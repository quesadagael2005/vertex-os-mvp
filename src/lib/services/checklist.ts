// ChecklistService - Generate and Manage Job Checklists
// Checklists are snapshots of tasks at booking time

import { prisma } from '@/lib/db/client';
import { taskLibraryService } from './task-library';
import type { Checklist, ChecklistItem } from '@prisma/client';

export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[];
}

export interface CreateChecklistInput {
  jobId: string;
  taskIds: string[]; // Selected tasks for this job
}

export interface UpdateChecklistItemInput {
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
}

export class ChecklistService {
  /**
   * Create a checklist for a job from selected tasks
   * Snapshots task data at creation time
   */
  async createChecklist(input: CreateChecklistInput): Promise<ChecklistWithItems> {
    const { jobId, taskIds } = input;

    // Get task details
    const tasks = await Promise.all(taskIds.map((id) => taskLibraryService.getTaskById(id)));

    const validTasks = tasks.filter((t) => t !== null);

    if (validTasks.length === 0) {
      throw new Error('No valid tasks provided for checklist');
    }

    // Calculate totals
    const totalTasks = validTasks.length;
    const estimatedMinutes = validTasks.reduce((sum, task) => sum + (task?.effortMinutes || 0), 0);

    // Create checklist with items
    const checklist = await prisma.checklist.create({
      data: {
        jobId,
        totalTasks,
        completedTasks: 0,
        estimatedMinutes,
        items: {
          create: validTasks.map((task, index) => ({
            taskId: task!.id,
            taskName: task!.name,
            taskDescription: task!.description,
            roomType: task!.roomType,
            estimatedMinutes: task!.effortMinutes,
            order: index + 1,
            isCompleted: false,
          })),
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return checklist;
  }

  /**
   * Get checklist with all items
   */
  async getChecklist(checklistId: string): Promise<ChecklistWithItems | null> {
    return await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Get checklist by job ID
   */
  async getChecklistByJobId(jobId: string): Promise<ChecklistWithItems | null> {
    return await prisma.checklist.findUnique({
      where: { jobId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Update a checklist item (mark complete/incomplete)
   */
  async updateChecklistItem(
    itemId: string,
    input: UpdateChecklistItemInput
  ): Promise<ChecklistItem> {
    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted: input.isCompleted,
        completedAt: input.isCompleted ? input.completedAt || new Date() : null,
        notes: input.notes,
      },
    });

    // Update checklist progress
    await this.updateChecklistProgress(item.checklistId);

    return item;
  }

  /**
   * Mark all items as complete
   */
  async completeAllItems(checklistId: string): Promise<void> {
    await prisma.checklistItem.updateMany({
      where: {
        checklistId,
        isCompleted: false,
      },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    await this.updateChecklistProgress(checklistId);
  }

  /**
   * Update checklist completion progress
   */
  private async updateChecklistProgress(checklistId: string): Promise<void> {
    const items = await prisma.checklistItem.findMany({
      where: { checklistId },
      select: { isCompleted: true },
    });

    const completedCount = items.filter((item) => item.isCompleted).length;
    const totalCount = items.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    await prisma.checklist.update({
      where: { id: checklistId },
      data: {
        completedTasks: completedCount,
        progress,
      },
    });
  }

  /**
   * Add a custom item to existing checklist
   */
  async addCustomItem(
    checklistId: string,
    data: {
      taskName: string;
      taskDescription?: string;
      roomType?: string;
      estimatedMinutes?: number;
    }
  ): Promise<ChecklistItem> {
    // Get current item count for ordering
    const itemCount = await prisma.checklistItem.count({
      where: { checklistId },
    });

    const item = await prisma.checklistItem.create({
      data: {
        checklistId,
        taskId: null, // Custom item, not from task library
        taskName: data.taskName,
        taskDescription: data.taskDescription,
        roomType: data.roomType || 'other',
        estimatedMinutes: data.estimatedMinutes || 15,
        order: itemCount + 1,
        isCompleted: false,
      },
    });

    // Update checklist totals
    await prisma.checklist.update({
      where: { id: checklistId },
      data: {
        totalTasks: { increment: 1 },
        estimatedMinutes: {
          increment: data.estimatedMinutes || 15,
        },
      },
    });

    return item;
  }

  /**
   * Remove item from checklist
   */
  async removeItem(itemId: string): Promise<void> {
    const item = await prisma.checklistItem.findUnique({
      where: { id: itemId },
      select: {
        checklistId: true,
        estimatedMinutes: true,
        isCompleted: true,
      },
    });

    if (!item) {
      throw new Error('Checklist item not found');
    }

    // Delete the item
    await prisma.checklistItem.delete({
      where: { id: itemId },
    });

    // Update checklist totals
    await prisma.checklist.update({
      where: { id: item.checklistId },
      data: {
        totalTasks: { decrement: 1 },
        completedTasks: item.isCompleted ? { decrement: 1 } : undefined,
        estimatedMinutes: { decrement: item.estimatedMinutes },
      },
    });

    // Recalculate progress
    await this.updateChecklistProgress(item.checklistId);
  }

  /**
   * Reorder checklist items
   */
  async reorderItems(checklistId: string, itemIds: string[]): Promise<void> {
    // Update each item's order
    await Promise.all(
      itemIds.map((itemId, index) =>
        prisma.checklistItem.update({
          where: { id: itemId },
          data: { order: index + 1 },
        })
      )
    );
  }

  /**
   * Get checklist completion summary
   */
  async getCompletionSummary(checklistId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    progress: number;
    estimatedMinutes: number;
    actualMinutes: number | null;
    remainingTasks: string[];
  }> {
    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        items: {
          where: { isCompleted: false },
          select: { taskName: true },
        },
      },
    });

    if (!checklist) {
      throw new Error('Checklist not found');
    }

    return {
      totalTasks: checklist.totalTasks,
      completedTasks: checklist.completedTasks,
      progress: checklist.progress,
      estimatedMinutes: checklist.estimatedMinutes,
      actualMinutes: checklist.actualMinutes,
      remainingTasks: checklist.items.map((item) => item.taskName),
    };
  }

  /**
   * Mark checklist as complete and record actual time
   */
  async completeChecklist(checklistId: string, actualMinutes: number): Promise<void> {
    await prisma.checklist.update({
      where: { id: checklistId },
      data: {
        actualMinutes,
        progress: 100,
      },
    });
  }
}

// Export singleton instance
export const checklistService = new ChecklistService();
