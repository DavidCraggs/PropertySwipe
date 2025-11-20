# Seeding Migration Progress

## ✅ Completed

1. **SQL Migration** - seed_tag columns added to all tables
2. **seedHelpers.ts** - Constants updated (_ID → _TAG)
3. **seedUserProfiles.ts** - Uses seed_tag, exports GENERATED_IDS
4. **seedTestData.ts** - clearSeedData() and verifySeedData() use seed_tag

## ⏳ In Progress

Due to the large number of files and interdependencies, I'm updating the remaining files in batches.

The build is currently running to check for errors...

## Remaining Files to Update

These files still reference the old `_ID` constants and need to use `GENERATED_IDS` instead:

1. **seedProperties.ts** - 5 properties, needs landlordId from GENERATED_IDS
2. **seedMatches.ts** - 4 matches, needs renterId, landlordId, propertyIds
3. **seedMessages.ts** - Messages for matches, needs matchIds
4. **seedViewingRequests.ts** - 3 viewing requests, needs matchIds, propertyIds
5. **seedMaintenanceIssues.ts** - 3 issues, needs propertyIds, renterIds, landlordIds, agencyIds
6. **seedRatings.ts** - 2 ratings, needs matchIds, userIds

## Strategy

Since these files are interdependent (properties need landlordId, matches need propertyIds, etc.), I'll:

1. Wait for current build to complete
2. Create a simplified version that uses the GENERATED_IDS from seedUserProfiles
3. Update each file to track its own generated IDs for downstream use

## Current Build Status

Running `npm run build` to see current state...
