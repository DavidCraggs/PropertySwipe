# COMPREHENSIVE PLAYWRIGHT E2E TESTING IMPLEMENTATION

## CONTEXT & OBJECTIVES

You are implementing end-to-end (E2E) automated testing using Playwright for **Get On** - a UK rental property platform (Tinder for properties). The app is built with React 19, TypeScript (strict mode), Vite 7, Tailwind CSS 4, Zustand (state), and has 525 passing Vitest unit/integration tests.

**CRITICAL REQUIREMENTS:**
- Senior developer code quality - NO placeholders, NO TODOs, NO incomplete implementations
- Full TypeScript strict mode compliance
- Follow existing patterns from codebase exactly
- All tests must be deterministic and reliable
- Tests must run in CI/CD environment (headless mode)
- Use Playwright's best practices for speed and stability

## PROJECT STRUCTURE ANALYSIS

```
PropertySwipe/
├── src/
│   ├── App.tsx                    # Main router with state-based routing
│   ├── pages/                     # 15 page components
│   │   ├── WelcomeScreen.tsx      # Landing page
│   │   ├── RoleSelectionScreen.tsx # Choose: renter/landlord/agency
│   │   ├── LoginPage.tsx          # Email/password login
│   │   ├── RenterOnboarding.tsx   # Multi-step renter signup
│   │   ├── LandlordOnboarding.tsx # Multi-step landlord signup
│   │   ├── AgencyOnboarding.tsx   # Multi-step agency signup
│   │   ├── SwipePage.tsx          # Renter: swipe properties
│   │   ├── LandlordDashboard.tsx  # Landlord: manage properties
│   │   ├── AgencyDashboard.tsx    # Agency: manage clients
│   │   ├── MatchesPage.tsx        # View matches
│   │   └── ProfilePage.tsx        # User profile
│   ├── components/
│   │   ├── atoms/Button.tsx
│   │   ├── molecules/LoginButton.tsx  # Top-right login button
│   │   └── organisms/BottomNav.tsx
│   ├── hooks/
│   │   ├── useAuthStore.ts        # Zustand auth (localStorage-backed)
│   │   └── useAppStore.ts         # Zustand app state (properties, matches)
│   ├── lib/
│   │   ├── storage.ts             # localStorage/Supabase abstraction
│   │   └── supabase.ts            # Optional backend
│   ├── types/index.ts             # UserType: renter|landlord|estate_agent|management_agency
│   └── utils/validation.ts        # Password/email validation
├── tests/
│   ├── setup.ts                   # Vitest setup (mocks matchMedia, IntersectionObserver)
│   ├── unit/                      # 13 unit test files
│   └── integration/               # 4 integration test files
├── package.json                   # React 19, Vite 7, Vitest 3, no Playwright yet
├── vite.config.ts                 # Dev server on port 5173
├── vitest.config.ts               # jsdom environment
└── tsconfig.app.json              # Strict: true, ES2022, bundler resolution

EXISTING TESTS: 20 test files, 525 passing tests (unit + Vitest integration)
```

## KEY APP BEHAVIORS (CRITICAL FOR E2E)

### 1. Routing (State-Based, NOT React Router)
```typescript
// App.tsx uses local state for routing:
type Route = 'welcome' | 'role-select' | 'login' | 'renter-onboarding' | 'landlord-onboarding' | 'agency-onboarding' | 'app';
const [currentRoute, setCurrentRoute] = useState<Route>('welcome');

// Navigation happens via callbacks, e.g.:
onLogin={() => setCurrentRoute('login')}
onGetStarted={() => setCurrentRoute('role-select')}
```

### 2. Authentication (localStorage + Zustand)
```typescript
// useAuthStore (Zustand with persistence):
interface AuthStore {
  isAuthenticated: boolean;
  userType: 'renter' | 'landlord' | 'estate_agent' | 'management_agency' | null;
  currentUser: RenterProfile | LandlordProfile | AgencyProfile | null;
  login(userType, profile): Promise<void>;
  loginWithPassword(email, password): Promise<boolean>;
  logout(): void;
}

// Storage keys:
// - get-on-auth (Zustand auth state)
// - get-on-renter-profiles (array of RenterProfile)
// - get-on-landlord-profiles (array of LandlordProfile)
// - get-on-agency-profiles (array of AgencyProfile)
// - get-on-properties (array of Property)
// - get-on-has-visited (boolean string)
```

