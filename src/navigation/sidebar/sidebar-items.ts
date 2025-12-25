import type { LucideIcon } from 'lucide-react';
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
} from 'lucide-react';

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  comingSoon?: boolean;
  newTab?: boolean;
  subItems?: NavMainItem[];
}

export interface NavGroup {
  id: string;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        title: 'Dashboard',
        url: '/admin',
        icon: LayoutDashboard,
        isActive: true,
      },
      {
        title: 'Jobs',
        url: '/admin/jobs',
        icon: Briefcase,
      },
      {
        title: 'Members',
        url: '/admin/members',
        icon: Users,
      },
      {
        title: 'Cleaners',
        url: '/admin/cleaners',
        icon: Sparkles,
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        title: 'Payouts',
        url: '/admin/payouts',
        icon: DollarSign,
      },
      {
        title: 'Applications',
        url: '/admin/applications',
        icon: FileText,
      },
      {
        title: 'Leads',
        url: '/admin/leads',
        icon: Target,
      },
    ],
  },
  {
    id: 'config',
    label: 'Configuration',
    items: [
      {
        title: 'Task Library',
        url: '/admin/tasks',
        icon: BookOpen,
      },
      {
        title: 'Zones',
        url: '/admin/zones',
        icon: Map,
      },
      {
        title: 'Settings',
        url: '/admin/settings',
        icon: Settings,
      },
    ],
  },
];
