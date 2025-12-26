# PropertySwipe - Haiku Implementation Plan
**Purpose:** Step-by-step tasks optimized for Claude Haiku model execution

---

## Overview

This plan contains 42 discrete, atomic tasks. Each task is:
- Self-contained with specific file paths and line numbers
- Copy-paste ready with before/after code
- Verifiable with simple lint check

**Priority Order:**
1. HIGH - Production code fixes
2. MEDIUM - Utility/seed file fixes
3. LOW - Test file fixes (optional)

---

## PHASE 1: Production Code `any` Types (18 fixes)
**Time Estimate:** 15-20 minutes total
**Verification:** `npx tsc --noEmit` after each fix

---

### Task 1.1: Fix storage.ts line 339
**File:** `src/lib/storage.ts`
**Line:** 339
**Issue:** `any` type in save function

**Find:**
```typescript
const existingData: any = {
```

**Replace with:**
```typescript
const existingData: Record<string, unknown> = {
```

---

### Task 1.2: Fix storage.ts line 478
**File:** `src/lib/storage.ts`
**Line:** 478
**Issue:** `any` type in property mapper

**Find:**
```typescript
const mapper: any = {
```

**Replace with:**
```typescript
const mapper: Record<string, unknown> = {
```

---

### Task 1.3: Fix storage.ts line 706
**File:** `src/lib/storage.ts`
**Line:** 706
**Issue:** `any` type in match transformer

**Find:**
```typescript
function transformMatch(m: any):
```

**Replace with:**
```typescript
function transformMatch(m: Record<string, unknown>):
```

---

### Task 1.4: Fix storage.ts line 828
**File:** `src/lib/storage.ts`
**Line:** 828
**Issue:** `any` type assertion

**Find:**
```typescript
} : {} as any,
```

**Replace with:**
```typescript
} : {} as Record<string, unknown>,
```

---

### Task 1.5: Fix storage.ts line 888
**File:** `src/lib/storage.ts`
**Line:** 888
**Issue:** `any` type for update data (already partially fixed)

**Verify this line uses `Record<string, any>` - if so, leave as is (intentional for Supabase)**

---

### Task 1.6: Fix storage.ts line 939
**File:** `src/lib/storage.ts`
**Line:** 939
**Issue:** `any` in viewing request

**Find:**
```typescript
const viewingData: any = {
```

**Replace with:**
```typescript
const viewingData: Record<string, unknown> = {
```

---

### Task 1.7: Fix storage.ts line 1362
**File:** `src/lib/storage.ts`
**Line:** 1362

**Find pattern and replace `any` with `Record<string, unknown>`**

---

### Task 1.8: Fix storage.ts line 1646
**File:** `src/lib/storage.ts`
**Line:** 1646

**Find pattern and replace `any` with `Record<string, unknown>`**

---

### Task 1.9: Fix storage.ts line 1747
**File:** `src/lib/storage.ts`
**Line:** 1747

**Find pattern and replace `any` with appropriate type**

---

### Task 1.10: Fix storage.ts line 2042
**File:** `src/lib/storage.ts`
**Line:** 2042

**Find pattern and replace `any` with `Record<string, unknown>`**

---

### Task 1.11: Fix storage.ts lines 2104 (2 instances)
**File:** `src/lib/storage.ts`
**Line:** 2104

**Find the line with two `any` types and fix both**

---

### Task 1.12: Fix storage.ts lines 2212-2213
**File:** `src/lib/storage.ts`
**Lines:** 2212, 2213

**Fix both `any` types on these lines**

---

### Task 1.13: Fix storage.ts line 2558
**File:** `src/lib/storage.ts`
**Line:** 2558

**Find:**
```typescript
function transformSupabasePropertyToApp(data: any): Property
```

**Replace with:**
```typescript
function transformSupabasePropertyToApp(data: Record<string, unknown>): Property
```

---

### Task 1.14: Fix storage.ts line 2821
**File:** `src/lib/storage.ts`
**Line:** 2821

**Find:**
```typescript
const createdMatch = await saveMatch(match as any);
```

**Replace with proper type or `as Match`**

---

### Task 1.15: Fix MatchesPage.tsx line 230
**File:** `src/pages/MatchesPage.tsx`
**Line:** 230
**Issue:** `senderType: userType as any`

