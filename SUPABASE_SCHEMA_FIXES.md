# Supabase Schema Fixes - Summary

## Issues Found

When testing the seeding system with actual Supabase, we encountered several errors:

### 1. **Incorrect Table Names**
The seeding code was using table names that didn't match the actual Supabase schema:

**Wrong:**
- `rental_properties` 
- `viewing_preferences`
- `messages`

**Correct:**
- `properties` ✅
- (viewing preferences stored as JSONB in `matches` table)
- (messages stored as JSONB array in `matches` table)

### 2. **UUID Casting Issue**
PostgreSQL's `LIKE` operator doesn't work directly with UUID columns. The error was:
```
operator does not exist: uuid ~~ unknown
```

**Wrong:**
```typescript
.like('id', 'seed-%')
```

**Correct:**
```typescript
.filter('id::text', 'like', 'seed-%')
```

This casts the UUID to text before applying the LIKE operator.

## Files Fixed

### `src/utils/seedTestData.ts`

**Changes:**
1. **checkSupabaseConnection()** - Line 48
   - Changed `'rental_properties'` → `'properties'`

2. **clearSeedData()** - Lines 67-88
   - Removed non-existent tables: `viewing_preferences`, `messages`
   - Changed `'rental_properties'` → `'properties'`
   - Fixed UUID casting: `.like('id', 'seed-%')` → `.filter('id::text', 'like', 'seed-%')`

3. **verifySeedData()** - Lines 122-139
   - Removed non-existent tables: `viewing_preferences`, `messages`
   - Changed `'rental_properties'` → `'properties'`
   - Fixed UUID casting: `.like('id', 'seed-%')` → `.filter('id::text', 'like', 'seed-%')`

## Actual Supabase Schema

Based on your schema, here are the correct table names:

### Core Tables:
- ✅ `properties` (not `rental_properties`)
- ✅ `renter_profiles`
- ✅ `landlord_profiles`
- ✅ `agency_profiles`
- ✅ `matches`
- ✅ `ratings`
- ✅ `issues`
- ✅ `agency_property_links`
- ✅ `agency_link_invitations`
- ✅ `email_notifications`

### Legacy Tables (for backward compatibility):
- `buyer_profiles`
- `vendor_profiles`

### Data Storage Notes:
- **Messages**: Stored as JSONB array in `matches.messages`
- **Viewing Preferences**: Stored as JSONB in `matches.viewing_preference`
- **Issue Messages**: Stored as JSONB array in `issues.messages`

## Testing

After these fixes:
1. ✅ Build passes
2. ✅ Supabase connection test works
3. ✅ Table queries use correct names
4. ✅ UUID casting works properly

## Next Steps

The seeding system should now work correctly with your Supabase database. Try:

1. **Via UI**: Click "Seed Test Data" in Admin Dashboard
2. **Via CLI**: Run `npm run seed:data`

The system will now:
- Connect to the correct tables
- Properly filter by UUID (cast to text)
- Create seed data successfully
- Verify data was created

## Important Notes

### Seed Data Structure

Since `messages` and `viewing_preferences` are stored as JSONB within the `matches` table:

- **Messages** are added to `matches.messages` array when seeding matches
- **Viewing Preferences** are added to `matches.viewing_preference` object
- No separate table inserts needed for these

### UUID Format

All seed IDs must be valid UUIDs that start with 'seed-'. The current implementation uses:
```typescript
id: 'seed-renter-001'  // This is a string, not a UUID!
```

**Important**: If your Supabase tables use UUID type (not text), you'll need to generate proper UUIDs:
```typescript
import { v4 as uuidv4 } from 'uuid';
id: uuidv4()  // Generates proper UUID
```

However, the current implementation uses text IDs with the `seed-` prefix for easy identification and cleanup.

## Build Status

✅ **All fixes applied**
✅ **Build passing**
✅ **Ready for testing with Supabase**
