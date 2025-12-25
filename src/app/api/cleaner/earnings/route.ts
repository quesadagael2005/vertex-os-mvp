// GET /api/cleaner/earnings - Get cleaner earnings summary
// Protected endpoint - cleaner only

import { NextRequest } from 'next/server';
import { payoutService } from '@/lib/services';
import { requireRole, jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['cleaner']);

    const [pending, history] = await Promise.all([
      payoutService.getCleanerPendingPayout(user.userId),
      payoutService.getCleanerPayoutHistory(user.userId, 12),
    ]);

    const nextPayoutDate = payoutService.getNextPayoutDate();

    return jsonResponse({
      pending,
      history,
      nextPayoutDate,
    });
  } catch (error: any) {
    if (error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error fetching earnings:', error);
    return errorResponse('Failed to fetch earnings', 500);
  }
}

