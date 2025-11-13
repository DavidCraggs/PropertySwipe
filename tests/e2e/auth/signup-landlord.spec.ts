import { test, expect } from '@playwright/test';
import { clearStorage, signupAndLogin, getProfiles } from '../utils/auth-helpers';
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
    const profiles = await getProfiles(page, 'landlord');
    const landlord = profiles.find((p: any) => p.email === user.email);

    expect(landlord).toBeTruthy();
    expect(landlord.prsRegistrationNumber).toBeTruthy();
    expect(landlord.ombudsmanScheme).toBeTruthy();
  });

  test('should enforce RRA 2025 compliance requirements', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get on/i }).click();
    await page.waitForSelector('text=How can we help you?');
    await page.getByRole('button', { name: /i'm a landlord/i }).click();

    // Wait for onboarding
    await page.waitForTimeout(500);

    // Complete first 3 steps quickly
    await page.locator('#email').fill('landlord@test.com');
    await page.locator('input[type="password"]').first().fill('TestPass123!');
    await page.locator('#names').fill('Test Landlord');
    await page.getByRole('button', { name: /continue/i }).click();

    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /flat/i }).first().click();
    await page.getByRole('button', { name: /continue/i }).click();

    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 3: Try to proceed without filling compliance
    await page.waitForTimeout(500);

    // Leave PRS registration empty and try to proceed
    await page.getByRole('button', { name: /continue/i }).click();

    // Should show validation error or be blocked
    await page.waitForTimeout(500);

    // Verify we're still on compliance step (error should prevent navigation)
    await expect(page.locator('#prsRegistrationNumber')).toBeVisible();
  });

  test('should save landlord profile with certification data', async ({ page }) => {
    const user = await signupAndLogin(page, 'landlord');

    // Verify profile saved with certification flags
    const profiles = await getProfiles(page, 'landlord');
    const landlord = profiles.find((p: any) => p.email === user.email);

    expect(landlord).toBeTruthy();
    expect(landlord.certifiedEPC).toBeTruthy();
    expect(landlord.certifiedGasSafety).toBeTruthy();
    expect(landlord.certifiedElectricalSafety).toBeTruthy();
    expect(landlord.certifiedSmokeAlarms).toBeTruthy();
    expect(landlord.certifiedCOAlarms).toBeTruthy();
  });
});
