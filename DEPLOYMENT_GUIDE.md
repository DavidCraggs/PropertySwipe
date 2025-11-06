# 🚀 PropertySwipe Deployment Guide
## Vercel + Supabase Setup

This guide will help you deploy the multi-role rental platform to Vercel and Supabase.

---

## 📋 Prerequisites

- ✅ Vercel account ([vercel.com](https://vercel.com))
- ✅ Supabase account ([supabase.com](https://supabase.com))
- ✅ Git repository (GitHub, GitLab, or Bitbucket)

---

## Part 1: Supabase Setup (Database)

### Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `PropertySwipe` (or your choice)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### Step 2: Run Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy and paste the contents of `supabase-schema-multirole.sql` (created below)
4. Click **"Run"** or press `Ctrl+Enter`
5. Verify: You should see ✅ "Success. No rows returned" messages

### Step 3: Get Your Supabase Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **"API"** in the left menu
3. Copy these values (you'll need them for Vercel):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)

---

## Part 2: Vercel Deployment

### Step 1: Connect Your Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. **Import your Git repository**:
   - If not connected, click "Connect Git Provider"
   - Authorize Vercel to access your repo
   - Select `PropertySwipe` repository
4. Click **"Import"**

### Step 2: Configure Build Settings

Vercel should auto-detect these settings (verify they match):

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 3: Add Environment Variables

**CRITICAL**: Before deploying, add these environment variables:

1. In the **"Configure Project"** section, find **"Environment Variables"**
2. Add these 2 variables:

**Variable 1:**
```
Name:  VITE_SUPABASE_URL
Value: https://xxxxx.supabase.co  (from Supabase Step 3)
```

**Variable 2:**
```
Name:  VITE_SUPABASE_ANON_KEY
Value: eyJhbGc...  (from Supabase Step 3)
```

**Important**: Make sure both are available to:
- ☑️ Production
- ☑️ Preview
- ☑️ Development

### Step 4: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll see:
   - Building... ⏳
   - Build succeeded ✅
   - Deploying... ⏳
   - Deployment ready! 🎉

4. Click **"Visit"** to see your live app!

---

## Part 3: Verify Deployment

### Test the Platform

1. **Open your Vercel URL** (e.g., `https://propertyswipe.vercel.app`)

2. **Test Renter Onboarding**:
   - Click "I'm looking to rent" → "Get Started"
   - Complete the renter onboarding form
   - You should be able to create a profile ✅

3. **Test Landlord Onboarding**:
   - Open in incognito/new session
   - Click "I'm a landlord" → "Get Started"
   - Complete the landlord onboarding form
   - You should be able to create a profile ✅

4. **Test Agency Onboarding**:
   - Create an agency profile (estate_agent or management_agency)
   - Configure SLA settings
   - You should see the agency dashboard ✅

5. **Check Supabase**:
   - Go to Supabase → **Table Editor**
   - You should see your test profiles in `renter_profiles`, `landlord_profiles`, `agency_profiles`

---

## Part 4: Custom Domain (Optional)

### Add Your Own Domain

1. In Vercel project, go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain (e.g., `propertyswipe.com`)
4. Follow DNS setup instructions:
   - Add A record or CNAME record to your domain DNS
   - Wait for DNS propagation (5-60 minutes)
5. SSL certificate auto-generated ✅

---

## Part 5: Environment Variables (Local Development)

### Update Your Local `.env` File

Copy your Supabase credentials to `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Optional: Add these for email service (Phase 8)
# VITE_EMAIL_PROVIDER=sendgrid
# VITE_SENDGRID_API_KEY=your-key-here
# VITE_FROM_EMAIL=noreply@propertyswipe.com
```

**Never commit `.env` to Git!** (Already in `.gitignore`)

---

## 🎨 Features Now Live

### ✅ Multi-Role Platform
- **Prospective Renters**: Property search & matching
- **Current Renters**: Tenancy management, issue reporting
- **Landlords**: Active tenancy tracking, message center
- **Agencies**: Portfolio management, SLA tracking, issue dashboard

### ✅ SLA System
- Response time commitments
- Compliance rate tracking
- Overdue issue alerts
- Color-coded performance indicators

### ✅ Issue Management
- Priority-based routing (emergency/urgent/routine/low)
- Status tracking (7 states)
- Timeline and resolution tracking
- Tenant satisfaction ratings

### ✅ Email Notifications (Ready for Integration)
- Message notifications
- Issue alerts
- Status updates
- SLA breach warnings

---

## 🔧 Troubleshooting

### Build Failed on Vercel

**Error**: `Module not found` or `Type error`
**Fix**:
```bash
# Test build locally first
npm run build

# If it works locally, check Vercel build logs for specific error
```

### Database Connection Failed

**Error**: `Invalid API key` or `Failed to fetch`
**Fix**:
1. Verify environment variables in Vercel Settings → Environment Variables
2. Check Supabase URL and anon key are correct
3. Ensure Supabase project is active (not paused)

### App Loads But Data Not Saving

**Error**: Data not persisting to Supabase
**Fix**:
1. Go to Supabase → **SQL Editor**
2. Run the schema file again: `supabase-schema-multirole.sql`
3. Check **Table Editor** → Verify tables exist
4. Check browser console for errors

### RLS (Row Level Security) Errors

**Error**: `new row violates row-level security policy`
**Fix**:
The schema includes permissive RLS policies. If you get this error:
1. Go to Supabase → **Authentication** → **Policies**
2. Verify policies are enabled for all tables
3. Or temporarily disable RLS for testing (NOT recommended for production):
   ```sql
   ALTER TABLE renter_profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE landlord_profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE agency_profiles DISABLE ROW LEVEL SECURITY;
   ```

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Free)

1. Go to Vercel project → **Analytics** tab
2. See:
   - Page views
   - Visitors
   - Performance metrics
   - Top pages

### Supabase Monitoring

1. Go to Supabase → **Database** → **Logs**
2. Monitor:
   - Query performance
   - Error logs
   - Connection stats

---

## 🔐 Security Checklist

- ✅ Environment variables not committed to Git
- ✅ Supabase anon key is public (safe for frontend)
- ✅ RLS policies enabled on all tables
- ✅ HTTPS enabled (automatic on Vercel)
- ✅ Database password is strong and saved securely

---

## 🚀 Next Steps

### Recommended Enhancements:

1. **Email Integration** (Phase 8):
   - Sign up for SendGrid/AWS SES/Resend
   - Add API key to Vercel environment variables
   - Update EmailService provider from 'mock' to your choice

2. **Image Upload**:
   - Enable Supabase Storage
   - Update property image uploads to use Storage API
   - Generate signed URLs for images

3. **Authentication**:
   - Enable Supabase Auth (currently using local storage)
   - Add Google/Apple sign-in
   - Implement password reset

4. **Analytics**:
   - Add Google Analytics
   - Track user flows
   - Monitor conversion rates

---

## 📞 Support

**Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
**Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

**Common Issues**:
- Check Vercel deployment logs
- Check browser console (F12)
- Check Supabase SQL logs

---

## ✅ Deployment Complete!

Your multi-role rental platform is now live at:
- **Production**: `https://your-project.vercel.app`
- **Custom Domain**: `https://propertyswipe.com` (if configured)

**Total setup time**: ~15 minutes 🎉
