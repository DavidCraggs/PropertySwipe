/**
 * E2E Tests - Renter Issue Reporting Flow
 *
 * Tests for renter issue reporting functionality
 */

import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';
import { expectRenterDashboard } from '../utils/assertions';

test.describe('Renter Issue Reporting E2E', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should display renter dashboard with navigation', async ({ page }) => {
    // Setup renter
    await setupAuthState(page, 'renter');
    await page.goto('/');
    await expectRenterDashboard(page);

    // Verify dashboard is loaded
    await expect(page.getByRole('button', { name: /swipe/i })).toBeVisible();
  });

  test('should navigate to profile page from renter dashboard', async ({ page }) => {
    // Setup renter
    await setupAuthState(page, 'renter');
    await page.goto('/');
    await expectRenterDashboard(page);

    // Navigate to profile
    await page.getByRole('button', { name: /profile/i }).click();
    await page.waitForTimeout(500);

    // Should be on profile page
    await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();
  });

  test('should navigate to matches page from renter dashboard', async ({ page }) => {
    // Setup renter
    await setupAuthState(page, 'renter');
    await page.goto('/');
    await expectRenterDashboard(page);

    // Navigate to matches
    await page.getByRole('button', { name: /matches/i }).click();
    await page.waitForTimeout(500);

    // Should be on matches page (shows "No Matches Yet" or matches list)
    await expect(
      page.getByRole('heading', { name: /no matches yet/i }).or(
        page.getByRole('heading', { name: /your matches/i })
      )
    ).toBeVisible();
  });
});
