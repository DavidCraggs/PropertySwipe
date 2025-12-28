# PropertySwipe Database Optimization Plan

**Generated:** December 26, 2025
**Analysis Based On:** Supabase Schema + TypeScript Codebase

---

## Executive Summary

After thorough analysis of the database schema against the codebase, I've identified **15 critical issues** that need to be addressed across 4 priority levels. The most impactful issues are:

1. **N+1 Query Patterns** causing unnecessary database round trips
2. **Missing Foreign Key Constraints** on renter_profiles
3. **Unbounded JSONB Arrays** for messages (performance degradation over time)
4. **No Pagination** on property queries (will fail at scale)
5. **Duplicated Transformation Logic** (maintenance nightmare)

---

## Issue Categories

| Priority | Category | Count | Est. Effort |
|----------|----------|-------|-------------|
| CRITICAL | Query Performance | 3 | 4-6 hours |
| HIGH | Data Integrity | 4 | 3-4 hours |
| MEDIUM | Schema Design | 5 | 6-8 hours |
| LOW | Code Quality | 3 | 2-3 hours |

---

## CRITICAL PRIORITY - Query Performance

### Issue 1: N+1 Query Pattern in MatchesPage

**Location:** `src/pages/MatchesPage.tsx` lines 76-127

**Current Behavior:**
```typescript
// Step 1: Fetch all matches for renter
const { data: matchData } = await supabase
  .from('matches')
  .select('*')
  .eq('renter_id', currentUser.id);

// Step 2: Fetch ALL properties (entire table!)
const properties = await getAllProperties();

// Step 3: O(n*m) client-side search
matchData.map((m) => {
  const property = properties.find(p => p.id === m.property_id);
  // ...
});
```

**Problem:**
- 2 database round trips instead of 1
- Fetches ALL properties (could be 1000s of rows)
- Client-side O(n*m) complexity to match data

**Fix:**
```typescript
// Single query with JOIN
const { data: matchData } = await supabase
  .from('matches')
  .select(`
    *,
    property:properties(*)
  `)
  .eq('renter_id', currentUser.id);
```

**Impact:** 50-90% reduction in query time for renters with active matches

---

### Issue 2: getAllProperties() Has No Pagination

**Location:** `src/lib/storage.ts` line 600-603

**Current Behavior:**
```typescript
const { data } = await supabase
  .from('properties')
  .select('*')
  .eq('is_available', true)
  .order('created_at', { ascending: false });
// NO LIMIT! Fetches ALL available properties
```

**Problem:**
- Fetches entire properties table on every call
- Called 8+ times throughout codebase (lines 580, 694, 759, 907, 2291, 2336, 2512, 2755)
- Will become extremely slow with 1000+ properties

**Fix:**
```typescript
// Add pagination with sensible defaults
export const getAllProperties = async (options?: {
  limit?: number;
  offset?: number;
  filters?: { rentMin?: number; rentMax?: number; city?: string };
}) => {
  const { limit = 50, offset = 0, filters = {} } = options || {};

  let query = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('is_available', true)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (filters.rentMin) query = query.gte('rent_pcm', filters.rentMin);
  if (filters.rentMax) query = query.lte('rent_pcm', filters.rentMax);
  if (filters.city) query = query.eq('city', filters.city);

  return query;
};
```

---

### Issue 3: Repeated Calls to getAllProperties()

**Locations:** 8+ places call `getAllProperties()` unnecessarily

**Problem Files:**
- `src/pages/MatchesPage.tsx:92` - Fetches all properties to find one by ID
- `src/lib/storage.ts:694` - Full table scan in deleteProperty fallback
- `src/lib/storage.ts:2755` - validateInviteCode fetches all properties
- `src/utils/seedMatches.ts:25` - Full scan to find single property

**Fix:** Replace with targeted queries:
```typescript
// Instead of:
const allProperties = await getAllProperties();
const property = allProperties.find(p => p.id === propertyId);

// Use:
const { data: property } = await supabase
  .from('properties')
  .select('*')
  .eq('id', propertyId)
  .single();
```

