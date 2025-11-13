import type { Page } from '@playwright/test';
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

  // Wait for role selection screen
  await page.waitForSelector('text=How can we help you?');

  // Select role based on userType
  if (userType === 'renter') {
    await page.getByRole('button', { name: /i'm a renter/i }).click();
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
  // Wait for onboarding to load
  await page.waitForSelector('text=Let\'s get to know you');

  // Step 0: Personal info
  await page.locator('#email').fill(user.email);
  await page.locator('input[type="password"]').first().fill(user.password);
  await page.locator('#names').fill('Test Renter');
  await page.locator('#ages').fill('28');
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 1: Location preferences - wait for step to load
  await page.waitForTimeout(500); // Allow animation to complete
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 2: Income & employment - wait for step to load
  await page.waitForTimeout(500);
  await page.locator('#monthlyIncome').fill('3000');
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 3: Move-in date - wait for step to load
  await page.waitForTimeout(500);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  await page.locator('#moveInDate').fill(futureDate.toISOString().split('T')[0]);
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 4: Review & submit - wait for step to load
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /complete|submit/i }).click();

  // Wait for dashboard (use timeout to handle navigation)
  await page.waitForTimeout(1000);
}

async function completeLandlordOnboarding(page: Page, user: TestUser) {
  // Wait for onboarding to load - just wait for email field since page renders quickly
  await page.waitForSelector('#email', { timeout: 10000 });

  // Step 0: Basic info
  await page.locator('#email').fill(user.email);
  await page.locator('input[type="password"]').first().fill(user.password);
  await page.locator('#names').fill('Test Landlord');
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 1: Property type - wait for step to load
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /flat/i }).first().click();
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 2: Property details - wait for step to load
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 3: RRA 2025 compliance - wait for step to load
  await page.waitForTimeout(500);
  await page.locator('#prsRegistrationNumber').fill('PRS-TEST-12345');

  // Select ombudsman scheme from dropdown
  await page.locator('select').first().selectOption('property_redress_scheme');

  // Check all certification checkboxes
  const checkboxes = await page.locator('input[type="checkbox"]').all();
  for (const checkbox of checkboxes) {
    await checkbox.check();
  }

  await page.getByRole('button', { name: /continue/i }).click();

  // Step 4: Review & submit - wait for step to load
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /complete|submit/i }).click();

  // Wait for dashboard
  await page.waitForTimeout(1000);
}

async function completeAgencyOnboarding(page: Page, user: TestUser) {
  // Wait for onboarding to load
  await page.waitForTimeout(500);

  // Step 0: Basic info
  await page.locator('#email').fill(user.email);
  await page.locator('input[type="password"]').first().fill(user.password);
  await page.locator('#companyName').fill('Test Agency Ltd');
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 1: Contact details - wait for step to load
  await page.waitForTimeout(500);
  await page.locator('#primaryContactName').fill('Test Contact');
  await page.locator('#phone').fill('01234567890');
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 2: Address & service areas - wait for step to load
  await page.waitForTimeout(500);
  await page.locator('#street').fill('123 Test Street');
  await page.locator('#city').fill('Liverpool');
  await page.locator('#postcode').fill('L1 1AA');
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 3: Review & submit - wait for step to load
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /complete|submit/i }).click();

  // Wait for dashboard
  await page.waitForTimeout(1000);
}

/**
 * Login existing user via UI
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/');

  // Click top-right login button
  await page.getByRole('button', { name: /log in/i }).click();

  // Wait for login page to load (has "Welcome Back" heading)
  await page.waitForSelector('text=Welcome Back');

  // Fill login form - inputs don't have IDs, use type selectors
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for navigation to complete
  await page.waitForTimeout(1500);
}

/**
 * Logout via UI
 */
export async function logout(page: Page) {
  // Navigate to profile page using bottom nav
  await page.getByRole('button', { name: /profile/i }).click();

  // Wait for profile page to load
  await page.waitForTimeout(500);

  // Click logout button (text is "Logout" as one word)
  // App shows confirm dialog, then does window.location.reload() after logout
  page.once('dialog', dialog => dialog.accept());

  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('button', { name: /logout/i }).click(),
  ]);

  // Wait for app to initialize after reload and show welcome screen
  await page.waitForTimeout(2000);
  // Verify welcome screen appeared (hasVisited flag was cleared)
  await page.waitForSelector('text=/get on with living better/i', { timeout: 5000 });
}

/**
 * Clear all localStorage (useful for test isolation)
 */
export async function clearStorage(page: Page) {
  // Navigate to the app first to ensure localStorage is accessible
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Get auth state from localStorage
 */
export async function getAuthState(page: Page) {
  return await page.evaluate(() => {
    const authData = localStorage.getItem('get-on-auth');
    return authData ? JSON.parse(authData) : null;
  });
}

/**
 * Get profiles from localStorage
 */
export async function getProfiles(page: Page, userType: UserType) {
  return await page.evaluate((type) => {
    const storageKey = type === 'renter'
      ? 'get-on-renter-profiles'
      : type === 'landlord'
      ? 'get-on-landlord-profiles'
      : 'get-on-agency-profiles';

    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  }, userType);
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

  // Use page.evaluate to set up auth state in localStorage
  await page.evaluate(async ({ user, profile }) => {
    // Create password hash (simple for testing)
    const encoder = new TextEncoder();
    const data = encoder.encode(user.password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const profileWithHash = { ...profile, passwordHash };

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
      situation: 'Single',
      localArea: 'Liverpool',
      renterType: 'Young Professional',
      employmentStatus: 'Employed Full-Time',
      hasPets: 'no',
      preferredFurnishing: ['Unfurnished'],
      moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  } else if (userType === 'landlord') {
    return {
      ...baseProfile,
      names: 'Test Landlord',
      propertyType: 'Flat',
      prsRegistrationNumber: 'PRS-TEST-12345',
      ombudsmanScheme: 'property_redress_scheme',
      certifiedEPC: true,
      certifiedGasSafety: true,
      certifiedElectricalSafety: true,
      certifiedSmokeAlarms: true,
      certifiedCOAlarms: true,
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
