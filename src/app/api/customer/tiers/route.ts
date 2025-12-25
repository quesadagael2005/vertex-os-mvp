// GET /api/customer/tiers - Get all tier options
// Protected endpoint

import { NextRequest } from 'next/server';
import { tierService } from '@/lib/services';
import { requireRole, jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['member']);

    const tiers = await tierService.getAllTierFeatures();
    const recommendation = await tierService.recommendTier(user.userId);

    return jsonResponse({
      tiers,
      recommendation,
    });
  } catch (error: any) {
    if (error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error fetching tiers:', error);
    return errorResponse('Failed to fetch tiers', 500);
  }
}

