# Frontend Integration Guide

> **How VERTEX OS connects to Red Shirt Club frontends**

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    RED SHIRT CLUB ECOSYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐              │
│  │  CUSTOMER SITE   │       │  CLEANER APP     │              │
│  │  (Next.js)       │       │  (React Native   │              │
│  │                  │       │   or Web)        │              │
│  │  • Marketing     │       │                  │              │
│  │  • Assessment    │       │  • Schedule      │              │
│  │  • Results       │       │  • Jobs          │              │
│  │  • Booking       │       │  • Earnings      │              │
│  │  • My Jobs       │       │  • Profile       │              │
│  │                  │       │                  │              │
│  │  Your Brand ✨   │       │  Your Brand ✨   │              │
│  └────────┬─────────┘       └────────┬─────────┘              │
│           │                          │                         │
│           │        API CALLS         │                         │
│           └──────────┬───────────────┘                         │
│                      │                                         │
│                      ▼                                         │
│           ┌──────────────────────┐                            │
│           │    VERTEX OS API     │◄───────────┐               │
│           │  (This Backend)      │            │               │
│           │                      │            │               │
│           │  • REST Endpoints    │         ┌──┴────────┐      │
│           │  • Business Logic    │         │  ADMIN    │      │
│           │  • Database          │         │   CRM     │      │
│           │  • Stripe (backend)  │         │           │      │
│           │  • Notifications     │         │  Manage   │      │
│           └──────────┬───────────┘         │  Platform │      │
│                      │                     └───────────┘      │
│                      ▼                                         │
│              ┌──────────────┐                                 │
│              │   SUPABASE   │                                 │
│              │  PostgreSQL  │                                 │
│              └──────────────┘                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## 🔌 How Frontends Connect

### Customer Site (Your Brand, Your Design)

**What you build (frontend):**
```tsx
// Your beautiful, branded customer site
// Example: redshirtclub.com

import { VertexAPI } from '@/lib/vertex-api';

// 1. HOME PAGE - ZIP Check
const HomePage = () => {
  const checkZip = async (zip: string) => {
    const response = await VertexAPI.post('/zones/check', { zip });
    // Show: "✓ We serve your area!" or "Join waitlist"
  };
  
  return (
    <YourBeautifulHeroSection>
      <YourBrandedHeadline>Your Home, Perfectly Clean</YourBrandedHeadline>
      <ZipInput onSubmit={checkZip} />
    </YourBeautifulHeroSection>
  );
};

// 2. ASSESSMENT FLOW - Your Design
const AssessmentPage = () => {
  const saveProgress = async (step: number, data: any) => {
    await VertexAPI.put(`/leads/${leadId}/assessment`, { step, data });
  };
  
  return (
    <YourAssessmentWizard onStepComplete={saveProgress}>
      {/* Your branded assessment questions */}
      {/* Your beautiful room selector UI */}
      {/* Your priority zone picker */}
    </YourAssessmentWizard>
  );
};

// 3. RESULTS PAGE - Show Matched Cleaners
const ResultsPage = () => {
  const { data } = await VertexAPI.get(`/leads/${leadId}/results`);
  // Backend returns: checklist summary + matched cleaners
  
  return (
    <YourResultsLayout>
      <YourChecklistDisplay tasks={data.checklist} />
      <YourCleanerCards cleaners={data.matched_cleaners} />
      {/* Customer picks cleaner, your design */}
    </YourResultsLayout>
  );
};

// 4. BOOKING & PAYMENT - Your Checkout Flow
const CheckoutPage = () => {
  // STRIPE IS IN FRONTEND (Stripe Elements)
  const { stripe } = useStripe();
  
  const handlePayment = async () => {
    // 1. Create booking (backend creates payment intent)
    const booking = await VertexAPI.post('/booking', {
      cleaner_id,
      date,
      time
    });
    
    // 2. Stripe Elements (FRONTEND) collects card
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret: booking.payment_intent.client_secret,
      confirmParams: {
        return_url: 'https://redshirtclub.com/booking/success',
      }
    });
    
    // 3. Confirm booking after payment succeeds
    if (paymentIntent.status === 'succeeded') {
      await VertexAPI.post(`/booking/${booking.id}/confirm`, {
        payment_intent_id: paymentIntent.id
      });
    }
  };
  
  return (
    <YourCheckoutUI>
      <OrderSummary />
      <StripeElements> {/* Stripe UI in YOUR frontend */}
        <PaymentElement />
      </StripeElements>
      <YourBrandedSubmitButton onClick={handlePayment} />
    </YourCheckoutUI>
  );
};
```

