import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db/client';
import { Clock } from 'lucide-react';

export default async function TasksPage() {
  // Fetch tasks
  const tasks = await prisma.task.findMany({
    orderBy: [
      { roomType: 'asc' },
      { name: 'asc' },
    ],
  });

  // Group tasks by room type
  const tasksByRoom = tasks.reduce((acc, task) => {
    if (!acc[task.roomType]) {
      acc[task.roomType] = [];
    }
    acc[task.roomType].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const roomTypes = Object.keys(tasksByRoom).sort();

  const roomIcons: Record<string, string> = {
    kitchen: '🍳',
    bathroom: '🚿',
    bedroom: '🛏️',
    living_room: '🛋️',
    common: '🏠',
  };

  const roomNames: Record<string, string> = {
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    bedroom: 'Bedroom',
    living_room: 'Living Room',
    common: 'Common Areas',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Library</h1>
          <p className="text-muted-foreground">
            Manage available cleaning tasks by room type
          </p>
        </div>
        <Button className="bg-primary">
          + Add Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {roomTypes.map((roomType) => (
          <Card key={roomType} className="p-4">
            <div className="text-center">
              <p className="text-3xl mb-2">{roomIcons[roomType]}</p>
              <p className="text-sm text-gray-500">{roomNames[roomType]}</p>
              <p className="text-2xl font-bold">{tasksByRoom[roomType].length}</p>
              <p className="text-xs text-gray-500">tasks</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Tasks by Room */}
      {roomTypes.map((roomType) => (
        <Card key={roomType}>
          <div className="p-6 border-b bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{roomIcons[roomType]}</span>
              <div>
                <h3 className="font-semibold text-lg">{roomNames[roomType]}</h3>
                <p className="text-sm text-gray-500">
                  {tasksByRoom[roomType].length} available tasks
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {tasksByRoom[roomType].map((task) => (
              <div
                key={task.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{task.name}</h4>
                      {task.category && (
                        <Badge variant="outline" className="text-xs">
                          {task.category}
                        </Badge>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{task.baseEffortMinutes} min</span>
                        <span className="text-gray-500">base effort</span>
                      </div>

                      {task.effortMultiplier !== 1 && (
                        <Badge variant="secondary" className="text-xs">
                          {task.effortMultiplier}x multiplier
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

