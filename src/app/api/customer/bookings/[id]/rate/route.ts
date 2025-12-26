// POST /api/customer/bookings/[id]/rate - Rate a completed booking
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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(request, ['member']);
    const body = await request.json();
    const { rating, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse('Rating must be between 1 and 5');
    }

    // Get job to verify ownership
    const job = await bookingService.getJob(params.id);

    if (!job) {
      return notFoundResponse('Booking not found');
    }

    // Verify ownership
    if (job.memberId !== user.userId) {
      return errorResponse('Access denied', 403);
    }

    // Rate job
    await bookingService.rateJob(params.id, rating, review);

    return jsonResponse({
      message: 'Rating submitted successfully',
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error rating booking:', error);
    return errorResponse(error.message || 'Failed to submit rating', 500);
  }
}

