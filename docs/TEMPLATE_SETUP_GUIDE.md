# Template Setup Guide 🎨

**Template**: `arhamkhnz/next-shadcn-admin-dashboard`  
**GitHub**: https://github.com/arhamkhnz/next-shadcn-admin-dashboard

---

## 🎯 Quick Start

### Step 1: Clone the Template

```bash
# In your project root
cd "/Users/gaelquesada/VERTEX OS MVP"

# Create temporary directory
git clone https://github.com/arhamkhnz/next-shadcn-admin-dashboard.git temp-dashboard

# Explore the structure
cd temp-dashboard
ls -la
```

### Step 2: Copy Essential Components

```bash
# From temp-dashboard, copy components to our project
cp -r components/ui ../src/components/
cp -r components/layout ../src/components/
cp -r components/dashboard ../src/components/

# Copy utility functions
cp lib/utils.ts ../src/lib/

# Clean up
cd ..
rm -rf temp-dashboard
```

### Step 3: Install shadcn/ui CLI

```bash
# Initialize shadcn in our project (if not already done)
npx shadcn-ui@latest init

# Follow prompts:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
# - Tailwind config: Yes
# - Components: src/components
# - Utils: src/lib/utils
# - React Server Components: Yes
```

### Step 4: Install Required Components

```bash
# Core components (run one by one)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add calendar

# Chart components (for dashboard)
npm install recharts
npx shadcn-ui@latest add chart
```

### Step 5: Update globals.css

Add these CSS variables for theming:

```css
/* src/app/globals.css */

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 199 89% 48%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 199 89% 48%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 199 89% 48%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 199 89% 48%;
  }
}
```

---

## 📁 Create Admin Structure

### Create Admin Layout

```bash
mkdir -p src/app/admin
```

**File**: `src/app/admin/layout.tsx`

```typescript
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### Create Admin Pages

```bash
# Create page directories
mkdir -p src/app/admin/jobs
mkdir -p src/app/admin/members
mkdir -p src/app/admin/cleaners
mkdir -p src/app/admin/payouts
mkdir -p src/app/admin/applications
mkdir -p src/app/admin/leads
mkdir -p src/app/admin/tasks
mkdir -p src/app/admin/zones
mkdir -p src/app/admin/settings
```

### Create Dashboard Page

**File**: `src/app/admin/page.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome to Vertex OS Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,500</div>
            <p className="text-xs text-green-500">+12% from last month</p>
          </CardContent>
        </Card>
        
        {/* More cards... */}
      </div>
    </div>
  );
}
```

---

## 🎨 Customize Components

### Update Sidebar Navigation

**File**: `src/components/layout/sidebar.tsx`

```typescript
import Link from 'next/link';
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
  Settings
} from 'lucide-react';

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
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r">
      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary">Vertex OS</h1>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

---

## 🧪 Test the Setup

### Run Development Server

```bash
pnpm dev
```

### Navigate to Admin

Open browser: http://localhost:3000/admin

You should see:
- ✅ Sidebar with navigation
- ✅ Header with user menu
- ✅ Dashboard with placeholder content
- ✅ Smooth navigation between pages

---

## 🎯 Next Steps

Once the template is integrated:

1. **Build Dashboard Components** - Connect to metrics API
2. **Create Data Tables** - For jobs, members, cleaners
3. **Add Forms** - For creating/editing entities
4. **Wire API Calls** - Connect frontend to our Phase 3 APIs
5. **Add Auth Guards** - Protect admin routes
6. **Polish UI** - Loading states, empty states, errors

---

## 📚 Resources

**Template Demo**: Check the template's demo for component examples  
**shadcn/ui Docs**: https://ui.shadcn.com  
**Tailwind Docs**: https://tailwindcss.com  
**Next.js Docs**: https://nextjs.org/docs  

---

## 🆘 Troubleshooting

### Issue: shadcn components not found
```bash
# Reinstall
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card table
```

### Issue: Styles not applying
```bash
# Check Tailwind config includes all paths
# Check globals.css is imported in layout.tsx
```

### Issue: Module resolution errors
```bash
# Check tsconfig.json has proper path aliases
# Verify @/* maps to src/*
```

---

Ready to integrate the template and start building! 🚀




