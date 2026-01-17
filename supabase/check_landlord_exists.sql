-- Check if the landlord exists in landlord_profiles
SELECT id, email, names
FROM landlord_profiles
WHERE id = '8c8afffa-ccef-4117-9312-bb162977d933'::uuid;

-- List all landlords to see what exists
SELECT id, email, names
FROM landlord_profiles
LIMIT 10;

-- Check if this ID is in renter_profiles current_landlord_id
SELECT id, email, names, current_landlord_id
FROM renter_profiles
WHERE current_landlord_id = '8c8afffa-ccef-4117-9312-bb162977d933'::uuid;

-- Check which renter has this landlord set
SELECT rp.id as renter_id, rp.email as renter_email, rp.current_landlord_id,
       lp.id as landlord_id, lp.email as landlord_email
FROM renter_profiles rp
LEFT JOIN landlord_profiles lp ON rp.current_landlord_id = lp.id
WHERE rp.current_landlord_id IS NOT NULL;
