-- Migration: Add Performance Indexes
-- Date: 2025-12-26
-- Purpose: Add missing indexes for frequently searched/filtered fields
-- Impact: Improved query performance for email lookups, property searches, and dashboard queries

-- =====================================================
-- Email Indexes (for authentication lookups)
-- =====================================================

-- Landlord email lookup
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_email
ON public.landlord_profiles(email);

-- Renter email lookup
CREATE INDEX IF NOT EXISTS idx_renter_profiles_email
ON public.renter_profiles(email);

-- Agency email lookup
CREATE INDEX IF NOT EXISTS idx_agency_profiles_email
ON public.agency_profiles(email);

-- =====================================================
-- Property Search Indexes
-- =====================================================

-- Rent price range filtering (common in property search)
CREATE INDEX IF NOT EXISTS idx_properties_rent_pcm
ON public.properties(rent_pcm);

-- City-based property search
CREATE INDEX IF NOT EXISTS idx_properties_city
ON public.properties(city);

-- Compound index for available properties by city and rent
CREATE INDEX IF NOT EXISTS idx_properties_available_city_rent
ON public.properties(is_available, city, rent_pcm)
WHERE is_available = true;

-- Bedrooms filter (common search criteria)
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms
ON public.properties(bedrooms);

-- Property type filter
CREATE INDEX IF NOT EXISTS idx_properties_type
ON public.properties(property_type);

-- =====================================================
-- Match Query Indexes
-- =====================================================

-- Matches by renter for dashboard (includes tenancy status for filtering)
CREATE INDEX IF NOT EXISTS idx_matches_renter_status
ON public.matches(renter_id, tenancy_status);

-- Matches by landlord for dashboard
CREATE INDEX IF NOT EXISTS idx_matches_landlord_status
ON public.matches(landlord_id, tenancy_status);

-- Matches by property (for property-specific queries)
CREATE INDEX IF NOT EXISTS idx_matches_property
ON public.matches(property_id);

-- =====================================================
-- Issue Query Indexes
-- =====================================================

-- Active issues by agency (for agency dashboard SLA tracking)
CREATE INDEX IF NOT EXISTS idx_issues_agency_active
ON public.issues(agency_id, status)
WHERE status NOT IN ('resolved', 'closed');

-- Issues by match (for tenancy issue lists)
CREATE INDEX IF NOT EXISTS idx_issues_match
ON public.issues(match_id);

-- Issues by property (for property issue history)
CREATE INDEX IF NOT EXISTS idx_issues_property
ON public.issues(property_id);

-- =====================================================
-- Conversation Query Indexes
-- =====================================================

-- Conversations by match (for loading conversation threads)
CREATE INDEX IF NOT EXISTS idx_conversations_match
ON public.conversations(match_id);

-- =====================================================
-- Renter Invite Indexes
-- =====================================================

-- Invite code lookup (for validation)
CREATE INDEX IF NOT EXISTS idx_renter_invites_code
ON public.renter_invites(code);

-- Pending invites by property (for landlord dashboard)
CREATE INDEX IF NOT EXISTS idx_renter_invites_property_pending
ON public.renter_invites(property_id, status)
WHERE status = 'pending';

-- =====================================================
-- Agency Property Link Indexes
-- =====================================================

-- Active links by agency (for agency dashboard)
CREATE INDEX IF NOT EXISTS idx_agency_property_links_agency_active
ON public.agency_property_links(agency_id, is_active)
WHERE is_active = true;

-- Active links by property
CREATE INDEX IF NOT EXISTS idx_agency_property_links_property_active
ON public.agency_property_links(property_id, is_active)
WHERE is_active = true;

-- =====================================================
-- Notes
-- =====================================================
-- Run ANALYZE after applying these indexes to update statistics:
-- ANALYZE public.landlord_profiles;
-- ANALYZE public.renter_profiles;
-- ANALYZE public.agency_profiles;
-- ANALYZE public.properties;
-- ANALYZE public.matches;
-- ANALYZE public.issues;
-- ANALYZE public.conversations;
-- ANALYZE public.renter_invites;
-- ANALYZE public.agency_property_links;
