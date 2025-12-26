// POST /api/customer/bookings/[id]/cancel - Cancel a booking
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
    const { reason } = body;

    // Get job to verify ownership
    const job = await bookingService.getJob(params.id);

    if (!job) {
      return notFoundResponse('Booking not found');
    }

    // Verify ownership
    if (job.memberId !== user.userId) {
      return errorResponse('Access denied', 403);
    }

    // Check if already cancelled or completed
    if (job.status === 'cancelled') {
      return errorResponse('Booking is already cancelled');
    }

    if (job.status === 'completed') {
      return errorResponse('Cannot cancel a completed booking');
    }

    // Cancel booking
    await bookingService.cancelBooking(params.id, reason || 'Cancelled by customer', user.userId);

    return jsonResponse({ message: 'Booking cancelled successfully' });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error cancelling booking:', error);
    return errorResponse('Failed to cancel booking', 500);
  }
}