### 3. Password Requirements
```typescript
// From validation.ts:
// - Min 8 characters
// - At least 1 uppercase, 1 lowercase, 1 number
// - At least 1 special character: !@#$%^&*()_+-=[]{}|;:',.<>?/~`"
// Example valid password: "TestPass123!"
```

### 4. Multi-Step Onboarding
```typescript
// All onboarding flows use step state:
const [currentStep, setCurrentStep] = useState(0);

// RenterOnboarding: 5 steps (0-4)
//   Step 0: Email, password, name, age
//   Step 1: Location preferences
//   Step 2: Income, employment
//   Step 3: Move-in date
//   Step 4: Review & submit

// LandlordOnboarding: 5 steps (0-4)
//   Step 0: Email, password, name
//   Step 1: Property type
//   Step 2: Property details
//   Step 3: RRA 2025 compliance (PRS registration, ombudsman)
//   Step 4: Review & submit

// AgencyOnboarding: 4 steps (0-3)
//   Step 0: Email, password, company name, agency type
//   Step 1: Contact details
//   Step 2: Address & service areas
//   Step 3: Review & submit
```

### 5. User Flows
```
FLOW 1: Renter Signup → Swipe Properties → Match
1. Land on welcome screen
2. Click "Get On" button → RoleSelectionScreen
3. Select "I'm Looking to Rent" → RenterOnboarding
4. Complete 5 steps → SwipePage
5. Swipe right on property → Match created

FLOW 2: Landlord Signup → Create Property → View Matches
1. Land on welcome screen
2. Click "Get On" → Select "I'm a Landlord" → LandlordOnboarding
3. Complete 5 steps (including RRA 2025 compliance) → LandlordDashboard
4. Click "Add Property" → Fill details → Property created
5. Navigate to Matches → See interested renters

FLOW 3: Existing User Login
1. Land on welcome screen
2. Click top-right "Log In" button (LoginButton) → LoginPage
3. Enter email/password → Verify → Dashboard

FLOW 4: Agency Onboarding → Link with Landlord
1. Select "Estate Agent" or "Management Agency" → AgencyOnboarding
2. Complete 4 steps → AgencyDashboard
3. Send invitation to landlord → Landlord accepts → Property linked
```

## IMPLEMENTATION TASKS

### TASK 1: INSTALL & CONFIGURE PLAYWRIGHT

**1.1 Install Playwright:**
```bash
npm install -D @playwright/test
npx playwright install
```

**1.2 Create `playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**1.3 Update `.gitignore`:**
Add:
```
# Playwright
test-results/
playwright-report/
playwright/.cache
```

**1.4 Update `package.json` scripts:**
Add to existing scripts:
```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:report": "playwright show-report"
}
```

**1.5 Create TypeScript config for E2E:**
Create `tsconfig.e2e.json`:
```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "types": ["node", "@playwright/test"],
    "noEmit": true
  },
  "include": ["tests/e2e/**/*.ts"]
}
```

### TASK 2: CREATE E2E TEST UTILITIES

