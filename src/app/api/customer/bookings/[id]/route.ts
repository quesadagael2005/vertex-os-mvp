// GET /api/customer/bookings/[id] - Get specific booking details
// Protected endpoint

import { NextRequest } from 'next/server';
import { bookingService } from '@/lib/services';
import {
  requireRole,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/auth/middleware';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ['member']);
    const job = await bookingService.getJob(params.id);

    if (!job) {
      return notFoundResponse('Booking not found');
    }

    // Verify ownership
    if (job.memberId !== user.userId) {
      return errorResponse('Access denied', 403);
    }

    return jsonResponse(job);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error fetching booking:', error);
    return errorResponse('Failed to fetch booking', 500);
  }
}