**Find:**
```typescript
senderType: userType as any,
```

**Replace with:**
```typescript
senderType: userType as 'renter' | 'landlord' | 'agency',
```

---

### Task 1.16: Fix ProfilePage.tsx line 115
**File:** `src/pages/ProfilePage.tsx`
**Line:** 115
**Issue:** `(currentUser as any).companyName`

**Find:**
```typescript
? (currentUser as any).companyName
```

**Replace with:**
```typescript
? (currentUser as AgencyProfile).companyName
```

**Also add import if missing:**
```typescript
import type { AgencyProfile } from '../types';
```

---

### Task 1.17: Fix FormField.tsx line 141
**File:** `src/components/molecules/FormField.tsx`
**Line:** 141
**Issue:** `any` in props spread

**This may need `Record<string, any>` for input spread - verify and keep if intentional**

---

### Task 1.18: Fix checkSeedData.ts line 80
**File:** `src/scripts/checkSeedData.ts`
**Line:** 80

**Find:**
```typescript
let conversations: any[] | null
```

**Replace with:**
```typescript
let conversations: Conversation[] | null
```

**Add import if needed:**
```typescript
import type { Conversation } from '../types';
```

---

## PHASE 2: Remove Unused Variables (6 fixes)
**Time Estimate:** 5 minutes
**Verification:** `npm run lint 2>&1 | grep "never used"`

---

### Task 2.1: Fix LandlordOnboarding.tsx line 95
**File:** `src/pages/LandlordOnboarding.tsx`
**Line:** 95
**Issue:** `propertyListingLink` is assigned but never used

**Option A - Remove the variable:**
```typescript
// Delete or comment out the unused assignment
```

**Option B - Prefix with underscore:**
```typescript
const _propertyListingLink = ...
```

---

### Task 2.2: Fix VendorOnboarding.tsx line 71
**File:** `src/pages/VendorOnboarding.tsx`
**Line:** 71
**Issue:** `estateAgentLink` is assigned but never used

**Prefix with underscore or remove if not needed**

---

### Task 2.3: Fix EmailService.ts line 423
**File:** `src/services/EmailService.ts`
**Line:** 423
**Issue:** `_notification` is defined but never used

**Find the function parameter and either use it or prefix properly**

---

### Task 2.4: Fix filters.ts lines 348, 350
**File:** `src/utils/filters.ts`
**Lines:** 348, 350
**Issue:** `_minRating` and `_property` unused

**These appear to be intentionally prefixed - verify the underscore is present**

If they're already prefixed, this may be a false positive from function parameters.

---

## PHASE 3: Fix React Hook Dependencies (2 fixes)
**Time Estimate:** 2 minutes
**Verification:** `npm run lint 2>&1 | grep "exhaustive-deps"`

---

### Task 3.1: Fix CurrentRenterDashboard.tsx line 103
**File:** `src/pages/CurrentRenterDashboard.tsx`
**Line:** 103
**Issue:** Missing `addToast` in useEffect dependency array

**Find the useEffect near line 103 and add `addToast` to dependencies**

---

### Task 3.2: Fix MatchesPage.tsx line 148
**File:** `src/pages/MatchesPage.tsx`
**Line:** 148
**Issue:** Missing `addToast` in useEffect dependency array

**Find:**
```typescript
}, [selectedMatch]);
```

**This should already be fixed - verify line 174 has `addToast` in dependencies**

---

## PHASE 4: Seed File `any` Types (18 fixes)
**Time Estimate:** 10 minutes
**Priority:** LOW - These are development/seeding scripts

---

### Task 4.1: Fix seedProperties.ts (5 instances)
**File:** `src/utils/seedProperties.ts`
**Lines:** 77, 80, 82, 148, 149

**Pattern:** Replace `property as any` with proper Property type assertions

---

### Task 4.2: Fix seedUserProfiles.ts (4 instances)
**File:** `src/utils/seedUserProfiles.ts`
**Lines:** 56, 93, 96, 123

**Pattern:** Replace `profile as any` with proper Profile type assertions

---

### Task 4.3: Fix seedViewingRequests.ts (3 instances)
**File:** `src/utils/seedViewingRequests.ts`
**Lines:** 19, 41, 62