**VERTEX OS provides the API:**
```typescript
// Backend handles:
✅ Checklist generation logic
✅ Cleaner matching algorithm
✅ Price calculation (effort × rate + fees)
✅ Job creation with snapshots
✅ Stripe payment intent creation
✅ Job tracking
✅ Database operations

// Frontend (your brand) handles:
🎨 All design and UX
🎨 User interactions
🎨 Stripe card collection (via Stripe Elements)
🎨 Brand messaging
🎨 Marketing content
```

---

## 💳 Why Stripe is in BOTH Places

### Frontend Stripe (Customer Sees This)

**What happens in YOUR frontend:**
```tsx
import { Elements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// 1. Load Stripe (public key - safe to expose)
const stripePromise = loadStripe('pk_live_YOUR_PUBLISHABLE_KEY');

// 2. Customer enters card details (handled by Stripe, not you)
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <PaymentElement />
  {/* Stripe's secure form - never touches your servers */}
</Elements>

// 3. Customer clicks "Pay $89.50"
// Card data goes directly to Stripe (PCI compliant)
// You never see card numbers ✅
```

**Why this matters:**
- **Security**: Card data NEVER touches your servers
- **PCI Compliance**: Stripe handles it all
- **Beautiful UI**: Stripe Elements look native to your brand
- **Fraud Protection**: Stripe's ML detects fraud automatically

### Backend Stripe (You Never See This)

**What happens in VERTEX OS backend:**
```typescript
// src/lib/stripe/payments.ts

// 1. CREATE PAYMENT INTENT (before customer pays)
export async function createJobPaymentIntent(job: Job) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: job.total_price * 100, // $89.50 → 8950 cents
    currency: 'usd',
    customer: member.stripe_customer_id,
    metadata: {
      job_id: job.id,
      member_id: member.id,
      cleaner_id: job.cleaner_id,
      type: 'job_payment'
    },
    // Return URL after payment
    return_url: 'https://redshirtclub.com/booking/success'
  });
  
  // Send client_secret to frontend
  // Frontend uses this with Stripe Elements
  return paymentIntent;
}

// 2. WEBHOOK (Stripe tells backend when payment succeeds)
// POST /api/webhooks/stripe
export async function handleStripeWebhook(event: Stripe.Event) {
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // Update job status
    await db.jobs.update({
      where: { id: paymentIntent.metadata.job_id },
      data: { status: 'confirmed' }
    });
    
    // Create transaction record
    await db.transactions.create({
      data: {
        job_id: paymentIntent.metadata.job_id,
        type: 'job_payment',
        amount: paymentIntent.amount / 100,
        stripe_payment_intent: paymentIntent.id,
        status: 'completed'
      }
    });
    
    // Send confirmation email
    await sendJobConfirmationEmail(job);
  }
}

// 3. PAYOUT TO CLEANERS (you trigger this in admin)
export async function payoutCleaner(cleaner: Cleaner, amount: number) {
  const transfer = await stripe.transfers.create({
    amount: amount * 100,
    currency: 'usd',
    destination: cleaner.stripe_account_id, // Cleaner's Stripe Connect account
    metadata: {
      cleaner_id: cleaner.id,
      payout_batch_id: batch.id
    }
  });
  
  // Money goes from your Stripe → Cleaner's bank
}

// 4. ELITE SUBSCRIPTIONS
export async function createEliteSubscription(member: Member) {
  const subscription = await stripe.subscriptions.create({
    customer: member.stripe_customer_id,
    items: [{ price: 'price_elite_monthly_149' }],
    metadata: {
      member_id: member.id,
      tier: 'elite'
    }
  });
  
  // Auto-charges $149/month
  return subscription;
}

// 5. REFUNDS (if job cancelled)
export async function refundJob(job: Job) {
  const refund = await stripe.refunds.create({
    payment_intent: job.stripe_payment_intent,
    reason: 'requested_by_customer'
  });
  
  // Money returns to customer
}
```

**Why backend needs Stripe:**
- ✅ **Create payment intents** (before customer pays)
- ✅ **Receive webhooks** (when payment succeeds/fails)
- ✅ **Track transactions** (for accounting)
- ✅ **Process payouts** (pay cleaners weekly)
- ✅ **Handle subscriptions** (Elite $149/month)
- ✅ **Process refunds** (if job cancelled)
- ✅ **Revenue analytics** (dashboard metrics)
- ✅ **Dispute handling** (customer chargebacks)

---

## 🎨 Brand Strategy Alignment

### Your Frontend = Your Brand 100%

**What you control completely:**
```
✅ Colors, fonts, design system
✅ Logo, imagery, photography
✅ Messaging, copy, tone of voice
✅ User experience and flows
✅ Marketing content
✅ SEO, landing pages
✅ Mobile app design
✅ Social proof, testimonials
✅ Animations, interactions
```

**VERTEX OS is invisible:**
- Customers never see "VERTEX OS"
- Customers never leave your site
- All your branding, all the time
- Backend is just plumbing

