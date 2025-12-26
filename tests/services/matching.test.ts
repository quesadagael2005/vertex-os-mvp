// MatchingService Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchingService } from '@/lib/services/matching';
import { availabilityService } from '@/lib/services/availability';
import { prisma } from '@/lib/db/client';
import type { Cleaner } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/services/availability');
vi.mock('@/lib/db/client', () => ({
  prisma: {
    job: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    cleanerZone: {
      findFirst: vi.fn(),
    },
  },
}));

describe('MatchingService', () => {
  let service: MatchingService;

  const mockCleaner: Cleaner = {
    id: 'cleaner-1',
    authId: 'auth-1',
    email: 'cleaner@test.com',
    phone: '555-0100',
    firstName: 'Jane',
    lastName: 'Doe',
    photoUrl: null,
    status: 'active',
    rating: 4.5,
    completedJobs: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = new MatchingService();
    vi.clearAllMocks();
  });

  describe('findBestCleaner()', () => {
    it('should find and rank available cleaners', async () => {
      vi.mocked(availabilityService.findAvailableCleaners).mockResolvedValue([
        {
          cleaner: mockCleaner,
          schedule: null,
          isAvailable: true,
        },
      ]);

      vi.mocked(prisma.job.count).mockResolvedValue(2);

      const result = await service.findBestCleaner({
        zoneId: 'zone-1',
        date: new Date(2024, 0, 1),
        startTime: '10:00',
        durationMinutes: 120,
      });

      expect(result).toHaveLength(1);
      expect(result[0].cleaner.id).toBe('cleaner-1');
      expect(result[0].isAvailable).toBe(true);
      expect(result[0].score).toBeGreaterThan(0);
    });

    it('should prioritize preferred cleaner', async () => {
      const cleaner2 = { ...mockCleaner, id: 'cleaner-2', rating: 5.0 };

      vi.mocked(availabilityService.findAvailableCleaners).mockResolvedValue([
        { cleaner: mockCleaner, schedule: null, isAvailable: true },
        { cleaner: cleaner2, schedule: null, isAvailable: true },
      ]);

      vi.mocked(prisma.job.count).mockResolvedValue(0);

      const result = await service.findBestCleaner({
        zoneId: 'zone-1',
        date: new Date(2024, 0, 1),
        startTime: '10:00',
        durationMinutes: 120,
        preferredCleanerId: 'cleaner-1',
      });

      // cleaner-1 should rank first due to preferred status
      expect(result[0].cleaner.id).toBe('cleaner-1');
      expect(result[0].isPreferred).toBe(true);
    });
  });

  describe('getBestMatch()', () => {
    it('should return single best available cleaner', async () => {
      vi.mocked(availabilityService.findAvailableCleaners).mockResolvedValue([
        { cleaner: mockCleaner, schedule: null, isAvailable: true },
      ]);

      vi.mocked(prisma.job.count).mockResolvedValue(1);

      const result = await service.getBestMatch({
        zoneId: 'zone-1',
        date: new Date(2024, 0, 1),
        startTime: '10:00',
        durationMinutes: 120,
      });

      expect(result).toBeDefined();
      expect(result?.cleaner.id).toBe('cleaner-1');
    });

    it('should return null if no cleaners available', async () => {
      vi.mocked(availabilityService.findAvailableCleaners).mockResolvedValue([
        { cleaner: mockCleaner, schedule: null, isAvailable: false, reason: 'Busy' },
      ]);

      const result = await service.getBestMatch({
        zoneId: 'zone-1',
        date: new Date(2024, 0, 1),
        startTime: '10:00',
        durationMinutes: 120,
      });

      expect(result).toBeNull();
    });
  });

  describe('getPreferredCleaner()', () => {
    it('should return cleaner from recent well-rated job', async () => {
      vi.mocked(prisma.job.findFirst).mockResolvedValue({
        cleanerId: 'cleaner-1',
      } as any);

      vi.mocked(prisma.cleanerZone.findFirst).mockResolvedValue({
        id: 'cz-1',
        cleanerId: 'cleaner-1',
        zoneId: 'zone-1',
        createdAt: new Date(),
      });

      const result = await service.getPreferredCleaner('member-1', 'zone-1');

      expect(result).toBe('cleaner-1');
    });

    it('should return null if no recent jobs', async () => {
      vi.mocked(prisma.job.findFirst).mockResolvedValue(null);

      const result = await service.getPreferredCleaner('member-1', 'zone-1');

      expect(result).toBeNull();
    });
  });
});


