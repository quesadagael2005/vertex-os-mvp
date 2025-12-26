// PayoutService - Cleaner Payout Calculations and Batch Processing
// Handles weekly/bi-weekly payout batch creation

import { prisma } from '@/lib/db/client';
import type { PayoutBatch, Job } from '@prisma/client';

export interface PayoutCalculation {
  cleanerId: string;
  cleanerName: string;
  jobCount: number;
  grossPayoutCents: number; // Before Stripe fees
  stripeFeesCents: number;
  netPayoutCents: number; // After Stripe fees
  jobs: Array<{
    jobId: string;
    completedAt: Date;
    payoutCents: number;
  }>;
}

export interface CreatePayoutBatchInput {
  startDate: Date;
  endDate: Date;
  notes?: string;
}

export class PayoutService {
  /**
   * Calculate payouts for all cleaners in a date range
   */
  async calculatePayouts(startDate: Date, endDate: Date): Promise<PayoutCalculation[]> {
    // Get all completed jobs in the period that haven't been paid out
    const jobs = await prisma.job.findMany({
      where: {
        status: 'completed',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
        payoutBatchId: null, // Not yet included in a payout batch
      },
      include: {
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Group by cleaner
    const cleanerJobs = new Map<string, typeof jobs>();

    for (const job of jobs) {
      if (!job.cleanerId) continue;

      if (!cleanerJobs.has(job.cleanerId)) {
        cleanerJobs.set(job.cleanerId, []);
      }
      cleanerJobs.get(job.cleanerId)!.push(job);
    }

    // Calculate payout for each cleaner
    const payouts: PayoutCalculation[] = [];

    for (const [cleanerId, cleanerJobList] of cleanerJobs.entries()) {
      const cleaner = cleanerJobList[0].cleaner!;

      const grossPayoutCents = cleanerJobList.reduce((sum, job) => sum + job.cleanerPayoutCents, 0);

      // Stripe fees: 2.9% + $0.30 per transfer
      const stripeFeesCents = Math.round(grossPayoutCents * 0.029) + 30;
      const netPayoutCents = grossPayoutCents - stripeFeesCents;

      payouts.push({
        cleanerId,
        cleanerName: `${cleaner.firstName} ${cleaner.lastName}`,
        jobCount: cleanerJobList.length,
        grossPayoutCents,
        stripeFeesCents,
        netPayoutCents,
        jobs: cleanerJobList.map((job) => ({
          jobId: job.id,
          completedAt: job.completedAt!,
          payoutCents: job.cleanerPayoutCents,
        })),
      });
    }

    // Sort by payout amount (highest first)
    payouts.sort((a, b) => b.grossPayoutCents - a.grossPayoutCents);

    return payouts;
  }

  /**
   * Create a payout batch
   * Marks all included jobs as paid
   */
  async createPayoutBatch(input: CreatePayoutBatchInput): Promise<PayoutBatch> {
    const { startDate, endDate, notes } = input;

    // Calculate payouts
    const payouts = await this.calculatePayouts(startDate, endDate);

    if (payouts.length === 0) {
      throw new Error('No unpaid jobs found in the specified period');
    }

    // Calculate totals
    const totalJobs = payouts.reduce((sum, p) => sum + p.jobCount, 0);
    const totalGrossCents = payouts.reduce((sum, p) => sum + p.grossPayoutCents, 0);
    const totalFeesCents = payouts.reduce((sum, p) => sum + p.stripeFeesCents, 0);
    const totalNetCents = payouts.reduce((sum, p) => sum + p.netPayoutCents, 0);

    // Create payout batch
    const batch = await prisma.payoutBatch.create({
      data: {
        periodStart: startDate,
        periodEnd: endDate,
        status: 'pending',
        totalCleaners: payouts.length,
        totalJobs,
        totalGrossCents,
        totalFeesCents,
        totalNetCents,
        notes,
      },
    });

    // Get all job IDs from payouts
    const allJobIds = payouts.flatMap((p) => p.jobs.map((j) => j.jobId));

    // Update all jobs with batch ID
    await prisma.job.updateMany({
      where: {
        id: { in: allJobIds },
      },
      data: {
        payoutBatchId: batch.id,
      },
    });

    return batch;
  }

  /**
   * Get payout batch with details
   */
  async getPayoutBatch(batchId: string) {
    const batch = await prisma.payoutBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error('Payout batch not found');
    }

    // Get jobs in this batch
    const jobs = await prisma.job.findMany({
      where: { payoutBatchId: batchId },
      include: {
        cleaner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Group by cleaner
    const cleanerPayouts = new Map<
      string,
      {
        cleaner: { id: string; firstName: string; lastName: string; email: string };
        jobs: Array<{ id: string; completedAt: Date | null; payoutCents: number }>;
        totalCents: number;
      }
    >();

    for (const job of jobs) {
      if (!job.cleanerId) continue;

      if (!cleanerPayouts.has(job.cleanerId)) {
        cleanerPayouts.set(job.cleanerId, {
          cleaner: job.cleaner,
          jobs: [],
          totalCents: 0,
        });
      }

      const cleanerData = cleanerPayouts.get(job.cleanerId)!;
      cleanerData.jobs.push({
        id: job.id,
        completedAt: job.completedAt,
        payoutCents: job.cleanerPayoutCents,
      });
      cleanerData.totalCents += job.cleanerPayoutCents;
    }

    return {
      batch,
      cleanerPayouts: Array.from(cleanerPayouts.values()),
    };
  }

  /**
   * Mark payout batch as processed
   */
  async markBatchProcessed(batchId: string, processedBy: string): Promise<void> {
    await prisma.payoutBatch.update({
      where: { id: batchId },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    });

    await prisma.note.create({
      data: {
        entityType: 'payout_batch',
        entityId: batchId,
        content: `Batch processed and payouts sent`,
        createdBy: processedBy,
      },
    });
  }

  /**
   * Get all payout batches
   */
  async getAllBatches(limit: number = 20): Promise<PayoutBatch[]> {
    return await prisma.payoutBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get pending payouts for a specific cleaner
   */
  async getCleanerPendingPayout(cleanerId: string): Promise<{
    jobCount: number;
    totalPendingCents: number;
    oldestJobDate: Date | null;
    jobs: Job[];
  }> {
    const jobs = await prisma.job.findMany({
      where: {
        cleanerId,
        status: 'completed',
        payoutBatchId: null, // Not yet paid
      },
      orderBy: { completedAt: 'asc' },
    });

    const totalPendingCents = jobs.reduce((sum, job) => sum + job.cleanerPayoutCents, 0);

    return {
      jobCount: jobs.length,
      totalPendingCents,
      oldestJobDate: jobs[0]?.completedAt || null,
      jobs,
    };
  }

  /**
   * Get cleaner payout history
   */
  async getCleanerPayoutHistory(
    cleanerId: string,
    limit: number = 12
  ): Promise<
    Array<{
      batch: PayoutBatch;
      jobCount: number;
      amountCents: number;
    }>
  > {
    const batches = await prisma.payoutBatch.findMany({
      where: {
        status: 'processed',
        jobs: {
          some: {
            cleanerId,
          },
        },
      },
      orderBy: { processedAt: 'desc' },
      take: limit,
      include: {
        jobs: {
          where: { cleanerId },
          select: {
            cleanerPayoutCents: true,
          },
        },
      },
    });

    return batches.map((batch) => ({
      batch: {
        id: batch.id,
        periodStart: batch.periodStart,
        periodEnd: batch.periodEnd,
        status: batch.status,
        processedAt: batch.processedAt,
        totalGrossCents: batch.totalGrossCents,
        totalFeesCents: batch.totalFeesCents,
        totalNetCents: batch.totalNetCents,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        totalCleaners: batch.totalCleaners,
        totalJobs: batch.totalJobs,
        notes: batch.notes,
      },
      jobCount: batch.jobs.length,
      amountCents: batch.jobs.reduce((sum, j) => sum + j.cleanerPayoutCents, 0),
    }));
  }

  /**
   * Get next payout date (assumes weekly payouts on Fridays)
   */
  getNextPayoutDate(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday

    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + (daysUntilFriday || 7)); // If today is Friday, next Friday

    return nextFriday;
  }

  /**
   * Get payout period for next batch
   */
  getNextPayoutPeriod(): { startDate: Date; endDate: Date } {
    const today = new Date();
    const lastFriday = new Date(today);
    const dayOfWeek = today.getDay();

    // Go back to last Friday
    const daysToLastFriday = (dayOfWeek + 2) % 7;
    lastFriday.setDate(today.getDate() - daysToLastFriday);

    // Period is last Friday to Thursday (6 days)
    const endDate = new Date(lastFriday);
    endDate.setDate(lastFriday.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Start date is 7 days before end date
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
  }
}

// Export singleton instance
export const payoutService = new PayoutService();
