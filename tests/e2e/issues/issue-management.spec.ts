import { test, expect } from '@playwright/test';
import { clearStorage, setupAuthState } from '../utils/auth-helpers';
import type { Issue, Match, Property, RenterProfile, LandlordProfile, AgencyProfile } from '../../../src/types';

/**
 * E2E Tests - Issue Management Flow
 * 
 * Comprehensive tests covering the complete issue management lifecycle
 * from reporting through resolution and satisfaction rating.
 */

test.describe('Issue Management E2E', () => {
    test.beforeEach(async ({ page }) => {
        await clearStorage(page);
    });

    test.afterEach(async ({ page }, testInfo) => {
        // Screenshot on failure
        if (testInfo.status !== 'passed') {
            await page.screenshot({
                path: `test-results/issue-management-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`,
                fullPage: true,
            });
        }
    });

    test('Test 1: Renter reports maintenance issue', async ({ page }) => {
        // Setup: Create renter with active tenancy
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const landlordId = 'landlord-issue-1';
            const propertyId = 'property-issue-1';
            const agencyId = 'agency-issue-1';

            const property: Property = {
                id: propertyId,
                landlordId: landlordId,
                address: {
                    street: '100 Issue Street',
                    city: 'Liverpool',
                    postcode: 'L10 1IS',
                    council: 'Liverpool City Council',
                },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'Flat',
                images: [],
                description: 'Test property for issues',
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
                id: 'match-issue-1',
                renterId,
                landlordId,
                propertyId,
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active',
                tenancyStartDate: '2024-02-01',
                monthlyRentAmount: 1000,
                managingAgencyId: agencyId,
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

        // Navigate to dashboard (should be default after login)
        await expect(page.getByText(/current tenancy/i)).toBeVisible();

        // Click "Report Issue" button
        await page.getByRole('button', { name: /report.*issue/i }).click();
        await page.waitForTimeout(500);

        // Fill issue form
        await expect(page.getByText(/report.*issue/i)).toBeVisible();

        // Select issue type
        await page.locator('select').first().selectOption('maintenance');

        // Select priority
        await page.locator('select').nth(1).selectOption('urgent');

        // Fill subject
        await page.locator('input[placeholder*="subject" i], input[placeholder*="title" i]').fill('Boiler not working');

        // Fill description
        await page.locator('textarea').fill('The boiler has stopped working completely. No hot water or heating available.');

        // Submit
        await page.getByRole('button', { name: /submit|report/i }).click();
        await page.waitForTimeout(1000);

        // Verify success message
        await expect(page.getByText(/issue.*reported|successfully/i)).toBeVisible();

        // Verify issue appears in list
        await expect(page.getByText(/boiler not working/i)).toBeVisible();
    });

    test('Test 2: Agency receives and acknowledges issue', async ({ page }) => {
        // Setup: Create agency with pending issue
        const agency = await setupAuthState(page, 'management_agency');

        await page.evaluate(({ agencyId }) => {
            const issue: Issue = {
                id: 'issue-ack-1',
                propertyId: 'property-ack-1',
                renterId: 'renter-ack-1',
                landlordId: 'landlord-ack-1',
                agencyId: agencyId,
                category: 'maintenance',
                priority: 'urgent',
                subject: 'Leaking tap',
                description: 'Kitchen tap is leaking constantly',
                images: [],
                raisedAt: new Date(),
                slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                isOverdue: false,
                status: 'open',
                statusHistory: [
                    {
                        status: 'open',
                        timestamp: new Date(),
                        updatedBy: 'renter-ack-1',
                        notes: 'Issue raised',
                    },
                ],
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            localStorage.setItem('issues', JSON.stringify([issue]));
        }, { agencyId: agency.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Navigate to dashboard
        await expect(page.getByText(/dashboard|issues/i)).toBeVisible();

        // Verify issue in queue
        await expect(page.getByText(/leaking tap/i)).toBeVisible();

        // Click issue to open details
        await page.getByText(/leaking tap/i).click();
        await page.waitForTimeout(500);

        // Update status to "Acknowledged"
        await page.locator('select, button').filter({ hasText: /status/i }).first().click();
        await page.getByRole('option', { name: /acknowledged/i }).click();

        // Or if it's a button-based status update
        await page.getByRole('button', { name: /acknowledge/i }).click();
        await page.waitForTimeout(500);

        // Verify status updated
        await expect(page.getByText(/acknowledged/i)).toBeVisible();
    });

    test('Test 3: Agency updates issue status', async ({ page }) => {
        // Setup: Create agency with acknowledged issue
        const agency = await setupAuthState(page, 'management_agency');

        await page.evaluate(({ agencyId }) => {
            const issue: Issue = {
                id: 'issue-progress-1',
                propertyId: 'property-progress-1',
                renterId: 'renter-progress-1',
                landlordId: 'landlord-progress-1',
                agencyId: agencyId,
                category: 'repair',
                priority: 'urgent',
                subject: 'Broken window',
                description: 'Bedroom window is cracked',
                images: [],
                raisedAt: new Date(),
                acknowledgedAt: new Date(),
                slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                isOverdue: false,
                status: 'acknowledged',
                statusHistory: [
                    {
                        status: 'open',
                        timestamp: new Date(Date.now() - 3600000),
                        updatedBy: 'renter-progress-1',
                        notes: 'Issue raised',
                    },
                    {
                        status: 'acknowledged',
                        timestamp: new Date(),
                        updatedBy: agencyId,
                        notes: 'Will arrange repair',
                    },
                ],
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            localStorage.setItem('issues', JSON.stringify([issue]));
        }, { agencyId: agency.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Open issue detail page
        await page.getByText(/broken window/i).click();
        await page.waitForTimeout(500);

        // Change status to "In Progress"
        await page.getByRole('button', { name: /in progress|update status/i }).click();
        await page.waitForTimeout(300);

        // Add internal note
        const noteText = 'Contractor scheduled for tomorrow morning';
        await page.locator('textarea[placeholder*="note" i], textarea[placeholder*="internal" i]').fill(noteText);

        // Save
        await page.getByRole('button', { name: /save|update/i }).click();
        await page.waitForTimeout(1000);

        // Verify status and note saved
        await expect(page.getByText(/in progress/i)).toBeVisible();
        await expect(page.getByText(/contractor scheduled/i)).toBeVisible();
    });

    test('Test 4: Agency resolves issue', async ({ page }) => {
        // Setup: Create agency with in-progress issue
        const agency = await setupAuthState(page, 'management_agency');

        await page.evaluate(({ agencyId }) => {
            const issue: Issue = {
                id: 'issue-resolve-1',
                propertyId: 'property-resolve-1',
                renterId: 'renter-resolve-1',
                landlordId: 'landlord-resolve-1',
                agencyId: agencyId,
                category: 'repair',
                priority: 'urgent',
                subject: 'Heating not working',
                description: 'Central heating system failed',
                images: [],
                raisedAt: new Date(Date.now() - 86400000),
                acknowledgedAt: new Date(Date.now() - 82800000),
                slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                isOverdue: false,
                status: 'in_progress',
                statusHistory: [
                    {
                        status: 'open',
                        timestamp: new Date(Date.now() - 86400000),
                        updatedBy: 'renter-resolve-1',
                        notes: 'Issue raised',
                    },
                    {
                        status: 'acknowledged',
                        timestamp: new Date(Date.now() - 82800000),
                        updatedBy: agencyId,
                        notes: 'Engineer contacted',
                    },
                    {
                        status: 'in_progress',
                        timestamp: new Date(Date.now() - 3600000),
                        updatedBy: agencyId,
                        notes: 'Engineer on site',
                    },
                ],
                messages: [],
                createdAt: new Date(Date.now() - 86400000),
                updatedAt: new Date(),
            };

            localStorage.setItem('issues', JSON.stringify([issue]));
        }, { agencyId: agency.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Open in-progress issue
        await page.getByText(/heating not working/i).click();
        await page.waitForTimeout(500);

        // Fill resolution form
        await page.getByRole('button', { name: /resolve|mark.*resolved/i }).click();
        await page.waitForTimeout(300);

        const resolutionText = 'Heating system repaired. New thermostat installed. System tested and working correctly.';
        await page.locator('textarea[placeholder*="resolution" i], textarea').fill(resolutionText);

        // Upload photo (simulate file upload)
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
            // In real test, would upload actual file
            // For now, just verify the input exists
            await expect(fileInput).toBeVisible();
        }

        // Mark as resolved
        await page.getByRole('button', { name: /submit|confirm.*resolution/i }).click();
        await page.waitForTimeout(1000);

        // Verify resolution saved
        await expect(page.getByText(/resolved/i)).toBeVisible();
        await expect(page.getByText(/heating system repaired/i)).toBeVisible();
    });

    test('Test 5: SLA deadline tracking', async ({ page }) => {
        // Setup: Create renter
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const landlordId = 'landlord-sla-1';
            const propertyId = 'property-sla-1';
            const agencyId = 'agency-sla-1';

            const property: Property = {
                id: propertyId,
                landlordId: landlordId,
                address: {
                    street: '200 SLA Street',
                    city: 'Liverpool',
                    postcode: 'L20 2SL',
                    council: 'Liverpool City Council',
                },
                rentPcm: 1000,
                deposit: 1200,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'Flat',
                images: [],
                description: 'SLA test property',
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
                id: 'match-sla-1',
                renterId,
                landlordId,
                propertyId,
                property,
                renterName: 'Test Renter',
                landlordName: 'Test Landlord',
                timestamp: '2024-01-01',
                tenancyStatus: 'active',
                tenancyStartDate: '2024-02-01',
                monthlyRentAmount: 1000,
                managingAgencyId: agencyId,
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

        // Report emergency issue
        await page.getByRole('button', { name: /report.*issue/i }).click();
        await page.waitForTimeout(500);

        await page.locator('select').first().selectOption('hazard');
        await page.locator('select').nth(1).selectOption('emergency');
        await page.locator('input[placeholder*="subject" i], input[placeholder*="title" i]').fill('Gas leak detected');
        await page.locator('textarea').fill('Strong smell of gas in the kitchen area. Immediate attention required.');

        await page.getByRole('button', { name: /submit|report/i }).click();
        await page.waitForTimeout(1000);

        // Verify SLA countdown displays
        await expect(page.getByText(/24.*hours|sla|deadline/i)).toBeVisible();

        // Verify countdown color (should be green for new emergency issue with 24h deadline)
        const slaElement = page.locator('[class*="success"], [class*="green"]').filter({ hasText: /sla|deadline|hours/i });
        await expect(slaElement).toBeVisible();
    });

    test('Test 6: Overdue issue warnings', async ({ page }) => {
        // Setup: Create agency with overdue issue
        const agency = await setupAuthState(page, 'management_agency');

        await page.evaluate(({ agencyId }) => {
            const overdueIssue: Issue = {
                id: 'issue-overdue-1',
                propertyId: 'property-overdue-1',
                renterId: 'renter-overdue-1',
                landlordId: 'landlord-overdue-1',
                agencyId: agencyId,
                category: 'maintenance',
                priority: 'urgent',
                subject: 'Overdue repair needed',
                description: 'This issue is past its SLA deadline',
                images: [],
                raisedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                slaDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day overdue
                isOverdue: true,
                status: 'open',
                statusHistory: [
                    {
                        status: 'open',
                        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        updatedBy: 'renter-overdue-1',
                        notes: 'Issue raised',
                    },
                ],
                messages: [],
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
            };

            const normalIssue: Issue = {
                id: 'issue-normal-1',
                propertyId: 'property-normal-1',
                renterId: 'renter-normal-1',
                landlordId: 'landlord-normal-1',
                agencyId: agencyId,
                category: 'maintenance',
                priority: 'routine',
                subject: 'Normal priority issue',
                description: 'This is a normal issue',
                images: [],
                raisedAt: new Date(),
                slaDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                isOverdue: false,
                status: 'open',
                statusHistory: [
                    {
                        status: 'open',
                        timestamp: new Date(),
                        updatedBy: 'renter-normal-1',
                        notes: 'Issue raised',
                    },
                ],
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            localStorage.setItem('issues', JSON.stringify([overdueIssue, normalIssue]));
        }, { agencyId: agency.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Navigate to dashboard
        await expect(page.getByText(/dashboard|issues/i)).toBeVisible();

        // Verify overdue badge (red, pulsing)
        const overdueBadge = page.locator('[class*="danger"], [class*="red"]').filter({ hasText: /overdue/i });
        await expect(overdueBadge).toBeVisible();

        // Verify issue at top of queue (overdue issues should be prioritized)
        const firstIssue = page.locator('[class*="issue"], [class*="card"]').first();
        await expect(firstIssue).toContainText(/overdue repair needed/i);
    });

    test('Test 7: Issue filtering and search', async ({ page }) => {
        // Setup: Create agency with multiple issues
        const agency = await setupAuthState(page, 'management_agency');

        await page.evaluate(({ agencyId }) => {
            const issues: Issue[] = [
                // Emergency issues
                {
                    id: 'issue-emergency-1',
                    propertyId: 'prop-1',
                    renterId: 'renter-1',
                    landlordId: 'landlord-1',
                    agencyId,
                    category: 'hazard',
                    priority: 'emergency',
                    subject: 'Gas leak emergency',
                    description: 'Gas leak detected',
                    images: [],
                    raisedAt: new Date(),
                    slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    isOverdue: false,
                    status: 'open',
                    statusHistory: [],
                    messages: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'issue-emergency-2',
                    propertyId: 'prop-2',
                    renterId: 'renter-2',
                    landlordId: 'landlord-2',
                    agencyId,
                    category: 'hazard',
                    priority: 'emergency',
                    subject: 'Electrical fire risk',
                    description: 'Sparking outlet',
                    images: [],
                    raisedAt: new Date(),
                    slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    isOverdue: false,
                    status: 'open',
                    statusHistory: [],
                    messages: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                // Urgent issues
                ...Array.from({ length: 3 }, (_, i) => ({
                    id: `issue-urgent-${i + 1}`,
                    propertyId: `prop-urgent-${i + 1}`,
                    renterId: `renter-urgent-${i + 1}`,
                    landlordId: `landlord-urgent-${i + 1}`,
                    agencyId,
                    category: 'repair' as const,
                    priority: 'urgent' as const,
                    subject: `Urgent repair ${i + 1}`,
                    description: `Urgent issue ${i + 1}`,
                    images: [],
                    raisedAt: new Date(),
                    slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                    isOverdue: false,
                    status: 'open' as const,
                    statusHistory: [],
                    messages: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })),
                // Routine issues
                ...Array.from({ length: 5 }, (_, i) => ({
                    id: `issue-routine-${i + 1}`,
                    propertyId: `prop-routine-${i + 1}`,
                    renterId: `renter-routine-${i + 1}`,
                    landlordId: `landlord-routine-${i + 1}`,
                    agencyId,
                    category: 'maintenance' as const,
                    priority: 'routine' as const,
                    subject: `Routine maintenance ${i + 1}`,
                    description: `Routine issue ${i + 1}`,
                    images: [],
                    raisedAt: new Date(),
                    slaDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    isOverdue: false,
                    status: 'open' as const,
                    statusHistory: [],
                    messages: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })),
            ];

            localStorage.setItem('issues', JSON.stringify(issues));
        }, { agencyId: agency.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Filter by "Emergency" priority
        await page.locator('select, button').filter({ hasText: /filter|priority/i }).click();
        await page.getByRole('option', { name: /emergency/i }).click();
        await page.waitForTimeout(500);

        // Verify only emergency issues shown
        await expect(page.getByText(/gas leak emergency/i)).toBeVisible();
        await expect(page.getByText(/electrical fire risk/i)).toBeVisible();
        await expect(page.getByText(/routine maintenance/i)).not.toBeVisible();

        // Search by keyword
        await page.locator('input[placeholder*="search" i]').fill('gas');
        await page.waitForTimeout(500);

        // Verify filtered results
        await expect(page.getByText(/gas leak emergency/i)).toBeVisible();
        await expect(page.getByText(/electrical fire/i)).not.toBeVisible();
    });

    test('Test 8: Internal agency notes', async ({ page }) => {
        // Setup: Create shared issue for agency and renter
        const issueId = 'issue-notes-shared';

        // First, login as agency and add internal note
        const agency = await setupAuthState(page, 'management_agency');

        await page.evaluate(({ agencyId, issueId }) => {
            const issue: Issue = {
                id: issueId,
                propertyId: 'property-notes-1',
                renterId: 'renter-notes-1',
                landlordId: 'landlord-notes-1',
                agencyId: agencyId,
                category: 'repair',
                priority: 'urgent',
                subject: 'Window repair needed',
                description: 'Broken window pane',
                images: [],
                raisedAt: new Date(),
                slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                isOverdue: false,
                status: 'acknowledged',
                statusHistory: [],
                messages: [],
                internalNotes: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            localStorage.setItem('issues', JSON.stringify([issue]));
        }, { agencyId: agency.profile.id, issueId });

        await page.reload();
        await page.waitForTimeout(1000);

        // Open issue
        await page.getByText(/window repair needed/i).click();
        await page.waitForTimeout(500);

        // Add internal note
        const internalNote = 'INTERNAL: Contractor quoted £500. Waiting for landlord approval.';
        await page.locator('textarea[placeholder*="internal" i], textarea[placeholder*="private" i]').fill(internalNote);

        // Save
        await page.getByRole('button', { name: /save.*note|add.*note/i }).click();
        await page.waitForTimeout(1000);

        // Verify note saved
        await expect(page.getByText(/contractor quoted/i)).toBeVisible();

        // Now login as renter
        await clearStorage(page);
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId, issueId, internalNote }) => {
            const issue: Issue = {
                id: issueId,
                propertyId: 'property-notes-1',
                renterId: renterId,
                landlordId: 'landlord-notes-1',
                agencyId: 'agency-notes-1',
                category: 'repair',
                priority: 'urgent',
                subject: 'Window repair needed',
                description: 'Broken window pane',
                images: [],
                raisedAt: new Date(),
                slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                isOverdue: false,
                status: 'acknowledged',
                statusHistory: [],
                messages: [],
                internalNotes: [internalNote],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            localStorage.setItem('issues', JSON.stringify([issue]));
        }, { renterId: renter.profile.id, issueId, internalNote });

        await page.reload();
        await page.waitForTimeout(1000);

        // Open same issue
        await page.getByText(/window repair needed/i).click();
        await page.waitForTimeout(500);

        // Verify note NOT visible to renter
        await expect(page.getByText(/contractor quoted/i)).not.toBeVisible();
        await expect(page.getByText(/INTERNAL/i)).not.toBeVisible();
    });

    test('Test 9: Resolution with photos', async ({ page }) => {
        // Setup: Create agency with issue to resolve
        const agency = await setupAuthState(page, 'management_agency');

        await page.evaluate(({ agencyId }) => {
            const issue: Issue = {
                id: 'issue-photos-1',
                propertyId: 'property-photos-1',
                renterId: 'renter-photos-1',
                landlordId: 'landlord-photos-1',
                agencyId: agencyId,
                category: 'repair',
                priority: 'urgent',
                subject: 'Damp patch on wall',
                description: 'Large damp patch in bedroom',
                images: [],
                raisedAt: new Date(Date.now() - 86400000),
                slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                isOverdue: false,
                status: 'in_progress',
                statusHistory: [],
                messages: [],
                createdAt: new Date(Date.now() - 86400000),
                updatedAt: new Date(),
            };

            localStorage.setItem('issues', JSON.stringify([issue]));
        }, { agencyId: agency.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // Resolve issue
        await page.getByText(/damp patch/i).click();
        await page.waitForTimeout(500);

        await page.getByRole('button', { name: /resolve/i }).click();
        await page.waitForTimeout(300);

        // Upload before/after photos (verify file inputs exist)
        const fileInputs = page.locator('input[type="file"]');
        const fileInputCount = await fileInputs.count();
        expect(fileInputCount).toBeGreaterThan(0);

        // Fill resolution notes
        await page.locator('textarea').fill('Damp issue resolved. Wall replastered and repainted. Photos attached showing before and after.');

        // Submit
        await page.getByRole('button', { name: /submit|confirm/i }).click();
        await page.waitForTimeout(1000);

        // Verify photos saved (check for photo indicators)
        await expect(page.getByText(/photos|images|attachments/i)).toBeVisible();

        // Login as renter
        await clearStorage(page);
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const resolvedIssue: Issue = {
                id: 'issue-photos-1',
                propertyId: 'property-photos-1',
                renterId: renterId,
                landlordId: 'landlord-photos-1',
                agencyId: 'agency-photos-1',
                category: 'repair',
                priority: 'urgent',
                subject: 'Damp patch on wall',
                description: 'Large damp patch in bedroom',
                images: ['before.jpg', 'after.jpg'],
                raisedAt: new Date(Date.now() - 86400000),
                resolvedAt: new Date(),
                slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                isOverdue: false,
                status: 'resolved',
                statusHistory: [],
                messages: [],
                resolutionSummary: 'Damp issue resolved. Wall replastered and repainted.',
                createdAt: new Date(Date.now() - 86400000),
                updatedAt: new Date(),
            };

            localStorage.setItem('issues', JSON.stringify([resolvedIssue]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // View resolved issue
        await page.getByText(/damp patch/i).click();
        await page.waitForTimeout(500);

        // Verify photos visible
        await expect(page.getByText(/before\.jpg|after\.jpg|photos|images/i)).toBeVisible();
    });

    test('Test 10: Renter satisfaction rating', async ({ page }) => {
        // Setup: Create renter with resolved issue
        const renter = await setupAuthState(page, 'renter');

        await page.evaluate(({ renterId }) => {
            const resolvedIssue: Issue = {
                id: 'issue-rating-1',
                propertyId: 'property-rating-1',
                renterId: renterId,
                landlordId: 'landlord-rating-1',
                agencyId: 'agency-rating-1',
                category: 'repair',
                priority: 'urgent',
                subject: 'Plumbing repair',
                description: 'Leaking pipe under sink',
                images: [],
                raisedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                slaDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                isOverdue: false,
                status: 'resolved',
                statusHistory: [],
                messages: [],
                resolutionSummary: 'Pipe replaced and tested. No further leaks.',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            };

            localStorage.setItem('issues', JSON.stringify([resolvedIssue]));
        }, { renterId: renter.profile.id });

        await page.reload();
        await page.waitForTimeout(1000);

        // View resolved issue
        await page.getByText(/plumbing repair/i).click();
        await page.waitForTimeout(500);

        // Rate satisfaction (1-5 stars)
        await expect(page.getByText(/rate.*satisfaction|how satisfied/i)).toBeVisible();

        // Click 4th star
        const satisfactionStars = page.locator('[data-testid="star-rating"]').last();
        await satisfactionStars.locator('button').nth(3).click();
        await page.waitForTimeout(300);

        // Submit
        await page.getByRole('button', { name: /submit.*rating|rate/i }).click();
        await page.waitForTimeout(1000);

        // Verify rating saved
        await expect(page.getByText(/thank you|rating.*submitted/i)).toBeVisible();
        await expect(page.locator('[data-testid="star-rating"]').last().locator('.fill-warning-500')).toHaveCount(4);
    });
});
