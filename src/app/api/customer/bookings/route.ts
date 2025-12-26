// POST /api/customer/bookings - Create a new booking
// GET /api/customer/bookings - Get all customer bookings
// Protected endpoint

import { NextRequest } from 'next/server';
import { bookingService } from '@/lib/services';
import {
  requireRole,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['member']);
    const body = await request.json();

    const {
      zoneId,
      address,
      scheduledDate,
      scheduledTime,
      taskIds,
      notes,
      isWeekend,
      isRush,
      isEcoFriendly,
      isPetFriendly,
      preferredCleanerId,
    } = body;

    // Validation
    if (!zoneId || !address || !scheduledDate || !scheduledTime || !taskIds) {
      return errorResponse('Zone, address, date, time, and tasks are required');
    }

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return errorResponse('At least one task must be selected');
    }

    // Create booking
    const booking = await bookingService.createBooking({
      memberId: user.userId,
      zoneId,
      address,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      taskIds,
      notes,
      isWeekend,
      isRush,
      isEcoFriendly,
      isPetFriendly,
      preferredCleanerId,
    });

    return jsonResponse(booking, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error creating booking:', error);
    return errorResponse(error.message || 'Failed to create booking', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['member']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'upcoming' or 'past'

    let jobs;

    if (status === 'upcoming') {
      jobs = await bookingService.getUpcomingJobs(user.userId);
    } else if (status === 'past') {
      jobs = await bookingService.getPastJobs(user.userId);
    } else {
      // Get both
      const [upcoming, past] = await Promise.all([
        bookingService.getUpcomingJobs(user.userId),
        bookingService.getPastJobs(user.userId),
      ]);
      jobs = { upcoming, past };
    }

    return jsonResponse(jobs);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error fetching bookings:', error);
    return errorResponse('Failed to fetch bookings', 500);
  }
}
