import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';
import { expectRenterDashboard, expectLandlordDashboard } from '../utils/assertions';

test.describe('Rating Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should display renter profile page', async ({ page }) => {
    // Setup renter
    await setupAuthState(page, 'renter');
    await page.goto('/');
    await expectRenterDashboard(page);

    // Navigate to profile
    await page.getByRole('button', { name: /profile/i }).click();
    await page.waitForTimeout(500);

    // Profile page should be visible
    await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();

    // Should have user information visible (name, email, etc.)
    await expect(page.getByText(/test/i).first()).toBeVisible();
  });

  test('should display landlord profile page', async ({ page }) => {
    // Setup landlord
    await setupAuthState(page, 'landlord');
    await page.goto('/');
    await expectLandlordDashboard(page);

    // Navigate to profile
    await page.getByRole('button', { name: /profile/i }).click();
    await page.waitForTimeout(500);

    // Profile page should be visible
    await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();
  });

  test('should display profile settings', async ({ page }) => {
    // Setup renter
    await setupAuthState(page, 'renter');
    await page.goto('/');
    await expectRenterDashboard(page);

    // Navigate to profile
    await page.getByRole('button', { name: /profile/i }).click();
    await page.waitForTimeout(500);

    // Should have logout option
    await expect(page.getByRole('button', { name: /log out|logout|sign out/i })).toBeVisible();
  });
});
