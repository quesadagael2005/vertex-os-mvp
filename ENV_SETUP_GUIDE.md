# 🔐 Environment Variables Setup Guide

## Step-by-Step: Create Your .env.local File

### 1. Create the File
```bash
cp .env.example .env.local
```

### 2. Fill in the Required Values

Open `.env.local` in your editor and fill in these values:

---

## 📋 REQUIRED VALUES (Must Fill These)

### A. DATABASE URLs (from Supabase)

**Where to find:**
1. Go to https://app.supabase.com
2. Open your project
3. Click Settings (gear icon) → Database
4. Find "Connection string" section
5. Select **"URI"** mode (not Session/Transaction)
6. Click "Copy"

**What to paste:**
```env
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**Real example (yours will look similar):**
```env
DATABASE_URL="postgresql://postgres.abcdefgh12345678:MySecurePass123!@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.abcdefgh12345678:MySecurePass123!@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**Important:** 
- Use the SAME URL for both DATABASE_URL and DIRECT_URL
- Make sure it includes your password
- The format is: `postgresql://postgres.PROJECT_REF:PASSWORD@HOST:5432/postgres`

---

### B. SUPABASE Credentials (from Supabase)

**Where to find:**
1. Go to https://app.supabase.com
2. Open your project
3. Click Settings → API
4. Copy the values

**What to paste:**
```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI..."
```

**Real example:**
```env
NEXT_PUBLIC_SUPABASE_URL="https://abcdefgh12345678.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoMTIzNDU2NzgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjM0NTY3OCwiZXhwIjoxOTI3OTIxNjc4fQ.abcdefghijklmnopqrstuvwxyz123456"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoMTIzNDU2NzgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjEyMzQ1Njc4LCJleHAiOjE5Mjc5MjE2Nzh9.zyxwvutsrqponmlkjihgfedcba987654"
```

**Note:** 
- The keys are LONG (100+ characters)
- They start with `eyJ`
- The anon key is safe to expose (used in frontend)
- The service role key is SECRET (never expose)

---

### C. JWT SECRET (generate yourself)

**How to generate:**

**Option 1 - Terminal (recommended):**
```bash
openssl rand -base64 32
```

**Option 2 - Online generator:**
Visit: https://generate-secret.vercel.app/32

**Option 3 - Make up a random string:**
At least 32 characters, mix of letters/numbers/symbols

**What to paste:**
```env
JWT_SECRET="xK9mP2vQ8wE5tR7yU1iO3pA6sD4fG0hJ2kL5zX8cV9bN4m"
JWT_EXPIRES_IN="7d"
```

**Real example:**
```env
JWT_SECRET="8xK3mP9vQ2wE5tR7yU1iO4pA6sD3fG0hJ8kL5zX7cV9bN2m"
JWT_EXPIRES_IN="7d"
```

---

### D. STRIPE Keys (from Stripe Dashboard)

**Where to find:**
1. Go to https://dashboard.stripe.com
2. **Toggle to TEST MODE** (top right switch)
3. Click Developers → API Keys
4. Copy both keys

**What to paste:**
```env
STRIPE_SECRET_KEY="sk_test_YOUR_KEY_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
```

**Format (use your actual keys from Stripe dashboard):**
```env
STRIPE_SECRET_KEY="sk_test_YOUR_LONG_SECRET_KEY_FROM_STRIPE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY_FROM_STRIPE"
```

**Important:**
- Use TEST MODE keys (start with `sk_test_` and `pk_test_`)
- Never use live keys in development
- The secret key is SECRET (never expose)
- The publishable key is safe to expose (used in frontend)

---

### E. Application Settings (copy as-is)

```env
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

---

### F. Development Mode (copy as-is)

```env
SKIP_EMAILS="true"
SKIP_SMS="true"
DEBUG="false"
```

---

## 📝 COMPLETE .env.local FILE TEMPLATE

Here's what your complete `.env.local` should look like:

```env
# =============================================================================
# DATABASE
# =============================================================================
DATABASE_URL="postgresql://postgres.YOUR_PROJECT:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.YOUR_PROJECT:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# =============================================================================
# SUPABASE
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M..."