### Example: Red Shirt Club Customer Journey

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Your Landing Page (redshirtclub.com)              │
│  Your Brand: ✅ Logo, colors, hero image                    │
│  Your Copy: ✅ "Arizona's Premium Cleaning Service"         │
│  Your Design: ✅ Beautiful, modern, professional            │
│  Backend: Invisible (just ZIP check API)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Assessment Wizard                                  │
│  Your Brand: ✅ Custom illustrations                         │
│  Your UX: ✅ Smooth, intuitive flow                          │
│  Your Copy: ✅ "Tell us about your home"                     │
│  Backend: Saves progress (API calls in background)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Results & Cleaner Selection                        │
│  Your Brand: ✅ Cleaner profiles with your styling          │
│  Your Design: ✅ Beautiful cards, ratings display            │
│  Your Copy: ✅ "Meet your matched cleaners"                  │
│  Backend: Matching algorithm + cleaner data (API)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Booking Calendar                                   │
│  Your Brand: ✅ Custom calendar UI                           │
│  Your UX: ✅ Date/time picker your way                       │
│  Backend: Availability check (API)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Checkout                                           │
│  Your Brand: ✅ Order summary in your style                  │
│  Stripe: ✅ Card form (styled to match your brand)           │
│  Your Copy: ✅ "Secure checkout" messaging                   │
│  Backend: Creates payment intent, confirms booking         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Confirmation                                       │
│  Your Brand: ✅ Success page, your celebration design        │
│  Your Email: ✅ Confirmation email in your template          │
│  Backend: Sends notifications, creates job                 │
└─────────────────────────────────────────────────────────────┘
```

**Customer Experience:**
- 🎨 All Red Shirt Club branding
- 🎨 Never see "powered by" anything
- 🎨 Seamless, native experience
- 🎨 Your marketing, your story

**Backend's Role:**
- 🔧 Makes it work (invisible)
- 🔧 Handles complexity (you don't see it)
- 🔧 Scales automatically (you don't worry)

---

## 🛠️ How You'll Build Your Frontend

### Option 1: Separate Frontend Repo (Recommended)

```
📁 red-shirt-club-frontend/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── assessment/
│   │   └── page.tsx                # Assessment wizard
│   ├── results/
│   │   └── page.tsx                # Matched cleaners
│   ├── booking/
│   │   ├── page.tsx                # Calendar & checkout
│   │   └── success/page.tsx        # Confirmation
│   └── dashboard/
│       └── page.tsx                # Customer dashboard
├── components/
│   ├── assessment/
│   │   ├── RoomSelector.tsx       # Your design
│   │   ├── PriorityZones.tsx      # Your design
│   │   └── ProgressBar.tsx        # Your design
│   ├── cleaners/
│   │   ├── CleanerCard.tsx        # Your design
│   │   └── CleanerProfile.tsx     # Your design
│   └── checkout/
│       ├── OrderSummary.tsx       # Your design
│       └── StripeCheckout.tsx     # Stripe Elements
├── lib/
│   ├── api.ts                      # API client for VERTEX OS
│   └── stripe.ts                   # Stripe frontend SDK
└── styles/
    └── theme.ts                    # Your brand colors/fonts

📁 vertex-os/  (this backend)
└── Connected via API calls
```

### Your API Client

```typescript
// lib/api.ts
const VERTEX_API = process.env.NEXT_PUBLIC_VERTEX_API_URL;

