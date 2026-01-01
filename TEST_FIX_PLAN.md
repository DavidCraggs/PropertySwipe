# Comprehensive Test Fix Plan

## Executive Summary

**Total Failing Tests: 106**
- Unit Tests: 52 failures (4 test files)
- E2E Tests: 54 failures (11 test files)

**Root Cause Categories:**
1. **Component Not Exported** - 27 failures (RenterIssueReporter)
2. **Test Flow Mismatch** - 15 failures (InviteCodePrompt blocking step rendering)
3. **Wrong Navigation Path** - 27 failures (tests look for nonexistent bottom nav buttons)
4. **localStorage Access in Node** - 7 failures (Playwright tests calling localStorage directly)
5. **Selector Ambiguity** - 6 failures (multiple elements match same selector)
6. **Implementation Gaps** - 24 failures (missing or mismatched functionality)

---

## Phase 1: Critical Export Fix (Impact: 27 Unit Tests)

### 1.1 Export RenterIssueReporter Component

**File:** `src/pages/CurrentRenterDashboard.tsx`

**Problem:** `RenterIssueReporter` is defined as a private component within the file but tests try to import it directly.

**Solution Options:**

**Option A: Extract to Separate File (Recommended)**
```
1. Create new file: src/components/organisms/RenterIssueReporter.tsx
2. Move the RenterIssueReporter component (lines 460-805) to this new file
3. Export it from the new file
4. Import and use it in CurrentRenterDashboard.tsx
5. Export from organisms/index.ts
6. Update test imports to: import { RenterIssueReporter } from '../../../src/components/organisms/RenterIssueReporter'
```

**Option B: Export from Existing File**
```typescript
// At end of CurrentRenterDashboard.tsx
export { RenterIssueReporter };
```

**Files to Modify:**
- `src/pages/CurrentRenterDashboard.tsx`
- `tests/unit/components/RenterIssueReporter.test.tsx` (update import path)
- Optionally: `src/components/organisms/index.ts`

**Expected Result:** 27 RenterIssueReporter tests should pass

---

## Phase 2: Test Flow Fix (Impact: 15 Unit Tests)

### 2.1 Fix RenterOnboarding Tests

**File:** `tests/unit/pages/RenterOnboarding.test.tsx`

**Problem:** Component shows `InviteCodePrompt` first, blocking step rendering. Tests expect to see step 0 immediately.

**Root Cause Analysis:**
```typescript
// RenterOnboarding.tsx line 286-300
if (showInvitePrompt) {
  return (
    <InviteCodePrompt
      onSkip={() => setShowInvitePrompt(false)}
      onValidCode={handleValidInviteCode}
      onBack={onLogin}
    />
  );
}
```

**Solution: Mock InviteCodePrompt or Skip It**

**Option A: Mock the Component**
```typescript
// At top of test file
vi.mock('../../../src/pages/InviteCodePrompt', () => ({
  InviteCodePrompt: () => null // Skip rendering
}));
```

**Option B: Provide Mock Props to Skip Prompt**
```typescript
// The component may need a prop like `skipInvitePrompt={true}`
// This would require modifying the component interface
```

**Option C: Add Test Helper to Dismiss Prompt**
```typescript
// In test setup
beforeEach(async () => {
  render(<RenterOnboarding onComplete={mockComplete} onLogin={mockLogin} />);
  // Click "Skip" button on InviteCodePrompt
  const skipButton = screen.queryByRole('button', { name: /skip/i });
  if (skipButton) {
    await userEvent.click(skipButton);
  }
});
```

**Files to Modify:**
- `tests/unit/pages/RenterOnboarding.test.tsx`

**Expected Result:** 15 RenterOnboarding tests should pass

---

## Phase 3: E2E Navigation Path Fixes (Impact: 27+ E2E Tests)

### 3.1 Fix renter-issue-reporting.spec.ts

**File:** `tests/e2e/issues/renter-issue-reporting.spec.ts`

**Problem:** Tests look for bottom nav button `/issues|maintenance/i` which doesn't exist. The Issues tab is inside CurrentRenterDashboard, not in the bottom nav.

**Current Wrong Approach:**
```typescript
await page.getByRole('button', { name: /issues|maintenance/i }).click();
```

**Correct Navigation Path:**
1. User must be authenticated as a "current renter" (with active tenancy)
2. Navigate to "My Tenancy" page via bottom nav
3. Click "Issues & Maintenance" tab within the page
4. Then interact with issue reporting form

