// SettingsService Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsService } from '@/lib/services/settings';
import { prisma } from '@/lib/db/client';

// Mock Prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    setting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    service = new SettingsService();
    vi.clearAllMocks();
  });

  describe('get()', () => {
    it('should return a string setting', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        id: '1',
        key: 'company_name',
        value: 'Red Shirt Club',
        category: 'general',
        description: 'Company name',
        valueType: 'string',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.get('company_name');
      expect(result).toBe('Red Shirt Club');
    });

    it('should return a number setting', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        id: '2',
        key: 'base_fee_cents',
        value: '2500',
        category: 'pricing',
        description: 'Base fee',
        valueType: 'number',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.get('base_fee_cents');
      expect(result).toBe(2500);
      expect(typeof result).toBe('number');
    });

    it('should return a boolean setting', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        id: '3',
        key: 'is_accepting_bookings',
        value: 'true',
        category: 'general',
        description: 'Accepting bookings',
        valueType: 'boolean',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.get('is_accepting_bookings');
      expect(result).toBe(true);
      expect(typeof result).toBe('boolean');
    });

    it('should return a JSON setting', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        id: '4',
        key: 'tier_features',
        value: '{"silver":["standard_cleaning"],"gold":["deep_cleaning"]}',
        category: 'tiers',
        description: 'Tier features',
        valueType: 'json',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.get('tier_features');
      expect(result).toEqual({
        silver: ['standard_cleaning'],
        gold: ['deep_cleaning'],
      });
    });

    it('should throw error if setting not found', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue(null);

      await expect(service.get('nonexistent')).rejects.toThrow('Setting not found: nonexistent');
    });

    it('should throw error for invalid number', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        id: '5',
        key: 'invalid_number',
        value: 'not a number',
        category: 'test',
        description: 'Invalid',
        valueType: 'number',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.get('invalid_number')).rejects.toThrow('Invalid number value');
    });

    it('should throw error for invalid JSON', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        id: '6',
        key: 'invalid_json',
        value: '{invalid json}',
        category: 'test',
        description: 'Invalid',
        valueType: 'json',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.get('invalid_json')).rejects.toThrow('Invalid JSON value');
    });
  });

  describe('getCategory()', () => {
    it('should return all settings in a category', async () => {
      vi.mocked(prisma.setting.findMany).mockResolvedValue([
        {
          id: '1',
          key: 'base_fee_cents',
          value: '2500',
          category: 'pricing',
          description: 'Base fee',
          valueType: 'number',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          key: 'per_minute_cents',
          value: '50',
          category: 'pricing',
          description: 'Per minute rate',
          valueType: 'number',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getCategory('pricing');
      expect(result).toEqual({
        base_fee_cents: 2500,
        per_minute_cents: 50,
      });
    });

    it('should return empty object for category with no settings', async () => {
      vi.mocked(prisma.setting.findMany).mockResolvedValue([]);

      const result = await service.getCategory('empty_category');
      expect(result).toEqual({});
    });
  });

  describe('getAll()', () => {
    it('should return all settings grouped by category', async () => {
      vi.mocked(prisma.setting.findMany).mockResolvedValue([
        {
          id: '1',
          key: 'company_name',
          value: 'Red Shirt Club',
          category: 'general',
          description: 'Company name',
          valueType: 'string',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          key: 'base_fee_cents',
          value: '2500',
          category: 'pricing',
          description: 'Base fee',
          valueType: 'number',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getAll();
      expect(result).toEqual({
        general: {
          company_name: 'Red Shirt Club',
        },
        pricing: {
          base_fee_cents: 2500,
        },
      });
    });
  });

  describe('update()', () => {
    it('should update a setting value', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        id: '1',
        key: 'base_fee_cents',
        value: '2500',
        category: 'pricing',
        description: 'Base fee',
        valueType: 'number',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.setting.update).mockResolvedValue({
        id: '1',
        key: 'base_fee_cents',
        value: '3000',
        category: 'pricing',
        description: 'Base fee',
        valueType: 'number',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.update('base_fee_cents', '3000');

      expect(prisma.setting.update).toHaveBeenCalledWith({
        where: { key: 'base_fee_cents' },
        data: {
          value: '3000',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error if setting not found', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue(null);

      await expect(service.update('nonexistent', 'value')).rejects.toThrow('Setting not found');
    });

    it('should validate number values', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        id: '1',
        key: 'base_fee_cents',
        value: '2500',
        category: 'pricing',
        description: 'Base fee',
        valueType: 'number',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.update('base_fee_cents', 'not a number')).rejects.toThrow(
        'Value must be a number'
      );
    });

    it('should validate boolean values', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        id: '1',
        key: 'is_accepting_bookings',
        value: 'true',
        category: 'general',
        description: 'Accepting bookings',
        valueType: 'boolean',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.update('is_accepting_bookings', 'yes')).rejects.toThrow(
        "Value must be 'true' or 'false'"
      );
    });

    it('should validate JSON values', async () => {
      vi.mocked(prisma.setting.findUnique).mockResolvedValue({
        id: '1',
        key: 'tier_features',
        value: '{}',
        category: 'tiers',
        description: 'Tier features',
        valueType: 'json',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.update('tier_features', '{invalid}')).rejects.toThrow(
        'Value must be valid JSON'
      );
    });
  });

  describe('create()', () => {
    it('should create a new setting', async () => {
      vi.mocked(prisma.setting.create).mockResolvedValue({
        id: '1',
        key: 'new_setting',
        value: 'test value',
        category: 'test',
        description: 'Test setting',
        valueType: 'string',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.create({
        key: 'new_setting',
        value: 'test value',
        category: 'test',
        description: 'Test setting',
      });

      expect(prisma.setting.create).toHaveBeenCalledWith({
        data: {
          key: 'new_setting',
          value: 'test value',
          category: 'test',
          description: 'Test setting',
          valueType: 'string',
        },
      });
    });

    it('should validate value on create', async () => {
      await expect(
        service.create({
          key: 'test_number',
          value: 'not a number',
          category: 'test',
          valueType: 'number',
        })
      ).rejects.toThrow('Value must be a number');
    });
  });
});



