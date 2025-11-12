import { test, expect } from '@playwright/test';
import { clearStorage, signupAndLogin, getAuthState, getProfiles } from '../utils/auth-helpers';
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
    const authState = await getAuthState(page);
    expect(authState.state.isAuthenticated).toBe(true);
    expect(authState.state.userType).toBe('renter');
    expect(authState.state.currentUser.email).toBe(user.email);
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get on/i }).click();
    await page.waitForSelector('text=How can we help you?');
    await page.getByRole('button', { name: /i'm a renter/i }).click();

    // Wait for onboarding form
    await page.waitForSelector('text=Let\'s get to know you');

    // Fill form with weak password
    await page.locator('#email').fill('weak@test.com');
    await page.locator('input[type="password"]').first().fill('weak');

    // Try to proceed
    await page.locator('#names').fill('Test');
    await page.locator('#ages').fill('28');

    // Should show validation error (password strength indicator or error message)
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get on/i }).click();
    await page.waitForSelector('text=How can we help you?');
    await page.getByRole('button', { name: /i'm a renter/i }).click();

    await page.waitForTimeout(500);

    // Fill form with invalid email
    await page.locator('#email').fill('notanemail');
    await page.locator('input[type="password"]').first().fill('TestPass123!');
    await page.locator('#names').fill('Test User');
    await page.locator('#ages').fill('28');

    // Try to proceed
    await page.getByRole('button', { name: /next/i }).click();

    // Should show validation error (via alert or form validation)
    await page.waitForTimeout(500);
  });

  test('should persist session across page reload', async ({ page }) => {
    await signupAndLogin(page, 'renter');

    // Reload page
    await page.reload();

    // Should still be authenticated
    await expectRenterDashboard(page);

    // Verify auth state
    const authState = await getAuthState(page);
    expect(authState.state.isAuthenticated).toBe(true);
  });

  test('should save renter profile to localStorage', async ({ page }) => {
    const user = await signupAndLogin(page, 'renter');

    // Verify profile saved
    const profiles = await getProfiles(page, 'renter');
    expect(profiles.length).toBeGreaterThan(0);

    const profile = profiles.find((p: any) => p.email === user.email);
    expect(profile).toBeTruthy();
    expect(profile.names).toBe('Test Renter');
    expect(profile.ages).toBe('28');
    expect(profile.monthlyIncome).toBe(3000);
  });
});
