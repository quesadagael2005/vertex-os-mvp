// PricingService - Dynamic Pricing Engine
// Price = (base_fee + effort * per_minute_rate) + modifiers + platform_fee

import { settingsService } from './settings';

export interface PricingInput {
  effortMinutes: number;
  isWeekend?: boolean;
  isRush?: boolean;
  isEcoFriendly?: boolean;
  isPetFriendly?: boolean;
  memberTier?: 'free' | 'silver' | 'gold' | 'diamond';
}

export interface PricingBreakdown {
  // Base pricing
  baseFeeCents: number;
  effortMinutes: number;
  perMinuteCents: number;
  effortCostCents: number;
  subtotalCents: number;

  // Modifiers
  modifiers: Array<{
    type: string;
    percent: number;
    amountCents: number;
  }>;
  modifiersTotalCents: number;

  // Discount (tier-based)
  tierDiscount?: {
    tier: string;
    percent: number;
    amountCents: number;
  };

  // Fees
  platformFee: {
    percent: number;
    amountCents: number;
  };

  // Final totals
  subtotalBeforeFeesCents: number;
  totalCents: number;
  cleanerPayoutCents: number; // Amount cleaner receives (subtotal - platform fee)

  // Stripe processing (for reference)
  stripeProcessing: {
    percent: number;
    fixedCents: number;
    estimatedCents: number;
  };
}

export class PricingService {
  /**
   * Calculate complete pricing breakdown for a job
   */
  async calculatePrice(input: PricingInput): Promise<PricingBreakdown> {
    // Get pricing settings
    const baseFee = (await settingsService.get('base_fee_cents')) as number;
    const perMinute = (await settingsService.get('per_minute_cents')) as number;
    const platformFeePercent = (await settingsService.get('platform_fee_percent')) as number;
    const stripeFeePercent = (await settingsService.get('stripe_fee_percent')) as number;
    const stripeFeeFixed = (await settingsService.get('stripe_fee_fixed_cents')) as number;

    // Calculate base price
    const effortCostCents = input.effortMinutes * perMinute;
    const subtotalCents = baseFee + effortCostCents;

    // Apply modifiers (add to price)
    const modifiers: PricingBreakdown['modifiers'] = [];
    let modifiersTotalCents = 0;

    if (input.isWeekend) {
      const weekendPercent = (await settingsService.get('modifier_weekend_percent')) as number;
      const amountCents = Math.round(subtotalCents * (weekendPercent / 100));
      modifiers.push({ type: 'Weekend', percent: weekendPercent, amountCents });
      modifiersTotalCents += amountCents;
    }

    if (input.isRush) {
      const rushPercent = (await settingsService.get('modifier_rush_percent')) as number;
      const amountCents = Math.round(subtotalCents * (rushPercent / 100));
      modifiers.push({ type: 'Rush', percent: rushPercent, amountCents });
      modifiersTotalCents += amountCents;
    }

    if (input.isEcoFriendly) {
      const ecoPercent = (await settingsService.get('modifier_eco_percent')) as number;
      const amountCents = Math.round(subtotalCents * (ecoPercent / 100));
      modifiers.push({ type: 'Eco-Friendly', percent: ecoPercent, amountCents });
      modifiersTotalCents += amountCents;
    }

    if (input.isPetFriendly) {
      const petPercent = (await settingsService.get('modifier_pet_friendly_percent')) as number;
      const amountCents = Math.round(subtotalCents * (petPercent / 100));
      modifiers.push({ type: 'Pet-Friendly', percent: petPercent, amountCents });
      modifiersTotalCents += amountCents;
    }

    const subtotalWithModifiersCents = subtotalCents + modifiersTotalCents;

    // Apply tier discount (subtract from price)
    let tierDiscount: PricingBreakdown['tierDiscount'];
    let subtotalAfterDiscountCents = subtotalWithModifiersCents;

    if (input.memberTier && input.memberTier !== 'free') {
      const tierKey = `tier_${input.memberTier}_discount_percent`;
      const discountPercent = (await settingsService.get(tierKey)) as number;

      if (discountPercent > 0) {
        const discountAmountCents = Math.round(
          subtotalWithModifiersCents * (discountPercent / 100)
        );
        tierDiscount = {
          tier: input.memberTier,
          percent: discountPercent,
          amountCents: discountAmountCents,
        };
        subtotalAfterDiscountCents = subtotalWithModifiersCents - discountAmountCents;
      }
    }

    // Platform fee (taken from subtotal before fees)
    const platformFeeCents = Math.round(subtotalAfterDiscountCents * (platformFeePercent / 100));

    // Final total (customer pays this)
    const totalCents = subtotalAfterDiscountCents + platformFeeCents;

    // Cleaner payout (subtotal - platform fee, before Stripe)
    const cleanerPayoutCents = subtotalAfterDiscountCents - platformFeeCents;

    // Stripe processing (for reference only, deducted at payout)
    const stripeEstimatedCents = Math.round(totalCents * (stripeFeePercent / 100) + stripeFeeFixed);

    return {
      baseFeeCents: baseFee,
      effortMinutes: input.effortMinutes,
      perMinuteCents: perMinute,
      effortCostCents,
      subtotalCents,
      modifiers,
      modifiersTotalCents,
      tierDiscount,
      subtotalBeforeFeesCents: subtotalAfterDiscountCents,
      platformFee: {
        percent: platformFeePercent,
        amountCents: platformFeeCents,
      },
      totalCents,
      cleanerPayoutCents,
      stripeProcessing: {
        percent: stripeFeePercent,
        fixedCents: stripeFeeFixed,
        estimatedCents: stripeEstimatedCents,
      },
    };
  }

  /**
   * Calculate minimum price for a job
   * Used for validation
   */
  async getMinimumJobPrice(): Promise<number> {
    return (await settingsService.get('min_job_value_cents')) as number;
  }

  /**
   * Calculate price for standard job types (quick estimates)
   */
  async estimateByJobType(
    jobType: 'standard' | 'deep' | 'move_out',
    memberTier?: PricingInput['memberTier']
  ): Promise<PricingBreakdown> {
    // Rough effort estimates
    const effortMap = {
      standard: 120, // 2 hours
      deep: 240, // 4 hours
      move_out: 360, // 6 hours
    };

    return await this.calculatePrice({
      effortMinutes: effortMap[jobType],
      memberTier,
    });
  }

  /**
   * Format cents to display currency
   */
  formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  /**
   * Calculate cleaner's take-home after Stripe fees
   */
  calculateCleanerTakeHome(cleanerPayoutCents: number, stripeFeeCents: number): number {
    return cleanerPayoutCents - stripeFeeCents;
  }
}

// Export singleton instance
export const pricingService = new PricingService();
