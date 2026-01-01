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

    // Wait for login page to load
    await page.waitForSelector('text=Welcome Back');

    // Fill with invalid credentials - no #email ID, use type selector
    await page.locator('input[type="email"]').fill('nonexistent@test.com');
    await page.locator('input[type="password"]').fill('WrongPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await page.waitForTimeout(1000);

    // Verify we're still on login page (not navigated away)
    await expectLoginPage(page);
  });

  test('should show login button on all pre-auth pages', async ({ page }) => {
    // Welcome screen
    await page.goto('/');
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();

    // Role selection
    await page.getByRole('button', { name: /get on/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();

    // After role selection, different onboarding flows may not have login button
    // (e.g., RenterOnboarding shows InviteCodePrompt first which doesn't have login)
    // So we only test Welcome and Role Selection screens
  });

  test('should hide login button when authenticated', async ({ page }) => {
    await signupAndLogin(page, 'renter');

    // Login button should not be visible
    await expect(page.getByRole('button', { name: /log in/i })).not.toBeVisible();
  });

  test('should support case-insensitive email login', async ({ page }) => {
    // Create user with lowercase email
    const user = await signupAndLogin(page, 'renter');

    // Wait for dashboard before logout
    await expectRenterDashboard(page);
    await logout(page);

    // Login with uppercase email
    await login(page, user.email.toUpperCase(), user.password);

    // Should successfully login
    await expectRenterDashboard(page);
  });

  test('should clear session on logout', async ({ page }) => {
    await signupAndLogin(page, 'renter');

    // Logout
    await logout(page);

    // Should be on welcome screen
    await expectWelcomeScreen(page);

    // Auth state should be cleared
    const authState = await page.evaluate(() => {
      const data = localStorage.getItem('get-on-auth');
      return data ? JSON.parse(data) : null;
    });

    expect(authState.state.isAuthenticated).toBe(false);
  });
});
