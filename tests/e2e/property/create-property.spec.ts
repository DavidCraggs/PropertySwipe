import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';
import { getProperties } from '../utils/property-helpers';
import { expectLandlordDashboard } from '../utils/assertions';

test.describe('Property Creation', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should create property as landlord', async ({ page }) => {
    // Signup as landlord
    await setupAuthState(page, 'landlord');
    await page.goto('/');
    await expectLandlordDashboard(page);

    // Get initial property count
    const initialProperties = await getProperties(page);
    const initialCount = initialProperties.length;

    // Click "Add Property" button
    await page.getByRole('button', { name: /add property/i }).click();

    // Wait for modal/form to appear
    await page.waitForTimeout(500);

    // Fill property form
    const timestamp = Date.now();
    await page.locator('#street').fill(`${timestamp} Test Street`);
    await page.locator('#city').fill('Liverpool');
    await page.locator('#postcode').fill('L1 1AA');
    await page.locator('#rent').fill('850');
    await page.locator('#bedrooms').fill('2');

    // Submit form
    await page.getByRole('button', { name: /save|create|add property/i }).click();

    // Wait for success
    await page.waitForTimeout(1000);

    // Verify property saved to storage
    const properties = await getProperties(page);
    expect(properties.length).toBe(initialCount + 1);

    const newProperty = properties.find((p: any) => p.street === `${timestamp} Test Street`);
    expect(newProperty).toBeTruthy();
    expect(newProperty.city).toBe('Liverpool');
    expect(newProperty.rent).toBe(850);
  });

  test('should display created property in dashboard', async ({ page }) => {
    // Setup landlord with a property
    const landlord = await setupAuthState(page, 'landlord');

    // Create property programmatically
    const timestamp = Date.now();
    await page.evaluate(({ landlordId, timestamp }) => {
      const property = {
        id: `test-property-${timestamp}`,
        landlordId,
        street: `${timestamp} Test Street`,
        city: 'Liverpool',
        postcode: 'L1 1AA',
        rent: 850,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'Flat',
        localArea: 'Liverpool',
        propertySize: 65,
        epcRating: 'C' as const,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const existing = JSON.parse(localStorage.getItem('get-on-properties') || '[]');
      existing.push(property);
      localStorage.setItem('get-on-properties', JSON.stringify(existing));
    }, { landlordId: landlord.profile.id, timestamp });

    await page.goto('/');

    // Property should be visible in dashboard
    await expect(page.getByText(`${timestamp} Test Street`)).toBeVisible();
    await expect(page.getByText('£850')).toBeVisible();
  });
});
