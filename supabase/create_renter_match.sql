-- Manually create a Match for the renter
-- Using the first property from the landlord
INSERT INTO matches (
  renter_id,
  landlord_id,
  property_id,
  managing_agency_id,
  renter_name,
  messages,
  unread_count,
  has_viewing_scheduled,
  application_status,
  application_submitted_at,
  tenancy_status,
  can_rate,
  has_renter_rated,
  has_landlord_rated,
  is_under_eviction_proceedings,
  active_issue_ids,
  total_issues_raised,
  total_issues_resolved
) VALUES (
  '4b77cf4c-4652-4a70-b732-1f9a3c758950', -- your renter ID
  '8c8afffa-ccef-4117-9312-bb162977d933', -- landlord ID
  '035a193a-e13b-476a-a17e-834e51cdd217', -- property ID
  '87cfae10-a673-4362-94e2-8aa518f88e4d', -- agency ID
  'Test Renter',
  ARRAY[]::jsonb[],
  0,
  false,
  'application_submitted',
  NOW(),
  'prospective',
  false,
  false,
  false,
  false,
  ARRAY[]::uuid[],
  0,
  0
)
RETURNING id, property_id, landlord_id, managing_agency_id;

-- Now update the renter profile with this match info
UPDATE renter_profiles
SET 
  status = 'current',
  current_property_id = '035a193a-e13b-476a-a17e-834e51cdd217',
  current_landlord_id = '8c8afffa-ccef-4117-9312-bb162977d933',
  current_agency_id = '87cfae10-a673-4362-94e2-8aa518f88e4d'
WHERE id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';

-- Verify
SELECT id, email, status, current_property_id, current_landlord_id
FROM renter_profiles
WHERE id = '4b77cf4c-4652-4a70-b732-1f9a3c758950';