export const VertexAPI = {
  // Lead & Assessment
  async createLead(data: LeadInput) {
    return fetch(`${VERTEX_API}/leads`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  async saveAssessment(leadId: string, data: AssessmentData) {
    return fetch(`${VERTEX_API}/leads/${leadId}/assessment`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  async generateChecklist(leadId: string) {
    return fetch(`${VERTEX_API}/leads/${leadId}/generate-checklist`, {
      method: 'POST'
    });
  },
  
  async getResults(leadId: string) {
    return fetch(`${VERTEX_API}/leads/${leadId}/results`);
  },
  
  // Booking
  async createBooking(data: BookingInput) {
    return fetch(`${VERTEX_API}/booking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
  },
  
  // Customer Dashboard (authenticated)
  async getMyJobs() {
    return fetch(`${VERTEX_API}/members/me/jobs`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
  }
};
```

---

## 💰 Stripe Flow (Complete Picture)

```
┌─────────────────────────────────────────────────────────────────┐
│                    STRIPE PAYMENT FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Customer clicks "Book Now" on YOUR frontend                 │
│     ↓                                                            │
│  2. Your frontend → VERTEX API: POST /booking                   │
│     {cleaner_id, date, time}                                    │
│     ↓                                                            │
│  3. VERTEX Backend:                                             │
│     • Calculate price ($89.50)                                  │
│     • Create Stripe PaymentIntent                               │
│     • Save job record (status: pending_payment)                 │
│     ↓                                                            │
│  4. Backend → Frontend: Return {client_secret, amount}          │
│     ↓                                                            │
│  5. YOUR FRONTEND shows Stripe Elements:                        │
│     ┌────────────────────────────────────┐                      │
│     │  Order Summary         $89.50      │ ← Your design        │
│     │  ──────────────────────────────    │                      │
│     │  Card Number: [    Stripe Form   ] │ ← Stripe secure UI   │
│     │  Expiry: [  ]  CVC: [  ]           │                      │
│     │  ──────────────────────────────    │                      │
│     │  [ Confirm & Pay $89.50 ]          │ ← Your button        │
│     └────────────────────────────────────┘                      │
│     ↓                                                            │
│  6. Customer clicks "Pay"                                       │
│     ↓                                                            │
│  7. Stripe JS SDK → Stripe servers (card data)                  │
│     (Card NEVER touches your servers! ✅ PCI compliant)          │
│     ↓                                                            │
│  8. Stripe processes payment                                    │
│     ↓                                                            │
│  9. Stripe → VERTEX webhook: "payment succeeded"                │
│     POST /api/webhooks/stripe                                   │
│     ↓                                                            │
│ 10. VERTEX Backend:                                             │
│     • Update job status → confirmed                             │
│     • Create transaction record                                 │
│     • Send confirmation email                                   │
│     • Notify cleaner                                            │
│     ↓                                                            │
│ 11. YOUR Frontend redirected to success page                    │
│     (Your beautiful confirmation screen)                        │
│                                                                  │
│ ──────────────────────────────────────────────────────────────  │
│                                                                  │
│ 12. JOB DAY: Cleaner completes job                              │
│     ↓                                                            │
│ 13. Customer rates → Job verified                               │
│     ↓                                                            │
│ 14. FRIDAY: You trigger weekly payout in Admin CRM              │
│     ↓                                                            │
│ 15. VERTEX Backend:                                             │
│     • Create payout batch                                       │
│     • Stripe Transfer: Your Stripe → Cleaner's bank             │
│     • Update transaction records                                │
│     ↓                                                            │
│ 16. Cleaner gets paid ✅                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Money Flow:**
```
Customer's Card
    ↓
Stripe (holds for 2 days)
    ↓
Your Stripe Account
    ↓  (you keep platform fee)
    ↓
Cleaner's Bank Account (via Stripe Connect)
```

**Why backend Stripe is essential:**
- Frontend: Collects payment securely
- Backend: Manages the money afterward
  - Track who paid what
  - When to pay cleaners
  - Revenue analytics
  - Handle refunds
  - Elite subscriptions

---

## 🎯 Your Frontend Development Path

### Phase 1: Customer Site MVP
```typescript
// Build these pages (your design):
1. Landing page with ZIP check
2. Assessment wizard (5-7 steps)
3. Results page (matched cleaners)
4. Calendar & booking
5. Stripe checkout
6. Confirmation page
7. Customer dashboard (upcoming jobs)

// Connect to VERTEX API:
✅ All endpoints ready
✅ Just fetch() or axios
✅ Copy API types from VERTEX
```

### Phase 2: Cleaner App
```typescript
// Mobile app or web (your choice):
1. Login
2. Schedule management
3. Job list (today, upcoming)
4. Job detail (checklist)
5. Complete job (photos)
6. Earnings dashboard

// Same VERTEX API:
✅ Different endpoints (cleaners/*)
✅ Same backend
```

### Phase 3: Admin CRM
```
Already built! ✅
Part of VERTEX OS
At: /admin
```

---

## 🤝 Summary

### VERTEX OS (Backend) = The Engine
- Business logic
- Database
- Stripe transactions
- Matching algorithm
- Notifications
- **Invisible to customers**

### Your Frontend = The Brand
- Design system
- User experience
- Marketing
- Stripe card collection (via Elements)
- **What customers see**

### They Work Together:
```
Your Frontend  ←──[API]──→  VERTEX Backend  ←──→  Supabase DB
    ↓                             ↓
Stripe Elements              Stripe API
(card collection)            (payments, payouts)
```

**You're building a SaaS platform where:**
- Backend = VERTEX OS (what we're building)
- Frontend = Your brand (what you'll build)
- Stripe = Payment infrastructure (in both places)

---

## 📖 Next Steps

1. **Finish VERTEX OS backend** (Phases 1-5)
2. **Get API endpoints working**
3. **Test APIs with Postman**
4. **Build your frontend** (connect to APIs)
5. **Style with your brand**
6. **Deploy both**

**Want me to:**
- Create API documentation for your frontend team?
- Show example API calls for each page?
- Build a frontend starter template?

Ready to continue building? 🚀



