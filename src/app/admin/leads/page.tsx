import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db/client';
import { formatDate, calculatePercentage } from '@/lib/utils';
import { Target, TrendingDown, Phone, Mail } from 'lucide-react';

export default async function LeadsPage() {
  // Fetch leads
  const leads = await prisma.lead.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  // Calculate funnel stats based on actual schema
  const funnelStats = {
    inProgress: leads.filter((l) => l.status === 'IN_PROGRESS').length,
    completed: leads.filter((l) => l.status === 'COMPLETED').length,
    converted: leads.filter((l) => l.status === 'CONVERTED').length,
    abandoned: leads.filter((l) => l.status === 'ABANDONED').length,
  };

  const totalLeads = leads.length;
  const conversionRate = calculatePercentage(funnelStats.converted, totalLeads);

  // Calculate abandoned leads (status is ABANDONED or idle > 3 days in progress)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const abandonedLeads = leads.filter(
    (l) =>
      l.status === 'ABANDONED' ||
      (l.status === 'IN_PROGRESS' && new Date(l.updatedAt) < threeDaysAgo)
  );

  const getIdleDays = (updatedAt: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(updatedAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONVERTED':
        return <Badge variant="success">✓ Converted</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-500 hover:bg-blue-600">📝 Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">⏳ In Progress</Badge>;
      case 'ABANDONED':
        return <Badge variant="destructive">❌ Abandoned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground">
            Track conversion funnel and follow up on abandoned leads
          </p>
        </div>
        <Button className="bg-primary">
          + Add Lead
        </Button>
      </div>

      {/* Conversion Funnel */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">📊 Conversion Funnel</h3>
        <div className="space-y-2">
          {/* Total Leads */}
          <div className="flex items-center gap-4">
            <div
              className="h-12 bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center text-sm font-semibold"
              style={{ width: '100%' }}
            >
              {totalLeads} Total Leads
            </div>
          </div>

          {/* In Progress */}
          <div className="flex items-center gap-4">
            <div
              className="h-10 bg-yellow-400 rounded flex items-center justify-center text-sm font-semibold text-white"
              style={{
                width: `${calculatePercentage(funnelStats.inProgress, totalLeads)}%`,
                minWidth: '150px',
              }}
            >
              {funnelStats.inProgress} In Progress (
              {calculatePercentage(funnelStats.inProgress, totalLeads)}%)
            </div>
          </div>

          {/* Completed */}
          <div className="flex items-center gap-4">
            <div
              className="h-10 bg-blue-400 rounded flex items-center justify-center text-sm font-semibold text-white"
              style={{
                width: `${calculatePercentage(funnelStats.completed, totalLeads)}%`,
                minWidth: '150px',
              }}
            >
              {funnelStats.completed} Completed (
              {calculatePercentage(funnelStats.completed, totalLeads)}%)
            </div>
          </div>

          {/* Converted */}
          <div className="flex items-center gap-4">
            <div
              className="h-10 bg-green-500 rounded flex items-center justify-center text-sm font-semibold text-white"
              style={{
                width: `${calculatePercentage(funnelStats.converted, totalLeads)}%`,
                minWidth: '150px',
              }}
            >
              {funnelStats.converted} Converted ({conversionRate}%)
            </div>
          </div>

          {/* Abandoned */}
          <div className="flex items-center gap-4">
            <div
              className="h-10 bg-red-400 rounded flex items-center justify-center text-sm font-semibold text-white"
              style={{
                width: `${calculatePercentage(funnelStats.abandoned, totalLeads)}%`,
                minWidth: '150px',
              }}
            >
              {funnelStats.abandoned} Abandoned (
              {calculatePercentage(funnelStats.abandoned, totalLeads)}%)
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-primary/10 rounded-lg">
          <p className="text-sm font-semibold">
            Overall Conversion Rate: <span className="text-2xl">{conversionRate}%</span>
          </p>
        </div>
      </Card>

      {/* Abandoned Leads Alert */}
      {abandonedLeads.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <TrendingDown className="h-6 w-6 text-red-500 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-red-600">
                  ⚠️ {abandonedLeads.length} Abandoned Leads
                </h3>
                <p className="text-sm text-gray-600">
                  These leads haven't been contacted in over 3 days. Follow up to re-engage!
                </p>
              </div>
              <Button variant="outline">
                Send Bulk Email
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Abandoned Leads Table */}
      <Card>
        <div className="p-6 border-b">
          <h3 className="font-semibold text-lg">🔍 Abandoned Leads (Need Follow-up)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Last Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Days Idle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {abandonedLeads.slice(0, 20).map((lead) => {
                const idleDays = getIdleDays(lead.updatedAt);
                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{lead.email}</p>
                      {lead.phone && (
                        <p className="text-xs text-gray-500">{lead.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(lead.status)}</td>
                  <td className="px-6 py-4 text-sm">{lead.addressZip || '-'}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(lead.updatedAt)}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          idleDays > 14
                            ? 'destructive'
                            : idleDays > 7
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {idleDays}d
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

