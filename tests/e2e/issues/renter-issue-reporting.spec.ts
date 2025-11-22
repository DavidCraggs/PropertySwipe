/**
 * E2E Tests - Renter Issue Reporting Flow
 * 
 * Comprehensive end-to-end tests for renter issue reporting functionality
 * Tests form interaction, validation, submission, persistence, and dashboard integration
 */

import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';
import type { Match, Property } from '../../../src/types';

test.describe('Renter Issue Reporting E2E', () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
    });

    test.afterEach(async ({ page }, testInfo) => {
        // Screenshot on failure
        if (testInfo.status !== 'passed') {
            await page.screenshot({
                path: `test-results/issue-reporting-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`,
                fullPage: true,
            });
        }
    });

    test('should render collapsed "Report New Issue" button initially', async ({ page }) => {
        // Setup renter with active tenancy
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const property: Property = {
                id: 'property-test-1',
                landlordId: 'landlord-test-1',
                address: {
                    street: '100 Test Street',
                    city: 'Liverpool',
                    postcode: 'L1 1AA',
                    council: 'Liverpool City Council',
                },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'Flat',
                images: [],
                description: 'Test property',
                epcRating: 'C',
                yearBuilt: 2010,
                features: [],
                furnishing: 'Furnished',
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic',
                maxOccupants: 2,
                petsPolicy: {
                    willConsiderPets: true,
                    preferredPetTypes: [],
                    requiresPetInsurance: false,
                    maxPetsAllowed: 1,
                },
                bills: {
                    councilTaxBand: 'A',
                    gasElectricIncluded: false,
                    waterIncluded: false,
                    internetIncluded: false,
                },
                meetsDecentHomesStandard: true,
                awababsLawCompliant: true,
                canBeMarketed: true,
                isAvailable: true,
                listingDate: '2024-01-01',
                acceptsShortTermTenants: false,
            };

            const match: Match = {
                id: 'match-test-1',
                renterId,
                landlordId: 'landlord-test-1',
                propertyId: 'property-test-1',
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active',
                tenancyStartDate: new Date('2024-02-01'),
                monthlyRentAmount: 1000,
                canRate: false,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
                activeIssueIds: [],
                totalIssuesRaised: 0,
                totalIssuesResolved: 0,
            };

            localStorage.setItem(' properties', JSON.stringify([property]));
            localStorage.setItem('matches', JSON.stringify([match]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Navigate to Issues tab
        await page.getByRole('button', { name: /issues|maintenance/i }).click();
        await page.waitForTimeout(500);

        // Verify collapsed state
        await expect(page.getByRole('button', { name: /report new issue/i })).toBeVisible();
        await expect(page.queryByText('Report an Issue')).not.toBeVisible();
    });

    test('should expand form when "Report New Issue" button clicked', async ({ page }) => {
        const renter = await setupAuthState(page, 'renter');

        // Setup test data (abbreviated for brevity)
        await page.evaluate(({ renterId }) => {
            const property: Property = {
                id: 'property-expand-test',
                landlordId: 'landlord-expand-test',
                address: { street: '200 Test Ave', city: 'Liverpool', postcode: 'L2 2AA', council: 'Liverpool' },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'House' as const,
                images: [],
                description: 'Test',
                epcRating: 'C',
                yearBuilt: 2010,
                features: [],
                furnishing: 'Furnished' as const,
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic' as const,
                maxOccupants: 2,
                petsPolicy: { willConsiderPets: true, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 1 },
                bills: { councilTaxBand: 'A', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
                canBeMarketed: true,
                isAvailable: true,
                listingDate: '2024-01-01',
                acceptsShortTermTenants: false,
            };

            const match: Match = {
                id: 'match-expand-test',
                renterId,
                landlordId: 'landlord-expand-test',
                propertyId: 'property-expand-test',
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active' as const,
                tenancyStartDate: new Date('2024-02-01'),
                monthlyRentAmount: 1000,
                canRate: false,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
                activeIssueIds: [],
                totalIssuesRaised: 0,
                totalIssuesResolved: 0,
            };

            localStorage.setItem('properties', JSON.stringify([property]));
            localStorage.setItem('matches', JSON.stringify([match]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Navigate to Issues tab
        await page.getByRole('button', { name: /issues|maintenance/i }).click();
        await page.waitForTimeout(500);

        // Click expand button
        await page.getByRole('button', { name: /report new issue/i }).click();
        await page.waitForTimeout(500);

        // Verify form is visible
        await expect(page.getByText('Report an Issue')).toBeVisible();
        await expect(page.getByLabel(/issue type/i)).toBeVisible();
        await expect(page.getByLabel(/priority/i)).toBeVisible();
        await expect(page.getByLabel(/subject/i)).toBeVisible();
        await expect(page.getByLabel(/description/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /submit issue/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    });

    test('should show validation error when category not selected', async ({ page }) => {
        const renter = await setupAuthState(page, 'renter');

        // Setup minimal test data
        await page.evaluate(({ renterId }) => {
            const property: Property = {
                id: 'prop-val-1',
                landlordId: 'land-val-1',
                address: { street: '1 Val St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'House' as const,
                images: [],
                description: 'Test',
                epcRating: 'C',
                yearBuilt: 2010,
                features: [],
                furnishing: 'Furnished' as const,
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic' as const,
                maxOccupants: 2,
                petsPolicy: { willConsiderPets: true, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 1 },
                bills: { councilTaxBand: 'A', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
                canBeMarketed: true,
                isAvailable: true,
                listingDate: '2024-01-01',
                acceptsShortTermTenants: false,
            };

            const match: Match = {
                id: 'match-val-1',
                renterId,
                landlordId: 'land-val-1',
                propertyId: 'prop-val-1',
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active' as const,
                tenancyStartDate: new Date('2024-02-01'),
                monthlyRentAmount: 1000,
                canRate: false,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
                activeIssueIds: [],
                totalIssuesRaised: 0,
                totalIssuesResolved: 0,
            };

            localStorage.setItem('properties', JSON.stringify([property]));
            localStorage.setItem('matches', JSON.stringify([match]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Navigate and expand form
        await page.getByRole('button', { name: /issues|maintenance/i }).click();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /report new issue/i }).click();
        await page.waitForTimeout(300);

        // Fill everything except category
        await page.getByLabel(/priority/i).selectOption('urgent');
        await page.getByLabel(/subject/i).fill('Test Issue');
        await page.getByLabel(/description/i).fill('This is a test issue description that is long enough to pass validation');

        // Try to submit
        await page.getByRole('button', { name: /submit issue/i }).click();
        await page.waitForTimeout(500);

        // Verify validation error
        await expect(page.getByText(/please select an issue type/i)).toBeVisible();
    });

    test('should show validation error when subject too short', async ({ page }) => {
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            // Minimal setup
            const property: Property = {
                id: 'prop-sub-1',
                landlordId: 'land-sub-1',
                address: { street: '1 Sub St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'House' as const,
                images: [],
                description: 'Test',
                epcRating: 'C',
                yearBuilt: 2010,
                features: [],
                furnishing: 'Furnished' as const,
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic' as const,
                maxOccupants: 2,
                petsPolicy: { willConsiderPets: true, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 1 },
                bills: { councilTaxBand: 'A', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
                canBeMarketed: true,
                isAvailable: true,
                listingDate: '2024-01-01',
                acceptsShortTermTenants: false,
            };

            const match: Match = {
                id: 'match-sub-1',
                renterId,
                landlordId: 'land-sub-1',
                propertyId: 'prop-sub-1',
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active' as const,
                tenancyStartDate: new Date('2024-02-01'),
                monthlyRentAmount: 1000,
                canRate: false,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
                activeIssueIds: [],
                totalIssuesRaised: 0,
                totalIssuesResolved: 0,
            };

            localStorage.setItem('properties', JSON.stringify([property]));
            localStorage.setItem('matches', JSON.stringify([match]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        await page.getByRole('button', { name: /issues|maintenance/i }).click();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /report new issue/i }).click();
        await page.waitForTimeout(300);

        // Fill with short subject
        await page.getByLabel(/issue type/i).selectOption('maintenance');
        await page.getByLabel(/subject/i).fill('Test');
        await page.getByLabel(/description/i).fill('This is a valid description with enough characters');

        await page.getByRole('button', { name: /submit issue/i }).click();
        await page.waitForTimeout(500);

        await expect(page.getByText(/subject must be at least 5 characters/i)).toBeVisible();
    });

    test('should successfully submit valid issue and show success message', async ({ page }) => {
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const property: Property = {
                id: 'prop-success-1',
                landlordId: 'land-success-1',
                address: { street: '1 Success St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'House' as const,
                images: [],
                description: 'Test',
                epcRating: 'C',
                yearBuilt: 2010,
                features: [],
                furnishing: 'Furnished' as const,
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic' as const,
                maxOccupants: 2,
                petsPolicy: { willConsiderPets: true, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 1 },
                bills: { councilTaxBand: 'A', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
                canBeMarketed: true,
                isAvailable: true,
                listingDate: '2024-01-01',
                acceptsShortTermTenants: false,
            };

            const match: Match = {
                id: 'match-success-1',
                renterId,
                landlordId: 'land-success-1',
                propertyId: 'prop-success-1',
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active' as const,
                tenancyStartDate: new Date('2024-02-01'),
                monthlyRentAmount: 1000,
                canRate: false,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
                activeIssueIds: [],
                totalIssuesRaised: 0,
                totalIssuesResolved: 0,
            };

            localStorage.setItem('properties', JSON.stringify([property]));
            localStorage.setItem('matches', JSON.stringify([match]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        await page.getByRole('button', { name: /issues|maintenance/i }).click();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /report new issue/i }).click();
        await page.waitForTimeout(300);

        // Fill valid form
        await page.getByLabel(/issue type/i).selectOption('maintenance');
        await page.getByLabel(/priority/i).selectOption('urgent');
        await page.getByLabel(/subject/i).fill('Leaky faucet in kitchen');
        await page.getByLabel(/description/i).fill('The kitchen faucet has been dripping constantly for the past two days and needs immediate repair');

        // Submit
        await page.getByRole('button', { name: /submit issue/i }).click();
        await page.waitForTimeout(1500);

        // Verify success message
        await expect(page.getByText(/issue reported successfully/i)).toBeVisible();
    });

    test('should save issue to localStorage and verify persistence', async ({ page }) => {
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const property: Property = {
                id: 'prop-persist-1',
                landlordId: 'land-persist-1',
                address: { street: '1 Persist St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'House' as const,
                images: [],
                description: 'Test',
                epcRating: 'C',
                yearBuilt: 2010,
                features: [],
                furnishing: 'Furnished' as const,
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic' as const,
                maxOccupants: 2,
                petsPolicy: { willConsiderPets: true, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 1 },
                bills: { councilTaxBand: 'A', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
                canBeMarketed: true,
                isAvailable: true,
                listingDate: '2024-01-01',
                acceptsShortTermTenants: false,
            };

            const match: Match = {
                id: 'match-persist-1',
                renterId,
                landlordId: 'land-persist-1',
                propertyId: 'prop-persist-1',
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active' as const,
                tenancyStartDate: new Date('2024-02-01'),
                monthlyRentAmount: 1000,
                canRate: false,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
                activeIssueIds: [],
                totalIssuesRaised: 0,
                totalIssuesResolved: 0,
            };

            localStorage.setItem('properties', JSON.stringify([property]));
            localStorage.setItem('matches', JSON.stringify([match]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        await page.getByRole('button', { name: /issues|maintenance/i }).click();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /report new issue/i }).click();
        await page.waitForTimeout(300);

        // Fill and submit
        await page.getByLabel(/issue type/i).selectOption('repair');
        await page.getByLabel(/priority/i).selectOption('emergency');
        await page.getByLabel(/subject/i).fill('Broken window pane');
        await page.getByLabel(/description/i).fill('Bedroom window has a large crack and needs emergency replacement for security');

        await page.getByRole('button', { name: /submit issue/i }).click();
        await page.waitForTimeout(1500);

        // Verify issue saved to localStorage
        const savedIssues = await page.evaluate(() => {
            const stored = localStorage.getItem('issues');
            return stored ? JSON.parse(stored) : [];
        });

        expect(savedIssues).toHaveLength(1);
        expect(savedIssues[0]).toMatchObject({
            propertyId: 'prop-persist-1',
            landlordId: 'land-persist-1',
            category: 'repair',
            priority: 'emergency',
            subject: 'Broken window pane',
            description: 'Bedroom window has a large crack and needs emergency replacement for security',
            status: 'open',
        });

        // Verify SLA deadline was calculated
        expect(savedIssues[0].slaDeadline).toBeDefined();
        expect(savedIssues[0].raisedAt).toBeDefined();
    });

    test('should include agencyId when property is agency-managed', async ({ page }) => {
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const property: Property = {
                id: 'prop-agency-1',
                landlordId: 'land-agency-1',
                managingAgencyId: 'agency-123', // Property has managing agency
                address: { street: '1 Agency St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'House' as const,
                images: [],
                description: 'Test',
                epcRating: 'C',
                yearBuilt: 2010,
                features: [],
                furnishing: 'Furnished' as const,
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic' as const,
                maxOccupants: 2,
                petsPolicy: { willConsiderPets: true, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 1 },
                bills: { councilTaxBand: 'A', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
                canBeMarketed: true,
                isAvailable: true,
                listingDate: '2024-01-01',
                acceptsShortTermTenants: false,
            };

            const match: Match = {
                id: 'match-agency-1',
                renterId,
                landlordId: 'land-agency-1',
                propertyId: 'prop-agency-1',
                managingAgencyId: 'agency-123',
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active' as const,
                tenancyStartDate: new Date('2024-02-01'),
                monthlyRentAmount: 1000,
                canRate: false,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
                activeIssueIds: [],
                totalIssuesRaised: 0,
                totalIssuesResolved: 0,
            };

            localStorage.setItem('properties', JSON.stringify([property]));
            localStorage.setItem('matches', JSON.stringify([match]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        await page.getByRole('button', { name: /issues|maintenance/i }).click();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /report new issue/i }).click();
        await page.waitForTimeout(300);

        // Verify messaging mentions agency
        await expect(page.getByText(/your managing agency will be notified/i)).toBeVisible();

        // Fill and submit
        await page.getByLabel(/issue type/i).selectOption('complaint');
        await page.getByLabel(/priority/i).selectOption('routine');
        await page.getByLabel(/subject/i).fill('Noise complaint from neighbor');
        await page.getByLabel(/description/i).fill('Neighbor has been making excessive noise during late night hours repeatedly');

        await page.getByRole('button', { name: /submit issue/i }).click();
        await page.waitForTimeout(1500);

        // Verify agencyId included in saved issue
        const savedIssues = await page.evaluate(() => {
            const stored = localStorage.getItem('issues');
            return stored ? JSON.parse(stored) : [];
        });

        expect(savedIssues).toHaveLength(1);
        expect(savedIssues[0].agencyId).toBe('agency-123');
    });

    test('should display loading state during submission', async ({ page }) => {
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const property: Property = {
                id: 'prop-loading-1',
                landlordId: 'land-loading-1',
                address: { street: '1 Loading St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'House' as const,
                images: [],
                description: 'Test',
                epcRating: 'C',
                yearBuilt: 2010,
                features: [],
                furnishing: 'Furnished' as const,
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic' as const,
                maxOccupants: 2,
                petsPolicy: { willConsiderPets: true, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 1 },
                bills: { councilTaxBand: 'A', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
                canBeMarketed: true,
                isAvailable: true,
                listingDate: '2024-01-01',
                acceptsShortTermTenants: false,
            };

            const match: Match = {
                id: 'match-loading-1',
                renterId,
                landlordId: 'land-loading-1',
                propertyId: 'prop-loading-1',
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active' as const,
                tenancyStartDate: new Date('2024-02-01'),
                monthlyRentAmount: 1000,
                canRate: false,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
                activeIssueIds: [],
                totalIssuesRaised: 0,
                totalIssuesResolved: 0,
            };

            localStorage.setItem('properties', JSON.stringify([property]));
            localStorage.setItem('matches', JSON.stringify([match]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        await page.getByRole('button', { name: /issues|maintenance/i }).click();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /report new issue/i }).click();
        await page.waitForTimeout(300);

        // Fill form
        await page.getByLabel(/issue type/i).selectOption('maintenance');
        await page.getByLabel(/subject/i).fill('Test Issue');
        await page.getByLabel(/description/i).fill('This is a test description for loading state verification');

        // Click submit and immediately verify loading state
        const submitButton = page.getByRole('button', { name: /submit issue/i });
        await submitButton.click();

        // Verify loading state appears briefly
        await expect(page.getByText(/submitting/i)).toBeVisible({ timeout: 1000 });
    });

    test('should cancel and reset form correctly', async ({ page }) => {
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const property: Property = {
                id: 'prop-cancel-1',
                landlordId: 'land-cancel-1',
                address: { street: '1 Cancel St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'House' as const,
                images: [],
                description: 'Test',
                epcRating: 'C',
                yearBuilt: 2010,
                features: [],
                furnishing: 'Furnished' as const,
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic' as const,
                maxOccupants: 2,
                petsPolicy: { willConsiderPets: true, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 1 },
                bills: { councilTaxBand: 'A', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
                canBeMarketed: true,
                isAvailable: true,
                listingDate: '2024-01-01',
                acceptsShortTermTenants: false,
            };

            const match: Match = {
                id: 'match-cancel-1',
                renterId,
                landlordId: 'land-cancel-1',
                propertyId: 'prop-cancel-1',
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active' as const,
                tenancyStartDate: new Date('2024-02-01'),
                monthlyRentAmount: 1000,
                canRate: false,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
                activeIssueIds: [],
                totalIssuesRaised: 0,
                totalIssuesResolved: 0,
            };

            localStorage.setItem('properties', JSON.stringify([property]));
            localStorage.setItem('matches', JSON.stringify([match]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        await page.getByRole('button', { name: /issues|maintenance/i }).click();
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /report new issue/i }).click();
        await page.waitForTimeout(300);

        // Fill some data
        await page.getByLabel(/issue type/i).selectOption('maintenance');
        await page.getByLabel(/subject/i).fill('Test Data');
        await page.getByLabel(/description/i).fill('Some test description');

        // Cancel
        await page.getByRole('button', { name: /cancel/i }).click();
        await page.waitForTimeout(300);

        // Verify form collapsed
        await expect(page.getByText('Report an Issue')).not.toBeVisible();
        await expect(page.getByRole('button', { name: /report new issue/i })).toBeVisible();

        // Expand again and verify form is reset
        await page.getByRole('button', { name: /report new issue/i }).click();
        await page.waitForTimeout(300);

        const categoryValue = await page.getByLabel(/issue type/i).inputValue();
        const subjectValue = await page.getByLabel(/subject/i).inputValue();
        const descriptionValue = await page.getByLabel(/description/i).inputValue();

        expect(categoryValue).toBe('');
        expect(subjectValue).toBe('');
        expect(descriptionValue).toBe('');
    });
});
