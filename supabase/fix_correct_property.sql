-- Update match to use the correct property
UPDATE matches
SET property_id = '81b4e6f9-3027-433e-9097-0690567dcc67'
WHERE renter_id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';

-- Update renter profile to reference the correct property
UPDATE renter_profiles
SET current_property_id = '81b4e6f9-3027-433e-9097-0690567dcc67'
WHERE id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';

-- Verify the updates
SELECT 
  'Match' as record_type,
  id,
  renter_id,
  property_id,
  landlord_id,
  tenancy_status
FROM matches
WHERE renter_id = '4b77cf4c-4652-4a70-b732-1f9a3c758950'

UNION ALL

SELECT 
  'Renter' as record_type,
  id,
  null as renter_id,
  current_property_id as property_id,
  current_landlord_id as landlord_id,
  status as tenancy_status
FROM renter_profiles
WHERE id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';
