# Security Policy & Implementation

## 🔒 Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimum necessary permissions
3. **Fail Securely** - Errors don't expose data
4. **Secure by Default** - Safe defaults, opt-in to features
5. **Audit Everything** - Log security-relevant events

## 🛡️ Authentication & Authorization

### Authentication Strategy

**Supabase Auth** for all user authentication:

```typescript
// Member/Cleaner/Admin login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Logout
await supabase.auth.signOut();
```

**JWT Tokens:**
- Short-lived access tokens (1 hour)
- Refresh tokens (7 days)
- Stored in httpOnly cookies
- CSRF protection enabled

### Authorization Levels

```typescript
enum Role {
  MEMBER = 'member',     // Customers
  CLEANER = 'cleaner',   // Service providers
  ADMIN = 'admin'        // Operations team
}
```

**Role Enforcement:**
```typescript
// Middleware checks
export async function authenticateMember(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const payload = await verifyJWT(token);
  
  if (payload.role !== 'member') {
    throw new UnauthorizedError();
  }
  
  return payload;
}
```

### Row Level Security (RLS)

**Supabase RLS Policies:**

```sql
-- Members can only see their own data
CREATE POLICY "Members view own data"
  ON members FOR SELECT
  USING (auth.uid() = id);

-- Members can only update their own profile
CREATE POLICY "Members update own profile"
  ON members FOR UPDATE
  USING (auth.uid() = id);

-- Cleaners can only see their assigned jobs
CREATE POLICY "Cleaners view assigned jobs"
  ON jobs FOR SELECT
  USING (cleaner_id = auth.uid());

-- Admins see everything
CREATE POLICY "Admins have full access"
  ON members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );
```

## 🔐 Data Protection

### Encryption

**At Rest:**
- Database encrypted (Supabase default: AES-256)
- File storage encrypted (Supabase Storage)
- Environment variables encrypted (Vercel)

**In Transit:**
- HTTPS only (TLS 1.3)
- Strict Transport Security (HSTS) headers
- Certificate pinning for mobile apps

**Application Level:**
```typescript
// Password hashing
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

### Sensitive Data Handling

**PII (Personally Identifiable Information):**
- Email, phone, address, payment details
- Never logged
- Masked in admin UI (except with permission)
- GDPR right to deletion supported

**Secrets:**
- Never committed to git
- Stored in environment variables
- Rotated regularly (90 days)
- Different per environment

## 🚨 Input Validation

### Schema Validation (Zod)

```typescript
import { z } from 'zod';

export const CreateMemberSchema = z.object({
  email: z.string().email().max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  phone: z.string().regex(/^\+1\d{10}$/, 'Invalid US phone number'),
  address: z.string().min(10).max(500),
  zip: z.string().regex(/^\d{5}$/, 'Invalid ZIP code'),
});

// Use in API route
const validatedData = CreateMemberSchema.parse(requestBody);
```

### SQL Injection Prevention

**Prisma handles this automatically:**
```typescript
// ✅ SAFE: Prisma uses parameterized queries
await prisma.member.findMany({
  where: {
    email: userInput  // Safe even if contains SQL
  }
});

// ❌ NEVER DO THIS:
await prisma.$executeRaw(`SELECT * FROM members WHERE email = '${userInput}'`);
// Use instead:
await prisma.$executeRaw`SELECT * FROM members WHERE email = ${userInput}`;
```

### XSS Prevention

**React handles this automatically:**
```tsx
// ✅ SAFE: React escapes by default
<div>{userInput}</div>

// ❌ DANGEROUS: Bypasses escaping
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ If HTML needed, sanitize first
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### CSRF Protection

```typescript
// Next.js built-in protection for API routes
// Checks Origin and Referer headers automatically

// For sensitive actions, add additional token
export async function verifyCSRFToken(request: NextRequest) {
  const token = request.headers.get('X-CSRF-Token');
  const sessionToken = request.cookies.get('csrf_token');
  
  if (token !== sessionToken) {
    throw new ForbiddenError('Invalid CSRF token');
  }
}
```