**2.1 Create `tests/e2e/utils/auth-helpers.ts`:**
```typescript
import { Page } from '@playwright/test';
import type { UserType, RenterProfile, LandlordProfile, AgencyProfile } from '../../../src/types';

export interface TestUser {
  email: string;
  password: string;
  userType: UserType;
  profile: RenterProfile | LandlordProfile | AgencyProfile;
}

/**
 * Create a test user and login via UI
 * Completes full onboarding flow
 */
export async function signupAndLogin(page: Page, userType: UserType): Promise<TestUser> {
  const timestamp = Date.now();
  const testUser: TestUser = {
    email: `test-${userType}-${timestamp}@example.com`,
    password: 'SecureTest123!',
    userType,
    profile: {} as any, // Will be populated during signup
  };

  // Navigate to welcome screen
  await page.goto('/');

  // Click "Get On" button
  await page.getByRole('button', { name: /get on/i }).click();

  // Select role based on userType
  if (userType === 'renter') {
    await page.getByRole('button', { name: /i'm looking to rent/i }).click();
  } else if (userType === 'landlord') {
    await page.getByRole('button', { name: /i'm a landlord/i }).click();
  } else if (userType === 'estate_agent') {
    await page.getByRole('button', { name: /i'm an estate agent/i }).click();
  } else if (userType === 'management_agency') {
    await page.getByRole('button', { name: /i'm a management agency/i }).click();
  }

  // Complete onboarding based on user type
  if (userType === 'renter') {
    await completeRenterOnboarding(page, testUser);
  } else if (userType === 'landlord') {
    await completeLandlordOnboarding(page, testUser);
  } else if (userType === 'estate_agent' || userType === 'management_agency') {
    await completeAgencyOnboarding(page, testUser);
  }

  return testUser;
}

async function completeRenterOnboarding(page: Page, user: TestUser) {
  // Step 0: Personal info
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).first().fill(user.password);
  await page.getByLabel(/confirm password/i).fill(user.password);
  await page.getByLabel(/name/i).fill('Test Renter');
  await page.getByLabel(/age/i).fill('28');
  await page.getByRole('button', { name: /next/i }).click();

  // Step 1: Location preferences
  await page.getByLabel(/preferred areas/i).click();
  await page.getByText('Liverpool').click();
  await page.getByRole('button', { name: /next/i }).click();

  // Step 2: Income & employment
  await page.getByLabel(/monthly income/i).fill('3000');
  await page.getByLabel(/employment status/i).selectOption('Employed Full-Time');
  await page.getByRole('button', { name: /next/i }).click();

  // Step 3: Move-in date
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  await page.getByLabel(/move-in date/i).fill(futureDate.toISOString().split('T')[0]);
  await page.getByRole('button', { name: /next/i }).click();

  // Step 4: Review & submit
  await page.getByRole('button', { name: /complete profile|submit/i }).click();

  // Wait for dashboard
  await page.waitForURL(/.*/, { waitUntil: 'networkidle' });
}

async function completeLandlordOnboarding(page: Page, user: TestUser) {
  // Step 0: Basic info
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).first().fill(user.password);
  await page.getByLabel(/confirm password/i).fill(user.password);
  await page.getByLabel(/name/i).fill('Test Landlord');
  await page.getByRole('button', { name: /next/i }).click();

  // Step 1: Property type
  await page.getByRole('button', { name: /flat/i }).first().click();
  await page.getByRole('button', { name: /next/i }).click();

  // Step 2: Property details (skip for now - not always required)
  await page.getByRole('button', { name: /next|skip/i }).click();

  // Step 3: RRA 2025 compliance
  await page.getByLabel(/prs registration number/i).fill('PRS-TEST-12345');
  await page.getByLabel(/ombudsman scheme/i).selectOption('property_redress_scheme');

  // Check all certification checkboxes
  const checkboxes = await page.getByRole('checkbox').all();
  for (const checkbox of checkboxes) {
    await checkbox.check();
  }

  await page.getByRole('button', { name: /next/i }).click();

  // Step 4: Review & submit
  await page.getByRole('button', { name: /complete profile|submit/i }).click();

  // Wait for dashboard
  await page.waitForURL(/.*/, { waitUntil: 'networkidle' });
}

async function completeAgencyOnboarding(page: Page, user: TestUser) {
  // Step 0: Basic info
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).first().fill(user.password);
  await page.getByLabel(/confirm password/i).fill(user.password);
  await page.getByLabel(/company name/i).fill('Test Agency Ltd');
  await page.getByRole('button', { name: /next/i }).click();

  // Step 1: Contact details
  await page.getByLabel(/primary contact name/i).fill('Test Contact');
  await page.getByLabel(/phone/i).fill('01234567890');
  await page.getByRole('button', { name: /next/i }).click();

  // Step 2: Address & service areas
  await page.getByLabel(/street/i).fill('123 Test Street');
  await page.getByLabel(/city/i).fill('Liverpool');
  await page.getByLabel(/postcode/i).fill('L1 1AA');
  await page.getByLabel(/service areas/i).click();
  await page.getByText('Liverpool').click();
  await page.getByRole('button', { name: /next/i }).click();

  // Step 3: Review & submit
  await page.getByRole('button', { name: /complete profile|submit/i }).click();

  // Wait for dashboard
  await page.waitForURL(/.*/, { waitUntil: 'networkidle' });
}

/**
 * Login existing user via UI
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/');

  // Click top-right login button
  await page.getByRole('button', { name: /log in/i }).click();

  // Fill login form
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in|sign in/i }).click();

  // Wait for navigation
  await page.waitForURL(/.*/, { waitUntil: 'networkidle' });
}

/**
 * Logout via UI
 */
export async function logout(page: Page) {
  // Navigate to profile page
  await page.getByRole('button', { name: /profile/i }).click();

  // Click logout button
  await page.getByRole('button', { name: /log out|logout/i }).click();

  // Should return to welcome screen
  await page.waitForURL('/');
}

/**
 * Clear all localStorage (useful for test isolation)
 */
export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Setup authenticated state programmatically (bypass UI)
 * Faster for tests that don't need to verify signup/login flows
 */
export async function setupAuthState(page: Page, userType: UserType): Promise<TestUser> {
  const timestamp = Date.now();
  const testUser: TestUser = {
    email: `test-${userType}-${timestamp}@example.com`,
    password: 'SecureTest123!',
    userType,
    profile: createMockProfile(userType, timestamp),
  };

  await page.goto('/');

  await page.evaluate(({ user, profile }) => {
    // Import validation to hash password
    import('../../../src/utils/validation.js').then(({ hashPassword }) => {
      hashPassword(user.password).then(hash => {
        const profileWithHash = { ...profile, passwordHash: hash };

        // Save to appropriate localStorage key
        const storageKey = user.userType === 'renter'
          ? 'get-on-renter-profiles'
          : user.userType === 'landlord'
          ? 'get-on-landlord-profiles'
          : 'get-on-agency-profiles';

        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existing.push(profileWithHash);
        localStorage.setItem(storageKey, JSON.stringify(existing));

        // Set auth state
        const authState = {
          state: {
            isAuthenticated: true,
            userType: user.userType,
            currentUser: profileWithHash,
            onboardingStep: 0,
          },
          version: 0,
        };
        localStorage.setItem('get-on-auth', JSON.stringify(authState));
      });
    });
  }, { user: testUser, profile: testUser.profile });

  // Reload to apply auth state
  await page.reload();

  return testUser;
}

function createMockProfile(userType: UserType, timestamp: number): any {
  const baseProfile = {
    id: `test-${userType}-${timestamp}`,
    email: `test-${userType}-${timestamp}@example.com`,
    onboardingComplete: true,
  };

  if (userType === 'renter') {
    return {
      ...baseProfile,
      names: 'Test Renter',
      ages: '28',
      monthlyIncome: 3000,
      status: 'prospective',
      preferredAreas: ['Liverpool'],
    };
  } else if (userType === 'landlord') {
    return {
      ...baseProfile,
      names: 'Test Landlord',
      propertyType: 'Flat',
      prsRegistrationNumber: 'PRS-TEST-12345',
      ombudsmanScheme: 'property_redress_scheme',
    };
  } else {
    return {
      ...baseProfile,
      companyName: 'Test Agency Ltd',
      agencyType: userType,
      registrationNumber: 'REG-TEST-12345',
      primaryContactName: 'Test Contact',
      phone: '01234567890',
      street: '123 Test Street',
      city: 'Liverpool',
      postcode: 'L1 1AA',
      serviceAreas: ['Liverpool'],
      isActive: true,
    };
  }
}
```