**Pattern:** Replace `viewing: any` with `viewing: ViewingPreference`

---

### Task 4.4: Fix seedMaintenanceIssues.ts (3 instances)
**File:** `src/utils/seedMaintenanceIssues.ts`
**Lines:** 21, 84, 135

**Pattern:** Replace `issue: any` with `issue: Issue`

---

### Task 4.5: Fix seedRatings.ts (2 instances)
**File:** `src/utils/seedRatings.ts`
**Lines:** 18, 49

**Pattern:** Replace `rating: any` with `rating: Rating`

---

### Task 4.6: Fix seedHelpers.ts line 166
**File:** `src/utils/seedHelpers.ts`
**Line:** 166

**Replace `any` with appropriate type**

---

## PHASE 5: Fix Failing Unit Tests (3 fixes)
**Time Estimate:** 15-20 minutes
**Priority:** MEDIUM

---

### Task 5.1: Fix RenterOnboarding.test.tsx placeholder mismatch
**File:** `tests/unit/pages/RenterOnboarding.test.tsx`
**Line:** ~434
**Issue:** Test looks for `'your@email.com'` but component may use different placeholder

**Steps:**
1. Read the actual RenterOnboarding component email input
2. Find the actual placeholder text
3. Update test to match:
```typescript
await user.type(screen.getByPlaceholderText('actual@placeholder.text'), 'test@example.com');
```

---

### Task 5.2: Fix seedHelpers.test.ts generatePlaceholderImage
**File:** `tests/unit/seedHelpers.test.ts`
**Issue:** Test for custom dimensions failing

**Steps:**
1. Read the test to understand expected behavior
2. Check if `generatePlaceholderImage` function exists and accepts dimensions
3. Fix test assertions or function implementation

---

### Task 5.3: Fix RenterIssueReporter.test.tsx
**File:** `tests/unit/components/RenterIssueReporter.test.tsx`
**Issue:** Component query/DOM mismatch

**Steps:**
1. Read the component structure
2. Update test queries to match current DOM
3. May need to update button text or form field queries

---

## PHASE 6: Test File `any` Types (Optional - 112 fixes)
**Time Estimate:** 30+ minutes
**Priority:** LOW - Test files don't affect production

---

### Task 6.1-6.X: Fix test file `any` types
**Files:**
- `tests/e2e/*.spec.ts` - 60+ instances
- `tests/unit/**/*.test.tsx` - 40+ instances
- `tests/utils/testHelpers.ts` - 4 instances

**Pattern:** Replace `any` with appropriate mock/test types

**Note:** These can be batch-fixed using ESLint's `--fix` for some, or systematically replaced with `unknown` or specific types.

---

## Verification Commands

After each phase, run:

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Check ESLint errors (should decrease)
npm run lint 2>&1 | tail -5

# Run tests (should maintain or improve pass rate)
npm run test:run 2>&1 | tail -10
```

---

## Expected Results After Full Implementation

| Metric | Current | Target |
|--------|---------|--------|
| ESLint Errors | 207 | <50 |
| TypeScript Errors | 0 | 0 |
| Unit Test Pass Rate | 95.5% | 98%+ |
| `any` in prod code | 18 | 0 |

---

## Notes for Haiku

1. **Read Before Edit:** Always read the file section before making changes
2. **Verify Types:** When replacing `any`, check what type the variable actually holds
3. **Import Types:** Add type imports at the top of files when needed
4. **Test After Changes:** Run `npx tsc --noEmit` after each file modification
5. **Preserve Functionality:** Don't change logic, only type annotations
6. **Record<string, unknown>:** Use this for dynamic object types when specific type is unclear
7. **Type Assertions:** Use `as Type` only when you're certain of the type

---

## Quick Reference: Type Replacements

| Original | Replacement | When to Use |
|----------|-------------|-------------|
| `any` | `unknown` | Don't know the type, need type narrowing |
| `any` | `Record<string, unknown>` | Dynamic object from API/database |
| `any` | `Record<string, any>` | Intentional dynamic spread (keep) |
| `foo as any` | `foo as SpecificType` | Know the actual type |
| `param: any` | `param: ExpectedType` | Function parameter with known type |

