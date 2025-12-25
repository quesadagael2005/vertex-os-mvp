// GET /api/admin/dashboard - Get dashboard metrics
// Protected endpoint - admin only

import { NextRequest } from 'next/server';
import { metricsService } from '@/lib/services';
import {
  requireRole,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);

    // Get date range from query params or default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const [metrics, todayStats, revenueByDay] = await Promise.all([
      metricsService.getDashboardMetrics(startDate, endDate),
      metricsService.getTodayStats(),
      metricsService.getRevenueByDay(startDate, endDate),
    ]);

    return jsonResponse({
      metrics,
      todayStats,
      revenueByDay,
      periodStart: startDate,
      periodEnd: endDate,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error fetching dashboard:', error);
    return errorResponse('Failed to fetch dashboard', 500);
  }
}