**Solution:**
```typescript
// Step 1: Setup current renter with active tenancy
await setupCurrentRenterWithTenancy(page);

// Step 2: Navigate to My Tenancy page (bottom nav)
await page.getByRole('button', { name: /my tenancy/i }).click();
await page.waitForTimeout(500);

// Step 3: Click Issues tab within the page
await page.getByRole('tab', { name: /issues.*maintenance/i }).click();
// OR
await page.getByText(/issues & maintenance/i).click();
await page.waitForTimeout(500);

// Step 4: Now interact with issue form
await page.getByRole('button', { name: /report new issue/i }).click();
```

**Additional Issue:** Test setup must create a renter with an ACTIVE tenancy, not just a renter profile.

**Files to Modify:**
- `tests/e2e/issues/renter-issue-reporting.spec.ts`
- `tests/e2e/utils/auth-helpers.ts` (add helper for current renter setup)

### 3.2 Fix issue-management.spec.ts

**Same navigation path issue as above.** Tests for agency managing issues need:
1. Agency authenticated
2. Navigate to proper dashboard
3. Find issues through correct UI path

---

## Phase 4: Fix localStorage Access in Node Context (Impact: 7 E2E Tests)

### 4.1 Fix renter-invite-flow.spec.ts

**File:** `tests/e2e/onboarding/renter-invite-flow.spec.ts`

**Problem 1:** Tests call `localStorage` directly in Node.js context (test setup)
```typescript
// Line 78 - WRONG
localStorage.clear();

// Line 98 - WRONG (also has typo: ' properties' with leading space)
localStorage.setItem(' properties', JSON.stringify([mockProperty]));
```

**Solution: Use Playwright's page.evaluate()**
```typescript
// Correct approach for E2E tests
test.beforeEach(async ({ page }) => {
  // Clear localStorage via browser context
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Set data via browser context
  await page.evaluate((property) => {
    localStorage.setItem('properties', JSON.stringify([property]));
  }, mockProperty);
});
```

**Problem 2:** Key typo - `' properties'` should be `'properties'`

**Problem 3:** Direct import and call of storage functions in Node context
```typescript
// Line 131 - WRONG
await createRenterInvite({ ... }); // This calls localStorage directly
```

**Solution:**
```typescript
// Create invite via browser context
await page.evaluate((inviteData) => {
  const stored = localStorage.getItem('renter-invites');
  const invites = stored ? JSON.parse(stored) : [];
  invites.push(inviteData);
  localStorage.setItem('renter-invites', JSON.stringify(invites));
}, inviteData);
```

**Files to Modify:**
- `tests/e2e/onboarding/renter-invite-flow.spec.ts`
- Potentially create `tests/e2e/utils/storage-helpers.ts` for reusable localStorage functions

---

## Phase 5: Fix Selector Ambiguity (Impact: 6 E2E Tests)

### 5.1 Fix bottom-nav.spec.ts Strict Mode Violations

**File:** `tests/e2e/navigation/bottom-nav.spec.ts`

**Problem:** Selector `getByText(/matches/i)` finds 3 elements:
1. `<h2>No Matches Yet</h2>`
2. `<p>Keep swiping! When you like a property...</p>`
3. `<span>Matches</span>` (bottom nav button)

**Solution: Use More Specific Selectors**
```typescript
// WRONG - ambiguous
await expect(page.getByText(/matches/i)).toBeVisible();

// RIGHT - target the specific element
await expect(page.getByRole('heading', { name: /no matches yet/i })).toBeVisible();
// OR target the bottom nav button specifically
await expect(page.getByRole('button', { name: 'Matches' })).toBeVisible();
```

### 5.2 Fix swipe-match.spec.ts Selector Issues

**Same pattern:** Tests use `/matches|matched/i` which matches multiple elements.

**Files to Modify:**
- `tests/e2e/navigation/bottom-nav.spec.ts`
- `tests/e2e/swipe/swipe-match.spec.ts`

---

## Phase 6: Fix Implementation Gaps (Impact: 24 Tests)

### 6.1 Fix useAuthStore loginWithPassword

**File:** `src/hooks/useAuthStore.ts`

**Problem:** Tests expect a `loginWithPassword` function that may not exist or not work correctly.

**Expected Behavior:**
```typescript
interface LoginResult {
  success: boolean;
  error?: string;
}

loginWithPassword(email: string, password: string): Promise<LoginResult>
```

**Tests Expect:**
1. Match email case-insensitively
2. Hash the input password and compare to stored hash
3. Return `{ success: true }` on match
4. Return `{ success: false, error: 'Invalid credentials' }` on mismatch

**Action:** Verify function exists and implement if missing.

### 6.2 Fix createIssue SLA Calculation

**File:** `src/lib/storage.ts` (or `src/lib/createIssue.ts`)

**Problem:** SLA deadline calculation may not match test expectations.

**Expected SLA Values:**
| Priority | Hours |
|----------|-------|
| Emergency | 4 |
| Urgent | 24 |
| Routine | 72 |
| Low | 168 |

