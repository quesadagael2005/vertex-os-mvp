import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db/client';
import { formatDate } from '@/lib/utils';
import { Star, Briefcase, DollarSign } from 'lucide-react';

export default async function CleanersPage() {
  // Fetch cleaners with job stats
  const cleaners = await prisma.cleaner.findMany({
    include: {
      zones: {
        include: {
          zone: true,
        },
      },
      _count: {
        select: {
          jobs: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate average rating for each cleaner
  const cleanersWithStats = await Promise.all(
    cleaners.map(async (cleaner) => {
      const ratings = await prisma.rating.findMany({
        where: {
          cleanerId: cleaner.id,
        },
      });

      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length
          : 0;

      return {
        ...cleaner,
        avgRating: avgRating.toFixed(1),
        ratingCount: ratings.length,
      };
    })
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cleaners</h1>
          <p className="text-muted-foreground">Manage cleaner profiles and assignments</p>
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          + Add Cleaner
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Cleaners</p>
          <p className="text-2xl font-bold">{cleaners.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {cleaners.filter((c) => c.status === 'active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">
            {cleaners.filter((c) => c.status === 'pending_approval').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-2xl font-bold">
            {cleanersWithStats.length > 0
              ? (
                  cleanersWithStats.reduce((sum, c) => sum + parseFloat(c.avgRating), 0) /
                  cleanersWithStats.length
                ).toFixed(1)
              : '0.0'}
            ⭐
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Status</option>
            <option>Active</option>
            <option>Pending Approval</option>
            <option>Suspended</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Zones</option>
            <option>Downtown SF</option>
            <option>Mission District</option>
            <option>Richmond</option>
          </select>
          <input
            type="search"
            placeholder="Search cleaners..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </Card>

      {/* Cleaners Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cleanersWithStats.map((cleaner) => (
          <Card
            key={cleaner.id}
            className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                    {cleaner.firstName[0]}
                    {cleaner.lastName[0]}
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {cleaner.firstName} {cleaner.lastName}
                    </p>
                    {getStatusBadge(cleaner.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    {cleaner.avgRating}
                  </div>
                  <p className="text-xs text-gray-500">{cleaner.ratingCount} reviews</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold">
                    <Briefcase className="h-4 w-4" />
                    {cleaner._count.jobs}
                  </div>
                  <p className="text-xs text-gray-500">Jobs</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-green-600">
                    <DollarSign className="h-4 w-4" />
                    {cleaner.payRateCents / 100}
                  </div>
                  <p className="text-xs text-gray-500">/hour</p>
                </div>
              </div>

              {/* Zones */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">Service Zones:</p>
                <div className="flex flex-wrap gap-1">
                  {cleaner.zones.slice(0, 3).map((cz) => (
                    <Badge key={cz.zoneId} variant="outline" className="text-xs">
                      {cz.zone.name}
                    </Badge>
                  ))}
                  {cleaner.zones.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{cleaner.zones.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t pt-4 text-xs text-gray-500">
                <span>Joined {formatDate(cleaner.createdAt)}</span>
                <button className="text-primary hover:underline">View Profile →</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
