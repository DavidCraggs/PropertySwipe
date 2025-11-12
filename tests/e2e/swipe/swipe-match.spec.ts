import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';
import { setupPropertyData } from '../utils/property-helpers';
import { expectRenterDashboard } from '../utils/assertions';

test.describe('Swipe and Match Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('should swipe right on property and create match', async ({ page }) => {
    // Setup: Create landlord with property
    const landlord = await setupAuthState(page, 'landlord');
    const property = await setupPropertyData(page, landlord.profile.id);

    // Clear auth and setup renter
    await clearStorage(page);
    await setupAuthState(page, 'renter');

    await page.goto('/');
    await expectRenterDashboard(page);

    // Wait for property to load
    await page.waitForTimeout(1000);

    // Should see property card
    await expect(page.getByText(property.street)).toBeVisible();

    // Swipe right (like) - find button by icon or text
    const likeButton = page.getByRole('button').filter({ hasText: /like|yes|❤️|♥️/i }).or(
      page.locator('button[aria-label*="like" i], button[aria-label*="yes" i]')
    );

    if (await likeButton.count() > 0) {
      await likeButton.first().click();
    } else {
      // Fallback: find any button that might be the like button (usually green or heart icon)
      await page.locator('button').filter({ has: page.locator('svg') }).nth(1).click();
    }

    // Wait for swipe animation
    await page.waitForTimeout(500);

    // Verify match created in localStorage
    const matches = await page.evaluate(() => {
      const appState = localStorage.getItem('get-on-app');
      if (!appState) return [];

      const parsed = JSON.parse(appState);
      return parsed.state?.matches || [];
    });

    expect(matches.length).toBeGreaterThan(0);
  });

  test('should swipe left to skip property', async ({ page }) => {
    // Setup
    const landlord = await setupAuthState(page, 'landlord');
    const property = await setupPropertyData(page, landlord.profile.id);

    await clearStorage(page);
    await setupAuthState(page, 'renter');

    await page.goto('/');
    await page.waitForTimeout(1000);

    // Verify property is visible
    await expect(page.getByText(property.street)).toBeVisible();

    // Swipe left (pass)
    const passButton = page.getByRole('button').filter({ hasText: /pass|no|✕|×/i }).or(
      page.locator('button[aria-label*="pass" i], button[aria-label*="no" i]')
    );

    if (await passButton.count() > 0) {
      await passButton.first().click();
    } else {
      // Fallback: click first button (usually the pass/no button)
      await page.locator('button').filter({ has: page.locator('svg') }).first().click();
    }

    // Wait for swipe animation
    await page.waitForTimeout(500);

    // Property should disappear or show "no more properties"
    await expect(page.getByText(property.street)).not.toBeVisible();
  });

  test('should show matches page with matched properties', async ({ page }) => {
    // Setup match
    const landlord = await setupAuthState(page, 'landlord');
    const property = await setupPropertyData(page, landlord.profile.id);

    await clearStorage(page);
    const renter = await setupAuthState(page, 'renter');

    // Create match programmatically
    await page.evaluate(({ renterId, propertyId }) => {
      const match = {
        id: `match-${Date.now()}`,
        propertyId,
        renterId,
        landlordId: 'test-landlord',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const appState = JSON.parse(localStorage.getItem('get-on-app') || '{"state": {"matches": []}}');
      if (!appState.state) appState.state = {};
      if (!appState.state.matches) appState.state.matches = [];
      appState.state.matches.push(match);
      localStorage.setItem('get-on-app', JSON.stringify(appState));
    }, { renterId: renter.profile.id, propertyId: property.id });

    await page.goto('/');

    // Navigate to matches page
    await page.getByRole('button', { name: /matches/i }).click();

    // Wait for matches page to load
    await page.waitForTimeout(500);

    // Should see match
    await expect(page.getByText(/matches|matched/i)).toBeVisible();
  });
});