## 🚦 Rate Limiting

### Implementation

```typescript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function rateLimit(
  identifier: string,
  limit: number,
  window: number // seconds
): Promise<{ success: boolean; remaining: number }> {
  const key = `rate_limit:${identifier}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, window);
  }
  
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}

// Use in API route
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success, remaining } = await rateLimit(ip, 10, 60); // 10 req/min
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: { 'Retry-After': '60' }
      }
    );
  }
  
  // ... handle request
}
```

### Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Public (unauthenticated) | 60 requests | 1 minute |
| Member/Cleaner | 300 requests | 1 minute |
| Admin | 600 requests | 1 minute |
| Auth endpoints (login) | 5 attempts | 15 minutes |
| Payment endpoints | 10 requests | 1 minute |

## 💳 Payment Security

### Stripe Integration

```typescript
// NEVER handle raw card data
// Use Stripe Elements (frontend) → Stripe API → webhook

// ✅ Backend receives token/intent only
const paymentIntent = await stripe.paymentIntents.create({
  amount: job.total_price * 100, // cents
  currency: 'usd',
  customer: member.stripe_customer_id,
  metadata: {
    job_id: job.id,
    member_id: member.id,
  }
});

// Verify webhook signatures
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  await request.text(),
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**PCI Compliance:**
- Never store card numbers
- Never log payment details
- Use Stripe's secure elements
- Regularly review Stripe security guidelines

## 📝 Audit Logging

### What to Log

**Security Events:**
- Authentication attempts (success/failure)
- Authorization failures
- Password changes
- Admin actions
- Data exports
- Payment transactions

**Implementation:**
```typescript
// lib/audit-log.ts
export async function logSecurityEvent(
  event: 'login' | 'logout' | 'auth_failure' | 'admin_action',
  userId: string,
  metadata?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: {
      event,
      user_id: userId,
      ip_address: metadata?.ip,
      user_agent: metadata?.userAgent,
      metadata,
      timestamp: new Date(),
    }
  });
  
  // Also send to monitoring (Sentry, etc.)
  if (event === 'auth_failure') {
    console.warn('Authentication failure', { userId, metadata });
  }
}
```

### Log Retention
- Security logs: 2 years
- Transaction logs: 7 years (financial compliance)
- General logs: 90 days

## 🔍 Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 🐛 Vulnerability Management

### Dependency Scanning

```bash
# Run regularly (weekly)
pnpm audit
pnpm outdated

# Auto-fix low-risk vulnerabilities
pnpm audit fix

# Check for critical vulnerabilities
pnpm audit --audit-level=critical
```

### Security Checklist (Pre-Deploy)

- [ ] All dependencies up to date
- [ ] No known critical vulnerabilities
- [ ] Environment variables configured
- [ ] RLS policies enabled
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] Security headers set
- [ ] Stripe webhooks verified
- [ ] Error messages don't leak data
- [ ] Admin endpoints require auth
- [ ] File uploads validated
- [ ] SQL injection tests pass
- [ ] XSS tests pass
- [ ] CSRF protection enabled

## 🚨 Incident Response

### If Security Issue Detected

1. **Contain:** Disable affected endpoint/feature
2. **Assess:** Determine scope and impact
3. **Notify:** Alert team and affected users if needed
4. **Fix:** Deploy patch
5. **Monitor:** Watch for continued attempts
6. **Document:** Write post-mortem

### Reporting Security Issues

**DO NOT** open a public issue for security vulnerabilities.

Email: **security@redshirtclub.com**

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond within 24 hours.

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Stripe Security](https://stripe.com/docs/security)

## 🔄 Review Schedule

- **Code Review:** Every PR
- **Dependency Audit:** Weekly (automated)
- **Security Policy Review:** Quarterly
- **Penetration Testing:** Annually
- **Compliance Audit:** Annually

---

**Security is everyone's responsibility. When in doubt, ask!**

