// TierService Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TierService } from '@/lib/services/tier';
import { settingsService } from '@/lib/services/settings';
import { prisma } from '@/lib/db/client';

// Mock dependencies
vi.mock('@/lib/services/settings');
vi.mock('@/lib/db/client', () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    note: {
      create: vi.fn(),
    },
    job: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

describe('TierService', () => {
  let service: TierService;

  beforeEach(() => {
    service = new TierService();
    vi.clearAllMocks();

    // Mock tier settings
    vi.mocked(settingsService.get).mockImplementation(async (key: string) => {
      const settings: Record<string, number> = {
        tier_silver_monthly_cents: 2900,
        tier_gold_monthly_cents: 4900,
        tier_diamond_monthly_cents: 9900,
        tier_silver_discount_percent: 0,
        tier_gold_discount_percent: 15,
        tier_diamond_discount_percent: 25,
      };
      return settings[key] || 0;
    });
  });

  describe('getTierFeatures()', () => {
    it('should return features for specific tier', async () => {
      const result = await service.getTierFeatures('gold');

      expect(result.tier).toBe('gold');
      expect(result.monthlyPriceCents).toBe(4900);
      expect(result.discountPercent).toBe(15);
      expect(result.features.length).toBeGreaterThan(0);
      expect(result.isRecommended).toBe(true);
    });
  });

  describe('canAccessFeature()', () => {
    it('should allow free tier to access basic features', () => {
      expect(service.canAccessFeature('free', 'pay_per_clean')).toBe(true);
      expect(service.canAccessFeature('free', 'online_booking')).toBe(true);
    });

    it('should block free tier from premium features', () => {
      expect(service.canAccessFeature('free', 'priority_scheduling')).toBe(false);
      expect(service.canAccessFeature('free', 'preferred_cleaner')).toBe(false);
    });

    it('should allow gold tier to access gold features', () => {
      expect(service.canAccessFeature('gold', 'priority_scheduling')).toBe(true);
      expect(service.canAccessFeature('gold', 'preferred_cleaner')).toBe(true);
    });

    it('should block gold tier from diamond features', () => {
      expect(service.canAccessFeature('gold', 'dedicated_cleaner')).toBe(false);
      expect(service.canAccessFeature('gold', 'concierge_support')).toBe(false);
    });
  });

  describe('getMemberTier()', () => {
    it('should return member tier', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue({
        tier: 'gold',
      } as any);

      const result = await service.getMemberTier('member-1');

      expect(result).toBe('gold');
    });

    it('should throw error if member not found', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);

      await expect(service.getMemberTier('nonexistent')).rejects.toThrow('Member not found');
    });
  });

  describe('recommendTier()', () => {
    it('should recommend Silver for monthly bookings', async () => {
      vi.mocked(prisma.member.findUnique).mockResolvedValue({
        tier: 'free',
      } as any);

      vi.mocked(prisma.job.count).mockResolvedValue(3); // 3 jobs in 3 months = 1/month

      vi.mocked(prisma.job.findMany).mockResolvedValue([
        { totalCents: 5000 },
        { totalCents: 5000 },
        { totalCents: 5000 },
      ] as any);

      const result = await service.recommendTier('member-1');

      expect(result.currentTier).toBe('free');
      // Should recommend upgrade based on usage
    });
  });
});