# =============================================================================
# JWT
# =============================================================================
JWT_SECRET="YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS_LONG"
JWT_EXPIRES_IN="7d"

# =============================================================================
# STRIPE (TEST MODE)
# =============================================================================
STRIPE_SECRET_KEY="sk_test_YOUR_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY"

# Optional (can skip for now)
STRIPE_WEBHOOK_SECRET=""
STRIPE_CONNECT_WEBHOOK_SECRET=""
STRIPE_ELITE_PRICE_ID=""
STRIPE_CERTIFICATION_PRICE_ID=""

# =============================================================================
# APPLICATION
# =============================================================================
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# =============================================================================
# DEVELOPMENT
# =============================================================================
SKIP_EMAILS="true"
SKIP_SMS="true"
DEBUG="false"

# =============================================================================
# OPTIONAL (add later when needed)
# =============================================================================
# SENDGRID_API_KEY=""
# TWILIO_ACCOUNT_SID=""
# SENTRY_DSN=""
```

---

## ✅ Verification Checklist

After creating `.env.local`, verify:

- [ ] File is named exactly `.env.local` (not `.env.local.txt`)
- [ ] File is in the root of your project (same level as `package.json`)
- [ ] All 4 Supabase values are filled in
- [ ] Both DATABASE URLs are filled in (and identical)
- [ ] JWT_SECRET is at least 32 characters
- [ ] Both Stripe keys start with `sk_test_` and `pk_test_`
- [ ] No extra spaces or quotes around values
- [ ] File is NOT committed to git (should be in .gitignore)

---

## 🚨 Common Mistakes

### ❌ Wrong:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
```
**Problem:** Using localhost instead of Supabase URL

### ❌ Wrong:
```env
DATABASE_URL="postgresql://postgres:password@db.abcdefgh.supabase.co:5432/postgres
```
**Problem:** Missing closing quote

### ❌ Wrong:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
```
**Problem:** Missing quotes around URL

### ❌ Wrong:
```env
STRIPE_SECRET_KEY="sk_live_..."
```
**Problem:** Using LIVE key instead of TEST key

### ✅ Correct:
```env
DATABASE_URL="postgresql://postgres.abcdefgh:MyPass123@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://abcdefgh.supabase.co"
STRIPE_SECRET_KEY="sk_test_51AbC..."
```

---

## 🔍 Test Your Setup

After creating `.env.local`, run:

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma client (tests database connection)
pnpm db:generate

# If this succeeds, your DATABASE_URL is correct! ✅
```

If you get an error, check:
1. Is your Supabase project running?
2. Is the DATABASE_URL copied correctly?
3. Does it include your password?
4. Are there any extra spaces?

---

## 💡 Pro Tips

1. **Keep .env.example updated** - But never put real credentials there
2. **Use different passwords** - Don't reuse your Supabase password
3. **Rotate secrets regularly** - Change JWT_SECRET every few months
4. **Never commit .env.local** - It's in .gitignore for a reason
5. **Backup your credentials** - Save them in a password manager

---

## 🆘 Still Having Trouble?

**If DATABASE_URL doesn't work:**
- Make sure Supabase project is fully provisioned (wait 2-3 minutes)
- Try the "Transaction" or "Session" connection string instead
- Check if your IP is allowed (Supabase → Settings → Database → Connection Pooling)

**If Supabase keys don't work:**
- Make sure you're copying from the correct project
- Refresh the API page and copy again
- Check for extra spaces at the beginning/end

**If Stripe keys don't work:**
- Confirm you're in TEST MODE (toggle in top right)
- Make sure you copied both keys
- Try generating new keys (Developers → API Keys → Create secret key)

---

**Ready to test? Run: `pnpm db:generate`** 🚀

