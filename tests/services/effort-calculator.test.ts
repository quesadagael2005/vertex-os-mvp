// EffortCalculatorService Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EffortCalculatorService } from '@/lib/services/effort-calculator';
import { taskLibraryService } from '@/lib/services/task-library';
import type { Task } from '@prisma/client';

// Mock TaskLibraryService
vi.mock('@/lib/services/task-library', () => ({
  taskLibraryService: {
    getTasksByRoomType: vi.fn(),
    getTaskById: vi.fn(),
    getAllTasksByRoomType: vi.fn(),
  },
}));

describe('EffortCalculatorService', () => {
  let service: EffortCalculatorService;

  const mockTasks: Task[] = [
    {
      id: '1',
      name: 'Vacuum carpet',
      description: null,
      roomType: 'living_room',
      effortMinutes: 15,
      defaultOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Dust surfaces',
      description: null,
      roomType: 'living_room',
      effortMinutes: 10,
      defaultOrder: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    service = new EffortCalculatorService();
    vi.clearAllMocks();
  });

  describe('calculateEffort()', () => {
    it('should calculate effort for single room type', async () => {
      vi.mocked(taskLibraryService.getTasksByRoomType).mockResolvedValue(mockTasks);

      const result = await service.calculateEffort([
        { roomType: 'living_room', quantity: 1 },
      ]);

      expect(result.baseEffortMinutes).toBe(25); // 15 + 10
      expect(result.modifiedEffortMinutes).toBe(25);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].minutesPerRoom).toBe(25);
      expect(result.breakdown[0].totalMinutes).toBe(25);
    });

    it('should handle multiple quantities of same room', async () => {
      vi.mocked(taskLibraryService.getTasksByRoomType).mockResolvedValue(mockTasks);

      const result = await service.calculateEffort([
        { roomType: 'living_room', quantity: 2 },
      ]);

      expect(result.baseEffortMinutes).toBe(50); // 25 * 2
      expect(result.breakdown[0].quantity).toBe(2);
      expect(result.breakdown[0].totalMinutes).toBe(50);
    });

    it('should handle multiple room types', async () => {
      vi.mocked(taskLibraryService.getTasksByRoomType)
        .mockResolvedValueOnce(mockTasks) // living_room
        .mockResolvedValueOnce([
          { ...mockTasks[0], id: '3', roomType: 'kitchen', effortMinutes: 20 },
        ]); // kitchen

      const result = await service.calculateEffort([
        { roomType: 'living_room', quantity: 1 },
        { roomType: 'kitchen', quantity: 1 },
      ]);

      expect(result.baseEffortMinutes).toBe(45); // 25 + 20
      expect(result.breakdown).toHaveLength(2);
    });

    it('should apply percentage modifier', async () => {
      vi.mocked(taskLibraryService.getTasksByRoomType).mockResolvedValue(mockTasks);

      const result = await service.calculateEffort(
        [{ roomType: 'living_room', quantity: 1 }],
        [{ type: 'rush', multiplier: 1.3 }] // +30%
      );

      expect(result.baseEffortMinutes).toBe(25);
      expect(result.modifiedEffortMinutes).toBe(33); // 25 + 7.5 = 32.5 rounded to 33
      expect(result.modifiers[0].effectMinutes).toBe(8);
    });

    it('should apply fixed minute modifier', async () => {
      vi.mocked(taskLibraryService.getTasksByRoomType).mockResolvedValue(mockTasks);

      const result = await service.calculateEffort(
        [{ roomType: 'living_room', quantity: 1 }],
        [{ type: 'deep_clean', additionalMinutes: 60 }]
      );

      expect(result.baseEffortMinutes).toBe(25);
      expect(result.modifiedEffortMinutes).toBe(85); // 25 + 60
      expect(result.modifiers[0].effectMinutes).toBe(60);
    });

    it('should apply multiple modifiers', async () => {
      vi.mocked(taskLibraryService.getTasksByRoomType).mockResolvedValue(mockTasks);

      const result = await service.calculateEffort(
        [{ roomType: 'living_room', quantity: 1 }],
        [
          { type: 'rush', multiplier: 1.3 }, // +7.5 minutes
          { type: 'eco_friendly', additionalMinutes: 15 },
        ]
      );

      expect(result.baseEffortMinutes).toBe(25);
      expect(result.modifiedEffortMinutes).toBe(48); // 25 + 8 + 15 = 48
      expect(result.modifiers).toHaveLength(2);
    });

    it('should handle specific task IDs', async () => {
      vi.mocked(taskLibraryService.getTaskById)
        .mockResolvedValueOnce(mockTasks[0]) // id: 1
        .mockResolvedValueOnce(mockTasks[1]); // id: 2

      const result = await service.calculateEffort([
        { roomType: 'living_room', quantity: 1, taskIds: ['1', '2'] },
      ]);

      expect(result.baseEffortMinutes).toBe(25);
      expect(taskLibraryService.getTaskById).toHaveBeenCalledWith('1');
      expect(taskLibraryService.getTaskById).toHaveBeenCalledWith('2');
    });

    it('should filter out null tasks', async () => {
      vi.mocked(taskLibraryService.getTaskById)
        .mockResolvedValueOnce(mockTasks[0])
        .mockResolvedValueOnce(null); // Nonexistent task

      const result = await service.calculateEffort([
        { roomType: 'living_room', quantity: 1, taskIds: ['1', '999'] },
      ]);

      expect(result.baseEffortMinutes).toBe(15); // Only first task
    });
  });

  describe('calculateEffortFromTasks()', () => {
    it('should calculate effort from task IDs', async () => {
      vi.mocked(taskLibraryService.getTaskById)
        .mockResolvedValueOnce(mockTasks[0])
        .mockResolvedValueOnce(mockTasks[1]);

      const result = await service.calculateEffortFromTasks(['1', '2']);

      expect(result.baseEffortMinutes).toBe(25);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].roomType).toBe('living_room');
    });

    it('should group tasks by room type', async () => {
      const kitchenTask = {
        ...mockTasks[0],
        id: '3',
        roomType: 'kitchen',
        effortMinutes: 20,
      };

      vi.mocked(taskLibraryService.getTaskById)
        .mockResolvedValueOnce(mockTasks[0]) // living_room
        .mockResolvedValueOnce(kitchenTask); // kitchen

      const result = await service.calculateEffortFromTasks(['1', '3']);

      expect(result.baseEffortMinutes).toBe(35);
      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[0].roomType).toBe('living_room');
      expect(result.breakdown[1].roomType).toBe('kitchen');
    });

    it('should apply modifiers', async () => {
      vi.mocked(taskLibraryService.getTaskById)
        .mockResolvedValueOnce(mockTasks[0])
        .mockResolvedValueOnce(mockTasks[1]);

      const result = await service.calculateEffortFromTasks(
        ['1', '2'],
        [{ type: 'rush', multiplier: 1.2 }]
      );

      expect(result.baseEffortMinutes).toBe(25);
      expect(result.modifiedEffortMinutes).toBe(30); // 25 * 1.2
    });

    it('should handle empty task list', async () => {
      const result = await service.calculateEffortFromTasks([]);

      expect(result.baseEffortMinutes).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });
  });

  describe('estimateByJobType()', () => {
    it('should estimate standard job effort', async () => {
      vi.mocked(taskLibraryService.getAllTasksByRoomType).mockResolvedValue({
        living_room: [{ ...mockTasks[0], effortMinutes: 30 }] as Task[],
        kitchen: [{ ...mockTasks[0], effortMinutes: 40 }] as Task[],
        bathroom: [{ ...mockTasks[0], effortMinutes: 25 }] as Task[],
      });

      const result = await service.estimateByJobType('standard');

      expect(result).toBe(95); // 30 + 40 + 25
    });

    it('should estimate deep clean with 50% modifier', async () => {
      vi.mocked(taskLibraryService.getAllTasksByRoomType).mockResolvedValue({
        living_room: [{ ...mockTasks[0], effortMinutes: 30 }] as Task[],
        kitchen: [{ ...mockTasks[0], effortMinutes: 40 }] as Task[],
        bathroom: [{ ...mockTasks[0], effortMinutes: 30 }] as Task[],
      });

      const result = await service.estimateByJobType('deep');

      expect(result).toBe(150); // (30 + 40 + 30) * 1.5 = 150
    });

    it('should estimate move-out with 75% modifier', async () => {
      vi.mocked(taskLibraryService.getAllTasksByRoomType).mockResolvedValue({
        living_room: [{ ...mockTasks[0], effortMinutes: 30 }] as Task[],
        kitchen: [{ ...mockTasks[0], effortMinutes: 40 }] as Task[],
      });

      const result = await service.estimateByJobType('move_out');

      expect(result).toBe(123); // (30 + 40) * 1.75 = 122.5 rounded to 123
    });
  });
});



