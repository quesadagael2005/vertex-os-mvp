import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db/client';
import { formatDate } from '@/lib/utils';
import { Clock, Lock, CheckCircle } from 'lucide-react';

export default async function ApplicationsPage() {
  // Fetch applications
  const applications = await prisma.application.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">✓ Approved</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">⏳ Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">❌ Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusCounts = {
    pending: applications.filter((a) => a.status === 'PENDING').length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cleaner Applications</h1>
        <p className="text-muted-foreground">Review and approve new cleaner applications</p>
      </div>

      {/* Pipeline Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-yellow-500 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-3xl font-bold">{statusCounts.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-3xl font-bold">{statusCounts.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-red-500 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-3xl font-bold">{statusCounts.rejected}</p>
            </div>
            <Lock className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
          <input
            type="search"
            placeholder="Search applications..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </Card>

      {/* Applications Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {app.firstName[0]}
                        {app.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">
                          {app.firstName} {app.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {app.addressZip}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{app.email}</td>
                  <td className="px-6 py-4 text-sm">{app.phone}</td>
                  <td className="px-6 py-4 text-sm">{formatDate(app.createdAt)}</td>
                  <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {app.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="default">
                            ✓ Approve
                          </Button>
                          <Button size="sm" variant="destructive">
                            ✗ Reject
                          </Button>
                        </>
                      )}
                      {(app.status === 'APPROVED' || app.status === 'REJECTED') && (
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
