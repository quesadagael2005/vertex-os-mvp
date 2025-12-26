// TierService - Membership Tier Management
// Tier = Features, not access. Free members can still book (pay per clean).

import { settingsService } from './settings';
import { prisma } from '@/lib/db/client';

export type MemberTier = 'free' | 'silver' | 'gold' | 'diamond';

export interface TierFeatures {
  tier: MemberTier;
  monthlyPriceCents: number;
  discountPercent: number;
  features: string[];
  isRecommended?: boolean;
}

export interface TierComparison {
  free: TierFeatures;
  silver: TierFeatures;
  gold: TierFeatures;
  diamond: TierFeatures;
}

export class TierService {
  /**
   * Get features for a specific tier
   */
  async getTierFeatures(tier: MemberTier): Promise<TierFeatures> {
    const features = await this.getAllTierFeatures();
    return features[tier];
  }

  /**
   * Get all tier features for comparison
   */
  async getAllTierFeatures(): Promise<TierComparison> {
    // Get pricing from settings
    const silverPrice = (await settingsService.get('tier_silver_monthly_cents')) as number;
    const goldPrice = (await settingsService.get('tier_gold_monthly_cents')) as number;
    const diamondPrice = (await settingsService.get('tier_diamond_monthly_cents')) as number;

    const silverDiscount = (await settingsService.get('tier_silver_discount_percent')) as number;
    const goldDiscount = (await settingsService.get('tier_gold_discount_percent')) as number;
    const diamondDiscount = (await settingsService.get('tier_diamond_discount_percent')) as number;

    return {
      free: {
        tier: 'free',
        monthlyPriceCents: 0,
        discountPercent: 0,
        features: ['Pay per clean', 'Standard scheduling', 'Basic support', 'Online booking'],
      },
      silver: {
        tier: 'silver',
        monthlyPriceCents: silverPrice,
        discountPercent: silverDiscount,
        features: [
          `${silverDiscount}% off all cleanings`,
          'Priority scheduling',
          'Email support',
          'Flexible cancellation',
          'Online booking',
        ],
      },
      gold: {
        tier: 'gold',
        monthlyPriceCents: goldPrice,
        discountPercent: goldDiscount,
        features: [
          `${goldDiscount}% off all cleanings`,
          'Priority scheduling',
          'Preferred cleaner matching',
          'Phone & email support',
          'Same-day cancellation',
          'Monthly deep clean included',
        ],
        isRecommended: true,
      },
      diamond: {
        tier: 'diamond',
        monthlyPriceCents: diamondPrice,
        discountPercent: diamondDiscount,
        features: [
          `${diamondDiscount}% off all cleanings`,
          'Top priority scheduling',
          'Dedicated cleaner',
          '24/7 concierge support',
          'Anytime cancellation',
          '2 monthly deep cleans included',
          'Eco-friendly products included',
          'Special occasion setup',
        ],
      },
    };
  }

  /**
   * Check if member can access a feature
   */
  canAccessFeature(memberTier: MemberTier, feature: string): boolean {
    const tierHierarchy: MemberTier[] = ['free', 'silver', 'gold', 'diamond'];
    const memberTierIndex = tierHierarchy.indexOf(memberTier);

    // Define which tier unlocks each feature
    const featureRequirements: Record<string, number> = {
      pay_per_clean: 0, // free
      standard_scheduling: 0, // free
      basic_support: 0, // free
      online_booking: 0, // free
      priority_scheduling: 1, // silver+
      email_support: 1, // silver+
      flexible_cancellation: 1, // silver+
      preferred_cleaner: 2, // gold+
      phone_support: 2, // gold+
      same_day_cancellation: 2, // gold+
      monthly_deep_clean: 2, // gold+
      top_priority: 3, // diamond
      dedicated_cleaner: 3, // diamond
      concierge_support: 3, // diamond
      anytime_cancellation: 3, // diamond
      eco_products_included: 3, // diamond
      special_occasion: 3, // diamond
    };

    const requiredTier = featureRequirements[feature];
    if (requiredTier === undefined) {
      return false; // Feature doesn't exist
    }

    return memberTierIndex >= requiredTier;
  }

  /**
   * Get member's current tier
   */
  async getMemberTier(memberId: string): Promise<MemberTier> {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { tier: true },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    return member.tier as MemberTier;
  }

