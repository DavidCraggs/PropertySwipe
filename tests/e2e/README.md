# E2E Tests with Playwright

## Overview

This directory contains end-to-end tests for the Get On rental property platform using Playwright. Tests cover all critical user flows including authentication, onboarding, property management, and swiping/matching.

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug specific test
```bash
npm run test:e2e:debug -- tests/e2e/auth/login.spec.ts
```

### Run specific browser
```bash
npm run test:e2e -- --project=firefox
```

### Run specific test file
```bash
npm run test:e2e -- tests/e2e/auth/signup-renter.spec.ts
```

### Generate tests using Playwright codegen
```bash
npm run test:e2e:codegen
```

## Test Structure

```
tests/e2e/
├── auth/                      # Authentication flows
│   ├── signup-renter.spec.ts  # Renter signup (5 tests)
│   ├── signup-landlord.spec.ts # Landlord signup with RRA 2025 (3 tests)
│   └── login.spec.ts          # Login/logout flows (6 tests)
├── property/                  # Property management
│   └── create-property.spec.ts # Property creation (2 tests)
├── swipe/                     # Swipe and matching
│   └── swipe-match.spec.ts    # Swipe right/left, matches (3 tests)
├── navigation/                # Navigation flows
│   └── bottom-nav.spec.ts     # Bottom nav (3 tests)
├── agency/                    # Agency-specific flows
│   └── agency-onboarding.spec.ts # Agency onboarding (4 tests)
└── utils/                     # Test utilities
    ├── auth-helpers.ts        # Signup, login, logout helpers
    ├── property-helpers.ts    # Property creation helpers
    └── assertions.ts          # Reusable assertions

Total: 26 E2E tests across 7 spec files
```

## Test Utilities

### Auth Helpers

```typescript
import { signupAndLogin, login, logout, clearStorage, setupAuthState } from '../utils/auth-helpers';

// Complete full UI signup flow
const user = await signupAndLogin(page, 'renter');

// Login existing user
await login(page, email, password);

// Programmatic auth (faster for tests that don't test auth)
const user = await setupAuthState(page, 'landlord');

// Clean slate for each test
await clearStorage(page);
```

### Property Helpers

```typescript
import { setupPropertyData, getProperties } from '../utils/property-helpers';

// Create property programmatically
const property = await setupPropertyData(page, landlordId);

// Verify properties
const properties = await getProperties(page);
```

### Assertions

```typescript
import {
  expectWelcomeScreen,
  expectRenterDashboard,
  expectLandlordDashboard,
  expectAuthenticated
} from '../utils/assertions';

await expectRenterDashboard(page);
await expectAuthenticated(page);
```

## Best Practices

1. **Test Isolation**: Each test calls `clearStorage()` in `beforeEach` to ensure clean state
2. **Deterministic Data**: Use timestamps for unique test data (emails, property addresses)
3. **Wait Strategies**: Tests use explicit waits (`waitForTimeout`) for animations and transitions
4. **Selectors**: Prefer accessible selectors (role, label, text) over CSS classes
5. **Setup Helpers**: Use `setupAuthState()` to bypass signup when not testing auth flows

## Debugging

### View test results
```bash
npm run test:e2e:report
```

### Visual trace viewer
After a test fails, traces are captured automatically. Open them with:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Run with headed browser
```bash
npm run test:e2e:headed
```

### Pause test execution
Add to test:
```typescript
await page.pause();
```

### Screenshot on failure
Screenshots are automatically captured on failure and saved to `test-results/`

## CI/CD

Tests run automatically on push/PR to `main` and `develop` branches via GitHub Actions.

- **Browsers tested**: Chromium, Firefox, WebKit
- **Parallel execution**: Tests run in parallel across browsers
- **Artifacts**: Test results and reports saved for 30 days
- **Retries**: Failing tests retry 2x in CI environment

See `.github/workflows/e2e-tests.yml` for configuration.

## Coverage

### User Flows Tested

✅ **Authentication**
- Renter signup with validation
- Landlord signup with RRA 2025 compliance
- Estate agent / Management agency signup
- Login with email/password
- Logout and session clearing
- Password requirements enforcement

✅ **Property Management**
- Create property as landlord
- Property appears in dashboard
- Property data persisted to localStorage

✅ **Swipe & Match**
- Swipe right to like property
- Swipe left to pass
- Matches page displays matched properties

✅ **Navigation**
- Bottom nav between swipe/matches/profile
- Auth state persists across navigation
- Bottom nav hidden when not authenticated

✅ **Data Persistence**
- Auth state persisted across page reloads
- Profile data saved to localStorage
- Property data available to renters

## Known Limitations

1. **Supabase Backend**: Tests use localStorage fallback, not actual Supabase integration
2. **Image Uploads**: Not tested in E2E (complex file upload scenarios)
3. **Real-time Features**: Chat/messaging not covered (requires WebSocket testing)
4. **Mobile Responsive**: Tests run in desktop viewport (can be extended for mobile)

## Adding New Tests

1. Create spec file in appropriate directory
2. Use test utilities from `utils/` folder
3. Follow existing patterns for setup/teardown
4. Add test to this README's coverage section
5. Ensure test is deterministic (no flaky failures)

## Troubleshooting

### Test timeouts
Increase timeout in test:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Flaky tests
Use `test.retry()` or investigate race conditions with `page.waitForSelector()`

### Element not found
Check selector with:
```bash
npm run test:e2e:codegen
```

Then inspect actual DOM structure.