**2.2 Create `tests/e2e/utils/property-helpers.ts`:**
```typescript
import { Page } from '@playwright/test';

export interface TestProperty {
  id: string;
  street: string;
  city: string;
  postcode: string;
  rent: number;
  bedrooms: number;
  propertyType: string;
}

/**
 * Create a property via landlord dashboard UI
 */
export async function createProperty(page: Page): Promise<TestProperty> {
  const timestamp = Date.now();
  const testProperty: TestProperty = {
    id: `test-property-${timestamp}`,
    street: `${timestamp} Test Street`,
    city: 'Liverpool',
    postcode: 'L1 1AA',
    rent: 850,
    bedrooms: 2,
    propertyType: 'Flat',
  };

  // Click "Add Property" button
  await page.getByRole('button', { name: /add property/i }).click();

  // Fill property form
  await page.getByLabel(/street/i).fill(testProperty.street);
  await page.getByLabel(/city/i).fill(testProperty.city);
  await page.getByLabel(/postcode/i).fill(testProperty.postcode);
  await page.getByLabel(/rent|monthly rent/i).fill(testProperty.rent.toString());
  await page.getByLabel(/bedrooms/i).fill(testProperty.bedrooms.toString());

  // Submit form
  await page.getByRole('button', { name: /save|create|add property/i }).click();

  // Wait for success message or navigation
  await page.waitForTimeout(500);

  return testProperty;
}

/**
 * Setup property data programmatically (bypass UI)
 */
export async function setupPropertyData(page: Page, landlordId: string): Promise<TestProperty> {
  const timestamp = Date.now();
  const testProperty: TestProperty = {
    id: `test-property-${timestamp}`,
    street: `${timestamp} Test Street`,
    city: 'Liverpool',
    postcode: 'L1 1AA',
    rent: 850,
    bedrooms: 2,
    propertyType: 'Flat',
  };

  await page.evaluate(({ property, landlordId }) => {
    const fullProperty = {
      ...property,
      landlordId,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    const existing = JSON.parse(localStorage.getItem('get-on-properties') || '[]');
    existing.push(fullProperty);
    localStorage.setItem('get-on-properties', JSON.stringify(existing));
  }, { property: testProperty, landlordId });

  return testProperty;
}
```

