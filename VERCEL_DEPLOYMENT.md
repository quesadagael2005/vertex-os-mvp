# 🚀 Vercel Deployment Guide for Vertex OS

## Part 1: Git Setup (One-Time Setup)

### Step 1: Initialize Git Repository

Run these commands in your terminal:

```bash
cd "/Users/gaelquesada/VERTEX OS MVP"

# Initialize git
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit - Vertex OS MVP"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `vertex-os-mvp` (or whatever you want)
3. **Make it PRIVATE** (important - this has your business logic)
4. **DO NOT** initialize with README, .gitignore, or license (we already have those)
5. Click "Create repository"

### Step 3: Connect Local Repo to GitHub

After creating the repo, GitHub will show you commands. Run these:

```bash
# Add your GitHub repo as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/vertex-os-mvp.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**If it asks for authentication:**
- Use a Personal Access Token (not your password)
- Generate one at: https://github.com/settings/tokens
- Give it `repo` scope
- Save the token somewhere safe!

---

## Part 2: Vercel Deployment

### Step 1: Sign Up / Log In to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" (or "Log In")
3. **Choose "Continue with GitHub"** (easiest)
4. Authorize Vercel to access your GitHub

### Step 2: Import Your Project

1. Click "Add New..." → "Project"
2. Find your `vertex-os-mvp` repository
3. Click "Import"

### Step 3: Configure Project Settings

**Framework Preset:** Next.js (should auto-detect)

**Build & Output Settings:**
- Build Command: `pnpm build`
- Output Directory: `.next` (default)
- Install Command: `pnpm install`

**Root Directory:** `./` (leave as is)

### Step 4: Add Environment Variables

Click "Environment Variables" and add these **one by one**:

#### Database (Supabase)
```
DATABASE_URL = your_supabase_pooler_connection_string
DIRECT_URL = your_supabase_direct_connection_string
```

#### JWT
```
JWT_SECRET = your_jwt_secret_from_env_local
JWT_EXPIRES_IN = 7d
```

#### Stripe
```
STRIPE_SECRET_KEY = your_stripe_secret_key
STRIPE_WEBHOOK_SECRET = your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = your_stripe_publishable_key
```

**Where to find these values:**
- Copy from your `.env.local` file
- Make sure to use the **exact same values**

### Step 5: Deploy!

1. Click "Deploy"
2. Wait 2-3 minutes for the build
3. 🎉 Your app will be live at `https://your-project.vercel.app`

---

## Part 3: Enable Claude to Push Changes

### Option A: You Push Manually (Safer)

After Claude makes changes, you run:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel will **auto-deploy** when you push to GitHub!

### Option B: Let Claude Push for You

When you want Claude to push changes, just say:

> "Push these changes to GitHub with message: [your message]"

Claude will run:
```bash
git add .
git commit -m "Your message"
git push
```

**Note:** Claude will ask for `git_write` permission the first time.

---

## Part 4: Post-Deployment Setup

### Check Your Deployment

1. Visit your Vercel URL
2. Try the health check: `https://your-app.vercel.app/api/health`
3. Try the admin: `https://your-app.vercel.app/admin`

### Common Issues

#### Issue 1: Build Fails
- Check the build logs in Vercel dashboard
- Make sure all environment variables are set
- Verify `pnpm` is being used (not `npm`)

#### Issue 2: Database Connection Fails
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Check if Supabase allows connections from Vercel IPs
- Try running: `pnpm prisma generate` in Vercel build settings

#### Issue 3: 500 Errors
- Check Vercel Function Logs (in dashboard)
- Verify all environment variables are set
- Make sure JWT_SECRET is set

### Set Up Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Follow Vercel's DNS instructions

---

## Part 5: Development Workflow

### Daily Workflow with Claude

1. **Work with Claude** - make changes, build features
2. **Test locally** - `pnpm dev` to verify changes
3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Added new feature"
   git push
   ```
4. **Auto-deploy** - Vercel deploys automatically
5. **Verify on production** - check your Vercel URL

### Branch Protection (Advanced)

Later, you can set up:
- Staging environment (for testing)
- Production environment (for live customers)
- Preview deployments (for each PR)

---

## Quick Reference

### Local Development
```bash
pnpm dev          # Start dev server
pnpm build        # Test production build
pnpm db:push      # Push schema changes
pnpm db:seed      # Seed database
```

### Git Commands
```bash
git status        # See changes
git add .         # Stage all changes
git commit -m ""  # Commit with message
git push          # Push to GitHub
git pull          # Pull latest changes
```

### Vercel CLI (Optional)
```bash
npm i -g vercel   # Install Vercel CLI
vercel            # Deploy from terminal
vercel --prod     # Deploy to production
vercel logs       # View logs
```

---

## Environment Variables Checklist

Before deploying, make sure you have all these in Vercel:

- [ ] `DATABASE_URL`
- [ ] `DIRECT_URL`
- [ ] `JWT_SECRET`
- [ ] `JWT_EXPIRES_IN`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## 🎉 You're All Set!

After following these steps:
- ✅ Your code is backed up on GitHub
- ✅ Your app is live on Vercel
- ✅ Changes auto-deploy when you push
- ✅ Claude can push changes for you (if you choose)

**Your Vercel dashboard:** https://vercel.com/dashboard

**Need help?** Just ask Claude!


