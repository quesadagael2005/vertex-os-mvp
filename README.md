# VERTEX OS

> **The engine that powers Red Shirt Club**  
> A unified backend serving customer site, cleaner app, and admin CRM

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E)](https://supabase.com/)

## 🎯 Purpose

VERTEX OS is the central nervous system for Red Shirt Club - a professional cleaning service platform. It handles:

- **Lead capture & conversion** funnel
- **Dynamic checklist generation** from home assessments
- **Smart cleaner matching** algorithm
- **Booking & scheduling** engine
- **Payment processing** via Stripe
- **Payout management** for cleaners
- **Admin operations** dashboard

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Customer Site  │────▶│   VERTEX OS     │◀────│   Cleaner App   │
│   (Next.js)     │     │   (This Repo)   │     │   (React)       │
└─────────────────┘     │                 │     └─────────────────┘
                        │  • REST APIs    │
┌─────────────────┐     │  • Services     │
│   Admin CRM     │────▶│  • Database     │
│  (Next.js)      │     │  • Jobs Queue   │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │    Supabase     │
                        │   PostgreSQL    │
                        └─────────────────┘
```

## 📋 Prerequisites

- Node.js 20+ and pnpm 8+
- PostgreSQL 15+ (via Supabase)
- Stripe account (test mode for development)
- Supabase project

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd vertex-os
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in your Supabase and Stripe credentials (see `.env.example` for details).

### 3. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database
pnpm prisma db seed
```

### 4. Start Development Server

```bash
pnpm dev
```

API will be available at `http://localhost:3000/api`

## 📚 Documentation

- **[BUILDGUIDELINES](./BUILDGUIDELINES)** - Complete technical specification
- **[API Documentation](./docs/api/)** - Endpoint reference
- **[Architecture Decisions](./docs/adr/)** - Why we built it this way
- **[Setup Guide](./docs/setup/)** - Detailed setup instructions
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute

## 🗂️ Project Structure

```
vertex-os/
├── src/
│   ├── app/              # Next.js 15 App Router
│   │   ├── api/          # API routes
│   │   └── (admin)/      # Admin CRM pages
│   ├── lib/
│   │   ├── services/     # Business logic layer
│   │   ├── db/           # Prisma client & utilities
│   │   └── utils/        # Shared utilities
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Version-controlled migrations
│   └── seed.ts           # Seed data
├── tests/                # Test suites
├── docs/                 # Documentation
└── BUILDGUIDELINES       # Master specification
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Check test coverage
pnpm test:coverage
```

## 🔑 Key Concepts

### Snapshot vs Reference
Jobs store **copies** of data (checklists, rates, fees) at booking time, not references. This ensures contracts don't change retroactively.

### Lead → Member Conversion
Two-stage customer creation: Leads for assessment tracking, Members for actual accounts. Clean funnel analytics.

### Config-Driven Logic
Business rules (fees, modifiers, tier thresholds) are stored in the `settings` table. Change pricing without deploying code.

### Subcontractor Compliance
Cleaners control their rates, schedule, and zones. Platform defines scope only. Legally compliant independent contractor relationship.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.3
- **Database:** PostgreSQL 15 (Supabase)
- **ORM:** Prisma 5.0
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **UI:** React 19, shadcn/ui, Tailwind CSS
- **Tables:** TanStack Table
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest, Playwright

## 📊 Database Schema

See [BUILDGUIDELINES](./BUILDGUIDELINES#part-2-database-schema) for complete schema.

Key entities:
- **Lead** → **Member** (customer journey)
- **Cleaner** (independent contractors)
- **Job** (bookings with snapshots)
- **Checklist** (generated from assessments)
- **Transaction** (payments & payouts)
- **Task** (admin-editable library)
- **Setting** (configurable business rules)

## 🔐 Security

- JWT-based authentication (via Supabase Auth)
- Row Level Security (RLS) policies
- Role-based access control (member, cleaner, admin)
- Stripe webhook signature verification
- Rate limiting on all public endpoints
- Input validation with Zod

## 🚢 Deployment

```bash
# Build for production
pnpm build

# Run production build locally
pnpm start

# Deploy to Vercel
vercel --prod
```

See [Deployment Guide](./docs/setup/deployment.md) for details.

## 📈 Monitoring

- **Error Tracking:** Sentry
- **Analytics:** PostHog
- **APM:** Vercel Analytics
- **Logs:** Vercel Logs / Supabase Logs

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow, code standards, and PR process.

## 📝 License

Proprietary - All Rights Reserved

## 🆘 Support

- **Technical Issues:** Create an issue in this repo
- **Security Issues:** Email security@redshirtclub.com
- **Questions:** Check [docs/](./docs/) or ask in team Slack

---

**Built with ❤️ for Red Shirt Club**



