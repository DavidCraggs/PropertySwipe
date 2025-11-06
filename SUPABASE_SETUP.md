# Supabase Setup for Get On Demo

## Why Supabase?
- ✅ Free tier (500MB database, 1GB file storage)
- ✅ Built-in authentication
- ✅ Real-time subscriptions
- ✅ File storage for images
- ✅ PostgreSQL database
- ✅ No Docker required
- ✅ Takes 15 minutes to setup

## Setup Steps

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Sign up (free)
3. Create new project
4. Note your project URL and anon key

### 2. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 3. Create Environment Variables
Create `.env.local`:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Database Schema
Run in Supabase SQL Editor:

```sql
-- Vendor Profiles
CREATE TABLE vendor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  names TEXT NOT NULL,
  property_type TEXT NOT NULL,
  looking_for TEXT NOT NULL,
  preferred_purchase_type TEXT NOT NULL,
  estate_agent_link TEXT,
  property_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyer Profiles
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  situation TEXT NOT NULL,
  names TEXT NOT NULL,
  ages TEXT NOT NULL,
  local_area TEXT NOT NULL,
  buyer_type TEXT NOT NULL,
  purchase_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendor_profiles(id),
  address JSONB NOT NULL,
  price INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  property_type TEXT NOT NULL,
  square_footage INTEGER,
  year_built INTEGER,
  description TEXT NOT NULL,
  epc_rating TEXT NOT NULL,
  tenure TEXT NOT NULL,
  images TEXT[] NOT NULL,
  features TEXT[] NOT NULL,
  listing_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendor_profiles(id),
  buyer_id UUID REFERENCES buyer_profiles(id),
  buyer_profile JSONB,
  messages JSONB[] DEFAULT '{}',
  has_viewing_scheduled BOOLEAN DEFAULT FALSE,
  confirmed_viewing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Public access policies (for demo)
CREATE POLICY "Allow all for demo" ON vendor_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON buyer_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON properties FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON matches FOR ALL USING (true);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Storage policy
CREATE POLICY "Public access for demo" ON storage.objects FOR ALL USING (bucket_id = 'property-images');
```

### 5. Update Code to Use Supabase

Replace `src/hooks/useAppStore.ts` and `src/hooks/useAuthStore.ts` to call Supabase instead of localStorage.

## Deployment

Deploy to Vercel:
```bash
vercel
```

Add environment variables in Vercel dashboard.

## Cost
- **Free tier**: 500MB database, 1GB storage, 2GB bandwidth/month
- **Perfect for demo!**
