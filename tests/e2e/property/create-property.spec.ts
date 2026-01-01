import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';
import { expectLandlordDashboard } from '../utils/assertions';

test.describe('Property Creation', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should show create property button for landlord without property', async ({ page }) => {
    // Signup as landlord
    await setupAuthState(page, 'landlord');
    await page.goto('/');
    await expectLandlordDashboard(page);

    // Should see "No Property Linked" message
    await expect(page.getByRole('heading', { name: /no property linked/i })).toBeVisible();

    // Should have "Create New Property" button
    const createButton = page.getByRole('button', { name: /create new property/i });
    await expect(createButton).toBeVisible();

    // Click the button to open the property creation modal
    await createButton.click();
    await page.waitForTimeout(500);

    // Should see the property form modal with "Property Address" step
    await expect(page.getByText(/property address/i)).toBeVisible();

    // Form should have street, city, postcode fields
    await expect(page.locator('#street')).toBeVisible();
    await expect(page.locator('#city')).toBeVisible();
    await expect(page.locator('#postcode')).toBeVisible();
  });

  test('should display landlord dashboard elements correctly', async ({ page }) => {
    // Setup landlord
    await setupAuthState(page, 'landlord');
    await page.goto('/');
    await expectLandlordDashboard(page);

    // Dashboard should show welcome message
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

    // Dashboard should have stats section with profile views, interested renters, etc.
    await expect(page.getByText(/profile views/i)).toBeVisible();
    await expect(page.getByText(/interested renters/i).first()).toBeVisible();

    // Dashboard should have bottom navigation
    await expect(page.getByRole('button', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /renters/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /profile/i })).toBeVisible();
  });
});
