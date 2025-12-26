# VERTEX OS - EXECUTION PLAN

> **How we'll build this step-by-step with clear handoffs**

## 🎯 Overview

This document breaks down BUILDGUIDELINES into **concrete execution sessions** with:
- ✅ What I (AI) will build automatically
- 👤 What YOU need to provide/create
- 🔍 Checkpoints where you review before continuing
- 📊 Token optimization strategy
- ⏱️ Time estimates

## 📋 Execution Phases

```
Phase 0: Prerequisites (YOU) ────────────────► 15 minutes
Phase 1: Database Foundation (AI) ───────────► 1 session
Phase 2: Core Services (AI) ─────────────────► 3 sessions
Phase 3: API Layer (AI) ─────────────────────► 4 sessions
Phase 4: Admin CRM (AI) ─────────────────────► 3 sessions
Phase 5: Integration (YOU + AI) ─────────────► 2 sessions
```

---

## PHASE 0: PREREQUISITES (YOUR ACTION REQUIRED)

**⏱️ Time: 15 minutes**  
**🤖 AI Involvement: None**  
**👤 You Do Everything Here**

### Checklist

- [ ] **1. Set up Supabase** (5 min)
  - Go to https://supabase.com
  - Create account (or login)
  - Click "New Project"
  - Name: `vertex-os-dev`
  - Region: Choose closest to you
  - Database password: Generate strong password (save it!)
  - Wait 2 minutes for project to provision
  
  **Save these (you'll need them):**
  - [ ] Project URL: `https://xxxxx.supabase.co`
  - [ ] Anon Key: `eyJhbG...`
  - [ ] Service Role Key: `eyJhbG...`
  - [ ] Database URL: Go to Settings → Database → Connection String → URI

- [ ] **2. Set up Stripe Test Account** (5 min)
  - Go to https://dashboard.stripe.com
  - Create account (or login)
  - Switch to TEST MODE (toggle in left sidebar)
  - Go to Developers → API Keys
  
  **Save these:**
  - [ ] Publishable key: `pk_test_...`
  - [ ] Secret key: `sk_test_...`

- [ ] **3. Generate JWT Secret** (1 min)
  ```bash
  # Run in terminal:
  openssl rand -base64 32
  ```
  - [ ] Save the output (this is your JWT_SECRET)

- [ ] **4. Create .env.local** (4 min)
  ```bash
  # In your project folder:
  mv env.example.txt .env.example
  cp .env.example .env.local
  ```
  - [ ] Open `.env.local` in editor
  - [ ] Fill in all values from steps 1-3
  - [ ] Set `SKIP_EMAILS="true"` and `SKIP_SMS="true"` for development

### ✅ Verification

Run these commands:
```bash
pnpm install
pnpm db:generate
```

If no errors → **You're ready for Phase 1!**

---

## PHASE 1: DATABASE FOUNDATION

**⏱️ Time: 1 AI session (15-20 min)**  
**📊 Estimated Tokens: ~150K**  
**🤖 AI Does: 95%**  
**👤 You Do: 5% (verify)**

### What I'll Build

```
Session 1A: Database Setup
├── Create prisma/seed.ts (settings data)
├── Create prisma/migrations/ (initial migration)
├── Add seed scripts for:
│   ├── Settings (pricing, fees, modifiers)
│   ├── Tasks (kitchen, bathroom, bedroom, etc.)
│   └── Zones (example service areas)
├── Create test data generators
└── Create database utilities (src/lib/db/)
```

### 🔍 CHECKPOINT 1A

**You verify:**
```bash
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

**Check:**
- [ ] All tables exist (18 tables)
- [ ] Settings table has ~25 rows
- [ ] Tasks table has ~80 rows
- [ ] Zones table has 4 example zones
- [ ] No errors in terminal

**👤 Your Decision:**
- [ ] "Looks good, continue" → I proceed to Phase 2
- [ ] "Wait, I see issues" → I fix them

---

## PHASE 2: CORE SERVICES

**⏱️ Time: 3 AI sessions**  
**📊 Estimated Tokens: ~400K total**  
**🤖 AI Does: 100%**  
**👤 You Do: Review & test**

### Session 2A: Foundation Services (120K tokens)

```
What I'll Build:
├── src/lib/db/client.ts (Prisma singleton)
├── src/lib/db/supabase.ts (Supabase client)
├── src/lib/services/settings.ts (SettingsService)
│   ├── get(key)
│   ├── getCategory(category)
│   └── update(key, value)
├── src/lib/services/task-library.ts (TaskLibraryService)
│   ├── getTasksForRoom()
│   └── getRoomTypes()
├── tests/services/settings.test.ts
└── tests/services/task-library.test.ts
```

### 🔍 CHECKPOINT 2A

**You verify:**
```bash
pnpm test src/lib/services/settings.test.ts
pnpm test src/lib/services/task-library.test.ts
```

**Check:**
- [ ] All tests pass ✅
- [ ] No TypeScript errors
- [ ] Settings can be read from database
- [ ] Tasks can be queried by room type

**Continue?** YES → Session 2B | NO → I fix issues

---

### Session 2B: Calculation Services (140K tokens)

```
What I'll Build:
├── src/lib/services/effort-calculator.ts (EffortCalculatorService)
│   ├── calculateEffort()
│   └── Apply all modifiers (priority, condition, sqft, service level)
├── src/lib/services/pricing.ts (PricingService)
│   ├── calculatePrice()
│   └── Support Free vs Elite tiers
├── src/lib/services/availability.ts (AvailabilityService)
│   ├── checkAvailability()
│   └── getAvailableSlots()
├── tests/services/effort-calculator.test.ts (comprehensive test cases)
├── tests/services/pricing.test.ts
└── tests/services/availability.test.ts
```

### 🔍 CHECKPOINT 2B

**You verify:**
```bash
pnpm test tests/services/
```

**Manual test:**
```typescript
// I'll give you a test script to run
import { EffortCalculatorService } from '@/services/effort-calculator';

const effort = await calculator.calculateEffort(sampleTasks, context);
console.log('Effort hours:', effort.effortHours);
// Should be: ~2.5 hours for average home
```

**Check:**
- [ ] All tests pass
- [ ] Calculations match expected values
- [ ] Free tier: 18% fee, Elite tier: 13% fee
- [ ] Effort modifiers apply correctly

**Continue?** YES → Session 2C | NO → I fix issues

---

### Session 2C: Business Logic Services (140K tokens)

```
What I'll Build:
├── src/lib/services/matching.ts (MatchingService)
│   ├── getMatchedCleaners() - scoring algorithm
│   ├── scoreDistance(), scoreRating(), scoreTier()
│   └── Weighted total calculation
├── src/lib/services/checklist.ts (ChecklistService)
│   ├── generateChecklist()
│   └── Integration with TaskLibrary + EffortCalculator
├── src/lib/services/booking.ts (BookingService)
│   ├── createBooking() - WITH SNAPSHOTS
│   ├── reassignJob()
│   └── Snapshot creation logic
├── src/lib/services/payout.ts (PayoutService)
│   ├── createPayoutBatch()
│   └── processBatch() (mock Stripe for now)
├── src/lib/services/metrics.ts (MetricsService)
│   ├── getDashboardMetrics()
│   ├── getConversionFunnel()
│   └── getCleanerMetrics()
├── src/lib/services/tier.ts (TierService)
│   ├── calculateTier()
│   └── updateCleanerTier()
└── tests/ (comprehensive tests for all above)
```

### 🔍 CHECKPOINT 2C

**You verify:**
```bash
pnpm test
pnpm type-check
```

**Integration test:**
```bash
# I'll provide a test script that simulates:
# Lead → Assessment → Checklist → Matched Cleaners → Booking → Job with Snapshots
```

**Check:**
- [ ] All tests pass (should be 80%+ coverage)
- [ ] No TypeScript errors
- [ ] Job creation includes snapshots (checklist, rate, fee)
- [ ] Matching algorithm returns scored/sorted cleaners
- [ ] Checklist generation works end-to-end

**Continue?** YES → Phase 3 | NO → I fix issues

---

## PHASE 3: API LAYER

**⏱️ Time: 4 AI sessions**  
**📊 Estimated Tokens: ~500K total**  
**🤖 AI Does: 100%**  
**👤 You Do: Test with requests**

### Session 3A: API Infrastructure + Public Endpoints (120K tokens)

```
What I'll Build:
├── src/lib/auth/jwt.ts (JWT utilities)
├── src/lib/auth/middleware.ts (auth middleware)
├── src/lib/api/response.ts (response helpers)
├── src/lib/api/validation.ts (Zod schemas)
├── src/app/api/health/route.ts (health check)
│
├── PUBLIC ENDPOINTS:
├── src/app/api/zones/check/route.ts (GET - check ZIP)
├── src/app/api/zones/waitlist/route.ts (POST - add to waitlist)
├── src/app/api/leads/route.ts (POST - create lead)
├── src/app/api/leads/[id]/assessment/route.ts (PUT - save progress)
├── src/app/api/leads/[id]/generate-checklist/route.ts (POST)
├── src/app/api/leads/[id]/results/route.ts (GET - results page)
├── src/app/api/cleaners/[id]/public/route.ts (GET - public profile)
├── src/app/api/applications/route.ts (POST - cleaner applies)
│
└── tests/api/ (test each endpoint)
```

### 🔍 CHECKPOINT 3A

**I'll give you test commands:**
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test lead creation
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","zip":"85255"}'
```

**You verify:**
- [ ] `pnpm dev` runs without errors
- [ ] Health endpoint returns 200
- [ ] Lead creation works
- [ ] Assessment save works
- [ ] Checklist generation works
- [ ] All tests pass

**Continue?** YES → Session 3B | NO → I fix issues

---

### Session 3B: Member Endpoints (130K tokens)

```
What I'll Build:
├── AUTH:
├── src/app/api/auth/member/signup/route.ts
├── src/app/api/auth/member/login/route.ts
├── src/app/api/auth/member/logout/route.ts
│
├── MEMBER PROFILE:
├── src/app/api/members/me/route.ts (GET, PUT)
├── src/app/api/members/upgrade/route.ts (POST - to Elite)
├── src/app/api/members/cancel/route.ts (POST - cancel Elite)
│
├── CHECKLIST:
├── src/app/api/members/me/checklist/route.ts (GET, PUT)
│
├── BOOKING:
├── src/app/api/booking/available-dates/route.ts (GET)
├── src/app/api/booking/slots/route.ts (GET)
├── src/app/api/booking/route.ts (POST - create booking)
├── src/app/api/booking/[id]/confirm/route.ts (POST - after payment)
│
├── JOBS:
├── src/app/api/members/me/jobs/route.ts (GET - history)
├── src/app/api/members/me/jobs/[id]/route.ts (GET - detail)
├── src/app/api/members/me/jobs/[id]/cancel/route.ts (POST)
├── src/app/api/members/me/jobs/[id]/reschedule/route.ts (POST)
├── src/app/api/members/me/jobs/[id]/rate/route.ts (POST)
├── src/app/api/members/me/jobs/[id]/report-issue/route.ts (POST)
│
└── tests/api/members/ (test all endpoints)
```

### 🔍 CHECKPOINT 3B

**Test flow:**
```bash
# 1. Sign up member
# 2. Login (get JWT)
# 3. Get profile
# 4. Get checklist
# 5. Create booking
# 6. List jobs
```

**I'll provide Postman/Thunder Client collection**

**You verify:**
- [ ] All endpoints return expected responses
- [ ] Auth middleware blocks unauthenticated requests
- [ ] JWT tokens work
- [ ] Tests pass

**Continue?** YES → Session 3C | NO → I fix issues

---

### Session 3C: Cleaner Endpoints (120K tokens)

```
What I'll Build:
├── AUTH:
├── src/app/api/auth/cleaner/login/route.ts
├── src/app/api/auth/cleaner/logout/route.ts
│
├── PROFILE:
├── src/app/api/cleaners/me/route.ts (GET, PUT)
├── src/app/api/cleaners/me/zones/route.ts (PUT - update zones)
│
├── SCHEDULE:
├── src/app/api/cleaners/me/schedule/route.ts (GET, PUT)
├── src/app/api/cleaners/me/blocked-dates/route.ts (POST, DELETE)
│
├── JOBS:
├── src/app/api/cleaners/me/jobs/route.ts (GET - assigned jobs)
├── src/app/api/cleaners/me/jobs/[id]/route.ts (GET - detail)
├── src/app/api/cleaners/me/jobs/[id]/decline/route.ts (POST)
├── src/app/api/cleaners/me/jobs/[id]/start/route.ts (POST)
├── src/app/api/cleaners/me/jobs/[id]/complete/route.ts (POST)
│
├── EARNINGS:
├── src/app/api/cleaners/me/earnings/route.ts (GET)
├── src/app/api/cleaners/me/payouts/route.ts (GET)
│
└── tests/api/cleaners/
```

### 🔍 CHECKPOINT 3C

**Test cleaner workflow:**
```bash
# 1. Login as cleaner
# 2. Update schedule
# 3. Block date
# 4. View assigned jobs
# 5. Start job
# 6. Complete job
```

**You verify:**
- [ ] Cleaner can only see their own jobs
- [ ] Schedule updates work
- [ ] Job status transitions work correctly
- [ ] Tests pass

**Continue?** YES → Session 3D | NO → I fix issues

---

### Session 3D: Admin Endpoints (130K tokens)

```
What I'll Build:
├── AUTH:
├── src/app/api/auth/admin/login/route.ts
│
├── DASHBOARD:
├── src/app/api/admin/dashboard/route.ts
│
├── MEMBERS:
├── src/app/api/admin/members/route.ts (GET - list)
├── src/app/api/admin/members/[id]/route.ts (GET, PUT)
├── src/app/api/admin/members/[id]/notes/route.ts (POST)
│
├── CLEANERS:
├── src/app/api/admin/cleaners/route.ts (GET - list)
├── src/app/api/admin/cleaners/[id]/route.ts (GET, PUT)
├── src/app/api/admin/cleaners/[id]/notes/route.ts (POST)
│
├── APPLICATIONS:
├── src/app/api/admin/applications/route.ts (GET)
├── src/app/api/admin/applications/[id]/route.ts (GET)
├── src/app/api/admin/applications/[id]/approve/route.ts (POST)
├── src/app/api/admin/applications/[id]/reject/route.ts (POST)
│
├── JOBS:
├── src/app/api/admin/jobs/route.ts (GET - list all)
├── src/app/api/admin/jobs/[id]/route.ts (GET)
├── src/app/api/admin/jobs/[id]/reassign/route.ts (POST)
├── src/app/api/admin/jobs/[id]/resolve-issue/route.ts (POST)
├── src/app/api/admin/jobs/[id]/cancel/route.ts (POST)
│
├── PAYOUTS:
├── src/app/api/admin/payouts/route.ts (GET)
├── src/app/api/admin/payouts/create-batch/route.ts (POST)
├── src/app/api/admin/payouts/[id]/route.ts (GET)
├── src/app/api/admin/payouts/[id]/process/route.ts (POST)
│
├── LEADS:
├── src/app/api/admin/leads/route.ts (GET)
├── src/app/api/admin/leads/[id]/route.ts (GET)
│
├── TASK LIBRARY:
├── src/app/api/admin/tasks/route.ts (GET, POST)
├── src/app/api/admin/tasks/[id]/route.ts (PUT, DELETE)
│
├── ZONES:
├── src/app/api/admin/zones/route.ts (GET, POST)
├── src/app/api/admin/zones/[id]/route.ts (PUT)
│
├── SETTINGS:
├── src/app/api/admin/settings/route.ts (GET)
├── src/app/api/admin/settings/[key]/route.ts (PUT)
│
└── tests/api/admin/
```

### 🔍 CHECKPOINT 3D

**Test admin functionality:**
```bash
# 1. Login as admin
# 2. Get dashboard metrics
# 3. List members/cleaners/jobs
# 4. Approve application
# 5. Reassign job
# 6. Create payout batch
# 7. Update settings
```

**You verify:**
- [ ] Admin can access all endpoints
- [ ] Non-admin cannot access admin endpoints
- [ ] Job reassignment recalculates pricing
- [ ] Payout batch creation works
- [ ] Settings updates work
- [ ] All tests pass

**Continue?** YES → Phase 4 | NO → I fix issues

---

## PHASE 4: ADMIN CRM

**⏱️ Time: 3 AI sessions**  
**📊 Estimated Tokens: ~450K total**  
**🤖 AI Does: 100%**  
**👤 You Do: Visual review**

### Session 4A: Setup + Dashboard + Jobs (150K tokens)

```
What I'll Build:
├── Clone shadcn/ui admin template
├── Configure navigation
├── Setup API client (src/lib/api-client.ts)
├── Setup TanStack Query
│
├── DASHBOARD PAGE:
├── src/app/(admin)/dashboard/page.tsx
├── src/components/dashboard/
│   ├── metric-cards.tsx
│   ├── needs-attention.tsx
│   ├── today-jobs-table.tsx
│   └── weekly-chart.tsx
│
├── JOBS PAGE:
├── src/app/(admin)/jobs/page.tsx
├── src/components/jobs/
│   ├── jobs-table.tsx
│   ├── job-filters.tsx
│   ├── job-detail-panel.tsx (slide-out)
│   └── reassign-dialog.tsx
```

### 🔍 CHECKPOINT 4A

**You verify:**
```bash
pnpm dev
# Visit http://localhost:3000/dashboard
```

**Check:**
- [ ] Dashboard loads with real data
- [ ] Metric cards show correct numbers
- [ ] Jobs table displays jobs from database
- [ ] Filters work (status, date range)
- [ ] Job detail panel opens on click
- [ ] Looks professional (not ugly placeholder UI)

**Visual review screenshots?**
- [ ] YES, looks good → Continue
- [ ] NO, needs UI adjustments → I fix

---

### Session 4B: Members + Cleaners + Payouts (150K tokens)

```
What I'll Build:
├── MEMBERS PAGE:
├── src/app/(admin)/members/page.tsx
├── src/components/members/
│   ├── members-table.tsx
│   ├── member-detail-panel.tsx
│   ├── notes-section.tsx
│   └── checklist-modal.tsx
│
├── CLEANERS PAGE:
├── src/app/(admin)/cleaners/page.tsx
├── src/components/cleaners/
│   ├── cleaners-table.tsx
│   ├── cleaner-detail-panel.tsx
│   ├── performance-metrics.tsx
│   └── schedule-viewer.tsx
│
├── PAYOUTS PAGE:
├── src/app/(admin)/payouts/page.tsx
├── src/components/payouts/
│   ├── pending-payout-card.tsx
│   ├── revenue-summary.tsx
│   ├── payout-history-table.tsx
│   └── process-payout-modal.tsx
```

### 🔍 CHECKPOINT 4B

**You verify:**
```bash
# Visit each page:
# - /members
# - /cleaners
# - /payouts
```

**Check:**
- [ ] All tables load data correctly
- [ ] Detail panels work
- [ ] Notes can be added
- [ ] Performance metrics calculate correctly
- [ ] Payout batch creation works
- [ ] UI is consistent across pages

**Continue?** YES → Session 4C | NO → UI fixes

---

### Session 4C: Applications + Leads + System (150K tokens)

```
What I'll Build:
├── APPLICATIONS PAGE:
├── src/app/(admin)/applications/page.tsx
├── src/components/applications/
│   ├── pending-applications.tsx
│   ├── application-review-modal.tsx
│   └── recent-decisions-table.tsx
│
├── LEADS PAGE:
├── src/app/(admin)/leads/page.tsx
├── src/components/leads/
│   ├── conversion-funnel.tsx
│   ├── abandoned-leads-table.tsx
│   └── waitlist-table.tsx
│
├── TASK LIBRARY PAGE:
├── src/app/(admin)/task-library/page.tsx
├── src/components/task-library/
│   ├── room-type-selector.tsx
│   ├── tasks-table.tsx
│   └── task-edit-modal.tsx
│
├── ZONES PAGE:
├── src/app/(admin)/zones/page.tsx
├── src/components/zones/
│   ├── zone-cards.tsx
│   ├── waitlist-demand.tsx
│   └── zone-edit-modal.tsx
│
├── SETTINGS PAGE:
├── src/app/(admin)/settings/page.tsx
├── src/components/settings/
│   ├── pricing-section.tsx
│   ├── effort-section.tsx
│   ├── tier-thresholds-section.tsx
│   └── match-weights-section.tsx
```

### 🔍 CHECKPOINT 4C

**You verify all remaining pages work**

**Check:**
- [ ] Application approval flow works
- [ ] Conversion funnel displays correctly
- [ ] Task library editable (add/edit/delete tasks)
- [ ] Zones manageable
- [ ] Settings update correctly
- [ ] All CRUD operations work

**🎉 Admin CRM Complete?**
- [ ] YES → Phase 5
- [ ] NO → Final polish/fixes

---

## PHASE 5: INTEGRATION

**⏱️ Time: 2 sessions**  
**📊 Estimated Tokens: ~200K total**  
**🤖 AI Does: 70%**  
**👤 You Do: 30% (external service setup)**

### Session 5A: Stripe Integration (YOU + AI)

**👤 YOUR TASKS FIRST:**

1. **Create Stripe Products/Prices** (10 min)
   ```
   In Stripe Dashboard (TEST MODE):
   
   1. Products → Create Product:
      - Name: "Elite Membership"
      - Recurring: Monthly
      - Price: $149
      - Copy Price ID → STRIPE_ELITE_PRICE_ID
   
   2. Create Product:
      - Name: "Cleaner Certification"
      - One-time: $150
      - Copy Price ID → STRIPE_CERTIFICATION_PRICE_ID
   
   3. Enable Stripe Connect:
      - Settings → Connect → Get Started
      - Platform settings → Onboard for Express accounts
   ```

2. **Update .env.local** with Price IDs

**🤖 THEN I BUILD:**
```
├── src/lib/stripe/client.ts (Stripe SDK wrapper)
├── src/lib/stripe/payments.ts
│   ├── createPaymentIntent() - for job payments
│   ├── createSubscription() - for Elite membership
│   └── processRefund()
├── src/lib/stripe/connect.ts
│   ├── createConnectAccount() - for cleaners
│   ├── createTransfer() - for payouts
│   └── onboardCleaner()
├── src/app/api/webhooks/stripe/route.ts
│   ├── Handle payment_intent.succeeded
│   ├── Handle invoice.paid (Elite subscription)
│   └── Handle account.updated (cleaner onboarding)
└── tests/stripe/ (with Stripe test mode)
```

### 🔍 CHECKPOINT 5A

**Test Stripe integration:**
```bash
# I'll give you test card numbers
# Test cards: 4242 4242 4242 4242 (success)
#             4000 0000 0000 0002 (decline)
```

**You test:**
- [ ] Create booking → Payment succeeds
- [ ] Upgrade to Elite → Subscription created
- [ ] Webhook receives events
- [ ] Payout batch → Transfers created

**Stripe working?** YES → Session 5B | NO → Debug

---

### Session 5B: Final Polish + Documentation (YOU + AI)

**🤖 I BUILD:**
```
├── Email templates (console.log for now, real emails later)
├── SMS templates (console.log for now, real SMS later)
├── Error tracking setup (Sentry placeholder)
├── Analytics setup (PostHog placeholder)
├── Performance monitoring
├── Health check improvements
└── Final documentation polish
```

**👤 YOU DO:**
```
1. Full end-to-end test:
   ✓ Lead → Assessment → Results → Booking → Payment → Job
   ✓ Cleaner completes job
   ✓ Customer rates
   ✓ Admin creates payout
   ✓ All flows work

2. Deploy to Vercel (optional):
   - Connect GitHub repo
   - Add environment variables
   - Deploy

3. Set up production Supabase (when ready)
```

### 🔍 FINAL CHECKPOINT

**Complete system test checklist:**
- [ ] All services work
- [ ] All APIs return correct responses
- [ ] Admin CRM fully functional
- [ ] Stripe payments work
- [ ] Database snapshots correct
- [ ] Tests pass (80%+ coverage)
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Ready for production

---

## 🎮 SESSION MANAGEMENT STRATEGY

### Token Optimization

**Each session targets ~150K tokens max to:**
- Stay well under 1M limit
- Allow for debugging/fixes
- Prevent context window exhaustion

**Session structure:**
```
1. Planning (5K tokens)
2. Implementation (100-120K tokens)
3. Testing code (20K tokens)
4. Checkpoint verification (10K tokens)
5. Buffer for fixes (15K tokens)
```

### Context Handoffs

**Between sessions I'll:**
1. Summarize what was built
2. List files created/modified
3. Note any issues/decisions
4. Prepare next session plan

**You'll:**
1. Review checkpoint
2. Run verification commands
3. Give GO/NO-GO decision
4. Provide any needed credentials

---

## 📊 PROGRESS TRACKING

I'll maintain a checklist:

```markdown
## VERTEX OS BUILD PROGRESS

### Phase 0: Prerequisites
- [ ] Supabase configured
- [ ] Stripe configured
- [ ] .env.local created
- [ ] Dependencies installed

### Phase 1: Database ✅ COMPLETE
- [✓] Schema created
- [✓] Migrations run
- [✓] Seed data added
- [✓] Test data generated

### Phase 2: Core Services (IN PROGRESS)
- [✓] Session 2A: SettingsService, TaskLibraryService
- [ ] Session 2B: EffortCalculator, Pricing, Availability
- [ ] Session 2C: Matching, Checklist, Booking, Payout, Metrics, Tier

### Phase 3: API Layer
- [ ] Session 3A: Infrastructure + Public
- [ ] Session 3B: Member endpoints
- [ ] Session 3C: Cleaner endpoints
- [ ] Session 3D: Admin endpoints

### Phase 4: Admin CRM
- [ ] Session 4A: Dashboard + Jobs
- [ ] Session 4B: Members + Cleaners + Payouts
- [ ] Session 4C: Applications + Leads + System

### Phase 5: Integration
- [ ] Session 5A: Stripe
- [ ] Session 5B: Final polish
```

---

## 🚦 DECISION POINTS

### When I Need Your Input

**During Implementation:**
- ❓ "Should X feature work this way or that way?"
- ❓ "I found an edge case not in spec, how to handle?"
- ❓ "This library has 2 approaches, which do you prefer?"

**At Checkpoints:**
- ✅ "Tests pass, continue?" → Your GO/NO-GO
- 🐛 "Found bug in previous session" → I fix before continuing
- 🎨 "UI needs adjustments?" → I refine

**External Services:**
- 🔑 "Need Stripe Price IDs" → You provide
- 🔑 "Need Supabase credentials" → You provide
- 🔑 "Need to test webhooks" → You run Stripe CLI

---

## 💬 COMMUNICATION STYLE

### During Sessions

**I'll provide:**
- "🏗️ Building [Feature Name]..." (start of feature)
- "✅ Created [filename]" (each file)
- "🧪 Testing [feature]..." (during testing)
- "✓ [Feature] complete" (end of feature)

**You respond:**
- Short: "continue", "looks good", "wait - fix X"
- Detailed: Give specific feedback
- Checkpoint: Run commands, report results

### Example Session Interaction

```
ME: "🏗️ Session 2A: Building SettingsService..."
    "✅ Created src/lib/services/settings.ts"
    "✅ Created tests/services/settings.test.ts"
    "🧪 Testing SettingsService..."
    "✓ SettingsService complete - All tests pass"
    
    "🔍 CHECKPOINT 2A"
    "Please run: pnpm test tests/services/settings.test.ts"

YOU: "✅ Tests pass"

ME: "🏗️ Building TaskLibraryService..."
```

---

## ⚡ READY TO START?

**Say:**
- "Start Phase 1" → I'll build database setup
- "Start Phase 2" → I'll build services (if Phase 1 done)
- "Skip to Phase X" → I'll start there
- "Build [specific feature]" → I'll focus on that

**Or ask:**
- "How long will Phase X take?"
- "What happens if I need to stop mid-session?"
- "Can you change the approach for [feature]?"

---

**Let's build VERTEX OS! 🚀**



