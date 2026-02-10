-- =====================================================
-- UNIFIED PROFILES TABLE
-- Bridges auth.users (Supabase Auth) to role-specific tables
-- Part of Authentication & Onboarding PRD implementation
-- =====================================================
--
-- MANUAL SUPABASE DASHBOARD CONFIGURATION REQUIRED:
--
-- 1. Authentication > Providers > Google:
--    - Enable Google provider
--    - Add Client ID + Client Secret from Google Cloud Console
--    - Required scopes: email, profile (defaults)
--
-- 2. Authentication > Providers > Apple:
--    - Enable Apple provider
--    - Add Service ID, Team ID, Key ID, and Private Key from Apple Developer Console
--
-- 3. Authentication > URL Configuration:
--    - Site URL: http://localhost:5173 (dev) or https://yourdomain.com (prod)
--    - Redirect URLs: http://localhost:5173/auth/callback, https://yourdomain.com/auth/callback
--
-- 4. Authentication > Email Templates:
--    - Customize Magic Link template with LetRight branding
--    - From: hello@letright.co.uk
--    - Subject: "Your LetRight login link"
--
-- 5. Authentication > Settings:
--    - Enable automatic account linking
--    - Refresh token expiry: 30+ days
--    - Magic link expiry: 10 minutes
-- =====================================================

-- Unified profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('landlord', 'renter', 'estate_agent', 'management_agency') OR role IS NULL),
    display_name TEXT,
    avatar_url TEXT,

    -- Links to existing role-specific tables (only one populated per user)
    landlord_profile_id UUID REFERENCES public.landlord_profiles(id) ON DELETE SET NULL,
    renter_profile_id UUID REFERENCES public.renter_profiles(id) ON DELETE SET NULL,
    agency_profile_id UUID REFERENCES public.agency_profiles(id) ON DELETE SET NULL,

    -- Auth metadata
    auth_provider TEXT NOT NULL DEFAULT 'email',
    onboarding_complete BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_landlord_id ON public.profiles(landlord_profile_id) WHERE landlord_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_renter_id ON public.profiles(renter_profile_id) WHERE renter_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON public.profiles(agency_profile_id) WHERE agency_profile_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (for trigger/client-side creation)
CREATE POLICY "Users can create own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url, auth_provider)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- AUTO-UPDATE updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();
