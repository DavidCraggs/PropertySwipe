-- Check ALL renter invites to see what's in the system
SELECT 
  id,
  code,
  property_id,
  landlord_id,
  managing_agency_id,
  status,
  accepted_by_renter_id,
  created_match_id,
  created_at,
  accepted_at
FROM renter_invites
ORDER BY created_at DESC
LIMIT 10;

-- Also check ALL matches to see if any exist
SELECT 
  id,
  renter_id,
  landlord_id,
  property_id,
  managing_agency_id,
  application_status,
  tenancy_status,
  created_at
FROM matches
ORDER BY created_at DESC
LIMIT 10;
