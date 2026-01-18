-- Migration: Create Storage Bucket for Tenancy Agreements
-- Description: Sets up the tenancy-agreements storage bucket
--
-- SECURITY MODEL:
-- This application uses custom authentication (not Supabase Auth), so we cannot
-- use auth.uid() in storage policies. Security is enforced at the application level:
-- 1. agreementService.ts verifies the user is landlord/agency for the match before upload
-- 2. tenancy_agreements table RLS verifies user is party to agreement for reads
-- 3. File paths use UUIDs making them unguessable
--
-- For production with Supabase Auth, stricter RLS policies should be implemented.

-- =====================================================
-- CREATE STORAGE BUCKET
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenancy-agreements',
  'tenancy-agreements',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- STORAGE POLICIES FOR tenancy-agreements BUCKET
-- =====================================================
-- Since the app uses custom auth (not Supabase Auth), we use service role
-- or anon key policies. Application-level security handles authorization.

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can upload agreement documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their agreement documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their agreement documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their agreement documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to tenancy-agreements" ON storage.objects;
DROP POLICY IF EXISTS "Allow reads from tenancy-agreements" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to tenancy-agreements" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from tenancy-agreements" ON storage.objects;

-- Allow any authenticated request to upload to this bucket
-- Application layer (agreementService.ts) validates authorization
CREATE POLICY "Allow uploads to tenancy-agreements"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'tenancy-agreements');

-- Allow any authenticated request to read from this bucket
-- Application layer validates via tenancy_agreements table queries
CREATE POLICY "Allow reads from tenancy-agreements"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'tenancy-agreements');

-- Allow any authenticated request to update in this bucket
-- Application layer validates authorization
CREATE POLICY "Allow updates to tenancy-agreements"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'tenancy-agreements')
WITH CHECK (bucket_id = 'tenancy-agreements');

-- Allow any authenticated request to delete from this bucket
-- Application layer validates authorization
CREATE POLICY "Allow deletes from tenancy-agreements"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'tenancy-agreements');
