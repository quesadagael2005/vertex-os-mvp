import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db/client';
import { formatDate } from '@/lib/utils';
import { Mail, Phone, MapPin } from 'lucide-react';

export default async function MembersPage() {
  // Fetch members
  const members = await prisma.member.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'VIP':
        return <Badge className="bg-purple-500 hover:bg-purple-600">VIP</Badge>;
      case 'Plus':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Plus</Badge>;
      case 'Basic':
        return <Badge variant="secondary">Basic</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage customer memberships and profiles
          </p>
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          + Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Members</p>
          <p className="text-2xl font-bold">{members.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">VIP Members</p>
          <p className="text-2xl font-bold">
            {members.filter((m) => m.tier === 'VIP').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">New This Month</p>
          <p className="text-2xl font-bold">
            {
              members.filter((m) => {
                const date = new Date(m.createdAt);
                const now = new Date();
                return (
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear()
                );
              }).length
            }
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>All Tiers</option>
            <option>VIP</option>
            <option>Plus</option>
            <option>Basic</option>
          </select>
          <input
            type="search"
            placeholder="Search members..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </Card>

      {/* Members Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {member.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {member.email}
                    </p>
                    {getTierBadge(member.tier)}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">
                    {member.addressZip}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t pt-4 text-xs text-gray-500">
                <span>Joined {formatDate(member.createdAt)}</span>
                <button className="text-primary hover:underline">
                  View Profile →
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

