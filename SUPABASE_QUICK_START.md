# 🚀 Supabase Quick Start Guide

Follow these steps to get your multi-device demo working in **15 minutes**.

---

## Step 1: Create Supabase Project (5 minutes)

1. **Go to** https://supabase.com
2. **Sign up** with GitHub (fastest) or email
3. **Click** "New Project"
4. **Fill in**:
   - Name: `geton-demo`
   - Database Password: (generate strong password - save it!)
   - Region: Choose closest to you
5. **Wait** ~2 minutes for project to initialize

---

## Step 2: Set Up Database (3 minutes)

1. **Click** "SQL Editor" in left sidebar
2. **Click** "New Query"
3. **Open** `supabase-schema.sql` file in this project
4. **Copy** entire contents
5. **Paste** into Supabase SQL editor
6. **Click** "Run" (bottom right)
7. **Verify**: You should see "Success. No rows returned"

---

## Step 3: Create Storage Bucket (2 minutes)

1. **Click** "Storage" in left sidebar
2. **Click** "New Bucket"
3. **Settings**:
   - Name: `property-images`
   - Public bucket: ✅ **CHECK THIS**
4. **Click** "Create bucket"
5. **Click** the bucket name
6. **Click** "Policies" tab
7. **Click** "New Policy" → "For full customization"
8. **Policy name**: `Public Access`
9. **Target roles**: `public`
10. **Policy definition**: SELECT ALL (checkbox at top)
11. **Click** "Review" → "Save policy"

---

## Step 4: Get API Keys (1 minute)

1. **Click** "Settings" (⚙️ icon in left sidebar)
2. **Click** "API" in settings menu
3. **Copy** these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## Step 5: Configure Your App (2 minutes)

1. **Create** file `.env.local` in project root (NOT .env.example)
2. **Paste** this content (replace with YOUR values):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Save** the file
4. **Restart** dev server:
   - Press `Ctrl+C` in terminal
   - Run `npm run dev`

---

## Step 6: Test It! (2 minutes)

### Test on Computer:
1. Open http://localhost:5174
2. Complete vendor onboarding
3. Create a property with uploaded image
4. Verify it appears

### Test Multi-Device:
1. **Deploy to Vercel** (get public URL):
   ```bash
   npm i -g vercel
   vercel
   ```
2. Vercel will ask for environment variables - add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Open URL on your phone**
4. **Verify**: Data syncs between devices!

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Database schema executed successfully
- [ ] Storage bucket `property-images` created and public
- [ ] `.env.local` file created with correct keys
- [ ] Dev server restarted
- [ ] Can create vendor profile
- [ ] Can upload image (gets saved to Supabase)
- [ ] Can create property
- [ ] Data persists across page refreshes
- [ ] Data accessible on different devices (after Vercel deploy)

---

## 🐛 Troubleshooting

### "Supabase not configured" warning
- Check `.env.local` exists in project root
- Check variable names start with `VITE_`
- Restart dev server after creating `.env.local`

### Can't upload images
- Verify storage bucket is **public**
- Check bucket name is exactly `property-images`
- Verify storage policy allows `INSERT` and `SELECT`

### No data showing up
- Open browser DevTools → Console
- Look for red errors
- Check Supabase dashboard → Table Editor to see if data is there

### Still having issues?
- Open Supabase → Logs (left sidebar)
- See what errors are being thrown
- Common issue: RLS policies need to allow public access

---

## 🎉 You're Done!

Your app now:
- ✅ Stores data in cloud database (Supabase)
- ✅ Uploads real images to cloud storage
- ✅ Works across multiple devices
- ✅ Accessible from anywhere via Vercel URL
- ✅ Free tier (500MB DB + 1GB storage)

---

## 📱 Next Steps

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Get your public URL**:
   - Share with anyone: `https://your-app.vercel.app`

3. **Add custom domain** (optional):
   - Go to Vercel dashboard
   - Add your domain
   - Update DNS records

---

## 🔒 Production Considerations

For a real app (not demo), you should:

1. **Enable proper authentication**:
   - Use Supabase Auth
   - Restrict RLS policies to `auth.uid()`

2. **Add proper RLS policies**:
   ```sql
   -- Example: Users can only see their own properties
   CREATE POLICY "Users see own properties"
     ON properties FOR SELECT
     USING (auth.uid() = vendor_id);
   ```

3. **Add image optimization**:
   - Compress images on upload
   - Generate thumbnails
   - Use CDN

4. **Monitor usage**:
   - Watch Supabase dashboard for limits
   - Upgrade if needed ($25/month for more)

---

Need help? Check:
- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
