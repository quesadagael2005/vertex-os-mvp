// SettingsService - Read/Write Configurable Business Rules
// All business logic (fees, modifiers, thresholds) comes from database

import { prisma } from '@/lib/db/client';

export class SettingsService {
  /**
   * Get a single setting value by key
   * Automatically parses based on value_type in database
   */
  async get(key: string): Promise<string | number | boolean | object> {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new Error(`Setting not found: ${key}`);
    }

    return this.parseValue(setting.value, setting.valueType);
  }

  /**
   * Get all settings in a category
   * Returns object with key-value pairs
   */
  async getCategory(category: string): Promise<Record<string, any>> {
    const settings = await prisma.setting.findMany({
      where: { category },
    });

    const result: Record<string, any> = {};
    
    for (const setting of settings) {
      result[setting.key] = this.parseValue(setting.value, setting.valueType);
    }

    return result;
  }

  /**
   * Get all settings grouped by category
   */
  async getAll(): Promise<Record<string, Record<string, any>>> {
    const settings = await prisma.setting.findMany();
    
    const result: Record<string, Record<string, any>> = {};

    for (const setting of settings) {
      if (!result[setting.category]) {
        result[setting.category] = {};
      }
      result[setting.category][setting.key] = this.parseValue(
        setting.value,
        setting.valueType
      );
    }

    return result;
  }

  /**
   * Update a setting value (admin only)
   */
  async update(key: string, value: string): Promise<void> {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new Error(`Setting not found: ${key}`);
    }

    // Validate value based on type
    this.validateValue(value, setting.valueType);

    await prisma.setting.update({
      where: { key },
      data: {
        value,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Create a new setting
   */
  async create(data: {
    key: string;
    value: string;
    category: string;
    description?: string;
    valueType?: string;
  }): Promise<void> {
    const valueType = data.valueType || 'string';
    
    // Validate value based on type
    this.validateValue(data.value, valueType);

    await prisma.setting.create({
      data: {
        key: data.key,
        value: data.value,
        category: data.category,
        description: data.description,
        valueType,
      },
    });
  }

  /**
   * Parse setting value based on its type
   */
  private parseValue(value: string, valueType: string): string | number | boolean | object {
    switch (valueType) {
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) {
          throw new Error(`Invalid number value: ${value}`);
        }
        return num;

      case 'boolean':
        return value.toLowerCase() === 'true';

      case 'json':
        try {
          return JSON.parse(value);
        } catch (error) {
          throw new Error(`Invalid JSON value: ${value}`);
        }

      case 'string':
      default:
        return value;
    }
  }

  /**
   * Validate a value based on its expected type
   */
  private validateValue(value: string, valueType: string): void {
    switch (valueType) {
      case 'number':
        if (isNaN(parseFloat(value))) {
          throw new Error(`Value must be a number: ${value}`);
        }
        break;

      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          throw new Error(`Value must be 'true' or 'false': ${value}`);
        }
        break;

      case 'json':
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error(`Value must be valid JSON: ${value}`);
        }
        break;

      case 'string':
      default:
        // Strings are always valid
        break;
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();

