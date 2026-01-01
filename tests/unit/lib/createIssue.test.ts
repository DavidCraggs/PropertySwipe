/**
 * Unit tests for createIssue storage function
 * Tests SLA calculation, validation, error handling, and storage operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as storageModule from '../../../src/lib/storage';
import * as supabaseModule from '../../../src/lib/supabase';
import type { Issue, IssueCategory, IssuePriority, AgencyProfile } from '../../../src/types';

// Mock Supabase
vi.mock('../../../src/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
    isSupabaseConfigured: vi.fn(() => false), // Start with localStorage mode
}));

const { createIssue } = storageModule;

describe('createIssue', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Validation', () => {
        it('should throw error if propertyId is missing', async () => {
            const issueData: any = {
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            await expect(createIssue(issueData)).rejects.toThrow('Property ID is required');
        });

        it('should throw error if renterId is missing', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            await expect(createIssue(issueData)).rejects.toThrow('Renter ID is required');
        });

        it('should throw error if landlordId is missing', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            await expect(createIssue(issueData)).rejects.toThrow('Landlord ID is required');
        });

        it('should throw error if category is missing', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            await expect(createIssue(issueData)).rejects.toThrow('Issue category is required');
        });

        it('should throw error if priority is missing', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            await expect(createIssue(issueData)).rejects.toThrow('Issue priority is required');
        });

        it('should throw error if subject is too short', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            await expect(createIssue(issueData)).rejects.toThrow(
                'Subject must be at least 5 characters long'
            );
        });

        it('should throw error if description is too short', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'Too short',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            await expect(createIssue(issueData)).rejects.toThrow(
                'Description must be at least 20 characters long'
            );
        });
    });

    describe('SLA Deadline Calculation - Default Values', () => {
        it('should calculate SLA deadline for emergency priority (4 hours)', async () => {
            const now = new Date();
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'hazard' as IssueCategory,
                priority: 'emergency' as IssuePriority,
                subject: 'Water leak emergency',
                description: 'Major water leak in the kitchen causing flooding',
                images: [],
                status: 'open',
                raisedAt: now,
            };

            const result = await createIssue(issueData);

            // SLA should be 4 hours from now
            const expectedDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000);
            const timeDiff = Math.abs(result.slaDeadline.getTime() - expectedDeadline.getTime());

            // Allow 100ms tolerance for test execution time
            expect(timeDiff).toBeLessThan(100);
            expect(result.status).toBe('open');
            expect(result.isOverdue).toBe(false);
        });

        it('should calculate SLA deadline for urgent priority (24 hours)', async () => {
            const now = new Date();
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'repair' as IssueCategory,
                priority: 'urgent' as IssuePriority,
                subject: 'Heating not working',
                description: 'Central heating system has stopped working completely',
                images: [],
                status: 'open',
                raisedAt: now,
            };

            const result = await createIssue(issueData);

            const expectedDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const timeDiff = Math.abs(result.slaDeadline.getTime() - expectedDeadline.getTime());

            expect(timeDiff).toBeLessThan(100);
        });

        it('should calculate SLA deadline for routine priority (72 hours)', async () => {
            const now = new Date();
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Dripping tap',
                description: 'Kitchen tap has a slow drip that needs fixing',
                images: [],
                status: 'open',
                raisedAt: now,
            };

            const result = await createIssue(issueData);

            const expectedDeadline = new Date(now.getTime() + 72 * 60 * 60 * 1000);
            const timeDiff = Math.abs(result.slaDeadline.getTime() - expectedDeadline.getTime());

            expect(timeDiff).toBeLessThan(100);
        });

        it('should calculate SLA deadline for low priority (168 hours / 7 days)', async () => {
            const now = new Date();
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'query' as IssueCategory,
                priority: 'low' as IssuePriority,
                subject: 'Garden maintenance question',
                description: 'Question about who is responsible for garden maintenance',
                images: [],
                status: 'open',
                raisedAt: now,
            };

            const result = await createIssue(issueData);

            const expectedDeadline = new Date(now.getTime() + 168 * 60 * 60 * 1000);
            const timeDiff = Math.abs(result.slaDeadline.getTime() - expectedDeadline.getTime());

            expect(timeDiff).toBeLessThan(100);
        });
    });

    describe('SLA Deadline Calculation - Agency Config', () => {
        it('should use agency SLA config when agencyId is provided', async () => {
            const mockAgency: AgencyProfile = {
                id: 'agency-123',
                email: 'test@agency.com',
                passwordHash: 'hash',
                agencyType: 'management_agency',
                companyName: 'Test Agency',
                registrationNumber: 'REG123',
                primaryContactName: 'John Doe',
                phone: '1234567890',
                address: {
                    street: '123 Test St',
                    city: 'London',
                    postcode: 'SW1A 1AA',
                },
                serviceAreas: ['London'],
                isActive: true,
                managedPropertyIds: [],
                landlordClientIds: [],
                activeTenantsCount: 0,
                totalPropertiesManaged: 0,
                slaConfiguration: {
                    emergencyResponseHours: 2, // Custom: 2 hours instead of 4
                    urgentResponseHours: 12,   // Custom: 12 hours instead of 24
                    routineResponseHours: 48,  // Custom: 48 hours instead of 72
                    maintenanceResponseDays: 5, // Custom: 5 days instead of 7
                },
                performanceMetrics: {
                    averageResponseTimeHours: 10,
                    slaComplianceRate: 98,
                    totalIssuesResolved: 0,
                    totalIssuesRaised: 0,
                    currentOpenIssues: 0,
                },
                propertyOmbudsmanMember: true,
                onboardingComplete: true,
                createdAt: new Date(),
            };

            // Store agency profile in localStorage so getAgencyProfile can find it
            localStorage.setItem('get-on-agency-profiles', JSON.stringify([mockAgency]));

            const now = new Date();
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                agencyId: 'agency-123',
                category: 'maintenance' as IssueCategory,
                priority: 'emergency' as IssuePriority,
                subject: 'Emergency issue',
                description: 'This is an emergency issue requiring immediate attention',
                images: [],
                status: 'open',
                raisedAt: now,
            };

            const result = await createIssue(issueData);

            // Should use agency's 2-hour emergency SLA instead of default 4 hours
            const expectedDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            const timeDiff = Math.abs(result.slaDeadline.getTime() - expectedDeadline.getTime());

            expect(timeDiff).toBeLessThan(100);
        });

        it('should fallback to default SLA if agency is not found', async () => {
            // Don't set up any agency data in localStorage
            // When getAgencyProfile is called with 'agency-123', it will return null

            const now = new Date();
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                agencyId: 'agency-123',
                category: 'maintenance' as IssueCategory,
                priority: 'urgent' as IssuePriority,
                subject: 'Urgent issue',
                description: 'This is an urgent issue that needs quick resolution',
                images: [],
                status: 'open',
                raisedAt: now,
            };

            const result = await createIssue(issueData);

            // Should use default 24-hour urgent SLA
            const expectedDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const timeDiff = Math.abs(result.slaDeadline.getTime() - expectedDeadline.getTime());

            expect(timeDiff).toBeLessThan(100);
        });
    });

    describe('Status History', () => {
        it('should create initial status history entry', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            const result = await createIssue(issueData);

            expect(result.statusHistory).toHaveLength(1);
            expect(result.statusHistory[0]).toMatchObject({
                status: 'open',
                updatedBy: 'renter-123',
                notes: 'Issue reported by renter',
            });
            expect(result.statusHistory[0].timestamp).toBeInstanceOf(Date);
        });
    });

    describe('localStorage Storage', () => {
        it('should save issue to localStorage when Supabase is not configured', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            const result = await createIssue(issueData);

            // Check result has generated ID
            expect(result.id).toBeTruthy();
            expect(result.id).toMatch(/^issue-\d+-[a-z0-9]+$/);

            // Check localStorage
            const stored = localStorage.getItem('issues');
            expect(stored).toBeTruthy();

            const issues: Issue[] = JSON.parse(stored!);
            expect(issues).toHaveLength(1);
            expect(issues[0].id).toBe(result.id);
            expect(issues[0].subject).toBe('Test Issue');
        });

        it('should handle multiple issues in localStorage', async () => {
            const issueData1: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'First Issue',
                description: 'This is the first test issue description',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            const issueData2: any = {
                propertyId: 'property-456',
                renterId: 'renter-456',
                landlordId: 'landlord-456',
                category: 'repair' as IssueCategory,
                priority: 'urgent' as IssuePriority,
                subject: 'Second Issue',
                description: 'This is the second test issue description',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            await createIssue(issueData1);
            await createIssue(issueData2);

            const stored = localStorage.getItem('issues');
            const issues: Issue[] = JSON.parse(stored!);

            expect(issues).toHaveLength(2);
            expect(issues[0].subject).toBe('First Issue');
            expect(issues[1].subject).toBe('Second Issue');
        });
    });

    describe('Supabase Storage', () => {
        beforeEach(() => {
            vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(true);
        });

        afterEach(() => {
            vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);
        });

        it('should insert issue to Supabase when configured', async () => {
            const mockInsert = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: '123e4567-e89b-12d3-a456-426614174000',
                        },
                        error: null,
                    }),
                }),
            });

            const mockFrom = vi.fn().mockReturnValue({
                insert: mockInsert,
            });

            vi.mocked(supabaseModule.supabase.from).mockImplementation(mockFrom);

            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            const result = await createIssue(issueData);

            expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
            expect(mockFrom).toHaveBeenCalledWith('issues');
            expect(mockInsert).toHaveBeenCalled();

            const insertCall = mockInsert.mock.calls[0][0];
            expect(insertCall.property_id).toBe('property-123');
            expect(insertCall.renter_id).toBe('renter-123');
            expect(insertCall.landlord_id).toBe('landlord-123');
            expect(insertCall.category).toBe('maintenance');
            expect(insertCall.priority).toBe('routine');
            expect(insertCall.subject).toBe('Test Issue');
        });

        it('should throw error if Supabase insert fails', async () => {
            const mockInsert = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Database connection failed' },
                    }),
                }),
            });

            vi.mocked(supabaseModule.supabase.from).mockReturnValue({
                insert: mockInsert,
            } as any);

            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            await expect(createIssue(issueData)).rejects.toThrow(
                'Failed to create issue: Database connection failed'
            );
        });
    });

    describe('Edge Cases', () => {
        it('should preserve whitespace in subject and description', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: '  Trimmed Subject  ',
                description: '  This description has leading and trailing whitespace that should be preserved internally  ',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            const result = await createIssue(issueData);

            // createIssue doesn't trim, validation checks trimmed length
            expect(result.subject).toBe('  Trimmed Subject  ');
            expect(result.description).toBe('  This description has leading and trailing whitespace that should be preserved internally  ');
        });

        it('should handle empty images array', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            const result = await createIssue(issueData);

            expect(result.images).toEqual([]);
            expect(result.messages).toEqual([]);
        });

        it('should initialize isOverdue to false', async () => {
            const issueData: any = {
                propertyId: 'property-123',
                renterId: 'renter-123',
                landlordId: 'landlord-123',
                category: 'maintenance' as IssueCategory,
                priority: 'routine' as IssuePriority,
                subject: 'Test Issue',
                description: 'This is a test issue description that is long enough',
                images: [],
                status: 'open',
                raisedAt: new Date(),
            };

            const result = await createIssue(issueData);

            expect(result.isOverdue).toBe(false);
        });
    });
});
