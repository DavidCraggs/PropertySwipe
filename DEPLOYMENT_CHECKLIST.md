# ✅ PropertySwipe Deployment Checklist

Use this checklist to ensure everything is set up correctly.

---

## 🗄️ Supabase Setup

- [ ] **Create Supabase Project**
  - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
  - Click "New Project"
  - Name: PropertySwipe
  - Save database password securely

- [ ] **Run Database Schema**
  - Open SQL Editor in Supabase
  - Copy contents of `supabase-schema-multirole.sql`
  - Run the query
  - Verify success message appears

- [ ] **Get API Credentials**
  - Go to Project Settings → API
  - Copy Project URL: `https://xxxxx.supabase.co`
  - Copy anon public key: `eyJhbGc...`

---

## 🚀 Vercel Deployment

- [ ] **Connect Repository**
  - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
  - Click "Add New" → "Project"
  - Import PropertySwipe repository
  - Authorize Git provider if needed

- [ ] **Configure Build Settings**
  - Verify Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

- [ ] **Add Environment Variables**
  ```
  VITE_SUPABASE_URL = https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY = eyJhbGc...
  ```
  - Check: Production ✓
  - Check: Preview ✓
  - Check: Development ✓

- [ ] **Deploy**
  - Click "Deploy"
  - Wait for build to complete
  - Get deployment URL

---

## 🧪 Testing

- [ ] **Test Renter Flow**
  - Visit deployment URL
  - Click "I'm looking to rent"
  - Complete onboarding
  - Verify profile created in Supabase

- [ ] **Test Landlord Flow**
  - Open incognito/new browser
  - Click "I'm a landlord"
  - Complete onboarding
  - Verify profile created in Supabase

- [ ] **Test Agency Flow**
  - Create agency profile
  - Configure SLA settings
  - Verify dashboard loads

- [ ] **Check Database**
  - Go to Supabase → Table Editor
  - Verify data in:
    - renter_profiles ✓
    - landlord_profiles ✓
    - agency_profiles ✓

---

## 🔧 Local Development

- [ ] **Update .env File**
  ```env
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGc...
  ```

- [ ] **Test Locally**
  ```bash
  npm install
  npm run dev
  ```
  - Open http://localhost:5173
  - Verify connection to Supabase

---

## 📧 Optional: Email Setup

- [ ] **Choose Email Provider**
  - SendGrid (recommended)
  - AWS SES
  - Resend

- [ ] **Get API Key**
  - Sign up for provider
  - Create API key
  - Verify sender domain

- [ ] **Add to Vercel**
  ```
  VITE_EMAIL_PROVIDER = sendgrid
  VITE_SENDGRID_API_KEY = SG.xxxxx
  VITE_FROM_EMAIL = noreply@propertyswipe.com
  ```

- [ ] **Update EmailService**
  - Edit `src/services/EmailService.ts`
  - Change provider from 'mock' to your choice
  - Test email sending

---

## 🌐 Custom Domain (Optional)

- [ ] **Add Domain to Vercel**
  - Settings → Domains
  - Add domain name
  - Follow DNS instructions

- [ ] **Configure DNS**
  - Add A or CNAME record
  - Wait for propagation (5-60 min)

- [ ] **Verify SSL**
  - SSL certificate auto-generated
  - Check HTTPS works

---

## 📊 Monitoring

- [ ] **Enable Vercel Analytics**
  - Go to Analytics tab
  - Turn on Web Analytics (free)

- [ ] **Check Supabase Logs**
  - Database → Logs
  - Monitor errors
  - Check query performance

---

## 🔐 Security

- [ ] **.env not in Git**
  - Verify .gitignore includes .env
  - Never commit secrets

- [ ] **RLS Policies Active**
  - Supabase → Authentication → Policies
  - All tables have policies enabled

- [ ] **Environment Variables Secure**
  - Only in Vercel dashboard
  - Not in code

---

## ✅ Final Checks

- [ ] **Production URL works**: ________________
- [ ] **Data persists to Supabase**: Yes / No
- [ ] **All user flows tested**: Yes / No
- [ ] **Build succeeds**: Yes / No
- [ ] **No console errors**: Yes / No

---

## 🎉 Done!

**Deployment URL**: ________________________________

**Time to complete**: ~15 minutes

**Next steps**:
1. Share URL with test users
2. Monitor analytics
3. Set up email integration
4. Configure custom domain