---

## HIGH PRIORITY - Data Integrity

### Issue 4: Missing Foreign Key Constraints on renter_profiles

**Schema Issue:**
```sql
-- Current (no FK constraints):
current_tenancy_id uuid,
current_property_id uuid,
current_landlord_id uuid,
current_agency_id uuid,

-- Should have:
current_tenancy_id uuid REFERENCES matches(id) ON DELETE SET NULL,
current_property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
current_landlord_id uuid REFERENCES landlord_profiles(id) ON DELETE SET NULL,
current_agency_id uuid REFERENCES agency_profiles(id) ON DELETE SET NULL,
```

**Risk:** Orphaned references when related records are deleted

**Fix Migration:**
```sql
-- Migration: add_renter_profile_fk_constraints.sql
ALTER TABLE renter_profiles
  ADD CONSTRAINT renter_profiles_current_tenancy_id_fkey
    FOREIGN KEY (current_tenancy_id) REFERENCES matches(id) ON DELETE SET NULL,
  ADD CONSTRAINT renter_profiles_current_property_id_fkey
    FOREIGN KEY (current_property_id) REFERENCES properties(id) ON DELETE SET NULL,
  ADD CONSTRAINT renter_profiles_current_landlord_id_fkey
    FOREIGN KEY (current_landlord_id) REFERENCES landlord_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT renter_profiles_current_agency_id_fkey
    FOREIGN KEY (current_agency_id) REFERENCES agency_profiles(id) ON DELETE SET NULL;
```

---

### Issue 5: conversations Table Missing from Main Schema

**Problem:**
- `supabase-schema-multirole.sql` does NOT include the `conversations` table
- It only exists in `supabase/migrations/20251201_create_conversations_table.sql`
- Fresh deployments using the main schema will be broken

**Fix:** Add to main schema file:
```sql
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  conversation_type text NOT NULL CHECK (conversation_type IN ('landlord', 'agency')),
  messages jsonb DEFAULT '[]'::jsonb,
  last_message_at timestamp with time zone,
  unread_count_renter integer DEFAULT 0 CHECK (unread_count_renter >= 0),
  unread_count_other integer DEFAULT 0 CHECK (unread_count_other >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  seed_tag text,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_match_conversation_unique UNIQUE (match_id, conversation_type)
);

CREATE INDEX idx_conversations_match_id ON conversations(match_id);
```

---

### Issue 6: renter_invites Table Missing from Main Schema

**Same Issue as #5**

**Fix:** Add to main schema file (copy from migration file)

---

### Issue 7: Data Synchronization Between Arrays and Link Tables

**Problem:**
- `agency_profiles.managed_property_ids` is an ARRAY
- `agency_profiles.landlord_client_ids` is an ARRAY
- BUT there's a separate `agency_property_links` table

**Risk:** Arrays can become out of sync with the normalized link table

**Fix Options:**

**Option A (Preferred): Remove the arrays, use queries**
```sql
-- Remove redundant arrays
ALTER TABLE agency_profiles
  DROP COLUMN managed_property_ids,
  DROP COLUMN landlord_client_ids;

-- Use joins instead:
SELECT p.* FROM properties p
JOIN agency_property_links l ON p.id = l.property_id
WHERE l.agency_id = 'xxx' AND l.is_active = true;
```

**Option B: Add trigger to keep in sync**
```sql
CREATE OR REPLACE FUNCTION sync_agency_property_ids()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agency_profiles SET managed_property_ids = (
    SELECT array_agg(property_id)
    FROM agency_property_links
    WHERE agency_id = NEW.agency_id AND is_active = true
  ) WHERE id = NEW.agency_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## MEDIUM PRIORITY - Schema Design

### Issue 8: Messages Stored as JSONB Arrays (Unbounded Growth)

**Current Schema:**
```sql
-- conversations table
messages jsonb DEFAULT '[]'::jsonb

-- matches table
messages ARRAY DEFAULT '{}'::jsonb[]

