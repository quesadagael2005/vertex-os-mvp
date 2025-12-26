// EffortCalculatorService - Calculate Total Effort from Room Selections
// Effort = sum of task minutes + modifiers

import { taskLibraryService } from './task-library';

export interface RoomSelection {
  roomType: string;
  quantity: number; // Number of that room type (e.g., 2 bathrooms)
  taskIds?: string[]; // Optional: specific task IDs (if not all tasks)
}

export interface EffortModifier {
  type: 'rush' | 'deep_clean' | 'eco_friendly' | 'pet_friendly' | 'custom';
  multiplier?: number; // Optional: custom multiplier (e.g., 1.2 for 20% more effort)
  additionalMinutes?: number; // Optional: add fixed minutes
}

export interface EffortResult {
  baseEffortMinutes: number;
  modifiedEffortMinutes: number;
  modifiers: Array<{
    type: string;
    multiplier?: number;
    additionalMinutes?: number;
    effectMinutes: number;
  }>;
  breakdown: Array<{
    roomType: string;
    quantity: number;
    minutesPerRoom: number;
    totalMinutes: number;
    tasks: Array<{
      id: string;
      name: string;
      effortMinutes: number;
    }>;
  }>;
}

export class EffortCalculatorService {
  /**
   * Calculate total effort from room selections
   */
  async calculateEffort(
    rooms: RoomSelection[],
    modifiers: EffortModifier[] = []
  ): Promise<EffortResult> {
    // Step 1: Calculate base effort from room selections
    const breakdown: EffortResult['breakdown'] = [];
    let baseEffortMinutes = 0;

    for (const room of rooms) {
      let tasks;

      if (room.taskIds && room.taskIds.length > 0) {
        // Get specific tasks
        tasks = await Promise.all(room.taskIds.map((id) => taskLibraryService.getTaskById(id)));
        tasks = tasks.filter((t) => t !== null); // Remove null results
      } else {
        // Get all tasks for room type
        tasks = await taskLibraryService.getTasksByRoomType(room.roomType);
      }

      const minutesPerRoom = tasks.reduce((sum, task) => sum + (task?.effortMinutes || 0), 0);
      const totalMinutes = minutesPerRoom * room.quantity;
      baseEffortMinutes += totalMinutes;

      breakdown.push({
        roomType: room.roomType,
        quantity: room.quantity,
        minutesPerRoom,
        totalMinutes,
        tasks: tasks.map((task) => ({
          id: task!.id,
          name: task!.name,
          effortMinutes: task!.effortMinutes,
        })),
      });
    }

    // Step 2: Apply modifiers
    let modifiedEffortMinutes = baseEffortMinutes;
    const appliedModifiers: EffortResult['modifiers'] = [];

    for (const modifier of modifiers) {
      let effectMinutes = 0;

      if (modifier.multiplier) {
        // Percentage-based modifier (e.g., rush +30%)
        const increase = baseEffortMinutes * (modifier.multiplier - 1);
        modifiedEffortMinutes += increase;
        effectMinutes = increase;
      }

      if (modifier.additionalMinutes) {
        // Fixed time addition (e.g., deep clean +60 minutes)
        modifiedEffortMinutes += modifier.additionalMinutes;
        effectMinutes += modifier.additionalMinutes;
      }

      appliedModifiers.push({
        type: modifier.type,
        multiplier: modifier.multiplier,
        additionalMinutes: modifier.additionalMinutes,
        effectMinutes: Math.round(effectMinutes),
      });
    }

    return {
      baseEffortMinutes: Math.round(baseEffortMinutes),
      modifiedEffortMinutes: Math.round(modifiedEffortMinutes),
      modifiers: appliedModifiers,
      breakdown,
    };
  }

  /**
   * Calculate effort from a list of task IDs (no room grouping)
   */
  async calculateEffortFromTasks(
    taskIds: string[],
    modifiers: EffortModifier[] = []
  ): Promise<EffortResult> {
    const tasks = await Promise.all(taskIds.map((id) => taskLibraryService.getTaskById(id)));

    const validTasks = tasks.filter((t) => t !== null);
    const baseEffortMinutes = validTasks.reduce((sum, task) => sum + (task?.effortMinutes || 0), 0);

    // Group tasks by room type for breakdown
    const tasksByRoom: Record<string, typeof validTasks> = {};
    for (const task of validTasks) {
      if (!task) continue;
      if (!tasksByRoom[task.roomType]) {
        tasksByRoom[task.roomType] = [];
      }
      tasksByRoom[task.roomType].push(task);
    }

    const breakdown: EffortResult['breakdown'] = [];
    for (const [roomType, roomTasks] of Object.entries(tasksByRoom)) {
      const totalMinutes = roomTasks.reduce((sum, task) => sum + (task?.effortMinutes || 0), 0);
      breakdown.push({
        roomType,
        quantity: 1,
        minutesPerRoom: totalMinutes,
        totalMinutes,
        tasks: roomTasks.map((task) => ({
          id: task!.id,
          name: task!.name,
          effortMinutes: task!.effortMinutes,
        })),
      });
    }

    // Apply modifiers
    let modifiedEffortMinutes = baseEffortMinutes;
    const appliedModifiers: EffortResult['modifiers'] = [];

    for (const modifier of modifiers) {
      let effectMinutes = 0;

      if (modifier.multiplier) {
        const increase = baseEffortMinutes * (modifier.multiplier - 1);
        modifiedEffortMinutes += increase;
        effectMinutes = increase;
      }

      if (modifier.additionalMinutes) {
        modifiedEffortMinutes += modifier.additionalMinutes;
        effectMinutes += modifier.additionalMinutes;
      }

      appliedModifiers.push({
        type: modifier.type,
        multiplier: modifier.multiplier,
        additionalMinutes: modifier.additionalMinutes,
        effectMinutes: Math.round(effectMinutes),
      });
    }

    return {
      baseEffortMinutes: Math.round(baseEffortMinutes),
      modifiedEffortMinutes: Math.round(modifiedEffortMinutes),
      modifiers: appliedModifiers,
      breakdown,
    };
  }

  /**
   * Estimate effort for common job types (quick estimates)
   */
  async estimateByJobType(jobType: 'standard' | 'deep' | 'move_out'): Promise<number> {
    const allTasks = await taskLibraryService.getAllTasksByRoomType();
    const roomTypes = Object.keys(allTasks);

    let baseEffort = 0;
    let modifier = 1.0;

    // Standard: living room, kitchen, bathroom
    if (jobType === 'standard') {
      const standardRooms = ['living_room', 'kitchen', 'bathroom'];
      for (const room of standardRooms) {
        if (allTasks[room]) {
          baseEffort += allTasks[room].reduce((sum, task) => sum + task.effortMinutes, 0);
        }
      }
      modifier = 1.0;
    }

    // Deep clean: all rooms + 50% more effort
    if (jobType === 'deep') {
      for (const room of roomTypes) {
        baseEffort += allTasks[room].reduce((sum, task) => sum + task.effortMinutes, 0);
      }
      modifier = 1.5;
    }

    // Move-out: all rooms + 75% more effort
    if (jobType === 'move_out') {
      for (const room of roomTypes) {
        baseEffort += allTasks[room].reduce((sum, task) => sum + task.effortMinutes, 0);
      }
      modifier = 1.75;
    }

    return Math.round(baseEffort * modifier);
  }
}

// Export singleton instance
export const effortCalculatorService = new EffortCalculatorService();

