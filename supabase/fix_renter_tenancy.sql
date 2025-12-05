-- Fix renter tenancy relationship
-- This updates the renter profile with the correct current property/landlord IDs

-- Step 1: Find the renter and their match
WITH renter_match AS (
  SELECT 
    m.id as match_id,
    m.property_id,
    m.landlord_id,
    m.managing_agency_id,
    m.renter_id
  FROM matches m
  WHERE m.renter_id = '4b77cf4c-4652-4a70-b732-1f9a3c758950'
  ORDER BY m.created_at DESC
  LIMIT 1
)
-- Step 2: Update the renter profile with the tenancy info
UPDATE renter_profiles
SET 
  status = 'current',
  current_property_id = (SELECT property_id FROM renter_match),
  current_landlord_id = (SELECT landlord_id FROM renter_match),
  current_agency_id = (SELECT managing_agency_id FROM renter_match)
WHERE id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';

-- Verify the update
SELECT 
  id,
  email,
  status,
  current_property_id,
  current_landlord_id,
  current_agency_id
FROM renter_profiles
WHERE id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';
