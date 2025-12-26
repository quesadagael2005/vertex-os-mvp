# TaskLibraryService

**Master Task Library** - Query and manage the catalog of cleaning tasks organized by room type.

## Overview

The TaskLibraryService provides access to the master task library, which contains all available cleaning tasks organized by room type (living_room, kitchen, bathroom, etc.). Each task has an effort estimate in minutes, used for pricing and checklist generation.

## Architecture

- **Room-Based Organization**: Tasks grouped by room type
- **Effort Estimates**: Each task has `effortMinutes` for pricing
- **Soft Deletes**: Tasks marked `isActive: false` instead of deletion
- **Admin Manageable**: CRUD operations for task library
- **Search Enabled**: Find tasks by name or description

## Task Structure

```typescript
interface Task {
  id: string;
  name: string;              // "Vacuum carpet"
  description?: string;      // "Vacuum all carpeted areas"
  roomType: string;          // "living_room", "kitchen", etc.
  effortMinutes: number;     // 15
  defaultOrder?: number;     // Display order in checklists
  isActive: boolean;         // Soft delete flag
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage Examples

### Get Tasks by Room Type

```typescript
import { taskLibraryService } from '@/lib/services';

// Get all living room tasks
const tasks = await taskLibraryService.getTasksByRoomType('living_room');
// => [
//   { name: "Vacuum carpet", effortMinutes: 15, ... },
//   { name: "Dust surfaces", effortMinutes: 10, ... },
//   ...
// ]
```

### Get All Tasks Grouped by Room Type

```typescript
const allTasks = await taskLibraryService.getAllTasksByRoomType();
// => {
//   living_room: [...],
//   kitchen: [...],
//   bathroom: [...],
//   ...
// }
```

### Get Available Room Types

```typescript
const roomTypes = await taskLibraryService.getRoomTypes();
// => ["bathroom", "bedroom", "kitchen", "living_room", ...]
```

### Search Tasks

```typescript
// Search by name or description
const results = await taskLibraryService.searchTasks('vacuum');
// => [{ name: "Vacuum carpet", ... }, { name: "Vacuum stairs", ... }]

// Case insensitive
const results2 = await taskLibraryService.searchTasks('CLEAN');
```

### Get Task by ID

```typescript
const task = await taskLibraryService.getTaskById('task-123');
// => { name: "Mop floor", effortMinutes: 20, ... }
```

### Get Task Statistics

```typescript
const stats = await taskLibraryService.getTaskStats();
// => {
//   totalTasks: 71,
//   tasksByRoomType: {
//     living_room: 8,
//     kitchen: 12,
//     bathroom: 10,
//     ...
//   },
//   totalEffortMinutes: 1420,
//   averageEffortMinutes: 20
// }
```

## Admin Operations

### Create a Task

```typescript
const newTask = await taskLibraryService.createTask({
  name: 'Clean windows',
  description: 'Clean interior window panes',
  roomType: 'living_room',
  effortMinutes: 15,
  defaultOrder: 10,
});
```

### Update a Task

```typescript
await taskLibraryService.updateTask('task-123', {
  effortMinutes: 20,  // Update effort estimate
  name: 'Clean all windows',
});
```

### Soft Delete a Task

```typescript
// Sets isActive: false (recommended)
await taskLibraryService.deleteTask('task-123');
```

### Hard Delete a Task

```typescript
// Permanent deletion (use with caution)
await taskLibraryService.hardDeleteTask('task-123');
```

## Seeded Tasks

The database comes pre-seeded with **71 tasks** across **9 room types**:

### Living Room (8 tasks)
- Vacuum carpet (15 min)
- Dust surfaces (10 min)
- Clean windows (20 min)
- Wipe baseboards (10 min)
- ...

### Kitchen (12 tasks)
- Clean countertops (10 min)
- Clean sink (10 min)
- Wipe appliances (15 min)
- Clean stovetop (15 min)
- Mop floor (20 min)
- ...

### Bathroom (10 tasks)
- Clean toilet (10 min)
- Clean sink (8 min)
- Clean shower/tub (15 min)
- Clean mirrors (5 min)
- Mop floor (15 min)
- ...

### Bedroom (7 tasks)
- Vacuum carpet (15 min)
- Dust surfaces (10 min)
- Make bed (5 min)
- ...

### Dining Room (6 tasks)
- Wipe table (10 min)
- Dust surfaces (10 min)
- ...

### Office (5 tasks)
- Dust desk (10 min)
- Wipe keyboard (5 min)
- ...

### Laundry Room (4 tasks)
- Clean washer (10 min)
- Wipe surfaces (10 min)
- ...

### Hallway (4 tasks)
- Vacuum carpet (10 min)
- Dust surfaces (5 min)
- ...

### Stairs (3 tasks)
- Vacuum stairs (15 min)
- Wipe railing (10 min)
- ...

## Integration with Other Services

### ChecklistService

```typescript
// Get tasks for checklist generation
const kitchenTasks = await taskLibraryService.getTasksByRoomType('kitchen');
const checklist = await checklistService.create(jobId, kitchenTasks);
```

### EffortCalculatorService

```typescript
// Calculate total effort for selected tasks
const tasks = await taskLibraryService.getTasksByRoomType('bathroom');
const totalMinutes = tasks.reduce((sum, task) => sum + task.effortMinutes, 0);
```

### PricingService

```typescript
// Calculate price based on task effort
const tasks = await taskLibraryService.getTasksByRoomType('kitchen');
const totalEffort = tasks.reduce((sum, t) => sum + t.effortMinutes, 0);
const price = await pricingService.calculate({ effortMinutes: totalEffort });
```

## Testing

Comprehensive test coverage (18 tests):
- ✅ Get tasks by room type
- ✅ Get all tasks grouped
- ✅ Search functionality
- ✅ Get room types
- ✅ CRUD operations
- ✅ Soft vs hard delete
- ✅ Task statistics
- ✅ Edge cases

Run tests:
```bash
pnpm test tests/services/task-library.test.ts
```

## API Integration

Use with API routes:

```typescript
// GET /api/tasks?roomType=kitchen
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomType = searchParams.get('roomType');
  
  if (roomType) {
    const tasks = await taskLibraryService.getTasksByRoomType(roomType);
    return Response.json(tasks);
  }
  
  const allTasks = await taskLibraryService.getAllTasksByRoomType();
  return Response.json(allTasks);
}

// POST /api/admin/tasks
export async function POST(req: Request) {
  const data = await req.json();
  const task = await taskLibraryService.createTask(data);
  return Response.json(task);
}
```

## Best Practices

1. **Use soft deletes** - Preserve historical task data
2. **Keep effort estimates accurate** - Critical for pricing
3. **Maintain consistent naming** - Use clear, descriptive task names
4. **Group logically** - Organize tasks by room type
5. **Review regularly** - Update task library based on cleaner feedback

## Data Model

```sql
CREATE TABLE tasks (
  id              UUID PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  room_type       VARCHAR(50) NOT NULL,
  effort_minutes  INTEGER NOT NULL,
  default_order   INTEGER,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_room_type ON tasks(room_type);
CREATE INDEX idx_tasks_active ON tasks(is_active);
```

## Related Services

- **ChecklistService**: Uses tasks for checklist generation
- **EffortCalculatorService**: Calculates effort from selected tasks
- **PricingService**: Prices jobs based on task effort
- **BookingService**: References tasks in job checklists