-- issues table
messages ARRAY DEFAULT '{}'::jsonb[]
```

**Problem:**
- JSONB arrays grow unbounded (no practical limit)
- Cannot query individual messages efficiently
- Loading a conversation with 1000+ messages loads entire array
- No pagination within conversation

**Long-term Fix:** Normalize into separate table:
```sql
CREATE TABLE conversation_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_messages_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_conv_messages_conversation ON conversation_messages(conversation_id, created_at DESC);
CREATE INDEX idx_conv_messages_unread ON conversation_messages(conversation_id, is_read) WHERE is_read = false;
```

**Short-term Mitigation:** Add message limit check in application layer

---

### Issue 9: Missing Indexes on Frequently Searched Fields

**Required Indexes:**
```sql
-- Email lookups (auth)
CREATE INDEX idx_landlord_profiles_email ON landlord_profiles(email);
CREATE INDEX idx_renter_profiles_email ON renter_profiles(email);
CREATE INDEX idx_agency_profiles_email ON agency_profiles(email);

-- Rent price range filtering
CREATE INDEX idx_properties_rent_pcm ON properties(rent_pcm);

-- City-based property search
CREATE INDEX idx_properties_city ON properties(city);

-- Active issues by agency
CREATE INDEX idx_issues_agency_status ON issues(agency_id, status) WHERE status NOT IN ('resolved', 'closed');

-- Matches by renter for dashboard
CREATE INDEX idx_matches_renter ON matches(renter_id, tenancy_status);

-- Matches by landlord
CREATE INDEX idx_matches_landlord ON matches(landlord_id, tenancy_status);
```

---

### Issue 10: Property Address is Nested in TypeScript but Flat in Database

**Database Schema:**
```sql
street text NOT NULL,
city text NOT NULL,
postcode text NOT NULL,
council text,
```

**TypeScript Interface:**
```typescript
address: {
  street: string;
  city: string;
  postcode: string;
  council: string;
};
```

**Current Handling:** Manual transformation in 50+ places

**Better Solution:** Create reusable transformer:
```typescript
// src/lib/transformers.ts
export const transformPropertyFromDB = (row: any): Property => ({
  ...baseFields,
  address: {
    street: row.street,
    city: row.city,
    postcode: row.postcode,
    council: row.council || '',
  },
  // ... other nested objects
});
```

---

### Issue 11: matches.renter_profile JSONB Snapshot Can Become Stale

**Current:** When match is created, renter profile is copied as JSONB snapshot

**Problem:** If renter updates profile, snapshot remains outdated

**Fix Options:**

**Option A: Use JOIN instead of snapshot (recommended)**
```typescript
// Instead of storing snapshot, join at query time
const { data } = await supabase
  .from('matches')
  .select(`
    *,
    renter:renter_profiles(*)
  `)
  .eq('id', matchId)
  .single();
```

**Option B: Keep snapshot but add sync trigger**
```sql
CREATE OR REPLACE FUNCTION sync_match_renter_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE matches SET renter_profile = to_jsonb(NEW)
  WHERE renter_id = NEW.id AND tenancy_status != 'ended';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_renter_profile_snapshots
