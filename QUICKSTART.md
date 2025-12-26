# 🚀 VERTEX OS - Quick Start

## ✅ What Just Happened (Session 1-COMBINED Complete)

**Completed Rungs 1.1-1.21:**
- ✅ Prisma schema (18 models, all relationships)
- ✅ Seed file (settings, tasks, zones, test data)
- ✅ Database client utilities
- ✅ Supabase integration setup
- ✅ Health check API
- ✅ Project configuration

**Files Created:**
```
prisma/
├── schema.prisma ✅ (713 lines, complete)
└── seed.ts ✅ (550+ lines, comprehensive)

src/
├── lib/
│   └── db/
│       ├── client.ts ✅ (Prisma singleton)
│       └── supabase.ts ✅ (Supabase clients)
└── app/
    └── api/
        └── health/
            └── route.ts ✅ (Health check)

Configuration:
├── next.config.js ✅
├── .gitignore ✅
└── All foundation docs ✅
```

---

## 🎯 YOUR TURN: Phase 0 Prerequisites

**Before we can test, you need to:**

### 1. Set up Supabase (5 minutes)

1. Go to https://supabase.com
2. Click "New Project"
3. Name: `vertex-os-dev`
4. Choose region (closest to you)
5. Generate strong database password (SAVE IT!)
6. Wait 2 minutes for provisioning

**Copy these from your Supabase dashboard:**
- Settings → API → Project URL
- Settings → API → anon/public key
- Settings → API → service_role key
- Settings → Database → Connection String (URI mode)

### 2. Set up Stripe Test Mode (5 minutes)

1. Go to https://dashboard.stripe.com
2. Toggle to **TEST MODE** (top right)
3. Go to Developers → API Keys

**Copy these:**
- Publishable key (starts with `pk_test_`)
- Secret key (starts with `sk_test_`)

### 3. Create .env.local (2 minutes)

```bash
# Rename the example file
mv env.example.txt .env.example

# Create your local env file
cp .env.example .env.local
```

**Edit `.env.local` and fill in (minimum required):**

```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase (from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# JWT Secret (generate new one)
JWT_SECRET="your-secret-here-min-32-chars"  # Generate: openssl rand -base64 32

# Stripe (from Stripe dashboard)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Development mode
NODE_ENV="development"
SKIP_EMAILS="true"
SKIP_SMS="true"
```

---

## 🔍 CHECKPOINT 1 - Verify Setup

**Once you have `.env.local` filled in, run these commands:**

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Generate Prisma Client
```bash
pnpm db:generate
```

### Step 3: Create Database Tables
```bash
pnpm db:migrate
```
This will:
- Create initial migration
- Create all 18 tables in your Supabase database
- Set up all relationships and indexes

### Step 4: Seed Database
```bash
pnpm db:seed
```
This will populate:
- ✅ 25 settings (pricing, modifiers, thresholds)
- ✅ 71 tasks across 9 room types
- ✅ 4 service zones
- ✅ Test member (sarah@example.com)
- ✅ Test cleaner (maria@example.com)
- ✅ Test checklist

### Step 5: Verify Data
```bash
pnpm db:studio
```
Opens Prisma Studio in browser - you should see all tables with data!

### Step 6: Start Dev Server
```bash
pnpm dev
```

### Step 7: Test Health Check
Open browser: http://localhost:3000/api/health

**Should return:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-24T...",
  "database": "connected",
  "environment": "development"
}
```

---

## ✅ Checkpoint 1 Results

**Report back with:**

```
[ ] pnpm install - ✅ No errors
[ ] pnpm db:generate - ✅ Client generated
[ ] pnpm db:migrate - ✅ Migration successful
[ ] pnpm db:seed - ✅ Seed successful
[ ] pnpm db:studio - ✅ Can see data in all tables
[ ] pnpm dev - ✅ Server running
[ ] http://localhost:3000/api/health - ✅ Returns "ok"
```

**Or if you hit any errors:**
```
❌ Error at step: [which step?]
Error message: [paste error]
```

---

## 📊 Progress Report

```
PHASE 1: DATABASE FOUNDATION ✅ COMPLETE
├── [✅] Session 1-COMBINED: All database rungs (1.1-1.21)
│   ├── Schema: 18 models, all relationships ✅
│   ├── Seed: Settings, tasks, zones ✅
│   ├── Utilities: Prisma + Supabase clients ✅
│   └── Health check API ✅
└── Result: 21/21 rungs complete! 🎉

OVERALL PROGRESS: 21/91 rungs (23%)
━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░ 23%

NEXT UP: Phase 2 - Core Services (11 rungs)
└── Session 2A: SettingsService, TaskLibraryService
```

---

## 🚦 What to Say Next

**If everything works:**
```
"✅ Checkpoint 1 passed - ready for Phase 2"
```

**If you need help:**
```
"Error at [step]: [error message]"
```

**If you're not ready yet:**
```
"Still setting up Supabase/Stripe - will be ready soon"
```

---

## 🎯 What's Next (Phase 2 Preview)

Once Checkpoint 1 passes, we'll build:

**Session 2A (2 rungs, ~40K tokens):**
- ✨ SettingsService - Read/write config from database
- ✨ TaskLibraryService - Query tasks by room type
- ✨ Full test coverage
- ✨ ~20 minutes of work

Then sessions 2B and 2C for remaining services!

---

## 📚 Need Help?

- **Supabase setup**: See `docs/setup/DEVELOPMENT.md`
- **Environment variables**: See `env.example.txt` (now `.env.example`)
- **Full architecture**: See `docs/WHAT_WE_BUILT.md`
- **Execution plan**: See `docs/EXECUTION_PLAN.md`

---

**Ready when you are! 🚀**