**2.3 Create `tests/e2e/utils/assertions.ts`:**
```typescript
import { Page, expect } from '@playwright/test';

/**
 * Assert user is on welcome screen
 */
export async function expectWelcomeScreen(page: Page) {
  await expect(page.getByText(/get on with living better/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /get on/i })).toBeVisible();
}

/**
 * Assert user is on role selection screen
 */
export async function expectRoleSelectionScreen(page: Page) {
  await expect(page.getByText(/choose your role/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /i'm looking to rent/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /i'm a landlord/i })).toBeVisible();
}

/**
 * Assert user is on login page
 */
export async function expectLoginPage(page: Page) {
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
}

/**
 * Assert user is on renter dashboard (SwipePage)
 */
export async function expectRenterDashboard(page: Page) {
  await expect(page.getByText(/swipe|properties/i)).toBeVisible();
  // Bottom navigation visible
  await expect(page.getByRole('button', { name: /swipe/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /matches/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /profile/i })).toBeVisible();
}

/**
 * Assert user is on landlord dashboard
 */
export async function expectLandlordDashboard(page: Page) {
  await expect(page.getByText(/landlord dashboard|my properties/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /add property/i })).toBeVisible();
}

/**
 * Assert user is on agency dashboard
 */
export async function expectAgencyDashboard(page: Page) {
  await expect(page.getByText(/agency dashboard|client properties/i)).toBeVisible();
}

/**
 * Assert toast notification appears
 */
export async function expectToast(page: Page, message: string | RegExp) {
  await expect(page.getByText(message)).toBeVisible();
}
```

### TASK 3: CREATE E2E TESTS

**3.1 Create `tests/e2e/auth/signup-renter.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';
import { clearStorage, signupAndLogin } from '../utils/auth-helpers';
import { expectRenterDashboard } from '../utils/assertions';

test.describe('Renter Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should complete full renter signup and reach dashboard', async ({ page }) => {
    const user = await signupAndLogin(page, 'renter');

    // Verify on renter dashboard
    await expectRenterDashboard(page);

    // Verify auth state persisted
    const authState = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('get-on-auth') || '{}');
    });

    expect(authState.state.isAuthenticated).toBe(true);
    expect(authState.state.userType).toBe('renter');
    expect(authState.state.currentUser.email).toBe(user.email);
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get on/i }).click();
    await page.getByRole('button', { name: /i'm looking to rent/i }).click();

    // Fill form with weak password
    await page.getByLabel(/email/i).fill('weak@test.com');
    await page.getByLabel(/password/i).first().fill('weak');
    await page.getByLabel(/confirm password/i).fill('weak');

    // Should show validation error
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get on/i }).click();
    await page.getByRole('button', { name: /i'm looking to rent/i }).click();

    // Fill form with invalid email
    await page.getByLabel(/email/i).fill('notanemail');

    // Should show validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('should persist session across page reload', async ({ page }) => {
    const user = await signupAndLogin(page, 'renter');

    // Reload page
    await page.reload();

    // Should still be authenticated
    await expectRenterDashboard(page);
  });
});
```

