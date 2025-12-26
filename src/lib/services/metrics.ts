// MetricsService - Business Analytics and Reporting
// Key metrics: revenue, bookings, cleaners, customers

import { prisma } from '@/lib/db/client';

export interface RevenueMetrics {
  totalRevenueCents: number;
  platformRevenueCents: number;
  cleanerPayoutsCents: number;
  averageJobValueCents: number;
  jobCount: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface BookingMetrics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  inProgressBookings: number;
  scheduledBookings: number;
  completionRate: number;
  cancellationRate: number;
}

export interface CleanerMetrics {
  totalCleaners: number;
  activeCleaners: number;
  averageRating: number;
  topCleaners: Array<{
    id: string;
    name: string;
    rating: number;
    completedJobs: number;
  }>;
}

export interface CustomerMetrics {
  totalMembers: number;
  newMembersThisPeriod: number;
  tierBreakdown: Record<string, number>;
  averageJobsPerMember: number;
  repeatCustomerRate: number;
}

export interface DashboardMetrics {
  revenue: RevenueMetrics;
  bookings: BookingMetrics;
  cleaners: CleanerMetrics;
  customers: CustomerMetrics;
}

export class MetricsService {
  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(startDate: Date, endDate: Date): Promise<DashboardMetrics> {
    const [revenue, bookings, cleaners, customers] = await Promise.all([
      this.getRevenueMetrics(startDate, endDate),
      this.getBookingMetrics(startDate, endDate),
      this.getCleanerMetrics(),
      this.getCustomerMetrics(startDate, endDate),
    ]);

    return {
      revenue,
      bookings,
      cleaners,
      customers,
    };
  }

