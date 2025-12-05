# Environment Setup Guide

## Required Environment Variables

The PropertySwipe application requires Supabase credentials to function.

### For Development (Vite)
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Getting Your Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Settings → API
4. Copy your:
   - **Project URL** (for `VITE_SUPABASE_URL`)
   - **Anon/Public Key** (for `VITE_SUPABASE_ANON_KEY`)

### Installation Steps

Since the app is currently running in development mode, your credentials are already configured somewhere. You need to:

**Option 1: Check Browser DevTools**
```javascript
// Open DevTools Console and run:
console.log({
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY
});
```

**Option 2: Create .env file manually**
1. Create a file named `.env` in `C:\Users\david\PropertySwipe\`
2. Add your Supabase credentials (format above)
3. Restart the dev server

### For Seed Scripts

After creating the `.env` file, you also need to install `dotenv`:

```bash
npm install dotenv
```

Then you can run the seed script:
```bash
npm run seed:data
```

### Security Notes

- ✅ `.env` is already in `.gitignore`
- ✅ Never commit actual credentials to Git
- ✅ Use `.env.example` as a template for team members
