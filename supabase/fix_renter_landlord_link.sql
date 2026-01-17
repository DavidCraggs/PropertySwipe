-- First, see what landlords exist
SELECT id, email, names FROM landlord_profiles;

-- Option A: If you have a test landlord (like test.landlord@example.com), use that ID
-- Replace the UUID below with an actual landlord ID from the query above
-- UPDATE renter_profiles
-- SET current_landlord_id = '<existing_landlord_id>'
-- WHERE id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';

-- Option B: Clear the invalid landlord reference (renter won't have a landlord set)
UPDATE renter_profiles
SET current_landlord_id = NULL
WHERE id = '4b77cf4c-4652-4a70-b732-1f9a3c758950'
  AND current_landlord_id = 'ce036764-628d-4167-9657-15b1f66b8253';

-- Verify the fix
SELECT id, email, names, current_landlord_id
FROM renter_profiles
WHERE id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';
