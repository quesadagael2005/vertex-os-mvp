// GET /api/admin/settings - Get all settings
// PATCH /api/admin/settings - Update a setting
// Protected endpoint - admin only

import { NextRequest } from 'next/server';
import { settingsService } from '@/lib/services';
import {
  requireRole,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);
    const settings = await settingsService.getAll();

    return jsonResponse(settings);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error fetching settings:', error);
    return errorResponse('Failed to fetch settings', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return errorResponse('Key and value are required');
    }

    await settingsService.update(key, value);

    return jsonResponse({
      message: 'Setting updated successfully',
      key,
      value,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return unauthorizedResponse(error.message);
    }
    console.error('Error updating setting:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to update setting', 500);
  }
}
