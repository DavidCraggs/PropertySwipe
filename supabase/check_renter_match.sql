-- Check if a match exists for this renter
SELECT 
  id,
  renter_id,
  property_id,
  landlord_id,
  managing_agency_id,
  application_status,
  tenancy_status,
  created_at
FROM matches
WHERE renter_id = '4b77cf4c-4652-4a70-b732-1f9a3c758950'
ORDER BY created_at DESC;

-- Also check the renter_invites table to see the invite
SELECT 
  id,
  code,
  property_id,
  landlord_id,
  managing_agency_id,
  status,
  accepted_by_renter_id,
  created_match_id,
  accepted_at
FROM renter_invites
WHERE accepted_by_renter_id = '4b77cf4c-4652-4a70-b732-1f9a3c758950'
ORDER BY created_at DESC;