  /**
   * Update member's tier
   */
  async updateMemberTier(memberId: string, newTier: MemberTier): Promise<void> {
    await prisma.member.update({
      where: { id: memberId },
      data: { tier: newTier },
    });

    // Log tier change
    await prisma.note.create({
      data: {
        entityType: 'member',
        entityId: memberId,
        content: `Tier changed to ${newTier}`,
        createdBy: 'system',
      },
    });
  }

  /**
   * Calculate tier savings for a member
   * Compare what they paid vs what they would have paid at free tier
   */
  async calculateTierSavings(
    memberId: string,
    periodMonths: number = 12
  ): Promise<{
    totalSpentCents: number;
    totalSavedCents: number;
    jobCount: number;
    subscriptionCostCents: number;
    netSavingsCents: number;
  }> {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { tier: true },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    const tier = member.tier as MemberTier;
    const tierFeatures = await this.getTierFeatures(tier);

    // Get all completed jobs in period
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - periodMonths);

    const jobs = await prisma.job.findMany({
      where: {
        memberId,
        status: 'completed',
        completedAt: {
          gte: startDate,
        },
      },
      select: {
        totalCents: true,
      },
    });

    const totalSpentCents = jobs.reduce((sum, job) => sum + job.totalCents, 0);
    const jobCount = jobs.length;

    // Calculate what they would have paid without discount
    const discountMultiplier = tierFeatures.discountPercent / 100;
    const fullPriceCents = Math.round(totalSpentCents / (1 - discountMultiplier));
    const totalSavedCents = fullPriceCents - totalSpentCents;

    // Subtract subscription cost
    const subscriptionCostCents = tierFeatures.monthlyPriceCents * periodMonths;
    const netSavingsCents = totalSavedCents - subscriptionCostCents;

    return {
      totalSpentCents,
      totalSavedCents,
      jobCount,
      subscriptionCostCents,
      netSavingsCents,
    };
  }

  /**
   * Recommend tier upgrade based on usage
   */
  async recommendTier(memberId: string): Promise<{
    currentTier: MemberTier;
    recommendedTier: MemberTier;
    reason: string;
    potentialSavings: number;
  }> {
    const currentTier = await this.getMemberTier(memberId);

    // Get booking frequency (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentJobs = await prisma.job.count({
      where: {
        memberId,
        status: { in: ['completed', 'scheduled'] },
        createdAt: { gte: threeMonthsAgo },
      },
    });

    const jobsPerMonth = recentJobs / 3;

    // Get average job price
    const completedJobs = await prisma.job.findMany({
      where: {
        memberId,
        status: 'completed',
        completedAt: { gte: threeMonthsAgo },
      },
      select: { totalCents: true },
    });

    const avgJobPrice =
      completedJobs.length > 0
        ? completedJobs.reduce((sum, j) => sum + j.totalCents, 0) / completedJobs.length
        : 5000; // Default $50

    // Recommendation logic
    let recommendedTier: MemberTier = currentTier;
    let reason = 'Current tier is optimal for your usage';
    let potentialSavings = 0;

    const tiers = await this.getAllTierFeatures();

    // If booking monthly or more, consider Silver
    if (currentTier === 'free' && jobsPerMonth >= 1) {
      const silverSavings =
        avgJobPrice * jobsPerMonth * (tiers.silver.discountPercent / 100) -
        tiers.silver.monthlyPriceCents;
      if (silverSavings > 0) {
        recommendedTier = 'silver';
        reason = 'You could save on monthly cleanings';
        potentialSavings = Math.round(silverSavings);
      }
    }

    // If booking twice a month or more, consider Gold
    if ((currentTier === 'free' || currentTier === 'silver') && jobsPerMonth >= 2) {
      const goldSavings =
        avgJobPrice * jobsPerMonth * (tiers.gold.discountPercent / 100) -
        tiers.gold.monthlyPriceCents;
      if (goldSavings > 0) {
        recommendedTier = 'gold';
        reason = 'You could save significantly with bi-weekly cleanings';
        potentialSavings = Math.round(goldSavings);
      }
    }

    // If booking weekly, consider Diamond
    if (currentTier !== 'diamond' && jobsPerMonth >= 4) {
      const diamondSavings =
        avgJobPrice * jobsPerMonth * (tiers.diamond.discountPercent / 100) -
        tiers.diamond.monthlyPriceCents;
      if (diamondSavings > 0) {
        recommendedTier = 'diamond';
        reason = 'Maximum savings for weekly cleanings';
        potentialSavings = Math.round(diamondSavings);
      }
    }

    return {
      currentTier,
      recommendedTier,
      reason,
      potentialSavings,
    };
  }
}

// Export singleton instance
export const tierService = new TierService();
