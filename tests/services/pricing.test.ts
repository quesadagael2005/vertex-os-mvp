// PricingService Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PricingService } from '@/lib/services/pricing';
import { settingsService } from '@/lib/services/settings';

// Mock SettingsService
vi.mock('@/lib/services/settings', () => ({
  settingsService: {
    get: vi.fn(),
  },
}));

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
    vi.clearAllMocks();

    // Default mock settings
    vi.mocked(settingsService.get).mockImplementation(async (key: string) => {
      const settings: Record<string, number> = {
        base_fee_cents: 2500,
        per_minute_cents: 50,
        platform_fee_percent: 15,
        stripe_fee_percent: 2.9,
        stripe_fee_fixed_cents: 30,
        modifier_weekend_percent: 20,
        modifier_rush_percent: 30,
        modifier_eco_percent: 10,
        modifier_pet_friendly_percent: 15,
        tier_silver_discount_percent: 0,
        tier_gold_discount_percent: 15,
        tier_diamond_discount_percent: 25,
        min_job_value_cents: 5000,
      };
      return settings[key] || 0;
    });
  });

  describe('calculatePrice()', () => {
    it('should calculate basic price without modifiers', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60, // 1 hour
      });

      expect(result.baseFeeCents).toBe(2500);
      expect(result.effortCostCents).toBe(3000); // 60 * 50
      expect(result.subtotalCents).toBe(5500); // 2500 + 3000
      expect(result.modifiersTotalCents).toBe(0);
      expect(result.platformFee.amountCents).toBe(825); // 5500 * 0.15
      expect(result.totalCents).toBe(6325); // 5500 + 825
      expect(result.cleanerPayoutCents).toBe(4675); // 5500 - 825
    });

    it('should apply weekend modifier', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60,
        isWeekend: true,
      });

      expect(result.subtotalCents).toBe(5500);
      expect(result.modifiers).toHaveLength(1);
      expect(result.modifiers[0].type).toBe('Weekend');
      expect(result.modifiers[0].percent).toBe(20);
      expect(result.modifiers[0].amountCents).toBe(1100); // 5500 * 0.20
      expect(result.modifiersTotalCents).toBe(1100);
    });

    it('should apply rush modifier', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60,
        isRush: true,
      });

      expect(result.modifiers).toHaveLength(1);
      expect(result.modifiers[0].type).toBe('Rush');
      expect(result.modifiers[0].percent).toBe(30);
      expect(result.modifiers[0].amountCents).toBe(1650); // 5500 * 0.30
    });

    it('should apply eco-friendly modifier', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60,
        isEcoFriendly: true,
      });

      expect(result.modifiers).toHaveLength(1);
      expect(result.modifiers[0].type).toBe('Eco-Friendly');
      expect(result.modifiers[0].percent).toBe(10);
      expect(result.modifiers[0].amountCents).toBe(550); // 5500 * 0.10
    });

    it('should apply pet-friendly modifier', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60,
        isPetFriendly: true,
      });

      expect(result.modifiers).toHaveLength(1);
      expect(result.modifiers[0].type).toBe('Pet-Friendly');
      expect(result.modifiers[0].percent).toBe(15);
      expect(result.modifiers[0].amountCents).toBe(825); // 5500 * 0.15
    });

    it('should apply multiple modifiers', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60,
        isWeekend: true,
        isRush: true,
      });

      expect(result.modifiers).toHaveLength(2);
      expect(result.modifiersTotalCents).toBe(2750); // 1100 + 1650
    });

    it('should apply tier discount (Gold)', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60,
        memberTier: 'gold',
      });

      expect(result.tierDiscount).toBeDefined();
      expect(result.tierDiscount?.tier).toBe('gold');
      expect(result.tierDiscount?.percent).toBe(15);
      expect(result.tierDiscount?.amountCents).toBe(825); // 5500 * 0.15
      expect(result.subtotalBeforeFeesCents).toBe(4675); // 5500 - 825
    });

    it('should apply tier discount (Diamond)', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60,
        memberTier: 'diamond',
      });

      expect(result.tierDiscount?.percent).toBe(25);
      expect(result.tierDiscount?.amountCents).toBe(1375); // 5500 * 0.25
      expect(result.subtotalBeforeFeesCents).toBe(4125); // 5500 - 1375
    });

    it('should not apply discount for free tier', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60,
        memberTier: 'free',
      });

      expect(result.tierDiscount).toBeUndefined();
      expect(result.subtotalBeforeFeesCents).toBe(5500);
    });

    it('should calculate cleaner payout correctly', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60,
        memberTier: 'gold', // 15% discount
      });

      // Subtotal: 5500
      // After gold discount (15%): 4675
      // Platform fee (15%): 701
      // Cleaner gets: 4675 - 701 = 3974

      expect(result.subtotalBeforeFeesCents).toBe(4675);
      expect(result.platformFee.amountCents).toBe(701);
      expect(result.cleanerPayoutCents).toBe(3974);
    });

    it('should estimate Stripe fees', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 60,
      });

      // Total: 6325
      // Stripe: 6325 * 0.029 + 30 = 183.425 + 30 = 213

      expect(result.stripeProcessing.percent).toBe(2.9);
      expect(result.stripeProcessing.fixedCents).toBe(30);
      expect(result.stripeProcessing.estimatedCents).toBe(213);
    });

    it('should handle complex scenario with all modifiers and discount', async () => {
      const result = await service.calculatePrice({
        effortMinutes: 120,
        isWeekend: true,
        isRush: true,
        isEcoFriendly: true,
        isPetFriendly: true,
        memberTier: 'diamond',
      });

      // Base: 2500 + (120 * 50) = 8500
      // Weekend +20%: 1700
      // Rush +30%: 2550
      // Eco +10%: 850
      // Pet +15%: 1275
      // Subtotal with modifiers: 8500 + 6375 = 14875
      // Diamond discount -25%: 3719
      // After discount: 11156
      // Platform fee 15%: 1673
      // Total: 12829
      // Cleaner payout: 11156 - 1673 = 9483

      expect(result.subtotalCents).toBe(8500);
      expect(result.modifiersTotalCents).toBe(6375);
      expect(result.tierDiscount?.amountCents).toBe(3719);
      expect(result.subtotalBeforeFeesCents).toBe(11156);
      expect(result.platformFee.amountCents).toBe(1673);
      expect(result.totalCents).toBe(12829);
      expect(result.cleanerPayoutCents).toBe(9483);
    });
  });

  describe('getMinimumJobPrice()', () => {
    it('should return minimum job price', async () => {
      const result = await service.getMinimumJobPrice();
      expect(result).toBe(5000);
    });
  });

  describe('estimateByJobType()', () => {
    it('should estimate standard job (2 hours)', async () => {
      const result = await service.estimateByJobType('standard');

      expect(result.effortMinutes).toBe(120);
      expect(result.subtotalCents).toBe(8500); // 2500 + (120 * 50)
    });

    it('should estimate deep clean (4 hours)', async () => {
      const result = await service.estimateByJobType('deep');

      expect(result.effortMinutes).toBe(240);
      expect(result.subtotalCents).toBe(14500); // 2500 + (240 * 50)
    });

    it('should estimate move-out (6 hours)', async () => {
      const result = await service.estimateByJobType('move_out');

      expect(result.effortMinutes).toBe(360);
      expect(result.subtotalCents).toBe(20500); // 2500 + (360 * 50)
    });

    it('should apply tier discount to job estimate', async () => {
      const result = await service.estimateByJobType('standard', 'gold');

      expect(result.tierDiscount).toBeDefined();
      expect(result.tierDiscount?.tier).toBe('gold');
      expect(result.tierDiscount?.percent).toBe(15);
    });
  });

  describe('formatPrice()', () => {
    it('should format cents to dollar string', () => {
      expect(service.formatPrice(5000)).toBe('$50.00');
      expect(service.formatPrice(12345)).toBe('$123.45');
      expect(service.formatPrice(100)).toBe('$1.00');
      expect(service.formatPrice(0)).toBe('$0.00');
    });
  });

  describe('calculateCleanerTakeHome()', () => {
    it('should calculate cleaner take-home after Stripe fees', () => {
      const cleanerPayout = 5000;
      const stripeFee = 200;

      const takeHome = service.calculateCleanerTakeHome(cleanerPayout, stripeFee);

      expect(takeHome).toBe(4800); // 5000 - 200
    });
  });
});

