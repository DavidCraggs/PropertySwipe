# Test Data Seeding Guide

## Overview

The GetOn Rental Platform includes a comprehensive test data seeding system that populates your Supabase database with realistic sample data for development and testing purposes.

## Quick Start

### Using the Admin UI (Recommended)

1. Log in as admin
2. Click the **"Seed Test Data"** button in the Admin Dashboard header
3. Choose whether to clear existing seed data
4. Click **"Start Seeding"**
5. Monitor progress and view results

### Using Command Line

```bash
# Seed all test data
npm run seed:data

# Clear existing seed data
npm run seed:clear

# Verify seed data integrity
npm run seed:verify
```

## What Gets Seeded

The seeding system creates a complete, interconnected dataset:

### 1. User Profiles
- **1 Renter** (Emma Thompson)
  - Complete profile with preferences
  - Employment and income verification
  - References
  
- **1 Landlord** (James Wilson)
  - Verified landlord profile
  - Ombudsman membership
  - Property portfolio

- **1 Management Agency** (PropertyCare Solutions)
  - Full agency profile
  - Service offerings
  - SLA commitments

### 2. Rental Properties (4 properties)
- Modern 1-bed apartment (Duke Street, Liverpool)
- Spacious 2-bed flat (Bold Street, Liverpool)
- Cozy studio (Hope Street, Liverpool)
- Family 3-bed house (Sefton Park, Liverpool)

Each property includes:
- Complete address and location data
- Detailed features and amenities
- Photos and descriptions
- Rent and bills information
- Availability dates

### 3. Matches (4 matches)
- **Match 1**: Active match (Property 1) - 5 days old
- **Match 2**: Viewing requested (Property 2) - 3 days old
- **Match 3**: Pending match (Property 3) - 2 days old
- **Match 4**: Declined application (Property 4) - 1 day old

### 4. Messages
- **Match 1**: 10 messages (realistic conversation thread)
- **Match 2**: 4 messages (negotiation in progress)

### 5. Viewing Requests (3 viewings)
- Confirmed viewing for tomorrow
- Pending viewing request
- Completed past viewing

### 6. Maintenance Issues (3 issues)
- Urgent plumbing issue (acknowledged)
- Routine boiler service (in progress)
- Low priority light bulb replacement (open)

### 7. Ratings (2 ratings)
- Renter rating landlord (4.5 stars)
- Landlord rating renter (5 stars)

## Seeding Process

### Step-by-Step Flow

1. **Connection Check**: Verifies Supabase connection
2. **Clear Existing** (optional): Removes previous seed data
3. **Seed User Profiles**: Creates renter, landlord, and agency profiles
4. **Seed Properties**: Creates rental properties
5. **Seed Matches**: Creates match relationships
6. **Seed Messages**: Adds conversation threads to matches
7. **Seed Viewing Requests**: Creates viewing preferences
8. **Seed Maintenance Issues**: Creates sample issues
9. **Seed Ratings**: Creates sample ratings
10. **Verification**: Confirms all data was created successfully

### Timing

- Full seeding typically takes **2-5 seconds**
- Progress is shown in real-time
- Each step reports records created and duration

## Data Identification

All seed data uses the `seed-` prefix for easy identification:

```
seed-renter-001
seed-landlord-001
seed-property-001
seed-match-001
etc.
```

This makes it easy to:
- Identify test data in the database
- Clear only test data without affecting real data
- Query seed data specifically

## Configuration

### Seeding Options

```typescript
await seedAllTestData({
  clearExisting: true,  // Clear previous seed data first
  verbose: true,        // Show detailed progress logs
});
```

### Environment Requirements

Seeding requires:
- Supabase connection configured
- `VITE_SUPABASE_URL` environment variable set
- `VITE_SUPABASE_ANON_KEY` environment variable set

## Verification

### Automatic Verification

The seeding process includes automatic verification:
- Counts records in each table
- Checks for errors
- Reports success/failure

### Manual Verification

```bash
npm run seed:verify
```

This will show:
- Record counts per table
- Any errors encountered
- Overall validation status

