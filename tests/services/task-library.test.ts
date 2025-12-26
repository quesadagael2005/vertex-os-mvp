// TaskLibraryService Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskLibraryService } from '@/lib/services/task-library';
import { prisma } from '@/lib/db/client';
import type { Task } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    task: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('TaskLibraryService', () => {
  let service: TaskLibraryService;

  const mockTask: Task = {
    id: '1',
    name: 'Vacuum carpet',
    description: 'Vacuum all carpeted areas',
    roomType: 'living_room',
    effortMinutes: 15,
    defaultOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = new TaskLibraryService();
    vi.clearAllMocks();
  });

  describe('getTasksByRoomType()', () => {
    it('should return all active tasks for a room type', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask]);

      const result = await service.getTasksByRoomType('living_room');

      expect(result).toEqual([mockTask]);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          roomType: 'living_room',
          isActive: true,
        },
        orderBy: [{ defaultOrder: 'asc' }, { name: 'asc' }],
      });
    });

    it('should return empty array for room type with no tasks', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const result = await service.getTasksByRoomType('office');
      expect(result).toEqual([]);
    });
  });

  describe('getAllTasksByRoomType()', () => {
    it('should return tasks grouped by room type', async () => {
      const tasks: Task[] = [
        { ...mockTask, id: '1', roomType: 'living_room', name: 'Task 1' },
        { ...mockTask, id: '2', roomType: 'living_room', name: 'Task 2' },
        { ...mockTask, id: '3', roomType: 'kitchen', name: 'Task 3' },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValue(tasks);

      const result = await service.getAllTasksByRoomType();

      expect(result).toEqual({
        living_room: [tasks[0], tasks[1]],
        kitchen: [tasks[2]],
      });
    });

    it('should only return active tasks', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask]);

      await service.getAllTasksByRoomType();

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ roomType: 'asc' }, { defaultOrder: 'asc' }, { name: 'asc' }],
      });
    });
  });

  describe('getTaskById()', () => {
    it('should return a task by ID', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask);

      const result = await service.getTaskById('1');

      expect(result).toEqual(mockTask);
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if task not found', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      const result = await service.getTaskById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('searchTasks()', () => {
    it('should search tasks by name', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask]);

      const result = await service.searchTasks('vacuum');

      expect(result).toEqual([mockTask]);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            {
              name: {
                contains: 'vacuum',
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: 'vacuum',
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: [{ roomType: 'asc' }, { name: 'asc' }],
      });
    });

    it('should search tasks by description', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask]);

      const result = await service.searchTasks('carpeted');

      expect(result).toEqual([mockTask]);
    });

    it('should be case insensitive', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask]);

      await service.searchTasks('VACUUM');

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: expect.objectContaining({
                  contains: 'vacuum',
                }),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('getRoomTypes()', () => {
    it('should return unique list of room types', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([
        { roomType: 'living_room' } as Task,
        { roomType: 'kitchen' } as Task,
        { roomType: 'bathroom' } as Task,
      ]);

      const result = await service.getRoomTypes();

      expect(result).toEqual(['living_room', 'kitchen', 'bathroom']);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { roomType: true },
        distinct: ['roomType'],
        orderBy: { roomType: 'asc' },
      });
    });
  });

  describe('createTask()', () => {
    it('should create a new task', async () => {
      const newTask = {
        name: 'New task',
        description: 'Description',
        roomType: 'bedroom',
        effortMinutes: 20,
        defaultOrder: 1,
      };

      vi.mocked(prisma.task.create).mockResolvedValue({ ...mockTask, ...newTask });

      const result = await service.createTask(newTask);

      expect(result.name).toBe('New task');
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          name: 'New task',
          description: 'Description',
          roomType: 'bedroom',
          effortMinutes: 20,
          defaultOrder: 1,
          isActive: true,
        },
      });
    });

    it('should set isActive to true by default', async () => {
      vi.mocked(prisma.task.create).mockResolvedValue(mockTask);

      await service.createTask({
        name: 'Task',
        roomType: 'kitchen',
        effortMinutes: 10,
      });

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });
  });

  describe('updateTask()', () => {
    it('should update a task', async () => {
      vi.mocked(prisma.task.update).mockResolvedValue({
        ...mockTask,
        name: 'Updated task',
      });

      const result = await service.updateTask('1', { name: 'Updated task' });

      expect(result.name).toBe('Updated task');
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated task' },
      });
    });

    it('should allow partial updates', async () => {
      vi.mocked(prisma.task.update).mockResolvedValue(mockTask);

      await service.updateTask('1', { effortMinutes: 30 });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { effortMinutes: 30 },
      });
    });
  });

  describe('deleteTask()', () => {
    it('should soft delete a task by setting isActive to false', async () => {
      vi.mocked(prisma.task.update).mockResolvedValue({
        ...mockTask,
        isActive: false,
      });

      const result = await service.deleteTask('1');

      expect(result.isActive).toBe(false);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });

  describe('hardDeleteTask()', () => {
    it('should permanently delete a task', async () => {
      vi.mocked(prisma.task.delete).mockResolvedValue(mockTask);

      await service.hardDeleteTask('1');

      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getTaskStats()', () => {
    it('should return task statistics', async () => {
      const tasks: Task[] = [
        { ...mockTask, id: '1', roomType: 'living_room', effortMinutes: 15 },
        { ...mockTask, id: '2', roomType: 'living_room', effortMinutes: 10 },
        { ...mockTask, id: '3', roomType: 'kitchen', effortMinutes: 20 },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValue(tasks);

      const result = await service.getTaskStats();

      expect(result).toEqual({
        totalTasks: 3,
        tasksByRoomType: {
          living_room: 2,
          kitchen: 1,
        },
        totalEffortMinutes: 45,
        averageEffortMinutes: 15,
      });
    });

    it('should handle zero tasks', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const result = await service.getTaskStats();

      expect(result).toEqual({
        totalTasks: 0,
        tasksByRoomType: {},
        totalEffortMinutes: 0,
        averageEffortMinutes: 0,
      });
    });
  });
});




