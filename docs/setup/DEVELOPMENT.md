# Development Setup Guide

This guide will get you from zero to running VERTEX OS locally.

## Prerequisites

Install these on your machine:

- **Node.js 20+**: [Download](https://nodejs.org/)
- **pnpm 8+**: `npm install -g pnpm`
- **Git**: [Download](https://git-scm.com/)
- **VS Code** (recommended): [Download](https://code.visualstudio.com/)

## Step 1: Clone Repository

```bash
git clone <repository-url>
cd vertex-os
```

## Step 2: Install Dependencies

```bash
pnpm install
```

This will:
- Install all npm packages
- Run `prisma generate` automatically (postinstall hook)
- Setup Husky git hooks

## Step 3: Setup Supabase

### Option A: Use Existing Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Get your credentials from **Settings → API**:
   - Project URL
   - Anon key
   - Service role key
4. Get database URL from **Settings → Database**:
   - Connection string (for Prisma)

### Option B: Local Supabase (Advanced)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize local Supabase
supabase init

# Start local services
supabase start
```

## Step 4: Configure Environment Variables

```bash
# Copy template
cp env.example.txt .env.local

# Edit .env.local with your values
code .env.local
```

**Minimum required for development:**
```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET="your-generated-secret-here"

# Stripe (test mode)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Skip external services in dev
SKIP_EMAILS="true"
SKIP_SMS="true"
```

## Step 5: Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations (creates all tables)
pnpm db:migrate

# Seed with test data
pnpm db:seed
```

**Verify database setup:**
```bash
# Open Prisma Studio
pnpm db:studio
```

You should see tables populated with:
- Settings (pricing, fees, modifiers)
- Tasks (kitchen, bathroom, etc.)
- Zones (example service areas)
- Test members, cleaners, jobs

## Step 6: Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 7: Verify Setup

### Check API Health
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

### Run Tests
```bash
# Unit tests
pnpm test

# Type check
pnpm type-check

# Linting
pnpm lint
```

All should pass ✅

## Common Development Tasks

### Run Database Migrations
```bash
# Create new migration
pnpm prisma migrate dev --name add_new_feature

# Apply migrations
pnpm db:migrate

# Reset database (⚠️ deletes all data)
pnpm db:reset
```

### Format Code
```bash
# Check formatting
pnpm format:check

# Auto-fix formatting
pnpm format
```

### Debug API Routes

**VS Code Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    }
  ]
}
```

Set breakpoints in API routes, press F5 to start debugging.

### View Database
```bash
# Prisma Studio (visual database browser)
pnpm db:studio
```

### Test Stripe Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## VS Code Recommended Extensions

Install these for best experience:

- **Prisma** (`Prisma.prisma`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **GitLens** (`eamodio.gitlens`)

## Troubleshooting

### "Prisma Client not generated"
```bash
pnpm prisma generate
```

### "Database connection failed"
- Verify `DATABASE_URL` in `.env.local`
- Check Supabase project is active
- Confirm your IP is allowed in Supabase network settings

### "Module not found" errors
```bash
rm -rf node_modules .next
pnpm install
```

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### Tests failing
```bash
# Ensure test database is set up
createdb vertex_test
pnpm prisma migrate deploy

# Run tests with verbose output
pnpm test --reporter=verbose
```

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** (write code, tests)

3. **Run quality checks**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

4. **Commit** (Husky will run pre-commit hooks)
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for full workflow details.

## Next Steps

- Read [BUILDGUIDELINES](../../BUILDGUIDELINES) for system architecture
- Explore [API Documentation](../api/)
- Check [Architecture Decision Records](../adr/)
- Review [Security Policy](../SECURITY.md)

## Need Help?

- **Technical issues**: Create an issue in GitHub
- **Quick questions**: Team Slack #vertex-os
- **Setup problems**: Ask in #dev-help

---

**Happy coding! 🚀**




