// TaskLibraryService - Query Master Task Library
// Tasks are organized by room_type (living_room, kitchen, etc.)

import { prisma } from '@/lib/db/client';
import type { Task } from '@prisma/client';

export interface TasksByRoomType {
  roomType: string;
  tasks: Task[];
}

export class TaskLibraryService {
  /**
   * Get all tasks for a specific room type
   * @param roomType - e.g., 'living_room', 'kitchen', 'bathroom'
   */
  async getTasksByRoomType(roomType: string): Promise<Task[]> {
    return await prisma.task.findMany({
      where: {
        roomType,
        isActive: true,
      },
      orderBy: [{ defaultOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get all tasks grouped by room type
   * Returns object with room types as keys
   */
  async getAllTasksByRoomType(): Promise<Record<string, Task[]>> {
    const tasks = await prisma.task.findMany({
      where: { isActive: true },
      orderBy: [{ roomType: 'asc' }, { defaultOrder: 'asc' }, { name: 'asc' }],
    });

    const result: Record<string, Task[]> = {};

    for (const task of tasks) {
      if (!result[task.roomType]) {
        result[task.roomType] = [];
      }
      result[task.roomType].push(task);
    }

    return result;
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    return await prisma.task.findUnique({
      where: { id },
    });
  }

  /**
   * Search tasks by name or description
   */
  async searchTasks(query: string): Promise<Task[]> {
    const lowerQuery = query.toLowerCase();

    return await prisma.task.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: lowerQuery,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: lowerQuery,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: [{ roomType: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get all available room types
   * Returns unique list of room types that have tasks
   */
  async getRoomTypes(): Promise<string[]> {
    const tasks = await prisma.task.findMany({
      where: { isActive: true },
      select: { roomType: true },
      distinct: ['roomType'],
      orderBy: { roomType: 'asc' },
    });

    return tasks.map((t) => t.roomType);
  }

  /**
   * Create a new task (admin only)
   */
  async createTask(data: {
    name: string;
    description?: string;
    roomType: string;
    effortMinutes: number;
    defaultOrder?: number;
    isActive?: boolean;
  }): Promise<Task> {
    return await prisma.task.create({
      data: {
        name: data.name,
        description: data.description,
        roomType: data.roomType,
        effortMinutes: data.effortMinutes,
        defaultOrder: data.defaultOrder,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Update a task (admin only)
   */
  async updateTask(
    id: string,
    data: {
      name?: string;
      description?: string;
      roomType?: string;
      effortMinutes?: number;
      defaultOrder?: number;
      isActive?: boolean;
    }
  ): Promise<Task> {
    return await prisma.task.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a task (admin only)
   * Soft delete by setting isActive to false
   */
  async deleteTask(id: string): Promise<Task> {
    return await prisma.task.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Hard delete a task (admin only, use with caution)
   */
  async hardDeleteTask(id: string): Promise<void> {
    await prisma.task.delete({
      where: { id },
    });
  }

  /**
   * Get task statistics
   * Returns count by room type and total effort
   */
  async getTaskStats(): Promise<{
    totalTasks: number;
    tasksByRoomType: Record<string, number>;
    totalEffortMinutes: number;
    averageEffortMinutes: number;
  }> {
    const tasks = await prisma.task.findMany({
      where: { isActive: true },
    });

    const tasksByRoomType: Record<string, number> = {};
    let totalEffortMinutes = 0;

    for (const task of tasks) {
      tasksByRoomType[task.roomType] = (tasksByRoomType[task.roomType] || 0) + 1;
      totalEffortMinutes += task.effortMinutes;
    }

    return {
      totalTasks: tasks.length,
      tasksByRoomType,
      totalEffortMinutes,
      averageEffortMinutes: tasks.length > 0 ? totalEffortMinutes / tasks.length : 0,
    };
  }
}

// Export singleton instance
export const taskLibraryService = new TaskLibraryService();
