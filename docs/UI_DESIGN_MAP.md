# VERTEX OS - Admin CRM UI Design Map 🎨

**Template Base**: `arhamkhnz/next-shadcn-admin-dashboard`  
**Design System**: shadcn/ui (Radix UI + Tailwind CSS)  
**Theme**: Modern, clean, professional  

---

## 🚀 Template Setup Process

### Using `arhamkhnz/next-shadcn-admin-dashboard`

**Repository**: https://github.com/arhamkhnz/next-shadcn-admin-dashboard

This is a production-ready Next.js admin dashboard template with:
- ✅ Next.js 14+ with App Router
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ shadcn/ui components (Radix UI)
- ✅ Sidebar navigation
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Pre-built layouts

### Step 1: Clone the Template

We'll integrate this template into our existing VERTEX OS project:

```bash
# Navigate to your project
cd "/Users/gaelquesada/VERTEX OS MVP"

# Create a temporary directory for the template
mkdir temp-template
cd temp-template

# Clone the template
git clone https://github.com/arhamkhnz/next-shadcn-admin-dashboard.git .

# Copy the relevant directories to our project
# (We'll selectively copy to avoid conflicts with our existing setup)
```

### Step 2: What We'll Copy

**FROM the template:**
```
temp-template/
├── src/components/       → Copy UI components
│   ├── ui/              (shadcn components)
│   ├── layout/          (Sidebar, Header, etc.)
│   └── dashboard/       (Dashboard-specific components)
│
├── src/app/dashboard/   → Copy admin routes structure
│   ├── layout.tsx       (Admin layout wrapper)
│   ├── page.tsx         (Dashboard home)
│   └── [other-pages]/   (Other admin pages)
│
└── src/lib/utils.ts     → Utility functions for cn(), etc.
```

**KEEP from our project:**
```
Our existing:
├── src/lib/services/    ✅ All our business logic
├── src/lib/db/          ✅ Database clients
├── src/lib/auth/        ✅ Authentication
├── src/app/api/         ✅ All our API routes
├── prisma/              ✅ Database schema
└── All configs          ✅ package.json, tsconfig, etc.
```

### Step 3: Integration Strategy

**Option A: Manual Integration (Recommended)**
1. Copy `components/ui/` → Use shadcn components
2. Copy `components/layout/` → Sidebar, Header structure
3. Create new `src/app/admin/` directory
4. Adapt the layout.tsx with our auth
5. Build each screen using the template's patterns

**Option B: Fresh Install with Template**
1. Start new Next.js project with template
2. Copy our `/api`, `/lib` directories over
3. Copy our configs (Prisma, etc.)
4. Wire everything together

### Step 4: Key Files to Adapt

**1. Admin Layout** (`src/app/admin/layout.tsx`)
```typescript
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { requireRole } from '@/lib/auth/middleware';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add our auth check
  // await requireRole(request, ['admin']);
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**2. Sidebar Navigation** (`components/layout/sidebar.tsx`)
```typescript
// Adapt the template's sidebar with our menu items
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Briefcase, label: 'Jobs', href: '/admin/jobs' },
  { icon: Users, label: 'Members', href: '/admin/members' },
  { icon: Sparkles, label: 'Cleaners', href: '/admin/cleaners' },
  { icon: DollarSign, label: 'Payouts', href: '/admin/payouts' },
  { icon: FileText, label: 'Applications', href: '/admin/applications' },
  { icon: Target, label: 'Leads', href: '/admin/leads' },
  { icon: BookOpen, label: 'Task Library', href: '/admin/tasks' },
  { icon: Map, label: 'Zones', href: '/admin/zones' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];
```

**3. Dashboard Page** (`src/app/admin/page.tsx`)
```typescript
import { metricsService } from '@/lib/services';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';

