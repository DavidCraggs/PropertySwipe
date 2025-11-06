# Vercel Deployment Guide

Your PropertySwipe app is configured for easy deployment to Vercel.

---

## First Time Setup

### 1. Login to Vercel
```bash
vercel login
```
- Opens browser for authentication
- Sign up with GitHub/Email (free)
- Authorize the CLI

### 2. Deploy
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No (first time)
- **Project name?** propertyswipe (or your preferred name)
- **Directory?** ./ (press enter)
- **Override settings?** No (press enter)

### 3. Get Your URL
After deployment completes, you'll get:
- **Preview URL:** `https://propertyswipe-xxxxx.vercel.app` (temporary)
- **Production URL:** `https://propertyswipe.vercel.app` (permanent)

---

## Future Deployments

Every time you make changes:

```bash
# Build locally to check for errors
npm run build

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## Automatic Deployments (Recommended)

### Connect to GitHub:

1. Push your code to GitHub
2. Go to https://vercel.com/dashboard
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

**Benefits:**
- Every git push auto-deploys
- Preview deployments for branches
- Production deployment for main branch
- No manual builds needed

---

## Environment Variables (For Supabase)

If you set up Supabase, add environment variables in Vercel:

### Via Dashboard:
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

### Via CLI:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

Then redeploy:
```bash
vercel --prod
```

---

## Your Deployment Configuration

The app is configured with `vercel.json`:
- ✅ Auto-detects Vite framework
- ✅ Builds from `dist` folder
- ✅ Handles React routing correctly
- ✅ Optimized for production

---

## Custom Domain (Optional)

Want a custom domain like `propertyswipe.com`?

1. Buy domain from any registrar
2. Go to Vercel Dashboard → Your Project → Settings → Domains
3. Add your domain
4. Update DNS records (Vercel provides instructions)
5. SSL certificate auto-generated

---

## Monitoring & Analytics

Vercel provides free:
- **Analytics:** Page views, performance metrics
- **Logs:** Runtime logs for debugging
- **Speed Insights:** Core Web Vitals
- **Deployment History:** Rollback to any version

Access at: https://vercel.com/dashboard

---

## Troubleshooting

### Build Failed
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
# Fix them, then deploy again
vercel
```

### "Command not found: vercel"
```bash
# Reinstall Vercel CLI
npm install -g vercel
```

### Environment variables not working
- Make sure they start with `VITE_`
- Redeploy after adding env vars
- Check Dashboard → Settings → Environment Variables

### 404 on page refresh
- Already handled by `vercel.json`
- If still happening, check the rewrite rules

---

## Cost

- **Free Plan:**
  - Unlimited deployments
  - 100 GB bandwidth/month
  - Custom domains
  - SSL certificates
  - Perfect for demos and small projects

- **Pro Plan ($20/month):**
  - More bandwidth
  - Team features
  - Advanced analytics
  - Only needed for production apps

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `vercel login` | Authenticate with Vercel |
| `vercel` | Deploy to preview |
| `vercel --prod` | Deploy to production |
| `vercel env ls` | List environment variables |
| `vercel logs` | View deployment logs |
| `vercel domains` | Manage custom domains |
| `vercel list` | List all deployments |

---

## What Happens During Deployment

1. ✅ Vercel receives your code
2. ✅ Runs `npm install`
3. ✅ Runs `npm run build`
4. ✅ Uploads `dist` folder to CDN
5. ✅ Generates SSL certificate
6. ✅ Provides public URL
7. ✅ Total time: ~2-3 minutes

---

## After Deployment

Your app will be live at:
```
https://your-project-name.vercel.app
```

**Share this URL to:**
- Test on iPhone (Safari)
- Test on Android (Chrome)
- Test on any desktop browser
- Share with demo participants
- Add to home screen on mobile for app-like experience

---

## Mobile Testing

Once deployed:

### iPhone:
1. Open Safari
2. Go to your Vercel URL
3. Tap Share → "Add to Home Screen"
4. App icon appears on home screen
5. Opens like a native app!

### Android:
1. Open Chrome
2. Go to your Vercel URL
3. Menu → "Add to Home Screen"
4. App icon appears
5. Launches like a native app!

---

## Next Steps After First Deployment

1. ✅ Test the deployed URL on your phone
2. ✅ Verify properties show up
3. ✅ Test vendor creating property
4. ✅ Test buyer seeing properties
5. 🎉 Share the URL with your demo audience!

---

Need to make changes? Just edit code and run `vercel --prod` again!
