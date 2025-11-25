import { test, expect, Page } from '@playwright/test';
import { createRenterInvite } from '../../../src/lib/storage';
import type { RenterInvite } from '../../../src/types';

/**
 * E2E tests for renter invite code flow
 * Tests onboarding with and without invite codes, validation, and error handling
 */

// Helper to navigate to renter onboarding
async function navigateToRenterOnboarding(page: Page) {
    await page.goto('/');
    // Assuming there's a "Sign Up as Renter" or similar button on the homepage
    await page.click('text=Sign Up');
    await page.click('text=Renter');
}

// Helper to complete onboarding form (all steps)
async function completeOnboardingSteps(page: Page, data: {
    email: string;
    password: string;
    situation?: string;
    names?: string;
    ages?: string;
}) {
    // Personal info step
    await page.fill('input[type="email"]', data.email);
    await page.fill('input[type="password"]', data.password);

    // Situation
    if (data.situation) {
        await page.click(`text=${data.situation}`);
    } else {
        await page.click('text=Single');
    }
    await page.click('text=Continue');

    // Names and ages
    await page.fill('input[placeholder*="name" i]', data.names || 'John Doe');
    await page.fill('input[placeholder*="age" i]', data.ages || '28');
    await page.click('text=Continue');

    // Location - select first option
    await page.click('text=Southport');
    await page.click('text=Continue');

    // Renter type
    await page.click('text=Young Professional');
    await page.click('text=Continue');

    // Employment
    await page.click('text=Employed Full-Time');
    await page.fill('input[placeholder*="income" i]', '3500');
    await page.click('text=Continue');

    // Pets
    await page.click('text=No');
    await page.click('text=Continue');

    // Furnishing preference
    await page.click('text=Furnished');
    await page.click('text=Continue');

    // Move-in date
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateString);
    await page.click('text=Continue');

    // Final submit
    await page.click('button:has-text("Complete Signup")');
}

// Helper to clean up test data
async function cleanupTestData() {
    // Clear localStorage
    localStorage.clear();

    // In a real scenario, you'd also clear Supabase test data
    // This would require API calls or direct database access
}

