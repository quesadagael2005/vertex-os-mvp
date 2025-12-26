# Contributing to VERTEX OS

Thank you for contributing to VERTEX OS! This document outlines our development workflow and standards.

## 🎯 Development Workflow

### 1. Branch Strategy

We use **Git Flow**:

```
main            → Production-ready code
├── develop     → Integration branch
    ├── feature/xxx  → New features
    ├── fix/xxx      → Bug fixes
    └── hotfix/xxx   → Emergency production fixes
```

**Branch Naming Convention:**
```
feature/lead-conversion-flow
fix/pricing-calculation-bug
hotfix/stripe-webhook-timeout
refactor/service-layer-optimization
docs/api-endpoint-documentation
```

### 2. Getting Started

```bash
# 1. Create a feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 2. Make your changes

# 3. Run quality checks
pnpm lint
pnpm type-check
pnpm test

# 4. Commit your changes (see commit conventions below)
git add .
git commit -m "feat: add lead conversion tracking"

# 5. Push and create PR
git push origin feature/your-feature-name
```

### 3. Commit Convention

We follow **Conventional Commits**:

```
type(scope): subject

[optional body]

[optional footer]
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting, no logic change)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks
- `perf:` Performance improvements

**Examples:**
```
feat(booking): add cleaner availability check
fix(pricing): correct Elite tier fee calculation
docs(api): update member endpoints documentation
refactor(services): extract effort calculation logic
test(matching): add unit tests for scoring algorithm
```

### 4. Pull Request Process

**Before Creating PR:**
- [ ] All tests pass (`pnpm test`)
- [ ] No linting errors (`pnpm lint`)
- [ ] No type errors (`pnpm type-check`)
- [ ] Code is formatted (`pnpm format`)
- [ ] New tests added for new features
- [ ] Documentation updated if needed

**PR Title Format:**
```
feat: Add lead conversion funnel analytics
fix: Resolve pricing rounding error for Elite members
```

**PR Description Template:**
```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Closes #123

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Database migrations included (if applicable)
```

**Review Process:**
1. At least **1 approval** required
2. All CI checks must pass
3. No merge conflicts
4. Squash and merge to develop

## 🧪 Testing Standards

### Test Coverage Requirements
- **Minimum:** 80% overall coverage
- **Services:** 90% coverage (business logic is critical)
- **API Routes:** 85% coverage
- **Utils:** 95% coverage

### Test Structure
```typescript
// tests/services/pricing.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PricingService } from '@/services/pricing';

describe('PricingService', () => {
  describe('calculatePrice', () => {
    it('should calculate correct price for Free tier', () => {
      // Arrange
      const service = new PricingService(mockSettings);
      
      // Act
      const result = service.calculatePrice(2.5, 30, 'free');
      
      // Assert
      expect(result.totalPrice).toBe(88.50);
      expect(result.platformFeePercent).toBe(0.18);
    });

    it('should apply Elite discount correctly', () => {
      // ...
    });
  });
});
```

### E2E Tests
```typescript
// tests/e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test('member can book a cleaning job', async ({ page }) => {
  // Login as member
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to booking
  await page.goto('/booking');
  
  // Select cleaner and time slot
  await page.click('[data-testid="cleaner-1"]');
  await page.click('[data-testid="slot-10am"]');
  
  // Complete booking
  await page.click('button:has-text("Book Now")');
  
  // Verify success
  await expect(page.locator('text=Booking Confirmed')).toBeVisible();
});
```

## 📝 Code Standards

### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── members/       # Group by resource
│   │       └── route.ts   # RESTful endpoints
│   └── (admin)/           # Admin CRM pages
├── lib/
│   ├── services/          # Business logic
│   │   ├── pricing.ts     # PricingService
│   │   └── matching.ts    # MatchingService
│   ├── db/                # Database utilities
│   │   ├── client.ts      # Prisma client singleton
│   │   └── migrations/    # Custom migrations
│   └── utils/             # Shared utilities
│       ├── validation.ts  # Zod schemas
│       └── helpers.ts     # Pure functions
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── features/         # Feature-specific components
└── types/                # TypeScript types
    ├── api.ts            # API request/response types
    └── models.ts         # Domain models
```

