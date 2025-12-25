// GET /api/public/tasks - Get all tasks grouped by room type
// Public endpoint - no authentication required

import { taskLibraryService } from '@/lib/services';
import { jsonResponse, errorResponse } from '@/lib/auth/middleware';

export async function GET() {
  try {
    const tasks = await taskLibraryService.getAllTasksByRoomType();

    return jsonResponse(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return errorResponse('Failed to fetch tasks', 500);
  }
}
