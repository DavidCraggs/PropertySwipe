import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';

test.describe('Bottom Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should navigate between pages using bottom nav', async ({ page }) => {
    await setupAuthState(page, 'renter');
    await page.goto('/');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Should see bottom navigation
    await expect(page.getByRole('button', { name: /swipe/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /matches/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /profile/i })).toBeVisible();

    // Navigate to matches
    await page.getByRole('button', { name: /matches/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('heading', { name: /matches/i }).or(page.getByText(/no matches yet/i))).toBeVisible();

    // Navigate to profile
    await page.getByRole('button', { name: /profile/i }).click();
    await page.waitForTimeout(500);
    // Profile page has a heading "Profile" - use specific selector
    await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();

    // Navigate back to swipe
    await page.getByRole('button', { name: /swipe/i }).click();
    await page.waitForTimeout(500);
  });

  test('should show bottom nav only when authenticated', async ({ page }) => {
    // Not authenticated
    await page.goto('/');
    await expect(page.getByRole('button', { name: /swipe/i })).not.toBeVisible();

    // After auth
    await setupAuthState(page, 'renter');
    await page.goto('/');
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /swipe/i })).toBeVisible();
  });

  test('should maintain auth state when navigating between pages', async ({ page }) => {
    await setupAuthState(page, 'renter');
    await page.goto('/');
    await page.waitForTimeout(500);

    // Navigate to matches
    await page.getByRole('button', { name: /matches/i }).click();
    await page.waitForTimeout(500);

    // Verify still authenticated
    const authState = await page.evaluate(() => {
      const data = localStorage.getItem('get-on-auth');
      return data ? JSON.parse(data) : null;
    });

    expect(authState.state.isAuthenticated).toBe(true);
  });
});
