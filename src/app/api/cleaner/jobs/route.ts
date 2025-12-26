// GET /api/cleaner/jobs - Get cleaner's assigned jobs
// Protected endpoint - cleaner only

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
    const user = await requireRole(request, ['cleaner']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: {
      cleanerId: string;
      status?: string;
    } = {
      cleanerId: user.userId,
    };

    if (status) {
      where.status = status;
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        zone: true,
        checklist: {
          include: {
            items: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
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
