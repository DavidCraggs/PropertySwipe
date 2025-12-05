-- Update the match to have active tenancy status
UPDATE matches
SET tenancy_status = 'active'
WHERE renter_id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';

-- Verify the update
SELECT 
  id,
  renter_id,
  landlord_id,
  property_id,
  tenancy_status
FROM matches
WHERE renter_id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';
