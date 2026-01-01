import { test, expect, Page } from '@playwright/test';
import { clearStorage, signupAndLogin, getAuthState } from '../utils/auth-helpers';
import { expectRenterDashboard } from '../utils/assertions';

/**
 * E2E tests for renter invite code flow
 * Tests onboarding with and without invite codes
 */

test.describe('Renter Invite Flow - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('New renter completes onboarding without invite', async ({ page }) => {
    // Use the standard signup flow which handles InviteCodePrompt
    await signupAndLogin(page, 'renter');

    // Should be on renter dashboard
    await expectRenterDashboard(page);

    // Verify profile created
    const authState = await getAuthState(page);
    expect(authState.state.isAuthenticated).toBe(true);
    expect(authState.state.userType).toBe('renter');
    expect(authState.state.currentUser.onboardingComplete).toBe(true);
  });

  test('Renter sees InviteCodePrompt when starting onboarding', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get on/i }).click();
    await page.waitForSelector('text=How can we help you?');
    await page.getByRole('button', { name: /i'm a renter/i }).click();

    // Should see InviteCodePrompt with options
    await page.waitForSelector('text=Welcome to GetOn', { timeout: 10000 });
    await expect(page.getByText(/i have an invite code/i)).toBeVisible();
    // The "I'm a new renter" text is inside a button with aria-label
    await expect(page.getByRole('button', { name: /continue as new renter/i })).toBeVisible();
  });

  test('Clicking "I have an invite code" shows code input', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get on/i }).click();
    await page.waitForSelector('text=How can we help you?');
    await page.getByRole('button', { name: /i'm a renter/i }).click();

    // Wait for InviteCodePrompt
    await page.waitForSelector('text=Welcome to GetOn', { timeout: 10000 });

    // Click "I have an invite code"
    await page.getByRole('button', { name: /continue with invite code/i }).click();
    await page.waitForTimeout(500);

    // Should show invite code input (placeholder is "AB12CD34")
    await expect(page.getByPlaceholder('AB12CD34')).toBeVisible();
  });

  test('Renter can switch from invite code back to new renter', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get on/i }).click();
    await page.waitForSelector('text=How can we help you?');
    await page.getByRole('button', { name: /i'm a renter/i }).click();

    // Wait for InviteCodePrompt
    await page.waitForSelector('text=Welcome to GetOn', { timeout: 10000 });

    // Click "I have an invite code"
    await page.getByRole('button', { name: /continue with invite code/i }).click();
    await page.waitForTimeout(500);

    // Should show invite code input (placeholder is "AB12CD34")
    await expect(page.getByPlaceholder('AB12CD34')).toBeVisible();

    // Go back
    await page.getByRole('button', { name: /back/i }).click();
    await page.waitForTimeout(500);

    // Should see the original options again
    await expect(page.getByRole('button', { name: /continue as new renter/i })).toBeVisible();
  });

  test('Invalid invite code shows error message', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get on/i }).click();
    await page.waitForSelector('text=How can we help you?');
    await page.getByRole('button', { name: /i'm a renter/i }).click();

    // Wait for InviteCodePrompt
    await page.waitForSelector('text=Welcome to GetOn', { timeout: 10000 });

    // Click "I have an invite code"
    await page.getByRole('button', { name: /continue with invite code/i }).click();
    await page.waitForTimeout(500);

    // Enter invalid code (placeholder is "AB12CD34")
    await page.getByPlaceholder('AB12CD34').fill('INVALID1');
    await page.getByRole('button', { name: /validate invite code/i }).click();

    // Should show error (exact text depends on implementation)
    await page.waitForTimeout(1000);
    await expect(page.getByText(/not found|invalid|error/i).first()).toBeVisible();
  });

  test('Renter onboarding saves to auth state correctly', async ({ page }) => {
    await signupAndLogin(page, 'renter');
    await expectRenterDashboard(page);

    // Verify auth state has correct structure
    const authState = await getAuthState(page);
    expect(authState.state.currentUser).toBeTruthy();
    expect(authState.state.currentUser.email).toContain('@example.com');
    expect(authState.state.currentUser.names).toBe('Test Renter');
  });
});
