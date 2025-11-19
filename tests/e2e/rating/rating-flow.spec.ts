import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';
import type { Match, Property, RenterProfile, LandlordProfile } from '../../../src/types';

test.describe('Rating Flow E2E', () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
    });

    test.afterEach(async ({ page, context }, testInfo) => {
        // Take screenshot on failure
        if (testInfo.status !== 'passed') {
            await page.screenshot({
                path: `test-results/rating-flow-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`,
                fullPage: true,
            });
        }
    });

    test('Test 1: Renter rates landlord after tenancy', async ({ page }) => {
        // Setup: Create renter with ended tenancy
        const renter = await setupAuthState(page, 'renter');

        // Create test data: ended tenancy
        await page.evaluate(({ renterId }) => {
            const landlordId = 'landlord-123';
            const propertyId = 'property-123';

            // Create property
            const property: Property = {
                id: propertyId,
                landlordId: landlordId,
                address: {
                    street: '123 Test Street',
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
                furnishing: 'Unfurnished',
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic',
                maxOccupants: 2,
                petsPolicy: {
                    willConsiderPets: true,
                    preferredPetTypes: ['cat'],
                    requiresPetInsurance: true,
                    maxPetsAllowed: 1,
                },
                bills: {
                    councilTaxBand: 'B',
                    gasElectricIncluded: false,
                    waterIncluded: false,
                    internetIncluded: false,
                },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
            };

            // Create ended match
            const match: Match = {
                id: 'match-123',
                renterId,
                landlordId,
                propertyId,
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'ended',
                tenancyStartDate: '2024-02-01',
                tenancyEndDate: '2024-12-01',
                monthlyRentAmount: 1000,
                canRate: true,
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

        // Reload to apply test data
        await page.reload();
        await page.waitForTimeout(1000);

        // Navigate to matches
        await page.getByRole('button', { name: /matches/i }).click();
        await page.waitForTimeout(500);

        // Find ended tenancy and click "Rate Landlord"
        await expect(page.getByText(/ended/i)).toBeVisible();
        await page.getByRole('button', { name: /rate landlord/i }).click();
        await page.waitForTimeout(500);

        // Fill rating form
        await expect(page.getByText(/rate your landlord/i)).toBeVisible();

        // Set overall rating (click 4th star)
        const stars = page.locator('[data-testid="star-rating"]').first();
        await stars.locator('button').nth(3).click();
        await page.waitForTimeout(200);

        // Fill category scores
        const categoryRatings = page.locator('[data-testid="star-rating"]');
        await categoryRatings.nth(1).locator('button').nth(3).click(); // Communication
        await page.waitForTimeout(100);
        await categoryRatings.nth(2).locator('button').nth(4).click(); // Cleanliness
        await page.waitForTimeout(100);
        await categoryRatings.nth(3).locator('button').nth(3).click(); // Reliability
        await page.waitForTimeout(100);
        await categoryRatings.nth(4).locator('button').nth(4).click(); // Property condition
        await page.waitForTimeout(100);

        // Fill review text (minimum 50 characters)
        const reviewText = 'Great landlord! Very responsive and kept the property in excellent condition throughout the tenancy.';
        await page.locator('textarea').fill(reviewText);

        // Check "Would recommend"
        await page.locator('input[type="checkbox"]').check();

        // Submit
        await page.getByRole('button', { name: /submit rating/i }).click();
        await page.waitForTimeout(1000);

        // Verify success message
        await expect(page.getByText(/rating submitted successfully/i)).toBeVisible();

        // Verify "Rated ✓" badge appears
        await expect(page.getByText(/rated.*✓/i)).toBeVisible();
    });

    test('Test 2: Landlord rates renter after tenancy', async ({ page }) => {
        // Setup: Create landlord with ended tenancy
        const landlord = await setupAuthState(page, 'landlord');

        // Create test data: ended tenancy
        await page.evaluate(({ landlordId }) => {
            const renterId = 'renter-456';
            const propertyId = 'property-456';

            const property: Property = {
                id: propertyId,
                landlordId: landlordId,
                address: {
                    street: '456 Landlord Street',
                    city: 'Manchester',
                    postcode: 'M1 1BB',
                    council: 'Manchester City Council',
                },
                rentPcm: 1200,
                deposit: 1400,
                maxRentInAdvance: 1,
                bedrooms: 3,
                bathrooms: 2,
                propertyType: 'Terraced',
                images: [],
                description: 'Test property for landlord',
                epcRating: 'B',
                yearBuilt: 2015,
                features: [],
                furnishing: 'Furnished',
                availableFrom: '2024-01-01',
                tenancyType: 'Fixed',
                maxOccupants: 4,
                petsPolicy: {
                    willConsiderPets: false,
                    preferredPetTypes: [],
                    requiresPetInsurance: false,
                    maxPetsAllowed: 0,
                },
                bills: {
                    councilTaxBand: 'C',
                    gasElectricIncluded: true,
                    waterIncluded: true,
                    internetIncluded: false,
                },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
            };

            const match: Match = {
                id: 'match-456',
                renterId,
                landlordId,
                propertyId,
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'ended',
                tenancyStartDate: '2024-02-01',
                tenancyEndDate: '2024-12-01',
                monthlyRentAmount: 1200,
                canRate: true,
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
        }, { landlordId: landlord.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Navigate to matches
        await page.getByRole('button', { name: /matches/i }).click();
        await page.waitForTimeout(500);

        // Click "Rate Tenant"
        await page.getByRole('button', { name: /rate tenant/i }).click();
        await page.waitForTimeout(500);

        // Fill rating form
        await expect(page.getByText(/rate your tenant/i)).toBeVisible();

        // Set overall rating
        const stars = page.locator('[data-testid="star-rating"]').first();
        await stars.locator('button').nth(4).click(); // 5 stars
        await page.waitForTimeout(200);

        // Fill category scores
        const categoryRatings = page.locator('[data-testid="star-rating"]');
        await categoryRatings.nth(1).locator('button').nth(4).click(); // Communication
        await page.waitForTimeout(100);
        await categoryRatings.nth(2).locator('button').nth(4).click(); // Cleanliness
        await page.waitForTimeout(100);
        await categoryRatings.nth(3).locator('button').nth(4).click(); // Reliability
        await page.waitForTimeout(100);
        await categoryRatings.nth(4).locator('button').nth(4).click(); // Respect for property
        await page.waitForTimeout(100);

        // Fill review
        const reviewText = 'Excellent tenant! Always paid rent on time, kept the property immaculate, and communicated well.';
        await page.locator('textarea').fill(reviewText);

        // Check "Would recommend"
        await page.locator('input[type="checkbox"]').check();

        // Submit
        await page.getByRole('button', { name: /submit rating/i }).click();
        await page.waitForTimeout(1000);

        // Verify success
        await expect(page.getByText(/rating submitted successfully/i)).toBeVisible();
    });

    test('Test 3: Cannot rate twice', async ({ page }) => {
        // Setup: Create renter who has already rated
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const landlordId = 'landlord-789';
            const propertyId = 'property-789';

            const property: Property = {
                id: propertyId,
                landlordId: landlordId,
                address: {
                    street: '789 Already Rated Street',
                    city: 'Liverpool',
                    postcode: 'L3 3CC',
                    council: 'Liverpool City Council',
                },
                rentPcm: 900,
                deposit: 1000,
                maxRentInAdvance: 1,
                bedrooms: 1,
                bathrooms: 1,
                propertyType: 'Flat',
                images: [],
                description: 'Already rated property',
                epcRating: 'C',
                yearBuilt: 2008,
                features: [],
                furnishing: 'Unfurnished',
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic',
                maxOccupants: 2,
                petsPolicy: {
                    willConsiderPets: true,
                    preferredPetTypes: ['cat'],
                    requiresPetInsurance: true,
                    maxPetsAllowed: 1,
                },
                bills: {
                    councilTaxBand: 'A',
                    gasElectricIncluded: false,
                    waterIncluded: false,
                    internetIncluded: false,
                },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
            };

            const match: Match = {
                id: 'match-789',
                renterId,
                landlordId,
                propertyId,
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'ended',
                tenancyStartDate: '2024-02-01',
                tenancyEndDate: '2024-11-01',
                monthlyRentAmount: 900,
                canRate: false, // Already rated
                hasRenterRated: true,
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

        // Navigate to matches
        await page.getByRole('button', { name: /matches/i }).click();
        await page.waitForTimeout(500);

        // Verify "Rated ✓" badge is shown
        await expect(page.getByText(/rated.*✓/i)).toBeVisible();

        // Verify "Rate Landlord" button is disabled or not present
        const rateButton = page.getByRole('button', { name: /rate landlord/i });
        if (await rateButton.isVisible()) {
            await expect(rateButton).toBeDisabled();
        }
    });

    test('Test 4: Ratings display on profile', async ({ page }) => {
        // Setup: Create landlord with ratings
        const landlord = await setupAuthState(page, 'landlord');

        await page.evaluate(({ landlordId }) => {
            // Create ratings for this landlord
            const ratings = [
                {
                    id: 'rating-1',
                    matchId: 'match-1',
                    fromUserId: 'renter-1',
                    fromUserType: 'renter',
                    toUserId: landlordId,
                    toUserType: 'landlord',
                    propertyId: 'property-1',
                    overallScore: 5,
                    categoryScores: {
                        communication: 5,
                        cleanliness: 5,
                        reliability: 5,
                        property_condition: 5,
                    },
                    review: 'Excellent landlord!',
                    wouldRecommend: true,
                    tenancyStartDate: new Date('2023-01-01'),
                    tenancyEndDate: new Date('2024-01-01'),
                    isVerified: true,
                    createdAt: new Date(),
                    isHidden: false,
                },
                {
                    id: 'rating-2',
                    matchId: 'match-2',
                    fromUserId: 'renter-2',
                    fromUserType: 'renter',
                    toUserId: landlordId,
                    toUserType: 'landlord',
                    propertyId: 'property-2',
                    overallScore: 4,
                    categoryScores: {
                        communication: 4,
                        cleanliness: 4,
                        reliability: 4,
                        property_condition: 4,
                    },
                    review: 'Good landlord, responsive.',
                    wouldRecommend: true,
                    tenancyStartDate: new Date('2022-01-01'),
                    tenancyEndDate: new Date('2023-01-01'),
                    isVerified: true,
                    createdAt: new Date(),
                    isHidden: false,
                },
            ];

            localStorage.setItem(`ratings-${landlordId}`, JSON.stringify(ratings));
        }, { landlordId: landlord.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Navigate to profile
        await page.getByRole('button', { name: /profile/i }).click();
        await page.waitForTimeout(500);

        // Scroll to ratings section
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(500);

        // Verify RatingsSummaryCard displays
        await expect(page.getByText(/your ratings/i)).toBeVisible();

        // Verify overall score matches data (average of 5 and 4 = 4.5)
        await expect(page.getByText(/4\.5/)).toBeVisible();

        // Verify rating count
        await expect(page.getByText(/2.*ratings/i)).toBeVisible();
    });

    test('Test 5: Rating validation errors', async ({ page }) => {
        // Setup: Create renter with ended tenancy
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const landlordId = 'landlord-validation';
            const propertyId = 'property-validation';

            const property: Property = {
                id: propertyId,
                landlordId: landlordId,
                address: {
                    street: '999 Validation Street',
                    city: 'Liverpool',
                    postcode: 'L9 9VV',
                    council: 'Liverpool City Council',
                },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'Flat',
                images: [],
                description: 'Validation test property',
                epcRating: 'C',
                yearBuilt: 2010,
                features: [],
                furnishing: 'Unfurnished',
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic',
                maxOccupants: 2,
                petsPolicy: {
                    willConsiderPets: true,
                    preferredPetTypes: ['cat'],
                    requiresPetInsurance: true,
                    maxPetsAllowed: 1,
                },
                bills: {
                    councilTaxBand: 'B',
                    gasElectricIncluded: false,
                    waterIncluded: false,
                    internetIncluded: false,
                },
                meetsDecentHomesStandard: true,
                awaabsLawCompliant: true,
            };

            const match: Match = {
                id: 'match-validation',
                renterId,
                landlordId,
                propertyId,
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'ended',
                tenancyStartDate: '2024-02-01',
                tenancyEndDate: '2024-12-01',
                monthlyRentAmount: 1000,
                canRate: true,
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

        // Navigate to matches and open rating modal
        await page.getByRole('button', { name: /matches/i }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: /rate landlord/i }).click();
        await page.waitForTimeout(500);

        // Try to submit empty form
        await page.getByRole('button', { name: /submit rating/i }).click();
        await page.waitForTimeout(500);

        // Verify error messages appear
        await expect(page.getByText(/please select.*rating/i)).toBeVisible();

        // Fill review with only 30 characters
        const shortReview = 'This review is too short!!!';
        await page.locator('textarea').fill(shortReview);

        // Set overall rating
        const stars = page.locator('[data-testid="star-rating"]').first();
        await stars.locator('button').nth(3).click();
        await page.waitForTimeout(200);

        // Try to submit
        await page.getByRole('button', { name: /submit rating/i }).click();
        await page.waitForTimeout(500);

        // Verify "minimum 50 characters" error
        await expect(page.getByText(/minimum.*50.*characters/i)).toBeVisible();

        // Fix: Fill proper review (50+ characters)
        const validReview = 'This is now a proper review with more than fifty characters to meet the minimum requirement.';
        await page.locator('textarea').fill(validReview);

        // Fill all category scores
        const categoryRatings = page.locator('[data-testid="star-rating"]');
        await categoryRatings.nth(1).locator('button').nth(3).click(); // Communication
        await page.waitForTimeout(100);
        await categoryRatings.nth(2).locator('button').nth(3).click(); // Cleanliness
        await page.waitForTimeout(100);
        await categoryRatings.nth(3).locator('button').nth(3).click(); // Reliability
        await page.waitForTimeout(100);
        await categoryRatings.nth(4).locator('button').nth(3).click(); // Property condition
        await page.waitForTimeout(100);

        // Check "Would recommend"
        await page.locator('input[type="checkbox"]').check();

        // Submit successfully
        await page.getByRole('button', { name: /submit rating/i }).click();
        await page.waitForTimeout(1000);

        // Verify success
        await expect(page.getByText(/rating submitted successfully/i)).toBeVisible();
    });
});
