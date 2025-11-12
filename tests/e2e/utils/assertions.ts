import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Assert user is on welcome screen
 */
export async function expectWelcomeScreen(page: Page) {
  await expect(page.getByText(/get on with living better/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /get on/i })).toBeVisible();
}

/**
 * Assert user is on role selection screen
 */
export async function expectRoleSelectionScreen(page: Page) {
  await expect(page.getByText(/how can we help you/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /i'm a renter/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /i'm a landlord/i })).toBeVisible();
}

/**
 * Assert user is on login page
 */
export async function expectLoginPage(page: Page) {
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /log in|sign in/i })).toBeVisible();
}

/**
 * Assert user is on renter dashboard (SwipePage)
 */
export async function expectRenterDashboard(page: Page) {
  // Bottom navigation visible
  await expect(page.getByRole('button', { name: /swipe/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /matches/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /profile/i })).toBeVisible();
}

/**
 * Assert user is on landlord dashboard
 */
export async function expectLandlordDashboard(page: Page) {
  await expect(page.getByText(/landlord dashboard|my properties/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /add property/i })).toBeVisible();
}

/**
 * Assert user is on agency dashboard
 */
export async function expectAgencyDashboard(page: Page) {
  await expect(page.getByText(/agency dashboard|client properties/i)).toBeVisible();
}

/**
 * Assert toast notification appears
 */
export async function expectToast(page: Page, message: string | RegExp) {
  await expect(page.getByText(message)).toBeVisible({ timeout: 5000 });
}

/**
 * Assert validation error appears
 */
export async function expectValidationError(page: Page, message: string | RegExp) {
  await expect(page.getByText(message)).toBeVisible();
}

/**
 * Assert user is authenticated
 */
export async function expectAuthenticated(page: Page) {
  const authState = await page.evaluate(() => {
    const data = localStorage.getItem('get-on-auth');
    return data ? JSON.parse(data) : null;
  });

  expect(authState).toBeTruthy();
  expect(authState.state.isAuthenticated).toBe(true);
  expect(authState.state.currentUser).toBeTruthy();
}

/**
 * Assert user is not authenticated
 */
export async function expectNotAuthenticated(page: Page) {
  const authState = await page.evaluate(() => {
    const data = localStorage.getItem('get-on-auth');
    return data ? JSON.parse(data) : null;
  });

  if (authState) {
    expect(authState.state.isAuthenticated).toBe(false);
  }
}
