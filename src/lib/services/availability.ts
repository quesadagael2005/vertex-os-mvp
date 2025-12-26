// AvailabilityService - Check Cleaner Availability
// Considers: zones, schedules, blocked dates, existing bookings

import { prisma } from '@/lib/db/client';
import type { Cleaner, CleanerSchedule, CleanerBlockedDate } from '@prisma/client';

export interface AvailabilityQuery {
  zoneId: string;
  date: Date;
  startTime: string; // Format: "HH:MM" (e.g., "09:00")
  durationMinutes: number;
}

export interface AvailableCleanerResult {
  cleaner: Cleaner;
  schedule: CleanerSchedule | null;
  isAvailable: boolean;
  reason?: string; // If not available, why?
}

export class AvailabilityService {
  /**
   * Find all available cleaners for a specific job
   */
  async findAvailableCleaners(query: AvailabilityQuery): Promise<AvailableCleanerResult[]> {
    const { zoneId, date, startTime, durationMinutes } = query;
    const dayOfWeek = this.getDayOfWeek(date);

    // Step 1: Get all cleaners who service this zone
    const cleaners = await prisma.cleaner.findMany({
      where: {
        status: 'ACTIVE',
        zones: {
          some: {
            zoneId,
          },
        },
      },
      include: {
        zones: {
          where: { zoneId },
        },
        schedules: true,
        blockedDates: true,
      },
    });

    // Step 2: Check each cleaner's availability
    const results: AvailableCleanerResult[] = [];

    for (const cleaner of cleaners) {
      const availability = await this.checkCleanerAvailability(
        cleaner,
        date,
        startTime,
        durationMinutes,
        dayOfWeek
      );
      results.push(availability);
    }

    return results;
  }

