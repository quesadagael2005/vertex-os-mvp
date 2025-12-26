'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Sparkles,
  DollarSign,
  FileText,
  Target,
  BookOpen,
  Map,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { name: 'Members', href: '/admin/members', icon: Users },
  { name: 'Cleaners', href: '/admin/cleaners', icon: Sparkles },
  { name: 'Payouts', href: '/admin/payouts', icon: DollarSign },
  { name: 'Applications', href: '/admin/applications', icon: FileText },
  { name: 'Leads', href: '/admin/leads', icon: Target },
  { name: 'Task Library', href: '/admin/tasks', icon: BookOpen },
  { name: 'Zones', href: '/admin/zones', icon: Map },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-white">V</span>
          </div>
          <span className="text-xl font-bold">Vertex OS</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <span className="text-sm font-semibold">AD</span>
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium">Admin User</p>
            <p className="text-xs text-gray-500">admin@vertexos.com</p>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
