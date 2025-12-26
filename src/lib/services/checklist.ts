// ChecklistService - Generate and Manage Job Checklists
// Checklists are snapshots of tasks at booking time

import { prisma } from '@/lib/db/client';
import { taskLibraryService } from './task-library';
import type { Checklist } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface ChecklistItem {
  room: string;
  taskName: string;
  timeMinutes: number;
  isPriority: boolean;
  isCompleted?: boolean;
  completedAt?: Date;
  notes?: string;
}

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
    const { taskIds } = input;

    // Get task details
    const tasks = await Promise.all(taskIds.map((id) => taskLibraryService.getTaskById(id)));

    const validTasks = tasks.filter((t) => t !== null);

    if (validTasks.length === 0) {
      throw new Error('No valid tasks provided for checklist');
    }

    // Calculate totals
    const totalTasks = validTasks.length;
    const estimatedMinutes = validTasks.reduce((sum, task) => sum + (task?.timeMinutes || 0), 0);

    // Create checklist tasks JSON
    const checklistTasks = validTasks.map((task) => ({
      room: task!.roomType,
      taskName: task!.name,
      timeMinutes: task!.timeMinutes,
      isPriority: task!.isPriority,
    }));

    // Create checklist
    const checklist = await prisma.checklist.create({
      data: {
        tasks: checklistTasks,
        totalTasks,
        totalTimeMinutes: estimatedMinutes,
        effortHours: estimatedMinutes / 60,
      },
    });

    return {
      ...checklist,
      items: checklistTasks as ChecklistItem[],
    };
  }

  /**
   * Get checklist with all items
   */
  async getChecklist(checklistId: string): Promise<ChecklistWithItems | null> {
    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
    });

    if (!checklist) return null;

    return {
      ...checklist,
      items: (checklist.tasks as unknown as ChecklistItem[]) || [],
    };
  }

  /**
   * Get checklist by job ID
   * Note: Jobs store checklist snapshots, not direct relations
   */
  async getChecklistByJobId(jobId: string): Promise<ChecklistWithItems | null> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { checklistSnapshot: true },
    });

    if (!job) return null;

    // Return the snapshot as a checklist
    return {
      id: jobId,
      memberId: null,
      tasks: job.checklistSnapshot,
      totalTasks: 0,
      totalTimeMinutes: 0,
      effortHours: new Decimal(0),
      rooms: null,
      priorityZones: null,
      serviceLevel: null,
      condition: null,
      sqft: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: (job.checklistSnapshot as unknown as ChecklistItem[]) || [],
    };
  }

  /**
   * Update a checklist item (mark complete/incomplete)
   * Note: Items are stored as JSON in the checklist.tasks field
   */
  async updateChecklistItem(
    _itemId: string,
    _input: UpdateChecklistItemInput
  ): Promise<ChecklistItem> {
    throw new Error('Not implemented: checklist items are stored as JSON snapshots');
  }

  /**
   * Mark all items as complete
   */
  async completeAllItems(_checklistId: string): Promise<void> {
    throw new Error('Not implemented: checklist items are stored as JSON snapshots');
  }

  /**
   * Add a custom item to existing checklist
   */
  async addCustomItem(
    _checklistId: string,
    _data: {
      taskName: string;
      taskDescription?: string;
      roomType?: string;
      estimatedMinutes?: number;
    }
  ): Promise<ChecklistItem> {
    throw new Error('Not implemented: checklist items are stored as JSON snapshots');
  }

  /**
   * Remove item from checklist
   */
  async removeItem(_itemId: string): Promise<void> {
    throw new Error('Not implemented: checklist items are stored as JSON snapshots');
  }

  /**
   * Reorder checklist items
   */
  async reorderItems(_checklistId: string, _itemIds: string[]): Promise<void> {
    throw new Error('Not implemented: checklist items are stored as JSON snapshots');
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
    });

    if (!checklist) {
      throw new Error('Checklist not found');
    }

    const tasks = (checklist.tasks as unknown as ChecklistItem[]) || [];
    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const remainingTasks = tasks.filter((t) => !t.isCompleted).map((t) => t.taskName);

    return {
      totalTasks: checklist.totalTasks,
      completedTasks,
      progress,
      estimatedMinutes: checklist.totalTimeMinutes,
      actualMinutes: null,
      remainingTasks,
    };
  }

  /**
   * Mark checklist as complete and record actual time
   */
  async completeChecklist(_checklistId: string, _actualMinutes: number): Promise<void> {
    throw new Error('Not implemented: checklist completion tracking not supported');
  }
}

// Export singleton instance
export const checklistService = new ChecklistService();