**Agency Override:** When `agencyId` provided, fetch agency profile and use custom SLA values.

**Action:** Verify createIssue function calculates SLA correctly.

### 6.3 Fix createIssue Edge Cases

**Problems:**
1. Empty images array - should be handled gracefully
2. Whitespace preservation in subject/description
3. `isOverdue` should initialize to `false`

---

## Phase 7: Fix Remaining E2E Test Issues

### 7.1 Fix property/create-property.spec.ts

**Problem:** Tests can't find "Add Property" button after landlord login.

**Likely Cause:**
- Landlord not properly authenticated
- Dashboard not rendering correctly
- Button has different text/role

**Action:** Verify LandlordDashboard renders "Add Property" button correctly.

### 7.2 Fix rating/rating-flow.spec.ts

**Problems:**
1. Can't find `/ended/i` text for ended tenancy
2. Can't find `/rated.*✓/i` badge
3. Can't find `/your ratings/i` section

**Likely Cause:** Tests assume UI elements that may have different text or structure.

**Action:** Compare test selectors with actual ProfilePage and MatchesPage components.

### 7.3 Fix auth/login.spec.ts

**Problem:** Firefox can't find "Log In" button on renter onboarding page.

**Likely Cause:** Button text might be different or element might not be rendered.

---

## Implementation Order

### Priority 1: Quick Wins (1 hour)
1. **Phase 1.1** - Export RenterIssueReporter (fixes 27 tests)
2. **Phase 4.1** - Fix localStorage typo (fixes data loading)

### Priority 2: Test Flow Fixes (2 hours)
3. **Phase 2.1** - Mock InviteCodePrompt (fixes 15 tests)
4. **Phase 4** - All localStorage/page.evaluate fixes (fixes 7 tests)

### Priority 3: Navigation Fixes (3 hours)
5. **Phase 3** - Update E2E navigation paths (fixes 27+ tests)
6. **Phase 5** - Fix selector ambiguity (fixes 6 tests)

### Priority 4: Implementation Verification (2 hours)
7. **Phase 6** - Verify/fix implementations (fixes 24 tests)

### Priority 5: Remaining E2E (2 hours)
8. **Phase 7** - Fix remaining E2E issues

---

## Estimated Impact

| Phase | Tests Fixed | Effort |
|-------|-------------|--------|
| Phase 1 | 27 | Low |
| Phase 2 | 15 | Low |
| Phase 3 | 27 | Medium |
| Phase 4 | 7 | Low |
| Phase 5 | 6 | Low |
| Phase 6 | 24 | Medium-High |
| Phase 7 | Variable | Medium |

**Total Estimated: 106 tests fixed**

---

## Files to Modify Summary

### Source Files:
1. `src/pages/CurrentRenterDashboard.tsx` - Export RenterIssueReporter
2. `src/hooks/useAuthStore.ts` - Verify loginWithPassword
3. `src/lib/storage.ts` - Verify createIssue SLA calculation

### Test Files:
1. `tests/unit/components/RenterIssueReporter.test.tsx` - Update import
2. `tests/unit/pages/RenterOnboarding.test.tsx` - Add InviteCodePrompt handling
3. `tests/e2e/onboarding/renter-invite-flow.spec.ts` - Fix localStorage access
4. `tests/e2e/issues/renter-issue-reporting.spec.ts` - Fix navigation path
5. `tests/e2e/issues/issue-management.spec.ts` - Fix navigation path
6. `tests/e2e/navigation/bottom-nav.spec.ts` - Fix selectors
7. `tests/e2e/swipe/swipe-match.spec.ts` - Fix selectors
8. `tests/e2e/utils/auth-helpers.ts` - Add currentRenter setup helper

### New Files (Optional):
1. `src/components/organisms/RenterIssueReporter.tsx` - Extracted component
2. `tests/e2e/utils/storage-helpers.ts` - Browser localStorage helpers

---

## Verification Steps

After each phase:
1. Run `npm run test:run tests/unit/` for unit tests
2. Run `npm run test:e2e` for E2E tests
3. Check specific test file: `npm run test:run tests/path/to/file.test.tsx`

---

## Notes

1. **Timeouts are symptoms, not causes** - Every timeout in these tests is because an element doesn't exist or has a different name/role. Increasing timeout won't help.

2. **E2E tests run in browser context** - Any direct `localStorage` call in test setup code fails because Node.js doesn't have localStorage. Use `page.evaluate()`.

3. **Test isolation is important** - Each test should set up its own state, not rely on previous tests.

4. **Selector specificity matters** - Use `getByRole` with specific names rather than `getByText` with regex to avoid ambiguity.
