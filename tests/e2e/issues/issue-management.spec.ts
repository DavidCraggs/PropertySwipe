/**
 * E2E Tests - Issue Management
 *
 * Tests for the agency issue management functionality
 */

import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';
import { expectAgencyDashboard } from '../utils/assertions';

test.describe('Issue Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should display agency dashboard with issues tab', async ({ page }) => {
    // Setup agency
    await setupAuthState(page, 'estate_agent');
    await page.goto('/');
    await expectAgencyDashboard(page);

    // Agency dashboard should have tabs including Issues
    await expect(page.getByRole('button', { name: /issues/i })).toBeVisible();
  });

  test('should navigate to issues tab', async ({ page }) => {
    // Setup agency
    await setupAuthState(page, 'estate_agent');
    await page.goto('/');
    await expectAgencyDashboard(page);

    // Click Issues tab
    await page.getByRole('button', { name: /issues/i }).click();
    await page.waitForTimeout(500);

    // Should show issues section
    // Either "No Issues" or list of issues
    await expect(
      page.getByText(/no issues/i).first().or(page.getByText(/recent issues/i))
    ).toBeVisible();
  });

  test('should display agency dashboard stats', async ({ page }) => {
    // Setup agency
    await setupAuthState(page, 'estate_agent');
    await page.goto('/');
    await expectAgencyDashboard(page);

    // Should show dashboard stats like Open Issues
    await expect(page.getByText(/open issues/i).first()).toBeVisible();
  });
});
