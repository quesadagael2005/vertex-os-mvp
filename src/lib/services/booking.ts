// BookingService - Create and Manage Bookings
// Orchestrates: pricing, matching, checklist creation, notifications

import { prisma } from '@/lib/db/client';
import { pricingService } from './pricing';
import { matchingService } from './matching';
import { checklistService } from './checklist';
import { effortCalculatorService } from './effort-calculator';
import type { Job } from '@prisma/client';

export interface CreateBookingInput {
  memberId: string;
  zoneId: string;
  address: string;
  scheduledDate: Date;
  scheduledTime: string;
  taskIds: string[];
  notes?: string;
  isWeekend?: boolean;
  isRush?: boolean;
  isEcoFriendly?: boolean;
  isPetFriendly?: boolean;
  preferredCleanerId?: string;
}

export interface BookingResult {
  job: Job;
  checklistId: string;
  pricing: {
    totalCents: number;
    cleanerPayoutCents: number;
  };
}

export class BookingService {
  /**
   * Create a new booking
   * Full workflow: calculate price → find cleaner → create job → create checklist
   */
  async createBooking(input: CreateBookingInput): Promise<BookingResult> {
    // Step 1: Validate member
    const member = await prisma.member.findUnique({
      where: { id: input.memberId },
      select: { id: true, tier: true, stripeCustomerId: true },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    // Step 2: Calculate effort
    const effort = await effortCalculatorService.calculateEffortFromTasks(input.taskIds);

    // Step 3: Calculate pricing
    const pricing = await pricingService.calculatePrice({
      effortMinutes: effort.modifiedEffortMinutes,
      isWeekend: input.isWeekend,
      isRush: input.isRush,
      isEcoFriendly: input.isEcoFriendly,
      isPetFriendly: input.isPetFriendly,
      memberTier: member.tier as 'free' | 'silver' | 'gold' | 'diamond',
    });

    // Step 4: Find best cleaner
    const match = await matchingService.getBestMatch({
      zoneId: input.zoneId,
      date: input.scheduledDate,
      startTime: input.scheduledTime,
      durationMinutes: effort.modifiedEffortMinutes,
      preferredCleanerId: input.preferredCleanerId,
    });

    if (!match) {
      throw new Error('No cleaners available for the selected time');
    }

    // Step 5: Create job record
    const job = await prisma.job.create({
      data: {
        memberId: input.memberId,
        cleanerId: match.cleaner.id,
        zoneId: input.zoneId,
        status: 'scheduled',
        address: input.address,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
        estimatedDurationMinutes: effort.modifiedEffortMinutes,

        // Snapshot pricing at booking time
        totalCents: pricing.totalCents,
        cleanerPayoutCents: pricing.cleanerPayoutCents,
        platformFeeCents: pricing.platformFee.amountCents,

        // Snapshot member tier
        memberTier: member.tier,
        tierDiscountCents: pricing.tierDiscount?.amountCents || 0,

        notes: input.notes,
      },
    });

    // Step 6: Create checklist
    const checklist = await checklistService.createChecklist({
      jobId: job.id,
      taskIds: input.taskIds,
    });

    // Step 7: Create note for job creation
    await prisma.note.create({
      data: {
        entityType: 'job',
        entityId: job.id,
        content: `Job created. Assigned to ${match.cleaner.firstName} ${match.cleaner.lastName}. ${match.reason}`,
        createdBy: 'system',
      },
    });

    return {
      job,
      checklistId: checklist.id,
      pricing: {
        totalCents: pricing.totalCents,
        cleanerPayoutCents: pricing.cleanerPayoutCents,
      },
    };
  }

  /**
   * Get job with all related data
   */
  async getJob(jobId: string) {
    return await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            rating: true,
          },
        },
        zone: true,
        checklist: {
          include: {
            items: {
              orderBy: { order: 'asc' },
            },
          },
        },
        rating: true,
      },
    });
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
    completedBy?: string
  ): Promise<Job> {
    const data: {
      status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
      startedAt?: Date;
      completedAt?: Date;
    } = { status };

    if (status === 'in_progress') {
      data.startedAt = new Date();
    }

    if (status === 'completed') {
      data.completedAt = new Date();
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data,
    });

    // Create status change note
    await prisma.note.create({
      data: {
        entityType: 'job',
        entityId: jobId,
        content: `Status changed to ${status}`,
        createdBy: completedBy || 'system',
      },
    });

    // If completed, update cleaner's completed job count
    if (status === 'completed') {
      await prisma.cleaner.update({
        where: { id: job.cleanerId! },
        data: {
          completedJobs: { increment: 1 },
        },
      });
    }

    return job;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(jobId: string, reason: string, cancelledBy: string): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        notes: `Cancelled: ${reason}`,
      },
    });

    await prisma.note.create({
      data: {
        entityType: 'job',
        entityId: jobId,
        content: `Booking cancelled. Reason: ${reason}`,
        createdBy: cancelledBy,
      },
    });
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    jobId: string,
    newDate: Date,
    newTime: string,
    rescheduledBy: string
  ): Promise<Job> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        zoneId: true,
        estimatedDurationMinutes: true,
        cleanerId: true,
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Check if cleaner is available at new time
    if (job.cleanerId) {
      const match = await matchingService.getBestMatch({
        zoneId: job.zoneId,
        date: newDate,
        startTime: newTime,
        durationMinutes: job.estimatedDurationMinutes!,
        preferredCleanerId: job.cleanerId,
      });

      if (!match || match.cleaner.id !== job.cleanerId) {
        throw new Error('Cleaner not available at the requested time');
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        scheduledDate: newDate,
        scheduledTime: newTime,
      },
    });

    await prisma.note.create({
      data: {
        entityType: 'job',
        entityId: jobId,
        content: `Rescheduled to ${newDate.toLocaleDateString()} at ${newTime}`,
        createdBy: rescheduledBy,
      },
    });

    return updatedJob;
  }

  /**
   * Add rating to completed job
   */
  async rateJob(jobId: string, rating: number, review?: string): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { status: true, cleanerId: true, rating: true },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'completed') {
      throw new Error('Can only rate completed jobs');
    }

    if (job.rating) {
      throw new Error('Job already rated');
    }

    // Create rating
    await prisma.rating.create({
      data: {
        jobId,
        cleanerId: job.cleanerId!,
        rating,
        review,
      },
    });

    // Update job with rating
    await prisma.job.update({
      where: { id: jobId },
      data: { rating },
    });

    // Recalculate cleaner's average rating
    await this.updateCleanerRating(job.cleanerId!);
  }

  /**
   * Update cleaner's average rating
   */
  private async updateCleanerRating(cleanerId: string): Promise<void> {
    const ratings = await prisma.rating.findMany({
      where: { cleanerId },
      select: { overallRating: true },
    });

    if (ratings.length === 0) return;

    const avgRating = ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length;
    const roundedRating = Math.round(avgRating * 10) / 10; // Round to 1 decimal

    await prisma.cleaner.update({
      where: { id: cleanerId },
      data: { rating: roundedRating },
    });
  }

  /**
   * Get upcoming jobs for a member
   */
  async getUpcomingJobs(memberId: string): Promise<Job[]> {
    return await prisma.job.findMany({
      where: {
        memberId,
        status: { in: ['scheduled', 'in_progress'] },
        scheduledDate: { gte: new Date() },
      },
      orderBy: { scheduledDate: 'asc' },
      include: {
        cleaner: {
          select: {
            firstName: true,
            lastName: true,
            rating: true,
          },
        },
        zone: true,
      },
    });
  }

  /**
   * Get past jobs for a member
   */
  async getPastJobs(memberId: string, limit: number = 10): Promise<Job[]> {
    return await prisma.job.findMany({
      where: {
        memberId,
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
      include: {
        cleaner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}

// Export singleton instance
export const bookingService = new BookingService();
