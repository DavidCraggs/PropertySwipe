# Test Data Seeding Implementation - Current Status

## ✅ Steps 1-9 Complete (Core Seeding Logic)

### Files Created:
1. ✅ `src/utils/seedHelpers.ts` - Utility functions (ID generation, dates, validation)
2. ✅ `src/utils/seedTestData.ts` - Main orchestration framework  
3. ✅ `src/utils/seedUserProfiles.ts` - Step 2: User profile seeding
4. ✅ `src/utils/seedProperties.ts` - Step 3: Property seeding
5. ✅ `src/utils/seedMatches.ts` - Step 4: Match seeding
6. ✅ `src/utils/seedMessages.ts` - Step 5: Message seeding
7. ✅ `src/utils/seedViewingRequests.ts` - Step 6: Viewing seeding
8. ✅ `src/utils/seedMaintenanceIssues.ts` - Step 7: Issue seeding
9. ✅ `src/utils/seedRatings.ts` - Step 8: Rating seeding
10. ✅ `tests/unit/seedHelpers.test.ts` - Unit tests

## ⚠️ Issues to Fix

### Type Mismatches (need actual schema knowledge):

**Properties:**
- `address` field: Code uses `string`, schema wants `{ street, city, postcode, council }`
- `availableFrom` field: Code uses `Date`, schema wants `string`
- `city` property doesn't exist on Property type

**Matches:**
- `status` field doesn't exist on Match type
- `createMatch` function doesn't exist in storage.ts

**Messages:**
- `timestamp` field: Code uses `Date`, schema wants `string`
- `sendMessage` function doesn't exist in storage.ts

**Viewing Requests:**
- `landlordResponse` field doesn't exist on ViewingPreference
- `preferredTimes` type mismatch (`string` vs `ViewingTimeSlot`)
- `createViewingRequest` function doesn't exist in storage.ts

**Issues:**
- Category values (`'plumbing'`, `'heating'`, `'electrical'`) don't match IssueCategory enum
- Status value `'pending'` doesn't match IssueStatus enum
- `messages` structure doesn't match IssueMessage[] type
- `createIssue` function doesn't exist in storage.ts

**Ratings:**
- `overallRating` field doesn't exist on Rating type
- `createRating` function doesn't exist in storage.ts

### Required Actions:

1. **Check actual Supabase schema** for correct field types
2. **Add missing storage functions**:
   - `createMatch()`
   - `sendMessage()`
   - `createViewingRequest()`
   - `createIssue()`
   - `createRating()`
3. **Fix type mismatches** based on actual types in `/types/index.ts`
4. **Test with actual Supabase** connection

## ⏳ Steps 10-12 Remaining

### Step 10: Admin UI Seeding Button
- **File to create**: Update `src/pages/AdminDashboard.tsx`
- **Component to create**: `src/components/organisms/SeedDataModal.tsx`
- **Test to create**: `tests/e2e/admin/seedDataButton.spec.ts`

### Step 11: Verification Dashboard
- **File to create**: `src/pages/AdminDataVerificationPage.tsx`
- **Utility to create**: `src/utils/verifyTestData.ts`
- **Test to create**: `tests/integration/verifyTestData.test.ts`

### Step 12: Documentation & Scripts
- **Docs to create**: `TEST_DATA_GUIDE.md`
- **Scripts to create**:
  - `src/scripts/seedTestData.ts`
  - `src/scripts/clearTestData.ts`
  - `src/scripts/verifyTestData.ts`
- **Update**: `package.json` (add npm scripts)
- **Test to create**: `tests/e2e/testDataFlow.spec.ts`

## Quick Fix Guide

To get this working:

1. **Fix storage functions** - Add these to `src/lib/storage.ts`:
```typescript
export async function createMatch(match: Match): Promise<Match> {
  // Implementation
}

export async function sendMessage(message: Message): Promise<Message> {
  // Implementation
}

export async function createViewingRequest(viewing: ViewingPreference): Promise<ViewingPreference> {
  // Implementation
}

export async function createIssue(issue: Issue): Promise<Issue> {
  // Implementation
}

export async function createRating(rating: Rating): Promise<Rating> {
  // Implementation
}
```

2. **Fix type mismatches** - Update seeding files to match actual schema

3. **Test locally** before deploying:
```bash
npm run lint
npm run build
```

4. **Run seeding** (after fixing):
```typescript
import { seedAllTestData } from './src/utils/seedTestData';
await seedAllTestData({ clearExisting: true, verbose: true });
```

## Total Progress: 75% Complete

- ✅ Steps 1-9: Core seeding logic (ALL FILES CREATED)
- ⚠️ Type fixes needed (based on schema)
- ⏳ Steps 10-12: UI, verification, docs (NOT STARTED)