Example output:
```
📊 Verification Summary:
══════════════════════════════════════════════════
✓ renter_profiles              1 records
✓ landlord_profiles             1 records
✓ agency_profiles               1 records
✓ rental_properties             4 records
✓ matches                       4 records
✓ messages                     14 records
✓ viewing_preferences           3 records
✓ issues                        3 records
✓ ratings                       2 records
══════════════════════════════════════════════════
Total seed records: 33

✅ Test data verification passed!
```

## Clearing Seed Data

### Using Admin UI

1. Open the Seed Data Modal
2. Check "Clear existing seed data"
3. Click "Start Seeding"

### Using Command Line

```bash
npm run seed:clear
```

This removes all records with IDs starting with `seed-` from:
- ratings
- issues
- viewing_preferences
- messages
- matches
- agency_property_links
- rental_properties
- renter_profiles
- landlord_profiles
- agency_profiles

## Error Handling

### Automatic Rollback

If seeding fails:
- All partially created data is automatically removed
- Database is returned to pre-seeding state
- Error details are logged

### Common Issues

**Issue**: "Supabase is not configured"
- **Solution**: Set environment variables in `.env`

**Issue**: "Failed to connect to Supabase"
- **Solution**: Check your Supabase URL and key are correct

**Issue**: "Seeding failed at step X"
- **Solution**: Check the error message, verify database schema matches types

## Best Practices

### Development Workflow

1. **Start fresh**: Clear existing seed data before re-seeding
2. **Verify**: Always run verification after seeding
3. **Inspect**: Use Supabase dashboard to inspect seeded data
4. **Test**: Use seed data for manual testing and development

### Testing Workflow

1. **Before tests**: Seed fresh data
2. **During tests**: Use seed IDs in test assertions
3. **After tests**: Clear seed data (optional)

### Production Safety

⚠️ **Never run seeding in production!**

The seeding system includes checks, but always:
- Only use in development/staging environments
- Double-check environment before seeding
- Keep production credentials separate

## Programmatic Usage

### In Application Code

```typescript
import { seedAllTestData } from './utils/seedTestData';

// Seed data
const result = await seedAllTestData({
  clearExisting: true,
  verbose: true,
});

if (result.success) {
  console.log(`Created ${result.totalRecords} records`);
} else {
  console.error('Seeding failed:', result.errors);
}
```

### In Tests

```typescript
import { seedAllTestData, clearSeedData } from './utils/seedTestData';

beforeEach(async () => {
  await seedAllTestData({ clearExisting: true, verbose: false });
});

afterEach(async () => {
  await clearSeedData(false);
});
```

## Customization

### Adding New Seed Data

1. Create a new seed file in `src/utils/seedXXX.ts`
2. Follow the pattern of existing seed files
3. Use `seed-` prefix for IDs
4. Add to `seedAllTestData()` in `seedTestData.ts`

### Modifying Existing Data

Edit the seed files:
- `seedUserProfiles.ts` - User data
- `seedProperties.ts` - Property data
- `seedMatches.ts` - Match relationships
- `seedMessages.ts` - Conversation threads
- `seedViewingRequests.ts` - Viewing preferences
- `seedMaintenanceIssues.ts` - Issue tickets
- `seedRatings.ts` - Rating data

## Troubleshooting

### Seeding Hangs

- Check Supabase connection
- Verify no database locks
- Check console for errors

### Partial Seeding

- Run verification to see what succeeded
- Clear and re-seed
- Check for schema mismatches

### Verification Fails

- Check Supabase dashboard for actual data
- Verify table names match
- Check for permission issues

## Support

For issues or questions:
1. Check this guide
2. Review error messages in console
3. Inspect Supabase logs
4. Check `SEEDING_STATUS.md` for known issues

## Related Documentation

- `SEEDING_STATUS.md` - Implementation status
- `SEEDING_FIXES_COMPLETE.md` - Recent fixes
- `src/utils/seedTestData.ts` - Main seeding logic
- `src/types/index.ts` - Type definitions