  /**
   * Check if a specific cleaner is available
   */
  async checkCleanerAvailability(
    cleaner: Cleaner & {
      schedules?: CleanerSchedule[];
      blockedDates?: CleanerBlockedDate[];
    },
    date: Date,
    startTime: string,
    durationMinutes: number,
    dayOfWeek?: number
  ): Promise<AvailableCleanerResult> {
    const day = dayOfWeek || this.getDayOfWeek(date);

    // Check 1: Is cleaner active?
    if (cleaner.status !== 'ACTIVE') {
      return {
        cleaner,
        schedule: null,
        isAvailable: false,
        reason: 'Cleaner is not active',
      };
    }

    // Check 2: Is this date blocked?
    if (cleaner.blockedDates) {
      const isBlocked = cleaner.blockedDates.some((blocked) => {
        const blockedDate = new Date(blocked.blockedDate);
        return this.isSameDay(blockedDate, date);
      });

      if (isBlocked) {
        return {
          cleaner,
          schedule: null,
          isAvailable: false,
          reason: 'Cleaner has blocked this date',
        };
      }
    }

    // Check 3: Get schedule for this day
    const schedule = cleaner.schedules?.find((s) => s.dayOfWeek === day);

    if (!schedule) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        cleaner,
        schedule: null,
        isAvailable: false,
        reason: `Cleaner does not work on ${days[day]}`,
      };
    }

    // Check 4: Is requested time within working hours?
    const requestedStart = this.timeToMinutes(startTime);
    const requestedEnd = requestedStart + durationMinutes;
    const workStart = this.timeToMinutes(schedule.startTime);
    const workEnd = this.timeToMinutes(schedule.endTime);

    if (requestedStart < workStart || requestedEnd > workEnd) {
      return {
        cleaner,
        schedule,
        isAvailable: false,
        reason: `Requested time (${startTime}-${this.minutesToTime(requestedEnd)}) outside working hours (${schedule.startTime}-${schedule.endTime})`,
      };
    }

    // Check 5: Does cleaner have conflicting bookings?
    const hasConflict = await this.hasConflictingBooking(
      cleaner.id,
      date,
      startTime,
      durationMinutes
    );

    if (hasConflict) {
      return {
        cleaner,
        schedule,
        isAvailable: false,
        reason: 'Cleaner has conflicting booking',
      };
    }

    // All checks passed!
    return {
      cleaner,
      schedule,
      isAvailable: true,
    };
  }

  /**
   * Check if cleaner has conflicting bookings
   */
  private async hasConflictingBooking(
    cleanerId: string,
    date: Date,
    startTime: string,
    durationMinutes: number
  ): Promise<boolean> {
    const requestedStart = this.timeToMinutes(startTime);
    const requestedEnd = requestedStart + durationMinutes;

    // Get all jobs for this cleaner on this date
    const jobs = await prisma.job.findMany({
      where: {
        cleanerId,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
        scheduledDate: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
      select: {
        scheduledTime: true,
        estimatedDurationMinutes: true,
      },
    });

    // Check for time conflicts
    for (const job of jobs) {
      if (!job.scheduledTime || !job.estimatedDurationMinutes) continue;

      const jobStart = this.timeToMinutes(job.scheduledTime);
      const jobEnd = jobStart + job.estimatedDurationMinutes;

      // Check if times overlap
      if (
        (requestedStart >= jobStart && requestedStart < jobEnd) ||
        (requestedEnd > jobStart && requestedEnd <= jobEnd) ||
        (requestedStart <= jobStart && requestedEnd >= jobEnd)
      ) {
        return true; // Conflict found
      }
    }

    return false; // No conflicts
  }

  /**
   * Get available time slots for a cleaner on a specific date
   */
  async getAvailableTimeSlots(
    cleanerId: string,
    date: Date,
    durationMinutes: number
  ): Promise<string[]> {
    const dayOfWeek = this.getDayOfWeek(date);

    // Get cleaner with schedule and blocked dates
    const cleaner = await prisma.cleaner.findUnique({
      where: { id: cleanerId },
      include: {
        schedules: { where: { dayOfWeek } },
        blockedDates: true,
      },
    });

    if (!cleaner || cleaner.status !== 'ACTIVE') {
      return [];
    }

    // Check if date is blocked
    const isBlocked = cleaner.blockedDates.some((blocked) =>
      this.isSameDay(new Date(blocked.blockedDate), date)
    );

    if (isBlocked || !cleaner.schedules[0]?.isAvailable) {
      return [];
    }

    const schedule = cleaner.schedules[0];
    const workStart = this.timeToMinutes(schedule.startTime);
    const workEnd = this.timeToMinutes(schedule.endTime);

    // Get existing bookings
    const jobs = await prisma.job.findMany({
      where: {
        cleanerId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledDate: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
      select: {
        scheduledTime: true,
        estimatedDurationMinutes: true,
      },
      orderBy: { scheduledTime: 'asc' },
    });

    // Build list of busy periods
    const busyPeriods: Array<{ start: number; end: number }> = jobs
      .filter((job) => job.scheduledTime && job.estimatedDurationMinutes)
      .map((job) => ({
        start: this.timeToMinutes(job.scheduledTime!),
        end: this.timeToMinutes(job.scheduledTime!) + job.estimatedDurationMinutes!,
      }));

    // Find available slots (every 30 minutes)
    const slots: string[] = [];
    const slotInterval = 30; // Check every 30 minutes

    for (let time = workStart; time + durationMinutes <= workEnd; time += slotInterval) {
      const slotEnd = time + durationMinutes;

      // Check if this slot conflicts with any busy period
      const hasConflict = busyPeriods.some(
        (busy) =>
          (time >= busy.start && time < busy.end) ||
          (slotEnd > busy.start && slotEnd <= busy.end) ||
          (time <= busy.start && slotEnd >= busy.end)
      );

      if (!hasConflict) {
        slots.push(this.minutesToTime(time));
      }
    }

    return slots;
  }

  /**
   * Helper: Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Helper: Convert minutes since midnight to time string
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Helper: Get day of week from date
   */
  private getDayOfWeek(date: Date): number {
    return date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  }

  /**
   * Helper: Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}

// Export singleton instance
export const availabilityService = new AvailabilityService();
