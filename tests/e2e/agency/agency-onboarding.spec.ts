import { test, expect } from '@playwright/test';
import { clearStorage, signupAndLogin, getAuthState } from '../utils/auth-helpers';
import { expectAgencyDashboard } from '../utils/assertions';

test.describe('Agency Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should complete estate agent onboarding', async ({ page }) => {
    await signupAndLogin(page, 'estate_agent');
    await expectAgencyDashboard(page);

    // Get agency profile from auth state (works in both Supabase and localStorage mode)
    const authState = await getAuthState(page);
    const agency = authState?.state?.currentUser;

    expect(agency).toBeTruthy();
    expect(agency.agencyType).toBe('estate_agent');
    expect(agency.companyName).toBe('Test Agency Ltd');
  });

  test('should complete management agency onboarding', async ({ page }) => {
    await signupAndLogin(page, 'management_agency');
    await expectAgencyDashboard(page);

    // Get agency profile from auth state
    const authState = await getAuthState(page);
    const agency = authState?.state?.currentUser;

    expect(agency).toBeTruthy();
    expect(agency.agencyType).toBe('management_agency');
  });

  test('should save agency contact and address information', async ({ page }) => {
    await signupAndLogin(page, 'estate_agent');
    await expectAgencyDashboard(page);

    // Get agency profile from auth state
    const authState = await getAuthState(page);
    const agency = authState?.state?.currentUser;

    expect(agency.primaryContactName).toBe('Test Contact');
    expect(agency.phone).toBe('01234567890');
    // Address is stored as a nested object in AgencyProfile
    expect(agency.address.street).toBe('123 Test Street');
    expect(agency.address.city).toBe('Liverpool');
    expect(agency.address.postcode).toBe('L1 1AA');
  });

  test('should mark agency as active after onboarding', async ({ page }) => {
    await signupAndLogin(page, 'estate_agent');
    await expectAgencyDashboard(page);

    // Get agency profile from auth state
    const authState = await getAuthState(page);
    const agency = authState?.state?.currentUser;

    expect(agency.isActive).toBe(true);
    expect(agency.onboardingComplete).toBe(true);
  });
});