**3.2 Create `tests/e2e/auth/signup-landlord.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';
import { clearStorage, signupAndLogin } from '../utils/auth-helpers';
import { expectLandlordDashboard } from '../utils/assertions';

test.describe('Landlord Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should complete full landlord signup with RRA 2025 compliance', async ({ page }) => {
    const user = await signupAndLogin(page, 'landlord');

    // Verify on landlord dashboard
    await expectLandlordDashboard(page);

    // Verify compliance data saved
    const profiles = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('get-on-landlord-profiles') || '[]');
    });

    const landlord = profiles.find((p: any) => p.email === user.email);
    expect(landlord.prsRegistrationNumber).toBeTruthy();
    expect(landlord.ombudsmanScheme).toBeTruthy();
  });

  test('should enforce RRA 2025 compliance requirements', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get on/i }).click();
    await page.getByRole('button', { name: /i'm a landlord/i }).click();

    // Complete first 3 steps quickly
    await page.getByLabel(/email/i).fill('landlord@test.com');
    await page.getByLabel(/password/i).first().fill('TestPass123!');
    await page.getByLabel(/confirm password/i).fill('TestPass123!');
    await page.getByLabel(/name/i).fill('Test Landlord');
    await page.getByRole('button', { name: /next/i }).click();

    await page.getByRole('button', { name: /flat/i }).first().click();
    await page.getByRole('button', { name: /next/i }).click();

    await page.getByRole('button', { name: /next|skip/i }).click();

    // Step 3: Try to proceed without filling compliance
    await page.getByRole('button', { name: /next/i }).click();

    // Should show validation errors
    await expect(page.getByText(/prs registration.*required/i)).toBeVisible();
  });
});
```

**3.3 Create `tests/e2e/auth/login.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';
import { clearStorage, signupAndLogin, login, logout } from '../utils/auth-helpers';
import { expectLoginPage, expectRenterDashboard, expectWelcomeScreen } from '../utils/assertions';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should login existing user successfully', async ({ page }) => {
    // Create user first
    const user = await signupAndLogin(page, 'renter');

    // Logout
    await logout(page);
    await expectWelcomeScreen(page);

    // Login again
    await login(page, user.email, user.password);

    // Should be back on dashboard
    await expectRenterDashboard(page);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /log in/i }).click();

    await page.getByLabel(/email/i).fill('nonexistent@test.com');
    await page.getByLabel(/password/i).fill('WrongPass123!');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid.*credentials|login failed/i)).toBeVisible();
  });

  test('should show login button on all pre-auth pages', async ({ page }) => {
    // Welcome screen
    await page.goto('/');
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();

    // Role selection
    await page.getByRole('button', { name: /get on/i }).click();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();

    // First step of onboarding
    await page.getByRole('button', { name: /i'm looking to rent/i }).click();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
  });

  test('should hide login button when authenticated', async ({ page }) => {
    await signupAndLogin(page, 'renter');

    // Login button should not be visible
    await expect(page.getByRole('button', { name: /log in/i })).not.toBeVisible();
  });
});
```

**3.4 Create `tests/e2e/property/create-property.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';
import { clearStorage, signupAndLogin } from '../utils/auth-helpers';
import { createProperty } from '../utils/property-helpers';
import { expectLandlordDashboard } from '../utils/assertions';

test.describe('Property Creation', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should create property as landlord', async ({ page }) => {
    // Signup as landlord
    await signupAndLogin(page, 'landlord');
    await expectLandlordDashboard(page);

    // Create property
    const property = await createProperty(page);

    // Verify property appears in dashboard
    await expect(page.getByText(property.street)).toBeVisible();
    await expect(page.getByText(`£${property.rent}`)).toBeVisible();

    // Verify property saved to storage
    const properties = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('get-on-properties') || '[]');
    });

    expect(properties.length).toBeGreaterThan(0);
    expect(properties.some((p: any) => p.street === property.street)).toBe(true);
  });

  test('should validate required property fields', async ({ page }) => {
    await signupAndLogin(page, 'landlord');

    // Click add property
    await page.getByRole('button', { name: /add property/i }).click();

    // Try to submit without filling fields
    await page.getByRole('button', { name: /save|create|add property/i }).click();

    // Should show validation errors
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });
});
```

