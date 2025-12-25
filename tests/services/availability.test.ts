// AvailabilityService Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AvailabilityService } from '@/lib/services/availability';
import { prisma } from '@/lib/db/client';
import type { Cleaner, CleanerSchedule, CleanerBlockedDate } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    cleaner: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    job: {
      findMany: vi.fn(),
    },
  },
}));

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  const mockCleaner: Cleaner = {
    id: 'cleaner-1',
    authId: 'auth-1',
    email: 'cleaner@test.com',
    phone: '555-0100',
    firstName: 'Jane',
    lastName: 'Doe',
    photoUrl: null,
    status: 'active',
    rating: 4.8,
    completedJobs: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSchedule: CleanerSchedule = {
    id: 'schedule-1',
    cleanerId: 'cleaner-1',
    dayOfWeek: 'monday',
    isAvailable: true,
    startTime: '09:00',
    endTime: '17:00',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = new AvailabilityService();
    vi.clearAllMocks();
  });

  describe('findAvailableCleaners()', () => {
    it('should find available cleaners in zone', async () => {
      vi.mocked(prisma.cleaner.findMany).mockResolvedValue([
        {
          ...mockCleaner,
          zones: [{ id: 'cz-1', cleanerId: 'cleaner-1', zoneId: 'zone-1', createdAt: new Date() }],
          schedule: [mockSchedule],
          blockedDates: [],
        } as any,
      ]);

      vi.mocked(prisma.job.findMany).mockResolvedValue([]);

      const monday = new Date(2024, 0, 1); // Jan 1, 2024 - Monday
      const result = await service.findAvailableCleaners({
        zoneId: 'zone-1',
        date: monday,
        startTime: '10:00',
        durationMinutes: 120,
      });

      expect(result).toHaveLength(1);
      expect(result[0].isAvailable).toBe(true);
      expect(result[0].reason).toBeUndefined();
    });

    it('should mark inactive cleaner as unavailable', async () => {
      vi.mocked(prisma.cleaner.findMany).mockResolvedValue([
        {
          ...mockCleaner,
          status: 'inactive',
          zones: [],
          schedule: [mockSchedule],
          blockedDates: [],
        } as any,
      ]);

      const monday = new Date(2024, 0, 1); // Jan 1, 2024 - Monday
      const result = await service.findAvailableCleaners({
        zoneId: 'zone-1',
        date: monday,
        startTime: '10:00',
        durationMinutes: 120,
      });

      expect(result[0].isAvailable).toBe(false);
      expect(result[0].reason).toBe('Cleaner is not active');
    });
  });

  describe('checkCleanerAvailability()', () => {
    it('should mark cleaner available if all checks pass', async () => {
      vi.mocked(prisma.job.findMany).mockResolvedValue([]);

      const monday = new Date(2024, 0, 1); // Jan 1, 2024 - Monday
      const result = await service.checkCleanerAvailability(
        { ...mockCleaner, schedule: [mockSchedule], blockedDates: [] },
        monday,
        '10:00',
        120
      );

      expect(result.isAvailable).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should mark inactive cleaner unavailable', async () => {
      const result = await service.checkCleanerAvailability(
        { ...mockCleaner, status: 'inactive', schedule: [], blockedDates: [] },
        new Date(),
        '10:00',
        120
      );

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toBe('Cleaner is not active');
    });

    it('should mark cleaner unavailable if date is blocked', async () => {
      const monday = new Date(2024, 0, 1); // Jan 1, 2024 - Monday
      const blockedDate: CleanerBlockedDate = {
        id: 'block-1',
        cleanerId: 'cleaner-1',
        date: monday,
        reason: 'Vacation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.checkCleanerAvailability(
        { ...mockCleaner, schedule: [mockSchedule], blockedDates: [blockedDate] },
        monday,
        '10:00',
        120
      );

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toBe('Cleaner has blocked this date');
    });

    it('should mark cleaner unavailable if not working that day', async () => {
      const tuesday = new Date(2024, 0, 2); // Jan 2, 2024 - Tuesday
      const result = await service.checkCleanerAvailability(
        { ...mockCleaner, schedule: [mockSchedule], blockedDates: [] }, // Monday schedule only
        tuesday,
        '10:00',
        120
      );

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('does not work on tuesday');
    });

    it('should mark cleaner unavailable if time is outside working hours', async () => {
      vi.mocked(prisma.job.findMany).mockResolvedValue([]);

      const monday = new Date(2024, 0, 1); // Jan 1, 2024 - Monday
      const result = await service.checkCleanerAvailability(
        { ...mockCleaner, schedule: [mockSchedule], blockedDates: [] }, // Works 09:00-17:00
        monday,
        '18:00', // Outside working hours
        120
      );

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('outside working hours');
    });

    it('should mark cleaner unavailable if start time is too early', async () => {
      vi.mocked(prisma.job.findMany).mockResolvedValue([]);

      const monday = new Date(2024, 0, 1); // Jan 1, 2024 - Monday
      const result = await service.checkCleanerAvailability(
        { ...mockCleaner, schedule: [mockSchedule], blockedDates: [] }, // Works 09:00-17:00
        monday,
        '07:00', // Too early
        120
      );

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('outside working hours');
    });

    it('should mark cleaner unavailable if has conflicting booking', async () => {
      vi.mocked(prisma.job.findMany).mockResolvedValue([
        {
          id: 'job-1',
          scheduledTime: '10:00',
          estimatedDurationMinutes: 120,
        } as any,
      ]);

      const monday = new Date(2024, 0, 1); // Jan 1, 2024 - Monday
      const result = await service.checkCleanerAvailability(
        { ...mockCleaner, schedule: [mockSchedule], blockedDates: [] },
        monday,
        '11:00', // Overlaps with 10:00-12:00 booking
        60
      );

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toBe('Cleaner has conflicting booking');
    });
  });

  describe('getAvailableTimeSlots()', () => {
    it('should return available time slots', async () => {
      vi.mocked(prisma.cleaner.findUnique).mockResolvedValue({
        ...mockCleaner,
        schedule: [mockSchedule], // 09:00-17:00
        blockedDates: [],
      } as any);

      vi.mocked(prisma.job.findMany).mockResolvedValue([]);

      const monday = new Date(2024, 0, 1); // Jan 1, 2024 - Monday
      const slots = await service.getAvailableTimeSlots('cleaner-1', monday, 60);

      // Should have slots from 09:00 to 16:00 (last slot must fit 60 min before 17:00)
      expect(slots.length).toBeGreaterThan(0);
      expect(slots).toContain('09:00');
      expect(slots).toContain('10:00');
      expect(slots).not.toContain('17:00'); // Outside work hours
    });

    it('should exclude busy time slots', async () => {
      vi.mocked(prisma.cleaner.findUnique).mockResolvedValue({
        ...mockCleaner,
        schedule: [mockSchedule], // 09:00-17:00
        blockedDates: [],
      } as any);

      vi.mocked(prisma.job.findMany).mockResolvedValue([
        {
          id: 'job-1',
          scheduledTime: '10:00',
          estimatedDurationMinutes: 120, // 10:00-12:00 busy
        } as any,
      ]);

      const monday = new Date(2024, 0, 1); // Jan 1, 2024 - Monday
      const slots = await service.getAvailableTimeSlots('cleaner-1', monday, 60);

      expect(slots).toContain('09:00'); // Before booking
      expect(slots).not.toContain('10:00'); // During booking
      expect(slots).not.toContain('11:00'); // During booking
      expect(slots).toContain('12:00'); // After booking
    });

    it('should return empty array if date is blocked', async () => {
      const monday = new Date(2024, 0, 1); // Jan 1, 2024 - Monday
      vi.mocked(prisma.cleaner.findUnique).mockResolvedValue({
        ...mockCleaner,
        schedule: [mockSchedule],
        blockedDates: [
          {
            id: 'block-1',
            cleanerId: 'cleaner-1',
            date: monday,
            reason: 'Vacation',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      } as any);

      const slots = await service.getAvailableTimeSlots('cleaner-1', monday, 60);

      expect(slots).toEqual([]);
    });

    it('should return empty array if cleaner not found', async () => {
      vi.mocked(prisma.cleaner.findUnique).mockResolvedValue(null);

      const slots = await service.getAvailableTimeSlots('nonexistent', new Date(), 60);

      expect(slots).toEqual([]);
    });

    it('should return empty array if cleaner inactive', async () => {
      vi.mocked(prisma.cleaner.findUnique).mockResolvedValue({
        ...mockCleaner,
        status: 'inactive',
        schedule: [mockSchedule],
        blockedDates: [],
      } as any);

      const slots = await service.getAvailableTimeSlots('cleaner-1', new Date(), 60);

      expect(slots).toEqual([]);
    });
  });

  describe('Helper methods', () => {
    it('should convert time to minutes correctly', () => {
      // Access private method via any cast for testing
      const timeToMinutes = (service as any).timeToMinutes.bind(service);

      expect(timeToMinutes('09:00')).toBe(540); // 9 * 60
      expect(timeToMinutes('12:30')).toBe(750); // 12 * 60 + 30
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('should convert minutes to time correctly', () => {
      const minutesToTime = (service as any).minutesToTime.bind(service);

      expect(minutesToTime(540)).toBe('09:00');
      expect(minutesToTime(750)).toBe('12:30');
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(1439)).toBe('23:59');
    });

    it('should get day of week correctly', () => {
      const getDayOfWeek = (service as any).getDayOfWeek.bind(service);

      // Use local time to avoid UTC/timezone issues
      const sunday = new Date(2024, 0, 7);  // Jan 7, 2024 is Sunday
      const monday = new Date(2024, 0, 1);  // Jan 1, 2024 is Monday
      const saturday = new Date(2024, 0, 6); // Jan 6, 2024 is Saturday

      expect(getDayOfWeek(sunday)).toBe('sunday');
      expect(getDayOfWeek(monday)).toBe('monday');
      expect(getDayOfWeek(saturday)).toBe('saturday');
    });

    it('should check if two dates are same day', () => {
      const isSameDay = (service as any).isSameDay.bind(service);

      const date1 = new Date('2025-01-06T10:00:00');
      const date2 = new Date('2025-01-06T15:00:00');
      const date3 = new Date('2025-01-07T10:00:00');

      expect(isSameDay(date1, date2)).toBe(true);
      expect(isSameDay(date1, date3)).toBe(false);
    });
  });
});

