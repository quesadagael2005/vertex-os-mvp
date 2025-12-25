import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db/client';
import { MapPin, Users } from 'lucide-react';

export default async function ZonesPage() {
  // Fetch zones with cleaner counts
  const zones = await prisma.zone.findMany({
    include: {
      cleaners: {
        include: {
          cleaner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              status: true,
              _count: {
                select: {
                  jobs: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          cleaners: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Zones</h1>
          <p className="text-muted-foreground">Manage service zones and cleaner assignments</p>
        </div>
        <Button className="bg-primary">+ Add Zone</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Zones</p>
          <p className="text-2xl font-bold">{zones.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Cleaners</p>
          <p className="text-2xl font-bold">
            {zones.reduce((sum, z) => sum + z.cleaners.length, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Jobs</p>
          <p className="text-2xl font-bold">
            {zones.reduce(
              (sum, z) => sum + z.cleaners.reduce((jobSum, c) => jobSum + c.cleaner._count.jobs, 0),
              0
            )}
          </p>
        </Card>
      </div>

      {/* Zones Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => {
          const activeCleaners = zone.cleaners.filter((c) => c.cleaner.status === 'active').length;
          const totalJobs = zone.cleaners.reduce((sum, c) => sum + c.cleaner._count.jobs, 0);

          return (
            <Card
              key={zone.id}
              className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-white">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{zone.name}</h3>
                      {zone.status === 'ACTIVE' ? (
                        <Badge variant="success" className="text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {zone.status === 'WAITLIST' ? 'Waitlist' : 'Inactive'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4 p-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                    <div className="flex items-center justify-center gap-1 text-xl font-bold text-primary">
                      <Users className="h-5 w-5" />
                      {activeCleaners}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Active Cleaners</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                    <div className="text-xl font-bold">{totalJobs}</div>
                    <p className="mt-1 text-xs text-gray-500">Total Jobs</p>
                  </div>
                </div>

                {/* Assigned Cleaners */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">Assigned Cleaners:</p>
                  {zone.cleaners.length > 0 ? (
                    <div className="space-y-2">
                      {zone.cleaners.slice(0, 3).map((cz) => (
                        <div key={cz.cleanerId} className="flex items-center gap-2 text-sm">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {cz.cleaner.firstName[0]}
                            {cz.cleaner.lastName[0]}
                          </div>
                          <span className="flex-1">
                            {cz.cleaner.firstName} {cz.cleaner.lastName}
                          </span>
                          {cz.cleaner.status === 'active' ? (
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                          )}
                        </div>
                      ))}
                      {zone.cleaners.length > 3 && (
                        <p className="pl-8 text-xs text-gray-500">
                          + {zone.cleaners.length - 3} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm italic text-gray-400">No cleaners assigned</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    Edit Zone
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Assign Cleaners
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