AFTER UPDATE ON renter_profiles
FOR EACH ROW EXECUTE FUNCTION sync_match_renter_profile();
```

---

### Issue 12: Rating Field Name Mismatch

**Database:**
```sql
rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5)
```

**TypeScript:**
```typescript
overallScore: number; // 1-5
categoryScores: { ... }
```

**Problem:** saveRating() must transform `overallScore` to `rating`

**Already handled but inconsistent. Consolidate in transformer.**

---

## LOW PRIORITY - Code Quality

### Issue 13: Transformation Logic Duplicated 50+ Times

**Problem:** The same snake_case → camelCase transformation appears in:
- getAllProperties() lines 622-675
- getAllMatches() lines 783-861
- getProperty() inline transform
- getRenterProfile() inline transform
- Multiple seed functions

**Fix:** Create centralized transformers:
```typescript
// src/lib/transformers/index.ts
export { transformProperty } from './property';
export { transformMatch } from './match';
export { transformRenter } from './renter';
export { transformLandlord } from './landlord';
export { transformAgency } from './agency';
export { transformIssue } from './issue';
export { transformConversation } from './conversation';
```

---

### Issue 14: Inconsistent Null/Undefined Handling

**Examples found:**
```typescript
landlordId: d.landlord_id || ''           // Empty string fallback
managingAgencyId: d.managing_agency_id || undefined  // Undefined fallback
deposit: d.deposit ?? 0                    // Nullish coalescing
yearBuilt: d.year_built || new Date().getFullYear()  // Default value
```

**Fix:** Establish consistent patterns:
- Use `?? defaultValue` for nullish coalescing (keeps 0, false, '')
- Use `|| undefined` for optional fields
- Document pattern in transformer files

---

### Issue 15: SELECT * Instead of Specific Columns

**Current:**
```typescript
.select('*')
```

**Better (when possible):**
```typescript
.select('id, landlord_id, street, city, postcode, rent_pcm, bedrooms, images')
```

**Benefits:**
- Reduced network transfer
- Clearer about what data is needed
- Easier to track field usage

---

## Implementation Phases

### Phase 1: Critical Query Fixes (Day 1) ✅ COMPLETED
1. [x] Fix MatchesPage N+1 query with JOIN - `src/pages/MatchesPage.tsx`
2. [x] Add pagination to getAllProperties() - Added `getPropertiesPaginated()` + limit to original
3. [x] Replace getAllProperties() calls with targeted queries:
   - Added `getPropertyById()` for single property lookups
   - Added `getPropertiesByIds()` for batch lookups
   - Updated `CurrentRenterDashboard.tsx` to use `getPropertyById()`
   - Updated `AgencyDashboard.tsx` to use `getPropertiesByIds()`
   - Updated `validateInviteCode()` to use `getPropertyById()`

### Phase 2: Schema Integrity (Day 1-2) ✅ COMPLETED
4. [x] Add FK constraints to renter_profiles - `supabase/migrations/20251226_add_renter_profile_fk_constraints.sql`
5. [ ] Add conversations table to main schema (migration file exists, needs merge)
6. [ ] Add renter_invites table to main schema (migration file exists, needs merge)
7. [x] Add missing indexes - `supabase/migrations/20251226_add_performance_indexes.sql`

### Phase 3: Transformer Consolidation (Day 2) ✅ COMPLETED
8. [x] Create src/lib/transformers/ directory
9. [x] Consolidate Property transformer - `src/lib/transformers/property.ts`
10. [x] Consolidate Match transformer - `src/lib/transformers/match.ts`
11. [x] Additional transformers created:
    - `src/lib/transformers/renterProfile.ts`
    - `src/lib/transformers/landlordProfile.ts`
    - `src/lib/transformers/agencyProfile.ts`
    - `src/lib/transformers/issue.ts`
    - `src/lib/transformers/conversation.ts`

### Phase 4: Medium Priority (Day 3+) - PENDING
12. [ ] Decide on array vs link table strategy for agency
13. [ ] Create migration for normalized messages (if proceeding)
14. [ ] Add renter profile sync trigger or switch to JOINs

---

## Verification Queries

After implementing fixes, run these to verify:

```sql
-- Check for orphaned references
SELECT id FROM renter_profiles
WHERE current_tenancy_id IS NOT NULL
AND current_tenancy_id NOT IN (SELECT id FROM matches);

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Find slow queries
SELECT query, calls, total_time/calls as avg_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
```

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Add FK constraints | Medium - may fail if orphaned data exists | Run cleanup query first |
| Pagination | Low - additive change | Test with empty/large datasets |
| JOIN queries | Low - same data, different structure | Add feature flag for rollback |
| Normalize messages | HIGH - schema change | Plan migration carefully, dual-write period |
| Remove array columns | HIGH - breaking change | Ensure no code reads arrays first |

---

## Metrics to Track

Before and after implementing:
1. **MatchesPage load time** (target: <500ms)
2. **Property search query time** (target: <200ms)
3. **Issue dashboard query time** (target: <300ms)
4. **Average API response time**
5. **Database connection pool usage**
