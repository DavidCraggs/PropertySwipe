# Supabase UUID Issue - Critical Fix Needed

## Problem

The seeding system is trying to insert text IDs like `'seed-renter-001'` into UUID columns, which Supabase rejects.

### Error:
```
409 Conflict - duplicate key value violates unique constraint
```

### Root Cause:
Your Supabase schema defines ID columns as `uuid` type with `uuid_generate_v4()` default:
```sql
id uuid NOT NULL DEFAULT uuid_generate_v4()
```

But the seeding code tries to insert text strings:
```typescript
id: 'seed-renter-001'  // This is TEXT, not UUID!
```

## Solutions

### Option 1: Let Supabase Generate UUIDs (Recommended)

**Pros:**
- Works with existing schema
- Proper UUID format
- No schema changes needed

**Cons:**
- Can't use predictable IDs like `seed-renter-001`
- Harder to identify seed data
- Need to track generated IDs for relationships

**Implementation:**
1. Don't specify `id` field when inserting
2. Let Supabase generate UUID
3. Store returned UUID
4. Use for relationships
5. Add a `is_seed_data: boolean` column to identify test data

### Option 2: Change Schema to TEXT IDs

**Pros:**
- Can use readable IDs like `seed-renter-001`
- Easy to identify seed data
- Simple cleanup with `LIKE 'seed-%'`

**Cons:**
- Requires schema migration
- Changes existing data structure
- May affect existing code

**Implementation:**
```sql
ALTER TABLE renter_profiles ALTER COLUMN id TYPE text;
ALTER TABLE landlord_profiles ALTER COLUMN id TYPE text;
-- etc for all tables
```

### Option 3: Hybrid Approach

**Pros:**
- Keep UUID primary keys
- Add seed identifier column
- No breaking changes

**Cons:**
- Requires schema change (add column)
- More complex queries

**Implementation:**
```sql
ALTER TABLE renter_profiles ADD COLUMN seed_tag text;
ALTER TABLE landlord_profiles ADD COLUMN seed_tag text;
-- etc
```

Then seed with:
```typescript
{
  // Let Supabase generate UUID for id
  seed_tag: 'seed-renter-001',
  email: '...',
  // ... rest of data
}
```

## Recommended Solution

**Use Option 3 (Hybrid Approach)**

1. Add `seed_tag text` column to all tables
2. Use for identifying and cleaning up seed data
3. Let Supabase generate proper UUIDs for `id`
4. Query by `seed_tag LIKE 'seed-%'` for cleanup

### Migration SQL:
```sql
ALTER TABLE renter_profiles ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE landlord_profiles ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS seed_tag text;
ALTER TABLE agency_property_links ADD COLUMN IF NOT EXISTS seed_tag text;
```

### Updated Seeding Code:
```typescript
// Don't specify id, add seed_tag instead
const landlord = {
  seed_tag: 'seed-landlord-001',  // For identification
  email: 'test.landlord@test.geton.com',
  // ... rest of data
};

const { data, error } = await supabase
  .from('landlord_profiles')
  .insert(landlord)
  .select()
  .single();

// Use data.id (generated UUID) for relationships
const landlordId = data.id;
```

### Updated Cleanup:
```typescript
await supabase
  .from('landlord_profiles')
  .delete()
  .not('seed_tag', 'is', null);  // Delete all with seed_tag
```

## Next Steps

1. Run the migration SQL in Supabase
2. Update seeding code to use `seed_tag`
3. Update cleanup code to filter by `seed_tag`
4. Test seeding process

Would you like me to implement Option 3?
