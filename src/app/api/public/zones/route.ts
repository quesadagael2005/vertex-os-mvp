// GET /api/public/zones - Get all service zones
// Public endpoint - no authentication required

import { prisma } from '@/lib/db/client';
import { jsonResponse, errorResponse } from '@/lib/auth/middleware';

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      orderBy: { name: 'asc' },
    });

    return jsonResponse(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return errorResponse('Failed to fetch zones', 500);
  }
}