  /**
   * Get revenue metrics for period
   */
  async getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics> {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalPrice: true,
        platformFeeAmount: true,
        cleanerPayout: true,
      },
    });

    const totalRevenueCents = jobs.reduce((sum, job) => sum + Number(job.totalPrice) * 100, 0);
    const platformRevenueCents = jobs.reduce(
      (sum, job) => sum + Number(job.platformFeeAmount) * 100,
      0
    );
    const cleanerPayoutsCents = jobs.reduce((sum, job) => sum + Number(job.cleanerPayout) * 100, 0);
    const jobCount = jobs.length;
    const averageJobValueCents = jobCount > 0 ? Math.round(totalRevenueCents / jobCount) : 0;

    return {
      totalRevenueCents,
      platformRevenueCents,
      cleanerPayoutsCents,
      averageJobValueCents,
      jobCount,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Get booking metrics for period
   */
  async getBookingMetrics(startDate: Date, endDate: Date): Promise<BookingMetrics> {
    const jobs = await prisma.job.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { status: true },
    });

    const totalBookings = jobs.length;
    const completedBookings = jobs.filter((j) => j.status === 'COMPLETED').length;
    const cancelledBookings = jobs.filter((j) => j.status === 'CANCELLED').length;
    const inProgressBookings = jobs.filter((j) => j.status === 'IN_PROGRESS').length;
    const scheduledBookings = jobs.filter((j) => j.status === 'SCHEDULED').length;

    const completionRate =
      totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;
    const cancellationRate =
      totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      inProgressBookings,
      scheduledBookings,
      completionRate,
      cancellationRate,
    };
  }

  /**
   * Get cleaner metrics
   */
  async getCleanerMetrics(): Promise<CleanerMetrics> {
    const cleaners = await prisma.cleaner.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        ratingAverage: true,
        jobsCompleted: true,
      },
    });

    const totalCleaners = cleaners.length;
    const activeCleaners = cleaners.filter((c) => c.status === 'ACTIVE').length;

    const ratingsSum = cleaners.reduce((sum, c) => sum + Number(c.ratingAverage), 0);
    const averageRating =
      totalCleaners > 0 ? Math.round((ratingsSum / totalCleaners) * 10) / 10 : 0;

    const topCleaners = cleaners
      .filter((c) => c.status === 'ACTIVE')
      .sort((a, b) => {
        // Sort by rating first, then by completed jobs
        if (b.ratingAverage !== a.ratingAverage) {
          return Number(b.ratingAverage) - Number(a.ratingAverage);
        }
        return b.jobsCompleted - a.jobsCompleted;
      })
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        rating: Number(c.ratingAverage),
        completedJobs: c.jobsCompleted,
      }));

    return {
      totalCleaners,
      activeCleaners,
      averageRating,
      topCleaners,
    };
  }

  /**
   * Get customer metrics for period
   */
  async getCustomerMetrics(startDate: Date, endDate: Date): Promise<CustomerMetrics> {
    // Total members
    const totalMembers = await prisma.member.count();

    // New members in period
    const newMembersThisPeriod = await prisma.member.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Tier breakdown
    const members = await prisma.member.findMany({
      select: { tier: true },
    });

    const tierBreakdown: Record<string, number> = {
      free: 0,
      silver: 0,
      gold: 0,
      diamond: 0,
    };

    for (const member of members) {
      tierBreakdown[member.tier] = (tierBreakdown[member.tier] || 0) + 1;
    }

    // Average jobs per member
    const jobCount = await prisma.job.count({
      where: { status: 'COMPLETED' },
    });
    const averageJobsPerMember =
      totalMembers > 0 ? Math.round((jobCount / totalMembers) * 10) / 10 : 0;

    // Repeat customer rate (members with 2+ completed jobs)
    const memberJobCounts = await prisma.job.groupBy({
      by: ['memberId'],
      where: { status: 'COMPLETED' },
      _count: { memberId: true },
    });

    const repeatCustomers = memberJobCounts.filter((m) => m._count.memberId >= 2).length;
    const repeatCustomerRate =
      totalMembers > 0 ? Math.round((repeatCustomers / totalMembers) * 100) : 0;

    return {
      totalMembers,
      newMembersThisPeriod,
      tierBreakdown,
      averageJobsPerMember,
      repeatCustomerRate,
    };
  }

  /**
   * Get revenue by day for charts
   */
  async getRevenueByDay(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; revenueCents: number; jobCount: number }>> {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        completedAt: true,
        totalPrice: true,
      },
      orderBy: { completedAt: 'asc' },
    });

    // Group by date
    const dailyRevenue = new Map<string, { revenueCents: number; jobCount: number }>();

    for (const job of jobs) {
      if (!job.completedAt) continue;

      const date = job.completedAt.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dailyRevenue.has(date)) {
        dailyRevenue.set(date, { revenueCents: 0, jobCount: 0 });
      }

      const day = dailyRevenue.get(date)!;
      day.revenueCents += Number(job.totalPrice) * 100;
      day.jobCount += 1;
    }

    return Array.from(dailyRevenue.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  /**
   * Get bookings by zone
   */
  async getBookingsByZone(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ zoneId: string; zoneName: string; jobCount: number; revenueCents: number }>> {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      select: {
        zoneId: true,
        totalPrice: true,
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by zone
    const zoneMetrics = new Map<
      string,
      { zoneName: string; jobCount: number; revenueCents: number }
    >();

    for (const job of jobs) {
      const zoneId = job.zoneId;
      const zoneName = job.zone?.name || 'Unknown';

      if (!zoneMetrics.has(zoneId)) {
        zoneMetrics.set(zoneId, { zoneName, jobCount: 0, revenueCents: 0 });
      }

      const zone = zoneMetrics.get(zoneId)!;
      zone.jobCount += 1;
      zone.revenueCents += Number(job.totalPrice) * 100;
    }

    return Array.from(zoneMetrics.entries())
      .map(([zoneId, data]) => ({
        zoneId,
        ...data,
      }))
      .sort((a, b) => b.jobCount - a.jobCount);
  }

  /**
   * Get top performing cleaners
   */
  async getTopCleaners(limit: number = 10): Promise<
    Array<{
      cleanerId: string;
      cleanerName: string;
      jobsCompleted: number;
      totalRevenueCents: number;
      averageRating: number;
    }>
  > {
    const cleaners = await prisma.cleaner.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        ratingAverage: true,
        jobsCompleted: true,
      },
      orderBy: { jobsCompleted: 'desc' },
      take: limit,
    });

    const cleanerMetrics = await Promise.all(
      cleaners.map(async (cleaner) => {
        const jobs = await prisma.job.findMany({
          where: {
            cleanerId: cleaner.id,
            status: 'COMPLETED',
          },
          select: { totalPrice: true },
        });

        const totalRevenueCents = jobs.reduce((sum, j) => sum + Number(j.totalPrice) * 100, 0);

        return {
          cleanerId: cleaner.id,
          cleanerName: `${cleaner.firstName} ${cleaner.lastName}`,
          jobsCompleted: cleaner.jobsCompleted,
          totalRevenueCents,
          averageRating: Number(cleaner.ratingAverage),
        };
      })
    );

    return cleanerMetrics.sort((a, b) => b.totalRevenueCents - a.totalRevenueCents);
  }

  /**
   * Get quick stats for today
   */
  async getTodayStats(): Promise<{
    scheduledJobs: number;
    inProgressJobs: number;
    completedJobs: number;
    revenueCents: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [scheduled, inProgress, completed] = await Promise.all([
      prisma.job.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.job.count({
        where: { status: 'IN_PROGRESS' },
      }),
      prisma.job.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: today, lt: tomorrow },
        },
        select: { totalPrice: true },
      }),
    ]);

    const revenueCents = completed.reduce((sum, j) => sum + Number(j.totalPrice) * 100, 0);

    return {
      scheduledJobs: scheduled,
      inProgressJobs: inProgress,
      completedJobs: completed.length,
      revenueCents,
    };
  }
}

// Export singleton instance
export const metricsService = new MetricsService();
