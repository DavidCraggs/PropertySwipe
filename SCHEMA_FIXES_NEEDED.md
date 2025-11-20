# Supabase Schema Fixes Required

## Based on actual schema from `supabase-schema-multirole.sql` and TypeScript

 types:

### Property Type Fixes

**Current issues in `seedProperties.ts`:**

1. `address` - Should be object: `{ street, city, postcode, council }`
2. `rent` → `rentPcm`
3. `availableFrom` - Should be string (ISO), not Date
4. `petsAllowed` → `petsPolicy` object
5. Missing `bills` object
6. Missing `maxRentInAdvance: 1`
7. Missing `tenancyType: 'Periodic'`
8. Missing `maxOccupants`
9. `floorArea` → not in type
10. `hasGarden`, `hasParking` → should be in `features` array

### Match Type Fixes

**Current issues in `seedMatches.ts`:**

The Supabase schema shows Match table structure is completely different. It uses JSONB arrays for messages, not separate tables. The TypeScript Match type likely mirrors Supabase schema.

Need to check Match type structure.

### Message Type Fixes

**Current issues in `seedMessages.ts`:**

Messages are stored as JSONB array in matches table, not separate table. Need to update the approach.

### Viewing Request Fixes

**Current issues in `seedViewingRequests.ts`:**

Viewing data is stored as `viewing_preference` JSONB in matches table.

### Issue Type Fixes

**Current issues in `seedMaintenanceIssues.ts`:**

Supabase schema shows:
- Categories: `'maintenance', 'repair', 'complaint', 'query', 'hazard', 'dispute'`
- Status: `'open', 'acknowledged', 'in_progress', 'awaiting_parts', 'awaiting_access', 'resolved', 'closed'`

Not `'plumbing'`, `'heating'`, etc.

### Rating Type Fixes

**Current issues in `seedRatings.ts`:**

Supabase schema shows `rating` is INTEGER 1-5, not object with `overallRating`.

## Action Plan

1. Check actual TypeScript types for Match, Message, ViewingPreference, Issue, Rating
2. Update seed files to match types
3. Use existing storage functions (`saveMatch`, `saveRating`, etc.)
4. For messages/viewings stored in Match as JSONB, update Match records directly