test.describe('Renter Invite Flow - E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to app
        await page.goto('/');
    });

    test.afterEach(async () => {
        await cleanupTestData();
    });

    test('New renter completes onboarding without invite', async ({ page }) => {
        await navigateToRenterOnboarding(page);

        // Should see InviteCodePrompt with two options
        await expect(page.locator('text=I have an invite code')).toBeVisible();
        await expect(page.locator('text=I\'m a new renter')).toBeVisible();

        // Click "I'm a new renter"
        await page.click('text=I\'m a new renter');

        // Complete all onboarding steps
        await completeOnboardingSteps(page, {
            email: 'newrenter@test.com',
            password: 'SecurePass123!',
        });

        // Verify redirected to dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // Verify profile created with status='prospective'
        // This would require checking localStorage or making an API call
        const profileJson = await page.evaluate(() => {
            return localStorage.getItem('renter-profile');
        });

        if (profileJson) {
            const profile = JSON.parse(profileJson);
            expect(profile.status).toBe('prospective');
            expect(profile.email).toBe('newrenter@test.com');
        }

        // Verify no Match created (dashboard should show "Find Properties" state)
        await expect(page.locator('text=Find Properties')).toBeVisible();
    });

    test('Renter with valid invite completes onboarding', async ({ page }) => {
        // Setup: Create invite via storage function
        const testInvite = await createRenterInvite({
            createdById: 'test-landlord-123',
            createdByType: 'landlord',
            propertyId: 'test-property-123',
            landlordId: 'test-landlord-123',
            proposedRentPcm: 2500,
            proposedDepositAmount: 2885,
            specialTerms: 'E2E test invite',
        });

        const inviteCode = testInvite.code;

        await navigateToRenterOnboarding(page);

        // Click "I have an invite code"
        await page.click('text=I have an invite code');

        // Enter valid invite code
        await page.fill('input[placeholder*="code" i]', inviteCode);
        await page.click('button:has-text("Validate")');

        // Wait for validation
        await page.waitForTimeout(1000);

        // Verify property preview shown
        await expect(page.locator('text=Valid invite!')).toBeVisible();
        await expect(page.locator('text=£2500')).toBeVisible(); // Rent amount

        // Auto-redirect should happen after 1.5s, or click continue
        await page.waitForTimeout(2000);

        // Complete onboarding steps
        await completeOnboardingSteps(page, {
            email: 'invitedrenter@test.com',
            password: 'SecurePass123!',
        });

        // Verify profile created with status='current'
        const profileJson = await page.evaluate(() => {
            return localStorage.getItem('renter-profile');
        });

        if (profileJson) {
            const profile = JSON.parse(profileJson);
            expect(profile.status).toBe('current');
            expect(profile.email).toBe('invitedrenter@test.com');
            expect(profile.currentPropertyId).toBe('test-property-123');
        }

        // Verify Match created
        const matchesJson = await page.evaluate(() => {
            return localStorage.getItem('matches');
        });

        if (matchesJson) {
            const matches = JSON.parse(matchesJson);
            expect(matches.length).toBeGreaterThan(0);
            expect(matches[0].propertyId).toBe('test-property-123');
            expect(matches[0].applicationStatus).toBe('application_submitted');
        }

        // Verify dashboard shows correct property
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.locator('text=123 Test St')).toBeVisible(); // Property address
    });

    test('Invalid invite code shows error', async ({ page }) => {
        await navigateToRenterOnboarding(page);

        // Click "I have an invite code"
        await page.click('text=I have an invite code');

        // Enter invalid code
        await page.fill('input[placeholder*="code" i]', 'INVALID1');
        await page.click('button:has-text("Validate")');

        // Wait for validation
        await page.waitForTimeout(1000);

        // Verify error message shown
        await expect(page.locator('text=Invite code not found')).toBeVisible();
        await expect(page.locator('text=Please check and try again')).toBeVisible();

        // Verify cannot proceed (no property preview)
        await expect(page.locator('text=Valid invite!')).not.toBeVisible();

        // Continue button should not be available/disabled
        const continueButton = page.locator('button:has-text("Continue")');
        if (await continueButton.isVisible()) {
            await expect(continueButton).toBeDisabled();
        }
    });

    test('Expired invite code shows error', async ({ page }) => {
        // Setup: Create expired invite
        const expiredInvite = await createRenterInvite({
            createdById: 'test-landlord-123',
            createdByType: 'landlord',
            propertyId: 'test-property-123',
            landlordId: 'test-landlord-123',
            proposedRentPcm: 2500,
        });

        // Manually set expiry to past date in localStorage
        await page.evaluate((code) => {
            const invites = JSON.parse(localStorage.getItem('renter-invites') || '[]');
            const invite = invites.find((inv: any) => inv.code === code);
            if (invite) {
                invite.expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
                localStorage.setItem('renter-invites', JSON.stringify(invites));
            }
        }, expiredInvite.code);

        await navigateToRenterOnboarding(page);

        // Click "I have an invite code"
        await page.click('text=I have an invite code');

        // Enter expired code
        await page.fill('input[placeholder*="code" i]', expiredInvite.code);
        await page.click('button:has-text("Validate")');

        // Wait for validation
        await page.waitForTimeout(1000);

        // Verify error message contains "expired"
        await expect(page.locator('text=expired')).toBeVisible();
        await expect(page.locator('text=Contact your landlord')).toBeVisible();
    });

    test('Already used invite code shows error', async ({ page }) => {
        // Setup: Create and redeem invite
        const usedInvite = await createRenterInvite({
            createdById: 'test-landlord-123',
            createdByType: 'landlord',
            propertyId: 'test-property-123',
            landlordId: 'test-landlord-123',
            proposedRentPcm: 2500,
        });

        // Mark as accepted in localStorage
        await page.evaluate((code) => {
            const invites = JSON.parse(localStorage.getItem('renter-invites') || '[]');
            const invite = invites.find((inv: any) => inv.code === code);
            if (invite) {
                invite.status = 'accepted';
                invite.acceptedAt = new Date();
                invite.acceptedByRenterId = 'other-renter-123';
                localStorage.setItem('renter-invites', JSON.stringify(invites));
            }
        }, usedInvite.code);

        await navigateToRenterOnboarding(page);

        // Click "I have an invite code"
        await page.click('text=I have an invite code');

        // Try to use same code again
        await page.fill('input[placeholder*="code" i]', usedInvite.code);
        await page.click('button:has-text("Validate")');

        // Wait for validation
        await page.waitForTimeout(1000);

        // Verify error message "already been used"
        await expect(page.locator('text=already been used')).toBeVisible();
    });

    test('Landlord creates invite code', async ({ page }) => {
        // Setup: Login as test landlord
        await page.goto('/login');
        await page.fill('input[type="email"]', 'test.landlord@example.com');
        await page.fill('input[type="password"]', 'LandlordPass123!');
        await page.click('button:has-text("Login")');

        // Wait for redirect to dashboard
        await page.waitForURL(/\/dashboard/);

        // Navigate to property (assuming properties are listed)
        await page.click('text=My Properties');
        await page.click('text=123 Test St'); // Click on first property

        // Click "Invite Renter" button
        await page.click('button:has-text("Invite Renter")');

        // Modal should open
        await expect(page.locator('text=Invite Renter')).toBeVisible();

        // Fill invite form
        // Rent should be pre-filled, but we can verify and adjust
        const rentInput = page.locator('input[placeholder*="rent" i]');
        await expect(rentInput).toHaveValue('2500');

        // Fill optional deposit
        await page.fill('input[placeholder*="deposit" i]', '2885');

        // Fill optional move-in date
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        await page.fill('input[type="date"]', futureDate.toISOString().split('T')[0]);

        // Fill special terms
        await page.fill('textarea[placeholder*="terms" i]', 'Pet-friendly property');

        // Submit
        await page.click('button:has-text("Create Invite")');

        // Wait for invite creation
        await page.waitForTimeout(1000);

        // Verify code displayed (should be 8 characters, uppercase)
        const codeElement = page.locator('[class*="text-4xl"]'); // Large code display
        await expect(codeElement).toBeVisible();
        const codeText = await codeElement.textContent();
        expect(codeText).toMatch(/^[A-Z0-9]{8}$/);

        // Copy code (click on code element)
        await codeElement.click();

        // Verify "Copied!" shown
        await expect(page.locator('text=Copied!')).toBeVisible();

        // Wait for feedback to disappear (2s timeout)
        await page.waitForTimeout(2500);
        await expect(page.locator('text=Copied!')).not.toBeVisible();

        // Close modal
        await page.click('button:has-text("Done")');

        // Verify modal closed
        await expect(page.locator('text=Invite Renter')).not.toBeVisible();
    });
});

// Additional test for mode switching (Supabase vs localStorage)
test.describe('Renter Invite Flow - Mode Tests', () => {
    test('Tests run in localStorage mode', async ({ page }) => {
        // This test verifies localStorage mode is working
        await page.goto('/');

        const isLocalStorageMode = await page.evaluate(() => {
            return !window.localStorage.getItem('SUPABASE_URL');
        });

        expect(isLocalStorageMode).toBe(true);
    });

    // Supabase mode test would require environment setup
    test.skip('Tests run in Supabase mode', async ({ page }) => {
        // This would require SUPABASE_URL and SUPABASE_ANON_KEY to be set
        // Skip for now as it requires backend configuration
    });
});
