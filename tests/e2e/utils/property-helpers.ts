import type { Page } from '@playwright/test';

export interface TestProperty {
  id: string;
  street: string;
  city: string;
  postcode: string;
  rent: number;
  bedrooms: number;
  propertyType: string;
}

/**
 * Create a property via landlord dashboard UI
 */
export async function createProperty(page: Page): Promise<TestProperty> {
  const timestamp = Date.now();
  const testProperty: TestProperty = {
    id: `test-property-${timestamp}`,
    street: `${timestamp} Test Street`,
    city: 'Liverpool',
    postcode: 'L1 1AA',
    rent: 850,
    bedrooms: 2,
    propertyType: 'Flat',
  };

  // Click "Add Property" button
  await page.getByRole('button', { name: /add property/i }).click();

  // Wait for modal/form to appear
  await page.waitForTimeout(500);

  // Fill property form (adjust selectors based on actual component)
  await page.locator('#street').fill(testProperty.street);
  await page.locator('#city').fill(testProperty.city);
  await page.locator('#postcode').fill(testProperty.postcode);
  await page.locator('#rent').fill(testProperty.rent.toString());
  await page.locator('#bedrooms').fill(testProperty.bedrooms.toString());

  // Submit form
  await page.getByRole('button', { name: /save|create|add property/i }).click();

  // Wait for success message or navigation
  await page.waitForTimeout(1000);

  return testProperty;
}

/**
 * Setup property data programmatically (bypass UI)
 */
export async function setupPropertyData(page: Page, landlordId: string): Promise<TestProperty> {
  const timestamp = Date.now();
  const testProperty: TestProperty = {
    id: `test-property-${timestamp}`,
    street: `${timestamp} Test Street`,
    city: 'Liverpool',
    postcode: 'L1 1AA',
    rent: 850,
    bedrooms: 2,
    propertyType: 'Flat',
  };

  await page.evaluate(({ property, landlordId }) => {
    const fullProperty = {
      ...property,
      landlordId,
      createdAt: new Date().toISOString(),
      status: 'active',
      localArea: 'Liverpool',
      bathrooms: 1,
      propertySize: 65,
      epcRating: 'C' as const,
      councilTaxBand: 'B',
      furnishing: 'Unfurnished' as const,
      deposit: property.rent * 5,
      availableFrom: new Date().toISOString().split('T')[0],
      petPolicy: 'No Pets' as const,
      description: 'Test property for E2E testing',
      images: [],
    };

    const existing = JSON.parse(localStorage.getItem('get-on-properties') || '[]');
    existing.push(fullProperty);
    localStorage.setItem('get-on-properties', JSON.stringify(existing));
  }, { property: testProperty, landlordId });

  return testProperty;
}

/**
 * Get properties from localStorage
 */
export async function getProperties(page: Page) {
  return await page.evaluate(() => {
    const data = localStorage.getItem('get-on-properties');
    return data ? JSON.parse(data) : [];
  });
}

/**
 * Clear all properties from localStorage
 */
export async function clearProperties(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('get-on-properties');
  });
}
