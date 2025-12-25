// POST /api/customer/bookings/[id]/reschedule - Reschedule a booking
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
    const { newDate, newTime } = body;

    if (!newDate || !newTime) {
      return errorResponse('New date and time are required');
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

    // Check if can be rescheduled
    if (job.status === 'cancelled') {
      return errorResponse('Cannot reschedule a cancelled booking');
    }

    if (job.status === 'completed') {
      return errorResponse('Cannot reschedule a completed booking');
    }

    // Reschedule booking
    const updatedJob = await bookingService.rescheduleBooking(
      params.id,
      new Date(newDate),
      newTime,
      user.userId
    );

    return jsonResponse({
      message: 'Booking rescheduled successfully',
      job: updatedJob,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error rescheduling booking:', error);
    return errorResponse(error.message || 'Failed to reschedule booking', 500);
  }
}
