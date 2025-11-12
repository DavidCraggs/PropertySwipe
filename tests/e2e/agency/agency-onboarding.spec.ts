import { test, expect } from '@playwright/test';
import { clearStorage, signupAndLogin, getProfiles } from '../utils/auth-helpers';
import { expectAgencyDashboard } from '../utils/assertions';

test.describe('Agency Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should complete estate agent onboarding', async ({ page }) => {
    const user = await signupAndLogin(page, 'estate_agent');
    await expectAgencyDashboard(page);

    // Verify agency type saved
    const profiles = await getProfiles(page, 'estate_agent');
    const agency = profiles.find((p: any) => p.email === user.email);

    expect(agency).toBeTruthy();
    expect(agency.agencyType).toBe('estate_agent');
    expect(agency.companyName).toBe('Test Agency Ltd');
  });

  test('should complete management agency onboarding', async ({ page }) => {
    const user = await signupAndLogin(page, 'management_agency');
    await expectAgencyDashboard(page);

    // Verify agency type saved
    const profiles = await getProfiles(page, 'management_agency');
    const agency = profiles.find((p: any) => p.email === user.email);

    expect(agency).toBeTruthy();
    expect(agency.agencyType).toBe('management_agency');
  });

  test('should save agency contact and address information', async ({ page }) => {
    const user = await signupAndLogin(page, 'estate_agent');

    const profiles = await getProfiles(page, 'estate_agent');
    const agency = profiles.find((p: any) => p.email === user.email);

    expect(agency.primaryContactName).toBe('Test Contact');
    expect(agency.phone).toBe('01234567890');
    expect(agency.street).toBe('123 Test Street');
    expect(agency.city).toBe('Liverpool');
    expect(agency.postcode).toBe('L1 1AA');
  });

  test('should mark agency as active after onboarding', async ({ page }) => {
    const user = await signupAndLogin(page, 'estate_agent');

    const profiles = await getProfiles(page, 'estate_agent');
    const agency = profiles.find((p: any) => p.email === user.email);

    expect(agency.isActive).toBe(true);
    expect(agency.onboardingComplete).toBe(true);
  });
});
