import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db/client';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function JobsPage() {
  // Fetch jobs with related data
  const jobs = await prisma.job.findMany({
    include: {
      member: {
        select: {
          email: true,
          phone: true,
        },
      },
      cleaner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-500 hover:bg-purple-600">In Progress</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">Manage all cleaning jobs and assignments</p>
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          + New Job
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Status</option>
            <option>Scheduled</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Zones</option>
            <option>Downtown SF</option>
            <option>Mission District</option>
            <option>Richmond</option>
          </select>
          <input
            type="search"
            placeholder="Search jobs..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </Card>

      {/* Jobs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Job ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Cleaner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-sm font-medium">{job.id.substring(0, 8)}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <p className="font-medium">{job.member.email}</p>
                      {job.member.phone && (
                        <p className="text-xs text-gray-500">{job.member.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {job.cleaner ? (
                      `${job.cleaner.firstName} ${job.cleaner.lastName}`
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">{job.addressZip}</p>
                      <p className="max-w-xs truncate text-xs text-gray-400">{job.addressFull}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {job.scheduledDate ? formatDate(job.scheduledDate) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {formatCurrency(Number(job.totalPrice) * 100)}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-6 py-3">
          <p className="text-sm text-gray-500">
            Showing 1-{jobs.length} of {jobs.length} jobs
          </p>
          <div className="flex gap-2">
            <button className="rounded border px-3 py-1 text-sm hover:bg-gray-50">Previous</button>
            <button className="rounded border bg-primary px-3 py-1 text-sm text-white">1</button>
            <button className="rounded border px-3 py-1 text-sm hover:bg-gray-50">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
