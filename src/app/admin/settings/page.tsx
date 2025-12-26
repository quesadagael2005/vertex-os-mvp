import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db/client';
import { Settings as SettingsIcon, DollarSign, Clock, Users } from 'lucide-react';

export default async function SettingsPage() {
  // Fetch settings
  const settings = await prisma.setting.findMany({
    orderBy: {
      key: 'asc',
    },
  });

  // Group settings by category
  const settingsByCategory = settings.reduce(
    (acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    },
    {} as Record<string, typeof settings>
  );

  const categories = Object.keys(settingsByCategory).sort();

  const categoryIcons: Record<string, typeof SettingsIcon> = {
    pricing: DollarSign,
    booking: Clock,
    operations: SettingsIcon,
    notifications: Users,
  };

  const categoryNames: Record<string, string> = {
    pricing: 'Pricing & Fees',
    booking: 'Booking Rules',
    operations: 'Operations',
    notifications: 'Notifications',
  };

  const formatValue = (value: string, key: string) => {
    // Handle different value types
    if (key.includes('cents') || key.includes('price')) {
      const cents = parseInt(value);
      return `$${(cents / 100).toFixed(2)}`;
    }
    if (key.includes('hours')) {
      return `${value} hours`;
    }
    if (key.includes('minutes')) {
      return `${value} minutes`;
    }
    if (key.includes('days')) {
      return `${value} days`;
    }
    if (key.includes('rate') && !key.includes('cents')) {
      return `${value}%`;
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and defaults</p>
        </div>
        <Button className="bg-primary">Save All Changes</Button>
      </div>

      {/* Settings by Category */}
      {categories.map((category) => {
        const Icon = categoryIcons[category] || SettingsIcon;
        const categoryName = categoryNames[category] || category;

        return (
          <Card key={category}>
            <div className="border-b bg-gray-50 p-6 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">{categoryName}</h3>
                  <p className="text-sm text-gray-500">
                    {settingsByCategory[category].length} settings
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y">
              {settingsByCategory[category].map((setting) => (
                <div
                  key={setting.id}
                  className="p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-3">
                        <h4 className="font-semibold">{setting.key}</h4>
                      </div>

                      {setting.description && (
                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                          {setting.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Current Value:</span>
                        <span className="rounded bg-gray-100 px-3 py-1 font-mono text-sm font-medium dark:bg-gray-700">
                          {formatValue(setting.value, setting.key)}
                        </span>
                      </div>
                    </div>

                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <div className="border-b bg-red-50 p-6 dark:bg-red-900/10">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">⚠️ Danger Zone</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Irreversible and destructive actions
          </p>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reset All Settings to Defaults</p>
              <p className="text-sm text-gray-500">
                This will overwrite all custom settings with default values
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Reset Settings
            </Button>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium">Clear All Data</p>
              <p className="text-sm text-gray-500">
                Permanently delete all jobs, members, cleaners, and related data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Clear Database
            </Button>
          </div>
        </div>
      </Card>

      {/* System Info */}
      <Card>
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold">System Information</h3>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Version</p>
            <p className="font-mono font-semibold">Vertex OS v1.0.0</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Environment</p>
            <p className="font-mono font-semibold">{process.env.NODE_ENV || 'development'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Database</p>
            <p className="font-mono font-semibold">PostgreSQL (Supabase)</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Settings</p>
            <p className="font-mono font-semibold">{settings.length} configured</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
