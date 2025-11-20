# Test Data Seeding - Implementation Plan

## Current Status
✅ Build is passing
✅ Storage functions exist: `saveMatch`, `saveProperty`, `createViewingRequest`, `saveRating`
⚠️ Seeding files need fixes to match actual types

## Issues to Fix

### 1. seedMatches.ts
**Problem:** Missing required fields `property`, `landlordName`, `renterName`
**Solution:** 
- Fetch property using `getAllProperties()` and find by ID
- Fetch landlord profile using `getLandlordProfile()` to get name
- Fetch renter profile using `getRenterProfile()` to get name
- Populate these fields before calling `saveMatch()`

### 2. seedMessages.ts  
**Problem:** Messages are stored in Match.messages array, not separately
**Solution:**
- Fetch matches using `getAllMatches()`
- Update match.messages array
- Call `saveMatch()` to persist

### 3. seedViewingRequests.ts
**Problem:** Already uses `createViewingRequest()` ✅
**Check:** Verify ViewingPreference type matches

### 4. seedRatings.ts
**Problem:** Already uses `saveRating()` ✅  
**Check:** Verify Rating type matches

### 5. seedMaintenanceIssues.ts
**Problem:** No `createIssue()` or `saveIssue()` function exists
**Solution:** Need to add this function to storage.ts first

## Implementation Order

1. ✅ Fix seedMatches.ts - Add property/name lookups
2. ✅ Fix seedMessages.ts - Update via match.messages
3. ✅ Verify seedViewingRequests.ts works
4. ✅ Verify seedRatings.ts works  
5. ⏳ Add saveIssue() to storage.ts
6. ⏳ Fix seedMaintenanceIssues.ts to use saveIssue()
7. ⏳ Test full seeding flow

## Next Steps
Start with fixing seedMatches.ts since other seeders depend on matches existing.
