import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default async function PayoutsPage() {
  // Fetch payout batches
  const batches = await prisma.payoutBatch.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  // Calculate pending payouts (jobs without payout transactions)
  const completedJobs = await prisma.job.findMany({
    where: {
      status: 'COMPLETED',
      cleanerId: { not: null },
    },
    include: {
      cleaner: true,
      transactions: {
        where: {
          type: 'CLEANER_PAYOUT',
          status: 'COMPLETED',
        },
      },
    },
  });

  // Filter to jobs that don't have a completed payout transaction
  const jobsNeedingPayout = completedJobs.filter(job => job.transactions.length === 0);

  const pendingAmount = jobsNeedingPayout.reduce(
    (sum, job) => sum + Number(job.cleanerPayout) * 100,
    0
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground">
            Manage cleaner payouts and batch processing
          </p>
        </div>
        <Button className="bg-primary">
          🚀 Run Payout Batch
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Payouts</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(pendingAmount)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {jobsNeedingPayout.length} jobs awaiting payout
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  batches
                    .filter((b) => {
                      const date = new Date(b.createdAt);
                      const now = new Date();
                      return (
                        date.getMonth() === now.getMonth() &&
                        date.getFullYear() === now.getFullYear()
                      );
                    })
                    .reduce((sum, b) => sum + b.totalCents, 0)
                )}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {
              batches.filter((b) => {
                const date = new Date(b.createdAt);
                const now = new Date();
                return (
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear()
                );
              }).length
            }{' '}
            batches processed
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold">
                {formatCurrency(batches.reduce((sum, b) => sum + b.totalCents, 0))}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Batch Size</p>
              <p className="text-2xl font-bold">
                {batches.length > 0
                  ? formatCurrency(
                      batches.reduce((sum, b) => sum + b.totalCents, 0) / batches.length
                    )
                  : '$0.00'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Pending Payouts */}
      {jobsNeedingPayout.length > 0 && (
        <Card>
          <div className="p-6 border-b bg-yellow-50 dark:bg-yellow-900/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">⚠️ Pending Payouts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {jobsNeedingPayout.length} completed jobs ready for payout
                </p>
              </div>
              <Button className="bg-primary">Process Now</Button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {jobsNeedingPayout.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {job.cleaner?.firstName} {job.cleaner?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">Job #{job.id.substring(0, 8)}</p>
                  </div>
                  <p className="font-bold text-green-600">
                    {formatCurrency(Number(job.cleanerPayout) * 100)}
                  </p>
                </div>
              ))}
              {jobsNeedingPayout.length > 5 && (
                <p className="text-sm text-gray-500 pt-2">
                  + {jobsNeedingPayout.length - 5} more jobs
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Payout History */}
      <Card>
        <div className="p-6 border-b">
          <h3 className="font-semibold text-lg">Payout History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Batch ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Stripe Transfer ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((batch) => (
                <tr
                  key={batch.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm font-medium">
                    {batch.id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm">{formatDate(batch.createdAt)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    {formatCurrency(batch.totalCents)}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(batch.status)}</td>
                  <td className="px-6 py-4 text-sm font-mono text-xs">
                    {batch.stripeTransferId || '-'}
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

