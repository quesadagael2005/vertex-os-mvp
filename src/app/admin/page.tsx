import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Briefcase, Users, Sparkles, TrendingUp } from 'lucide-react';
import { metricsService } from '@/lib/services';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  // Get date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  // Fetch metrics
  const [metrics, todayStats] = await Promise.all([
    metricsService.getDashboardMetrics(startDate, endDate),
    metricsService.getTodayStats(),
  ]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.revenue.totalRevenueCents),
      change: '+12%',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Bookings',
      value: metrics.bookings.totalBookings.toString(),
      change: `${metrics.bookings.completionRate}% complete`,
      icon: Briefcase,
      color: 'text-blue-600',
    },
    {
      title: 'Active Cleaners',
      value: metrics.cleaners.activeCleaners.toString(),
      change: `${metrics.cleaners.averageRating}★ avg rating`,
      icon: Sparkles,
      color: 'text-purple-600',
    },
    {
      title: 'Total Members',
      value: metrics.customers.totalMembers.toString(),
      change: `+${metrics.customers.newMembersThisPeriod} this month`,
      icon: Users,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Vertex OS Admin. Here&apos;s your overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Scheduled Jobs</span>
              <span className="font-semibold">{todayStats.scheduledJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">In Progress</span>
              <span className="font-semibold">{todayStats.inProgressJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-semibold">{todayStats.completedJobs}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-medium">Today&apos;s Revenue</span>
              <span className="font-bold text-green-600">
                {formatCurrency(todayStats.revenueCents)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium transition-colors hover:bg-gray-50">
              + New Job
            </button>
            <button className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium transition-colors hover:bg-gray-50">
              Approve Cleaners
            </button>
            <button className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium transition-colors hover:bg-gray-50">
              Run Payouts
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Cleaners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.cleaners.topCleaners.slice(0, 3).map((cleaner) => (
              <div key={cleaner.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {cleaner.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{cleaner.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cleaner.rating}★ • {cleaner.completedJobs} jobs
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
