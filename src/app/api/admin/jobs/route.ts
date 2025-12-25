// GET /api/admin/jobs - Get all jobs (with filters)
// Protected endpoint - admin only

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import {
  requireRole,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    await requireRole(request, ['admin']);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const zoneId = searchParams.get('zoneId');
    const cleanerId = searchParams.get('cleanerId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, string> = {};

    if (status) where.status = status;
    if (cleanerId) where.cleanerId = cleanerId;

    const jobs = await prisma.job.findMany({
      where,
      include: {
        member: {
          select: {
            email: true,
            phone: true,
          },
        },
        cleaner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return jsonResponse(jobs);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error fetching jobs:', error);
    return errorResponse('Failed to fetch jobs', 500);
  }
}
