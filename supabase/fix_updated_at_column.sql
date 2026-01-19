-- Quick fix: Add updated_at column to landlord_profiles
-- Run this directly in Supabase SQL Editor if you get the error:
-- 'record "new" has no field "updated_at"'

-- Add updated_at column if it doesn't exist
ALTER TABLE landlord_profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'landlord_profiles'
AND column_name = 'updated_at';
