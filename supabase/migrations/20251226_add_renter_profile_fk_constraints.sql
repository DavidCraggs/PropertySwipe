-- Migration: Add Foreign Key Constraints to renter_profiles
-- Date: 2025-12-26
-- Purpose: Add missing FK constraints to prevent orphaned references
-- Impact: Data integrity improvements

-- =====================================================
-- IMPORTANT: Run cleanup queries BEFORE applying constraints
-- =====================================================
-- Check for orphaned references:
--
-- SELECT id, current_tenancy_id FROM renter_profiles
-- WHERE current_tenancy_id IS NOT NULL
-- AND current_tenancy_id NOT IN (SELECT id FROM matches);
--
-- SELECT id, current_property_id FROM renter_profiles
-- WHERE current_property_id IS NOT NULL
-- AND current_property_id NOT IN (SELECT id FROM properties);
--
-- If orphaned records exist, clean them up:
--
-- UPDATE renter_profiles SET current_tenancy_id = NULL
-- WHERE current_tenancy_id NOT IN (SELECT id FROM matches);
--
-- UPDATE renter_profiles SET current_property_id = NULL
-- WHERE current_property_id NOT IN (SELECT id FROM properties);

-- =====================================================
-- Add Foreign Key Constraints
-- =====================================================

-- FK: current_tenancy_id -> matches(id)
-- ON DELETE SET NULL: If match is deleted, clear the reference
ALTER TABLE public.renter_profiles
DROP CONSTRAINT IF EXISTS renter_profiles_current_tenancy_id_fkey;

ALTER TABLE public.renter_profiles
ADD CONSTRAINT renter_profiles_current_tenancy_id_fkey
FOREIGN KEY (current_tenancy_id)
REFERENCES public.matches(id)
ON DELETE SET NULL;

-- FK: current_property_id -> properties(id)
-- ON DELETE SET NULL: If property is deleted, clear the reference
ALTER TABLE public.renter_profiles
DROP CONSTRAINT IF EXISTS renter_profiles_current_property_id_fkey;

ALTER TABLE public.renter_profiles
ADD CONSTRAINT renter_profiles_current_property_id_fkey
FOREIGN KEY (current_property_id)
REFERENCES public.properties(id)
ON DELETE SET NULL;

-- FK: current_landlord_id -> landlord_profiles(id)
-- ON DELETE SET NULL: If landlord is deleted, clear the reference
ALTER TABLE public.renter_profiles
DROP CONSTRAINT IF EXISTS renter_profiles_current_landlord_id_fkey;

ALTER TABLE public.renter_profiles
ADD CONSTRAINT renter_profiles_current_landlord_id_fkey
FOREIGN KEY (current_landlord_id)
REFERENCES public.landlord_profiles(id)
ON DELETE SET NULL;

-- FK: current_agency_id -> agency_profiles(id)
-- ON DELETE SET NULL: If agency is deleted, clear the reference
ALTER TABLE public.renter_profiles
DROP CONSTRAINT IF EXISTS renter_profiles_current_agency_id_fkey;

ALTER TABLE public.renter_profiles
ADD CONSTRAINT renter_profiles_current_agency_id_fkey
FOREIGN KEY (current_agency_id)
REFERENCES public.agency_profiles(id)
ON DELETE SET NULL;

-- =====================================================
-- Verify Constraints (run manually after migration)
-- =====================================================
-- SELECT
--   conname AS constraint_name,
--   conrelid::regclass AS table_name,
--   confrelid::regclass AS referenced_table
-- FROM pg_constraint
-- WHERE conrelid = 'renter_profiles'::regclass
-- AND contype = 'f';