### TypeScript Guidelines

**Always use explicit types:**
```typescript
// ✅ Good
function calculateTotal(price: number, tax: number): number {
  return price + tax;
}

// ❌ Bad
function calculateTotal(price, tax) {
  return price + tax;
}
```

**Use Zod for runtime validation:**
```typescript
import { z } from 'zod';

export const CreateMemberSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+1\d{10}$/),
  address: z.string().min(10),
});

export type CreateMemberInput = z.infer<typeof CreateMemberSchema>;
```

**Service Layer Pattern:**
```typescript
// services/pricing.ts
export class PricingService {
  constructor(
    private settings: SettingsService
  ) {}

  async calculatePrice(
    effortHours: number,
    cleanerRate: number,
    memberTier: 'free' | 'elite'
  ): Promise<PriceBreakdown> {
    const fee = await this.settings.get(
      memberTier === 'elite' ? 'platform_fee_elite' : 'platform_fee_free'
    );
    
    return {
      subtotal: effortHours * cleanerRate,
      platformFee: effortHours * cleanerRate * fee,
      // ...
    };
  }
}
```

### API Route Pattern
```typescript
// app/api/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateMember } from '@/lib/auth';

const CreateMemberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const data = CreateMemberSchema.parse(body);
    
    // 2. Business logic
    const member = await memberService.create(data);
    
    // 3. Return response
    return NextResponse.json({
      success: true,
      data: member,
      error: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 });
    }
    
    // Log error (Sentry)
    console.error(error);
    
    return NextResponse.json({
      success: false,
      data: null,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
```

## 🗄️ Database Guidelines

### Prisma Schema Conventions
```prisma
model Member {
  id                  String   @id @default(uuid())
  email               String   @unique
  passwordHash        String   @map("password_hash")
  tier                Tier     @default(FREE)
  
  // Relations
  checklist           Checklist?
  jobs                Job[]
  
  // Timestamps
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  @@map("members")
}
```

### Migrations
```bash
# Create a migration
pnpm prisma migrate dev --name add_member_tier

# Apply migrations in production
pnpm prisma migrate deploy

# Reset database (development only)
pnpm db:reset
```

### Seeding
Update `prisma/seed.ts` for test data:
```typescript
async function main() {
  // Seed settings
  await prisma.setting.createMany({
    data: settingsData,
    skipDuplicates: true,
  });
  
  // Seed tasks
  await prisma.task.createMany({
    data: tasksData,
    skipDuplicates: true,
  });
}
```

## 🚀 Deployment

### Pre-Deployment Checklist
- [ ] All tests pass in CI
- [ ] Database migrations reviewed
- [ ] Environment variables updated in Vercel
- [ ] Stripe webhooks configured
- [ ] Error tracking (Sentry) configured

### Deployment Process
```bash
# 1. Merge to develop (staging deployment)
# → Auto-deploys to staging.vertexos.com

# 2. Create release PR: develop → main
# → Review and approve

# 3. Merge to main (production deployment)
# → Auto-deploys to vertexos.com
# → Run production migrations
# → Monitor error rates
```

## 📊 Performance Standards

- **API Response Times:**
  - Simple queries: <100ms (p95)
  - Complex queries: <500ms (p95)
  - Heavy operations: <2s (p95)

- **Database Queries:**
  - Use indexes for all WHERE clauses
  - Paginate large result sets (max 100 per page)
  - Use `select` to fetch only needed fields
  - Batch operations when possible

## 🔒 Security Guidelines

- **Never commit secrets** (use .env.local)
- **Validate all user input** (Zod schemas)
- **Sanitize database queries** (Prisma handles this)
- **Use parameterized queries** (never string concatenation)
- **Implement rate limiting** on public endpoints
- **Verify Stripe webhook signatures**
- **Hash passwords** with bcrypt (never store plain text)

## 📚 Documentation

Update documentation for:
- New API endpoints → `docs/api/`
- Architecture changes → `docs/adr/`
- New features → `README.md`
- Breaking changes → `CHANGELOG.md`

## ❓ Questions?

- **Technical issues:** Create an issue
- **Quick questions:** Team Slack #vertex-os
- **Urgent matters:** @mention tech lead

---

**Happy coding! 🚀**