**3.5 Create `tests/e2e/swipe/swipe-match.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';
import { clearStorage, signupAndLogin, setupAuthState } from '../utils/auth-helpers';
import { setupPropertyData } from '../utils/property-helpers';
import { expectRenterDashboard } from '../utils/assertions';

test.describe('Swipe and Match Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should swipe right on property and create match', async ({ page }) => {
    // Setup: Create landlord with property
    const landlord = await setupAuthState(page, 'landlord');
    const property = await setupPropertyData(page, landlord.profile.id);

    // Clear auth and setup renter
    await clearStorage(page);
    const renter = await setupAuthState(page, 'renter');

    await page.goto('/');
    await expectRenterDashboard(page);

    // Should see property card
    await expect(page.getByText(property.street)).toBeVisible();

    // Swipe right (like)
    await page.getByRole('button', { name: /like|yes/i }).click();

    // Verify match created
    const matches = await page.evaluate(() => {
      const appState = JSON.parse(localStorage.getItem('get-on-app') || '{}');
      return appState.state?.matches || [];
    });

    expect(matches.length).toBeGreaterThan(0);
  });

  test('should swipe left to skip property', async ({ page }) => {
    // Setup
    const landlord = await setupAuthState(page, 'landlord');
    await setupPropertyData(page, landlord.profile.id);
    await clearStorage(page);
    await setupAuthState(page, 'renter');

    await page.goto('/');

    // Swipe left (pass)
    await page.getByRole('button', { name: /pass|no/i }).click();

    // Property should disappear
    await expect(page.getByText(/no more properties/i)).toBeVisible();
  });
});
```

**3.6 Create `tests/e2e/navigation/bottom-nav.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';

test.describe('Bottom Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should navigate between pages using bottom nav', async ({ page }) => {
    await setupAuthState(page, 'renter');
    await page.goto('/');

    // Should start on swipe page
    await expect(page.getByRole('button', { name: /swipe/i })).toHaveClass(/active|selected/);

    // Navigate to matches
    await page.getByRole('button', { name: /matches/i }).click();
    await expect(page.getByText(/matches/i)).toBeVisible();

    // Navigate to profile
    await page.getByRole('button', { name: /profile/i }).click();
    await expect(page.getByText(/profile|settings/i)).toBeVisible();

    // Navigate back to swipe
    await page.getByRole('button', { name: /swipe/i }).click();
    await expect(page.getByText(/properties|swipe/i)).toBeVisible();
  });

  test('should show bottom nav only when authenticated', async ({ page }) => {
    // Not authenticated
    await page.goto('/');
    await expect(page.getByRole('button', { name: /swipe/i })).not.toBeVisible();

    // After auth
    await setupAuthState(page, 'renter');
    await page.goto('/');
    await expect(page.getByRole('button', { name: /swipe/i })).toBeVisible();
  });
});
```

**3.7 Create `tests/e2e/agency/agency-onboarding.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';
import { clearStorage, signupAndLogin } from '../utils/auth-helpers';
import { expectAgencyDashboard } from '../utils/assertions';

test.describe('Agency Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should complete estate agent onboarding', async ({ page }) => {
    const user = await signupAndLogin(page, 'estate_agent');
    await expectAgencyDashboard(page);

    // Verify agency type saved
    const profiles = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('get-on-agency-profiles') || '[]');
    });

    const agency = profiles.find((p: any) => p.email === user.email);
    expect(agency.agencyType).toBe('estate_agent');
  });

  test('should complete management agency onboarding', async ({ page }) => {
    const user = await signupAndLogin(page, 'management_agency');
    await expectAgencyDashboard(page);

    const profiles = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('get-on-agency-profiles') || '[]');
    });

    const agency = profiles.find((p: any) => p.email === user.email);
    expect(agency.agencyType).toBe('management_agency');
  });
});
```

### TASK 4: CREATE CI/CD INTEGRATION

**4.1 Create `.github/workflows/e2e-tests.yml`:**
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run E2E tests
        run: npm run test:e2e -- --project=${{ matrix.browser }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 30

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.browser }}
          path: test-results/
          retention-days: 30
```

**4.2 Create `tests/e2e/README.md`:**
```markdown
# E2E Tests with Playwright

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

## Test Structure

```
tests/e2e/
├── auth/                  # Authentication flows
│   ├── signup-renter.spec.ts
│   ├── signup-landlord.spec.ts
│   └── login.spec.ts
├── property/              # Property management
│   └── create-property.spec.ts
├── swipe/                 # Swipe and matching
│   └── swipe-match.spec.ts
├── navigation/            # Navigation flows
│   └── bottom-nav.spec.ts
├── agency/                # Agency-specific flows
│   └── agency-onboarding.spec.ts
└── utils/                 # Test utilities
    ├── auth-helpers.ts
    ├── property-helpers.ts
    └── assertions.ts
```

