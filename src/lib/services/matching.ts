// MatchingService - Find Best Cleaner for Job
// Algorithm: available → in zone → highest rating → least busy

import { availabilityService } from './availability';
import { prisma } from '@/lib/db/client';
import type { Cleaner } from '@prisma/client';

export interface MatchingCriteria {
  zoneId: string;
  date: Date;
  startTime: string;
  durationMinutes: number;
  preferredCleanerId?: string; // Customer's preferred cleaner
}

export interface CleanerMatch {
  cleaner: Cleaner;
  score: number;
  reason: string;
  isPreferred: boolean;
  isAvailable: boolean;
  upcomingJobs: number;
}

export class MatchingService {
  /**
   * Find the best cleaner for a job
   * Returns ranked list of potential matches
   */
  async findBestCleaner(criteria: MatchingCriteria): Promise<CleanerMatch[]> {
    const { zoneId, date, startTime, durationMinutes, preferredCleanerId } = criteria;

    // Step 1: Get all available cleaners in the zone
    const availableCleaners = await availabilityService.findAvailableCleaners({
      zoneId,
      date,
      startTime,
      durationMinutes,
    });

    // Step 2: Score each cleaner
    const matches: CleanerMatch[] = [];

    for (const result of availableCleaners) {
      const score = await this.calculateCleanerScore(
        result.cleaner,
        result.isAvailable,
        preferredCleanerId === result.cleaner.id
      );

      const upcomingJobs = await this.getUpcomingJobCount(result.cleaner.id, date);

      matches.push({
        cleaner: result.cleaner,
        score,
        reason: this.getMatchReason(
          result.cleaner,
          result.isAvailable,
          preferredCleanerId === result.cleaner.id
        ),
        isPreferred: preferredCleanerId === result.cleaner.id,
        isAvailable: result.isAvailable,
        upcomingJobs,
      });
    }

    // Step 3: Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Get the single best match
   */
  async getBestMatch(criteria: MatchingCriteria): Promise<CleanerMatch | null> {
    const matches = await this.findBestCleaner(criteria);

    // Return first available cleaner, or null if none available
    const bestAvailable = matches.find((m) => m.isAvailable);
    return bestAvailable || null;
  }

  /**
   * Calculate cleaner score based on multiple factors
   * Higher score = better match
   */
  private async calculateCleanerScore(
    cleaner: Cleaner,
    isAvailable: boolean,
    isPreferred: boolean
  ): Promise<number> {
    let score = 0;

    // Factor 1: Availability (50 points)
    if (isAvailable) {
      score += 50;
    }

    // Factor 2: Preferred cleaner (30 points)
    if (isPreferred) {
      score += 30;
    }

    // Factor 3: Rating (max 20 points)
    // Rating is 0-5, normalize to 0-20
    score += (Number(cleaner.ratingAverage) / 5) * 20;

    // Factor 4: Experience (max 10 points)
    // More completed jobs = more experience
    const experienceScore = Math.min(cleaner.jobsCompleted / 10, 10);
    score += experienceScore;

    // Factor 5: Current workload (deduct up to 10 points)
    const upcomingJobs = await this.getUpcomingJobCount(cleaner.id, new Date());
    const workloadPenalty = Math.min(upcomingJobs * 2, 10);
    score -= workloadPenalty;

    return Math.round(score);
  }

  /**
   * Get upcoming job count for a cleaner
   */
  private async getUpcomingJobCount(cleanerId: string, fromDate: Date): Promise<number> {
    const count = await prisma.job.count({
      where: {
        cleanerId,
        status: {
          in: ['scheduled', 'in_progress'],
        },
        scheduledDate: {
          gte: fromDate,
        },
      },
    });

    return count;
  }

  /**
   * Generate human-readable match reason
   */
  private getMatchReason(cleaner: Cleaner, isAvailable: boolean, isPreferred: boolean): string {
    if (!isAvailable) {
      return 'Not available';
    }

    const reasons: string[] = [];

    if (isPreferred) {
      reasons.push('Customer preferred');
    }

    if (cleaner.rating >= 4.5) {
      reasons.push('Top rated');
    } else if (cleaner.rating >= 4.0) {
      reasons.push('Highly rated');
    }

    if (cleaner.completedJobs >= 100) {
      reasons.push('Very experienced');
    } else if (cleaner.completedJobs >= 50) {
      reasons.push('Experienced');
    }

    if (reasons.length === 0) {
      reasons.push('Available');
    }

    return reasons.join(' • ');
  }

  /**
   * Check if customer has a preferred cleaner
   */
  async getPreferredCleaner(memberId: string, zoneId: string): Promise<string | null> {
    // Find the cleaner the member has booked with most recently
    const recentJob = await prisma.job.findFirst({
      where: {
        memberId,
        status: 'completed',
        rating: {
          gte: 4, // Only consider well-rated jobs
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      select: {
        cleanerId: true,
      },
    });

    if (!recentJob?.cleanerId) {
      return null;
    }

    // Verify cleaner still services this zone
    const cleanerZone = await prisma.cleanerZone.findFirst({
      where: {
        cleanerId: recentJob.cleanerId,
        zoneId,
      },
    });

    return cleanerZone ? recentJob.cleanerId : null;
  }

  /**
   * Get cleaner availability summary for next N days
   */
  async getCleanerAvailabilitySummary(
    cleanerId: string,
    days: number = 7
  ): Promise<Array<{ date: Date; availableSlots: number }>> {
    const summary: Array<{ date: Date; availableSlots: number }> = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const slots = await availabilityService.getAvailableTimeSlots(
        cleanerId,
        date,
        120 // 2-hour job duration
      );

      summary.push({
        date,
        availableSlots: slots.length,
      });
    }

    return summary;
  }
}

// Export singleton instance
export const matchingService = new MatchingService();
