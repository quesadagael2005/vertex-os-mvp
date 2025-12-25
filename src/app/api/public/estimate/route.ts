// POST /api/public/estimate - Get price estimate for tasks
// Public endpoint - no authentication required

import { effortCalculatorService, pricingService } from '@/lib/services';
import { jsonResponse, errorResponse } from '@/lib/auth/middleware';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskIds, isWeekend, isRush, isEcoFriendly, isPetFriendly, memberTier } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return errorResponse('Task IDs are required');
    }

    // Calculate effort
    const effort = await effortCalculatorService.calculateEffortFromTasks(taskIds);

    // Calculate pricing
    const pricing = await pricingService.calculatePrice({
      effortMinutes: effort.modifiedEffortMinutes,
      isWeekend: isWeekend || false,
      isRush: isRush || false,
      isEcoFriendly: isEcoFriendly || false,
      isPetFriendly: isPetFriendly || false,
      memberTier: memberTier || 'free',
    });

    return jsonResponse({
      effort: {
        baseMinutes: effort.baseEffortMinutes,
        totalMinutes: effort.modifiedEffortMinutes,
        breakdown: effort.breakdown,
      },
      pricing: {
        subtotalCents: pricing.subtotalCents,
        modifiers: pricing.modifiers,
        tierDiscount: pricing.tierDiscount,
        platformFee: pricing.platformFee,
        totalCents: pricing.totalCents,
      },
    });
  } catch (error) {
    console.error('Error calculating estimate:', error);
    return errorResponse('Failed to calculate estimate', 500);
  }
}