## Best Practices

1. **Test Isolation**: Each test clears localStorage before running
2. **Deterministic**: Use timestamps for unique test data
3. **Wait Strategies**: Use Playwright's auto-waiting, avoid hard waits
4. **Selectors**: Prefer accessible selectors (role, label) over CSS
5. **Setup Helpers**: Use `setupAuthState()` to skip signup when not testing auth

## Debugging

### Visual Trace Viewer
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

## CI/CD

Tests run automatically on push/PR to main/develop branches.
Reports are uploaded as artifacts for 30 days.
```

### TASK 5: FINAL INTEGRATION

**5.1 Update main README (if exists) with E2E section:**
Add section to existing README.md:
```markdown
## Testing

### Unit & Integration Tests (Vitest)
```bash
npm run test           # Watch mode
npm run test:run       # Run once
npm run test:coverage  # With coverage
```

### E2E Tests (Playwright)
```bash
npm run test:e2e       # Run all E2E tests
npm run test:e2e:ui    # Interactive UI mode
npm run test:e2e:headed # See browser
```

**Test Coverage:**
- 20 unit/integration test files (525 tests) ✓
- 7 E2E test files (20+ tests) ✓
- Total: 545+ tests
```

**5.2 Verify all TypeScript compiles:**
```bash
npx tsc --noEmit -p tsconfig.e2e.json
```

**5.3 Run all tests to verify:**
```bash
npm run test:run && npm run test:e2e
```

## COMPLETION CHECKLIST

- [ ] Playwright installed and configured
- [ ] `playwright.config.ts` created with 3 browser projects
- [ ] `.gitignore` updated with test artifacts
- [ ] `package.json` scripts added (6 new scripts)
- [ ] `tsconfig.e2e.json` created
- [ ] `tests/e2e/utils/auth-helpers.ts` created (300+ lines)
- [ ] `tests/e2e/utils/property-helpers.ts` created
- [ ] `tests/e2e/utils/assertions.ts` created
- [ ] `tests/e2e/auth/signup-renter.spec.ts` created (4 tests)
- [ ] `tests/e2e/auth/signup-landlord.spec.ts` created (2 tests)
- [ ] `tests/e2e/auth/login.spec.ts` created (4 tests)
- [ ] `tests/e2e/property/create-property.spec.ts` created (2 tests)
- [ ] `tests/e2e/swipe/swipe-match.spec.ts` created (2 tests)
- [ ] `tests/e2e/navigation/bottom-nav.spec.ts` created (2 tests)
- [ ] `tests/e2e/agency/agency-onboarding.spec.ts` created (2 tests)
- [ ] `tests/e2e/README.md` created
- [ ] `.github/workflows/e2e-tests.yml` created
- [ ] Main README updated with E2E section
- [ ] All TypeScript compiles without errors
- [ ] All E2E tests pass

## SUCCESS CRITERIA

1. ✅ Run `npm run test:e2e` - all 18+ tests pass
2. ✅ Run `npm run test:e2e:ui` - UI opens and tests are visible
3. ✅ Run `npx tsc --noEmit -p tsconfig.e2e.json` - no errors
4. ✅ Tests are deterministic (pass consistently 3 times in a row)
5. ✅ No hardcoded waits (`page.waitForTimeout` only for deliberate pauses)
6. ✅ All tests follow existing code patterns
7. ✅ CI/CD workflow file is valid YAML

## NOTES FOR AGENT

- **DO NOT USE PLACEHOLDERS**: Every function must be fully implemented
- **FOLLOW EXISTING PATTERNS**: Match the coding style in existing tests
- **USE STRICT TYPESCRIPT**: All types must be explicitly defined
- **TEST RELIABILITY**: Use Playwright's auto-waiting, not arbitrary timeouts
- **REAL SELECTORS**: Inspect actual component code for accurate selectors
- **ERROR HANDLING**: Wrap storage operations in try-catch where appropriate
- **CONSISTENT NAMING**: Match existing naming conventions (camelCase, TestUser, etc.)
- **DOCUMENTATION**: Every helper function gets JSDoc comments

This implementation will add 18-20 new E2E tests covering all critical user flows, bringing total test count from 525 to 545+.