export default async function DashboardPage() {
  const metrics = await metricsService.getDashboardMetrics(
    startDate,
    endDate
  );
  
  return (
    <div className="p-6">
      {/* Use template components with our data */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard 
          title="Revenue" 
          value={formatCurrency(metrics.revenue.totalRevenueCents)}
          trend="+12%"
        />
        {/* More cards... */}
      </div>
      
      <RevenueChart data={metrics.revenueByDay} />
    </div>
  );
}
```

### Step 5: Required shadcn/ui Components

Install the components we need:

```bash
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
npx shadcn-ui@latest add chart
```

### Step 6: File Structure After Integration

```
VERTEX OS MVP/
├── src/
│   ├── app/
│   │   ├── api/              ✅ (Our existing API routes)
│   │   ├── auth/             ✅ (Our auth pages)
│   │   ├── admin/            🆕 (New admin dashboard)
│   │   │   ├── layout.tsx    (From template, adapted)
│   │   │   ├── page.tsx      (Dashboard)
│   │   │   ├── jobs/
│   │   │   ├── members/
│   │   │   ├── cleaners/
│   │   │   ├── payouts/
│   │   │   ├── applications/
│   │   │   ├── leads/
│   │   │   ├── tasks/
│   │   │   ├── zones/
│   │   │   └── settings/
│   │   └── ...
│   │
│   ├── components/           🆕 (From template)
│   │   ├── ui/              (shadcn components)
│   │   ├── layout/          (Sidebar, Header)
│   │   ├── dashboard/       (Dashboard components)
│   │   └── admin/           (Custom admin components)
│   │
│   └── lib/
│       ├── services/         ✅ (Our services)
│       ├── auth/             ✅ (Our auth)
│       ├── db/               ✅ (Our database)
│       └── utils.ts          🆕 (From template)
│
├── prisma/                   ✅ (Our database)
└── ...
```

### Step 7: Styling Integration

The template uses Tailwind CSS (we already have it). Just ensure:

**tailwind.config.ts** - Merge with template's theme:
```typescript
export default {
  // Our existing config
  theme: {
    extend: {
      // Add template's custom colors/spacing if needed
    }
  }
}
```

**globals.css** - Add template's CSS variables for theming

---

## 🏗️ Overall Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR (Left)              MAIN CONTENT AREA              │
│                                                              │
│  [Logo]                      ┌─────────────────────────┐   │
│                              │  HEADER                 │   │
│  📊 Dashboard                │  Page Title             │   │
│  💼 Jobs                     │  [Search] [User Menu]   │   │
│  👥 Members                  └─────────────────────────┘   │
│  🧹 Cleaners                                               │
│  💰 Payouts                  ┌─────────────────────────┐   │
│  📝 Applications             │                         │   │
│  🎯 Leads                    │                         │   │
│  📚 Task Library             │   PAGE CONTENT          │   │
│  🗺️  Zones                   │   (Cards, Tables,       │   │
│  ⚙️  Settings                │    Charts, Forms)       │   │
│                              │                         │   │
│  [User Profile]              │                         │   │
│  [Logout]                    └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Screen-by-Screen Breakdown

### 1. 📊 Dashboard (Landing Page)

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                    [Date Range ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ 📈 Revenue  │ │ 📋 Bookings │ │ 👷 Cleaners │          │
│  │ $12,500     │ │ 45 jobs     │ │ 8 active    │          │
│  │ +12% ↗      │ │ 90% done ✓  │ │ 4.7★ avg    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                              │
│  ┌─────────────┐ ┌─────────────────────────────────────┐   │
│  │ 📊 Chart    │ │ 📅 Today's Schedule                │   │
│  │             │ ├─────────────────────────────────────┤   │
│  │  Revenue    │ │ 10:00 AM - Sarah J. - Kitchen      │   │
│  │  by Day     │ │ 2:00 PM  - Maria G. - Full House   │   │
│  │             │ │ 4:00 PM  - Jake M.  - Bathroom     │   │
│  │             │ └─────────────────────────────────────┘   │
│  └─────────────┘                                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🎯 Quick Actions                                     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ [+ New Job] [Approve Cleaners] [Run Payouts]        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Stat Cards** (4): Revenue, Bookings, Cleaners, Members
  - Large number display
  - Percentage change indicator
  - Trend arrow (up/down)
- **Revenue Chart**: Line/bar chart showing daily revenue (7-30 days)
- **Today's Schedule**: List of jobs happening today
  - Time, Cleaner name, Job type
  - Status badge
- **Quick Actions**: Button group for common tasks

---

### 2. 💼 Jobs Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Jobs                                         [+ New Job]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Filters: [All ▼] [Zone ▼] [Cleaner ▼] [🔍 Search...]      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Job ID    │ Member      │ Cleaner  │ Date   │ Status│   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ JOB-1234  │ John D.     │ Sarah J. │ 2/15   │ ✓Done│   │
│  │ JOB-1235  │ Jane S.     │ Maria G. │ 2/16   │ 📅   │   │
│  │ JOB-1236  │ Bob M.      │ Unassign │ 2/17   │ ⏳   │   │
│  │ JOB-1237  │ Alice W.    │ Jake M.  │ 2/14   │ ❌   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Showing 1-10 of 145        [◀ Previous] [1][2][3] [Next ▶]│
└─────────────────────────────────────────────────────────────┘

Click a row → Job Detail Modal:

┌─────────────────────────────────────────┐
│  Job #JOB-1234                    [✕]   │
├─────────────────────────────────────────┤
│                                         │
│  Customer: John Doe                     │
│  Address: 123 Main St, SF               │
│  Date: Feb 15, 2024 @ 10:00 AM         │
│  Cleaner: Sarah Johnson (4.8★)         │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Checklist (12/15 complete)       │ │
│  │ ✓ Kitchen - Clean stovetop       │ │
│  │ ✓ Kitchen - Wipe counters        │ │
│  │ ☐ Bathroom - Clean toilet        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Pricing:                               │
│  Subtotal: $85.00                       │
│  Platform Fee: $12.75                   │
│  Total: $97.75                          │
│                                         │
│  [Edit] [Cancel Job] [Reassign]        │
└─────────────────────────────────────────┘
```

**Components:**
- **Filters Bar**: Dropdowns + search
- **Data Table**: Sortable columns
  - Job ID (link to detail)
  - Member name
  - Cleaner name
  - Date/Time
  - Status badge
  - Actions menu (•••)
- **Pagination**: Page numbers + prev/next
- **Job Detail Modal**: Full job information
  - Customer info
  - Checklist with progress
  - Pricing breakdown
  - Action buttons

---

### 3. 👥 Members Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Members                                    [+ Add Member]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Filters: [All Tiers ▼] [Status ▼] [🔍 Search by email...] │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Name        │ Email           │ Tier    │ Jobs │ LTV │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ John Doe    │ john@email.com  │ 🥇Gold  │ 12   │$1.2K│   │
│  │ Jane Smith  │ jane@email.com  │ 🥈Silver│ 8    │$640 │   │
│  │ Bob Martin  │ bob@email.com   │ 💎Diamond│15   │$2.1K│   │
│  │ Alice Wong  │ alice@email.com │ Free    │ 3    │$225 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Showing 1-10 of 234        [◀ Previous] [1][2][3] [Next ▶]│
└─────────────────────────────────────────────────────────────┘

Click a row → Member Detail Panel:

┌─────────────────────────────────────────┐
│  👤 John Doe                      [✕]   │
├─────────────────────────────────────────┤
│  Email: john@email.com                  │
│  Phone: (555) 123-4567                  │
│  Tier: 🥇 Gold ($49/mo)                 │
│  Member Since: Jan 2024                 │
│                                         │
│  📊 Stats:                              │
│  • Total Jobs: 12                       │
│  • Completed: 11                        │
│  • Cancelled: 1                         │
│  • Lifetime Value: $1,240               │
│                                         │
│  📅 Recent Jobs:                        │
│  Feb 10 - Kitchen Clean - ✓            │
│  Feb 3  - Full House - ✓               │
│  Jan 27 - Bathroom - ✓                 │
│                                         │
│  [Edit Profile] [Change Tier] [View All]│
└─────────────────────────────────────────┘
```

**Components:**
- **Filters**: Tier, status, search
- **Data Table**: Member info + stats
  - Tier badge (colored)
  - Jobs count
  - Lifetime value (LTV)
- **Member Detail Panel**: Slide-out or modal
  - Contact info
  - Tier with badge
  - Stats summary
  - Recent activity
  - Action buttons

---

### 4. 🧹 Cleaners Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Cleaners                                 [+ Add Cleaner]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Filters: [All Status ▼] [Zone ▼] [🔍 Search...]           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Name        │ Zone      │ Rating │ Jobs │ Earnings  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Sarah J.    │ Downtown  │ 4.9★   │ 45   │ $3,200    │   │
│  │ Maria G.    │ Mission   │ 4.7★   │ 38   │ $2,850    │   │
│  │ Jake M.     │ Richmond  │ 4.8★   │ 52   │ $3,900    │   │
│  │ Emma L.     │ SOMA      │ 5.0★   │ 28   │ $2,100    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Showing 1-10 of 15         [◀ Previous] [1][2] [Next ▶]   │
└─────────────────────────────────────────────────────────────┘

Click a row → Cleaner Detail:

┌─────────────────────────────────────────┐
│  🧹 Sarah Johnson               [✕]     │
├─────────────────────────────────────────┤
│  Email: sarah@email.com                 │
│  Phone: (555) 987-6543                  │
│  Status: 🟢 Active                      │
│  Rating: 4.9★ (45 reviews)             │
│                                         │
│  📍 Service Zones:                      │
│  • Downtown SF                          │
│  • Financial District                   │
│                                         │
│  📅 Weekly Schedule:                    │
│  Mon-Fri: 9:00 AM - 5:00 PM            │
│  Sat: 10:00 AM - 3:00 PM               │
│  Sun: Off                               │
│                                         │
│  💰 Earnings:                           │
│  This Month: $1,250                     │
│  Pending Payout: $340                   │
│                                         │
│  [Edit Profile] [Manage Schedule]       │
│  [View Jobs] [Deactivate]               │
└─────────────────────────────────────────┘
```

**Components:**
- **Filters**: Status, zone
- **Data Table**: Cleaner performance
  - Star rating
  - Completed jobs
  - Total earnings
- **Cleaner Detail Panel**: Full profile
  - Contact info
  - Service zones (tags)
  - Weekly schedule
  - Earnings summary
  - Management actions

---

### 5. 💰 Payouts Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Payouts                                [Create New Batch]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📊 Next Payout Preview                             │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ Period: Feb 12-18, 2024                            │    │
│  │ Cleaners: 8                                        │    │
│  │ Jobs: 42                                           │    │
│  │ Total Gross: $9,850                                │    │
│  │ Stripe Fees: $315                                  │    │
│  │ Total Net: $9,535                                  │    │
│  │                                                     │    │
│  │ Next Payout Date: Friday, Feb 23                   │    │
│  │                                                     │    │
│  │ [Create Payout Batch] [Preview Details]            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  📜 Payout History:                                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Date      │ Period      │ Cleaners │ Amount │ Status│   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Feb 16    │ Feb 5-11    │ 8        │ $8,920 │ ✓Paid│   │
│  │ Feb 9     │ Jan 29-Feb4 │ 7        │ $7,650 │ ✓Paid│   │
│  │ Feb 2     │ Jan 22-28   │ 8        │ $9,100 │ ✓Paid│   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Click a batch → Payout Detail:

┌─────────────────────────────────────────┐
│  💰 Payout Batch #PAY-023       [✕]    │
├─────────────────────────────────────────┤
│  Period: Feb 5-11, 2024                 │
│  Status: ✓ Processed                    │
│  Processed: Feb 16, 2024 @ 3:00 PM     │
│                                         │
│  📊 Summary:                            │
│  Total Jobs: 42                         │
│  Total Gross: $8,920                    │
│  Stripe Fees: $289                      │
│  Total Net: $8,631                      │
│                                         │
│  👷 Breakdown by Cleaner:               │
│  Sarah J.  - 8 jobs - $1,850           │
│  Maria G.  - 6 jobs - $1,320           │
│  Jake M.   - 9 jobs - $2,100           │
│  ...                                    │
│                                         │
│  [Download CSV] [View Details]          │
└─────────────────────────────────────────┘
```

**Components:**
- **Next Payout Card**: Preview of upcoming batch
  - Period dates
  - Summary stats
  - CTA button
- **Payout History Table**: Past batches
  - Date processed
  - Period covered
  - Amount
  - Status badge
- **Payout Detail Modal**: Full breakdown
  - Per-cleaner amounts
  - Job counts
  - Fees
  - Export option

---

### 6. 📚 Task Library Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Task Library                             [+ Add Task]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Filter by Room: [All ▼] [🔍 Search tasks...]              │
│                                                              │
│  🏠 Living Room (8 tasks)                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Task Name       │ Effort  │ Order │ Status │ Actions│   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Vacuum carpet   │ 15 min  │  1    │ ✓      │ [⚙️]   │   │
│  │ Dust surfaces   │ 10 min  │  2    │ ✓      │ [⚙️]   │   │
│  │ Clean windows   │ 20 min  │  3    │ ✓      │ [⚙️]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  🍳 Kitchen (12 tasks)                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Clean countertops│ 10 min │  1    │ ✓      │ [⚙️]   │   │
│  │ Clean sink      │ 10 min  │  2    │ ✓      │ [⚙️]   │   │
│  │ Wipe appliances │ 15 min  │  3    │ ✓      │ [⚙️]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  🚿 Bathroom (10 tasks)                                     │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘

Click [+ Add Task] → Add Task Form:

┌─────────────────────────────────────────┐
│  Add New Task                     [✕]   │
├─────────────────────────────────────────┤
│                                         │
│  Task Name *                            │
│  [____________________________]         │
│                                         │
│  Room Type *                            │
│  [Living Room ▼]                        │
│                                         │
│  Estimated Effort (minutes) *           │
│  [____] minutes                         │
│                                         │
│  Description (optional)                 │
│  [____________________________]         │
│  [____________________________]         │
│                                         │
│  Display Order                          │
│  [____] (1 = first)                     │
│                                         │
│  [Cancel] [Create Task]                 │
└─────────────────────────────────────────┘
```

**Components:**
- **Room Type Sections**: Collapsible/expandable
- **Task Tables**: Grouped by room
  - Task name
  - Effort in minutes
  - Display order
  - Active status
  - Edit/Delete actions
- **Add/Edit Task Form**: Modal
  - Form fields
  - Validation
  - Save/Cancel

---

### 7. 📝 Applications Screen (Cleaner Pipeline)

```
┌─────────────────────────────────────────────────────────────┐
│  Cleaner Applications                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Pipeline Overview:                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Pending  │ │ Review   │ │ BG Check │ │ Approved │      │
│  │   12     │ │    5     │ │    3     │ │   45     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
│  Filters: [All Stages ▼] [Date Range ▼] [🔍 Search...]     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Name     │ Applied  │ Stage      │ Score │ Actions  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Lisa M.  │ 2d ago   │ ⏳Pending  │ -     │ [Review] │   │
│  │ Tom K.   │ 5d ago   │ 🔍Review   │ 8.5/10│ [View]   │   │
│  │ Amy L.   │ 1w ago   │ 🔐BG Check │ 9.0/10│ [View]   │   │
│  │ Sam P.   │ 2w ago   │ ⏸️ Rejected│ 4.2/10│ [View]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Showing 1-10 of 20         [◀ Previous] [1][2] [Next ▶]   │
└─────────────────────────────────────────────────────────────┘

Click [Review] → Application Detail:

┌───────────────────────────────────────────────────────┐
│  Application Review - Lisa Martinez           [✕]     │
├───────────────────────────────────────────────────────┤
│  Applied: Feb 20, 2024 @ 3:45 PM                     │
│  Status: ⏳ Pending Review                            │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 👤 Personal Info                                │  │
│  │ Name: Lisa Martinez                             │  │
│  │ Email: lisa.martinez@email.com                  │  │
│  │ Phone: (555) 234-5678                           │  │
│  │ Location: San Francisco, CA                     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 💼 Experience                                   │  │
│  │ Years in cleaning: 3 years                      │  │
│  │ Previous employers:                             │  │
│  │ • Sparkle Clean Co. (2021-2023)                │  │
│  │ • Quick Maid Service (2020-2021)               │  │
│  │                                                  │  │
│  │ Certifications:                                 │  │
│  │ ✓ Professional Cleaning Certificate            │  │
│  │ ✓ Green Cleaning Certified                     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📍 Service Areas                                │  │
│  │ [✓] Downtown SF                                 │  │
│  │ [✓] Mission District                            │  │
│  │ [ ] Richmond                                     │  │
│  │ [ ] SOMA                                         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📅 Availability                                 │  │
│  │ Mon-Fri: 8:00 AM - 6:00 PM                     │  │
│  │ Saturday: 9:00 AM - 3:00 PM                    │  │
│  │ Sunday: Not Available                           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  📄 Documents:                                         │
│  • [📎 Resume.pdf] [Download]                         │
│  • [📎 Certificates.pdf] [Download]                   │
│                                                        │
│  ⭐ Initial Screening Score:                           │
│  [__________|_] 8.5/10                                 │
│                                                        │
│  Experience: ⭐⭐⭐⭐☆                                   │
│  Certifications: ⭐⭐⭐⭐⭐                              │
│  Availability: ⭐⭐⭐⭐☆                                 │
│                                                        │
│  📝 Admin Notes:                                       │
│  [________________________________]                     │
│  [________________________________]                     │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ Actions:                                      │     │
│  │ [✓ Approve & Start BG Check] [❌ Reject]     │     │
│  │ [📧 Request More Info] [💬 Schedule Call]    │     │
│  └──────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────┘

After Approval → Background Check Panel:

┌───────────────────────────────────────────────────────┐
│  Background Check - Lisa Martinez             [✕]     │
├───────────────────────────────────────────────────────┤
│  Status: 🔍 In Progress                               │
│  Started: Feb 21, 2024                                │
│  Expected Completion: Feb 28, 2024                    │
│                                                        │
│  Check Items:                                          │
│  ✓ Identity Verification - PASSED                     │
│  ✓ Criminal Background - CLEAR                        │
│  ⏳ Employment Verification - PENDING                  │
│  ⏳ Reference Checks (0/2 complete)                   │
│                                                        │
│  ⚠️ Manual Actions Required:                           │
│  • Call reference: Jane Smith (555) 123-4567          │
│  • Verify employment at Sparkle Clean Co.             │
│                                                        │
│  [Mark as Complete] [Request Additional Info]         │
└───────────────────────────────────────────────────────┘
```

**Components:**
- **Pipeline Overview Cards**: 4 stage counters (clickable filters)
  - Pending Review (yellow)
  - In Review (blue)
  - Background Check (purple)
  - Approved (green)
  - Rejected (red)
- **Applications Table**: Full pipeline view
  - Stage badges (colored)
  - Application score
  - Quick actions per row
- **Application Detail Modal**: Full-screen review
  - Tabbed sections (Info, Experience, Availability)
  - Document downloads
  - Auto-calculated score with visual bars
  - Action buttons (Approve, Reject, Request Info)
- **Background Check Panel**: Checklist view
  - Item-by-item status
  - Manual action prompts
  - Completion tracking

---

### 8. 🎯 Leads Screen (Conversion Funnel)

```
┌─────────────────────────────────────────────────────────────┐
│  Lead Management                           [+ Add Lead]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Conversion Funnel:                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │      ╔═══════════════════════╗ 150 Visitors         │    │
│  │      ║                       ║                       │    │
│  │      ╚═══════════════════════╝                       │    │
│  │           ▼                                           │    │
│  │      ╔═══════════════╗ 75 Leads (50% conversion)     │    │
│  │      ║               ║                                │    │
│  │      ╚═══════════════╝                                │    │
│  │           ▼                                           │    │
│  │      ╔═══════╗ 30 Qualified (40% conversion)         │    │
│  │      ║       ║                                        │    │
│  │      ╚═══════╝                                        │    │
│  │           ▼                                           │    │
│  │      ╔═══╗ 12 Booked (40% conversion)                │    │
│  │      ║   ║                                            │    │
│  │      ╚═══╝                                            │    │
│  │                                                       │    │
│  │  Overall Conversion Rate: 8% (12/150)               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  🔍 Abandoned Leads (Need Follow-up):                       │
│                                                              │
│  Filters: [All Stages ▼] [Last Contact ▼] [🔍 Search...]  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Name    │ Stage   │ Source  │ Last│ Days│ Action   │   │
│  │         │         │         │ Cont│ Idle│          │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ John D. │ Quoted  │ Website │ 3d  │  3  │[Follow-up]│   │
│  │ Jane S. │ Viewed  │ Google  │ 1w  │  7  │[Call]    │   │
│  │ Bob M.  │ Quoted  │ Referral│ 2w  │ 14  │[Email]   │   │
│  │ Alice W.│ Inquiry │ Facebook│ 3w  │ 21  │[Archive] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚠️ High Priority (Idle >7 days): 8 leads                  │
│  [Send Bulk Follow-up Email] [Export to CSV]                │
│                                                              │
│  📅 Upcoming Follow-ups:                                    │
│  Today:     5 scheduled calls                                │
│  Tomorrow:  3 scheduled emails                               │
│  This Week: 12 total actions                                 │
└─────────────────────────────────────────────────────────────┘

Click a lead → Lead Detail:

┌───────────────────────────────────────────────────────┐
│  Lead: John Doe                               [✕]     │
├───────────────────────────────────────────────────────┤
│  Stage: 💰 Quoted                                     │
│  Source: 🌐 Website                                   │
│  Created: Feb 15, 2024                                │
│  Last Contact: 3 days ago                             │
│                                                        │
│  📞 Contact Info:                                     │
│  Email: john.doe@email.com                            │
│  Phone: (555) 123-4567                                │
│  Address: 123 Main St, San Francisco, CA             │
│                                                        │
│  📝 Lead Details:                                     │
│  Interested in: Weekly cleaning                       │
│  Preferred Day: Saturday mornings                     │
│  Budget Range: $80-$100                               │
│                                                        │
│  💵 Quote Sent:                                       │
│  Service: Kitchen + 2 Bathrooms                       │
│  Price: $95.00                                        │
│  Sent: Feb 18, 2024                                   │
│  Opened: ✓ Yes (Feb 18, 2:30 PM)                     │
│  Booking Link Clicked: ✓ Yes (Feb 18, 2:35 PM)       │
│  ⚠️ Abandoned at booking form (didn't complete)       │
│                                                        │
│  📊 Engagement Score: 8/10                            │
│  • Email opened ✓                                     │
│  • Clicked booking link ✓                             │
│  • Didn't complete booking ✗                          │
│                                                        │
│  🕒 Timeline:                                         │
│  Feb 15 - Submitted inquiry form                      │
│  Feb 18 - Quote sent via email                        │
│  Feb 18 - Opened email                                │
│  Feb 18 - Clicked booking link                        │
│  Feb 18 - Abandoned booking form                      │
│  Feb 20 - Follow-up email sent                        │
│  Feb 20 - No response                                 │
│                                                        │
│  🎯 Suggested Actions:                                │
│  • Call now (high engagement, likely price concern)   │
│  • Offer 10% first-time discount                      │
│  • Send simplified booking link                        │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ Quick Actions:                                │     │
│  │ [📞 Call Now] [📧 Send Email]                │     │
│  │ [💬 Send SMS] [🔄 Update Stage]              │     │
│  │ [✓ Convert to Member] [🗑️ Archive]          │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  📝 Add Note:                                         │
│  [_____________________________________________]       │
│  [Save Note]                                          │
└───────────────────────────────────────────────────────┘

Lead Stages (Color-coded):
• 👀 Visitor (Gray)
• 📝 Inquiry (Blue)
• 💬 Contacted (Purple)
• 💰 Quoted (Yellow)
• 🎯 Qualified (Orange)
• ✓ Booked (Green)
• ❌ Lost (Red)
```

**Components:**
- **Conversion Funnel Chart**: Visual funnel
  - Stage widths proportional to count
  - Conversion percentages between stages
  - Overall rate at bottom
- **Abandoned Leads Table**: Priority list
  - Stage badges
  - Source tracking
  - Days idle (color-coded: <7 green, 7-14 yellow, >14 red)
  - Quick action buttons
- **Lead Detail Panel**: Full lead profile
  - Contact info
  - Quote details
  - Engagement tracking (email opens, clicks)
  - Timeline of all interactions
  - AI-suggested next actions
  - Quick action buttons
  - Notes section
- **Bulk Actions**: 
  - Mass email campaigns
  - CSV export
  - Stage updates
- **Follow-up Calendar**: Scheduled actions widget

---

### 9. 🗺️ Zones Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Service Zones                            [+ Add Zone]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Zone Name       │ Cleaners │ Jobs  │ Status │ Actions│   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Downtown SF     │    3     │ 145   │ ✓      │ [⚙️]   │   │
│  │ Mission District│    2     │  89   │ ✓      │ [⚙️]   │   │
│  │ Richmond        │    2     │  67   │ ✓      │ [⚙️]   │   │
│  │ SOMA            │    1     │  34   │ ✓      │ [⚙️]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  💡 Tip: Zones help match customers with nearby cleaners    │
└─────────────────────────────────────────────────────────────┘

Click a zone → Zone Detail:

┌─────────────────────────────────────────┐
│  📍 Downtown SF                   [✕]   │
├─────────────────────────────────────────┤
│  Status: 🟢 Active                      │
│                                         │
│  👷 Assigned Cleaners (3):              │
│  • Sarah Johnson                        │
│  • Maria Garcia                         │
│  • Jake Miller                          │
│                                         │
│  📊 Stats:                              │
│  Total Jobs: 145                        │
│  This Month: 12                         │
│  Avg Rating: 4.8★                       │
│                                         │
│  [Edit Zone] [Manage Cleaners]          │
└─────────────────────────────────────────┘
```

**Components:**
- **Zones Table**: Simple list
  - Zone name
  - Cleaner count
  - Job count
  - Status
- **Zone Detail Modal**: Basic info
  - Assigned cleaners
  - Stats
  - Management options

---

### 10. ⚙️ Settings Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tabs: [General] [Pricing] [Tiers] [Modifiers] [Thresholds]│
│                                                              │
│  💼 General Settings:                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Company Name                                         │   │
│  │ [Red Shirt Club___________________________]  [Save] │   │
│  │                                                       │   │
│  │ Accepting New Bookings                               │   │
│  │ [✓] Yes  [ ] No                            [Save]   │   │
│  │                                                       │   │
│  │ Minimum Booking Notice (hours)                       │   │
│  │ [24_____]                                  [Save]   │   │
│  │                                                       │   │
│  │ Maximum Advance Booking (days)                       │   │
│  │ [90_____]                                  [Save]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  💰 Pricing Settings:                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Base Fee                                             │   │
│  │ $[25.00____]                               [Save]   │   │
│  │                                                       │   │
│  │ Per Minute Rate                                       │   │
│  │ $[0.50_____]                               [Save]   │   │
│  │                                                       │   │
│  │ Platform Fee (%)                                      │   │
│  │ [15________]%                              [Save]   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Tab Navigation**: Switch between setting categories
- **Setting Sections**: Grouped by category
- **Form Fields**: 
  - Text inputs
  - Number inputs
  - Toggles/checkboxes
  - Individual save buttons
- **Validation**: Inline error messages

---

## 🎨 Design System

### Colors (shadcn/ui default theme)
```
Primary: Blue (#0EA5E9)
Secondary: Slate (#64748B)
Success: Green (#10B981)
Warning: Yellow (#F59E0B)
Error: Red (#EF4444)
Background: White (#FFFFFF)
Card: Light Gray (#F8FAFC)
Text: Dark Gray (#1E293B)
```

### Typography
```
Headings: Inter Bold
Body: Inter Regular
Mono: Fira Code (for IDs, code)
```

### Component Library (shadcn/ui)
- **Button**: Primary, Secondary, Outline, Ghost
- **Card**: Container for content sections
- **Table**: Data tables with sorting
- **Modal/Dialog**: Pop-up forms
- **Dropdown**: Filters, menus
- **Badge**: Status indicators (colored pills)
- **Input**: Text, number, date
- **Textarea**: Multi-line text
- **Select**: Dropdown selection
- **Tabs**: Content switching
- **Chart**: recharts for data viz

---

## 📱 Responsive Behavior

### Desktop (1440px+)
- Sidebar always visible
- Full table width
- Side-by-side layouts

### Tablet (768-1439px)
- Collapsible sidebar
- Stacked cards
- Horizontal scroll tables

### Mobile (< 768px)
- Hamburger menu
- Vertical card stacks
- Mobile-optimized tables

---

## 🎯 User Flows

### Creating a Job
```
Dashboard → [+ New Job] → Form Modal
  ↓
Fill in details (member, zone, date, tasks)
  ↓
System auto-assigns best cleaner
  ↓
Review & Confirm
  ↓
Job created → Appears in Jobs table
```

### Processing Payouts
```
Payouts Screen → View Next Payout Preview
  ↓
[Create Payout Batch] → Confirmation
  ↓
System creates batch, marks jobs paid
  ↓
Batch appears in history
  ↓
[Download CSV] for accounting
```

### Managing Settings
```
Settings Screen → Select category tab
  ↓
Edit value in field
  ↓
[Save] individual setting
  ↓
Success message
  ↓
Value updated across system
```

---

## 🔄 Real-time Updates

### Auto-refresh zones:
- Dashboard stats (every 60 seconds)
- Today's schedule (every 30 seconds)
- Job status changes (real-time with Supabase)

### Manual refresh:
- [🔄] button in header
- Pull-to-refresh on mobile

---

## 🎭 Empty States

### No Jobs Yet
```
┌─────────────────────────────────────────┐
│                                         │
│           📋                            │
│                                         │
│     No jobs scheduled yet               │
│                                         │
│     Get started by creating your        │
│     first booking.                      │
│                                         │
│     [+ Create First Job]                │
│                                         │
└─────────────────────────────────────────┘
```

### No Cleaners in Zone
```
No cleaners assigned to this zone yet.
[Assign Cleaners]
```

---

## ✨ Nice-to-Have Features

### Phase 5 Enhancements:
- 📊 Advanced charts (trend analysis)
- 📱 Mobile app views
- 🔔 Notifications center
- 💬 In-app messaging
- 📧 Email templates
- 📄 Invoice generation
- 📈 Custom reports
- 🔍 Advanced search
- 📤 Bulk actions

---

## 🏁 Summary

**The Admin CRM is a clean, modern dashboard with:**
- ✅ 9 main screens
- ✅ Data tables for all entities
- ✅ Detail modals for quick access
- ✅ Form-based editing
- ✅ Real-time dashboard
- ✅ Responsive design
- ✅ Professional UI components

**Built on proven template:** `next-shadcn-admin-dashboard`  
**Same stack:** Next.js 15, TypeScript, Tailwind, shadcn/ui  
**Fully integrated:** Uses all our Phase 2 services & Phase 3 APIs  

---

---

## 🛠️ Build Plan Summary

### Phase 4A: Template Setup & Integration
1. **Clone template** from GitHub
2. **Copy components** (ui/, layout/, dashboard/)
3. **Set up admin routes** structure
4. **Install shadcn components** (button, card, table, etc.)
5. **Adapt layout** with our auth
6. **Test basic navigation**

### Phase 4B: Core Admin Screens
7. **Dashboard** (metrics, charts, quick actions)
8. **Jobs** (table, filters, detail modals)
9. **Members** (table, profile panels)
10. **Cleaners** (table, profile panels)

### Phase 4C: Operations Screens
11. **Payouts** (batch management, history)
12. **Applications** (pipeline, approval workflow)
13. **Leads** (funnel, follow-up table)
14. **Task Library** (CRUD, room grouping)
15. **Zones** (list, assignments)
16. **Settings** (tabbed config)

### Phase 4D: Polish & Testing
17. **Responsive testing** (mobile, tablet)
18. **Dark mode** support
19. **Error handling** (toast notifications)
20. **Loading states** (skeletons)
21. **Empty states** (helpful messaging)
22. **Final QA** across all screens

---

## ✅ Ready to Build!

**What we have:**
- ✅ Complete UI design for all 10 screens
- ✅ Template identified and documented
- ✅ Integration strategy defined
- ✅ All backend services ready (Phase 2)
- ✅ All API endpoints ready (Phase 3)

**What we'll build:**
- 🎨 Beautiful admin dashboard
- 📊 Interactive charts and metrics
- 📋 Full CRUD for all entities
- 🔄 Real-time updates
- 📱 Responsive design
- 🎭 Professional UX

**Let's start building!** 🚀

