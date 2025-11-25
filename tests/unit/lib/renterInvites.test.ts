import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RenterInvite, Property, RenterProfile, Match } from '../../../src/types';

// Mock Supabase
vi.mock('../../../src/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
    isSupabaseConfigured: vi.fn(),
}));

// Mock storage functions
vi.mock('../../../src/lib/storage', async () => {
    const actual = await vi.importActual<typeof import('../../../src/lib/storage')>('../../../src/lib/storage');
    return {
        ...actual,
        saveMatch: vi.fn(),
        saveRenterProfile: vi.fn(),
        getAllProperties: vi.fn(),
    };
});

import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import {
    createRenterInvite,
    validateInviteCode,
    redeemInviteCode,
    saveMatch,
    saveRenterProfile,
    getAllProperties,
} from '../../../src/lib/storage';

describe('Renter Invite System - Storage Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const mockProperty: Property = {
        id: 'prop-123',
        address: {
            street: '123 Test St',
            city: 'London',
            postcode: 'SW1A 1AA',
            council: 'Westminster',
        },
        rentPcm: 2500,
        deposit: 2885,
        maxRentInAdvance: 1,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'Flat',
        furnishing: 'Furnished',
        images: [],
        description: 'Test property',
        epcRating: 'C',
        yearBuilt: 2020,
        features: [],
        availableFrom: '2025-02-01',
        tenancyType: 'Periodic',
        maxOccupants: 4,
        petsPolicy: {
            willConsiderPets: true,
            preferredPetTypes: ['cat'],
            requiresPetInsurance: false,
            maxPetsAllowed: 1,
        },
        bills: {
            councilTaxBand: 'D',
            gasElectricIncluded: false,
            waterIncluded: false,
            internetIncluded: false,
        },
        meetsDecentHomesStandard: true,
        awaabsLawCompliant: true,
        landlordId: 'landlord-123',
        landlordType: 'individual',
        prsPropertyRegistrationNumber: 'PRS123',
        prsPropertyRegistrationStatus: 'Registered',
        canBeMarketed: true,
        isAvailable: true,
        listingDate: '2025-01-01',
        preferredMinimumStay: 12,
        acceptsShortTermTenants: false,
    };

    const mockRenterProfile: RenterProfile = {
        id: 'renter-123',
        email: 'test@example.com',
        passwordHash: 'hash',
        status: 'prospective',
        situation: 'Single',
        names: 'John Doe',
        ages: '28',
        localArea: 'Southport',
        renterType: 'Young Professional',
        employmentStatus: 'Employed Full-Time',
        monthlyIncome: 3500,
        hasPets: false,
        preferredFurnishing: ['Furnished'],
        moveInDate: new Date('2025-03-01'),
        likedProperties: [],
        passedProperties: [],
        matches: [],
        createdAt: new Date('2025-01-15T12:00:00Z'),
        hasCompletedOnboarding: true,
    };

    describe('generateInviteCode', () => {
        it('should generate 8-character code', async () => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(true);
            vi.mocked(supabase.from).mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: {
                                id: 'invite-1',
                                code: 'ABCD1234',
                                created_by_id: 'landlord-123',
                                created_by_type: 'landlord',
                                property_id: 'prop-123',
                                landlord_id: 'landlord-123',
                                managing_agency_id: null,
                                proposed_rent_pcm: 2500,
                                proposed_deposit_amount: null,
                                proposed_move_in_date: null,
                                special_terms: null,
                                status: 'pending',
                                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            },
                            error: null,
                        }),
                    }),
                }),
            } as any);

            const invite = await createRenterInvite({
                createdById: 'landlord-123',
                createdByType: 'landlord',
                propertyId: 'prop-123',
                landlordId: 'landlord-123',
                proposedRentPcm: 2500,
            });

            expect(invite.code).toHaveLength(8);
        });

        it('should only use valid characters (exclude 0,O,1,I)', async () => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(false);

            const codes = new Set<string>();
            for (let i = 0; i < 100; i++) {
                const invite = await createRenterInvite({
                    createdById: 'landlord-123',
                    createdByType: 'landlord',
                    propertyId: 'prop-123',
                    landlordId: 'landlord-123',
                    proposedRentPcm: 2500,
                });
                codes.add(invite.code);

                // Check each character is valid
                const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                for (const char of invite.code) {
                    expect(validChars).toContain(char);
                }
                expect(invite.code).not.toMatch(/[0O1I]/);
            }
        });

        it('should generate unique codes (test 100 iterations)', async () => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(false);

            const codes = new Set<string>();
            for (let i = 0; i < 100; i++) {
                const invite = await createRenterInvite({
                    createdById: 'landlord-123',
                    createdByType: 'landlord',
                    propertyId: 'prop-123',
                    landlordId: 'landlord-123',
                    proposedRentPcm: 2500,
                });
                codes.add(invite.code);
            }

            // Most codes should be unique (allow small collision rate)
            expect(codes.size).toBeGreaterThan(95);
        });
    });

    describe('createRenterInvite', () => {
        it('should create invite with all fields in Supabase mode', async () => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(true);

            const mockInviteData = {
                id: 'invite-1',
                code: 'TEST1234',
                created_by_id: 'landlord-123',
                created_by_type: 'landlord',
                property_id: 'prop-123',
                landlord_id: 'landlord-123',
                managing_agency_id: 'agency-456',
                proposed_rent_pcm: 2500,
                proposed_deposit_amount: 2885,
                proposed_move_in_date: '2025-03-01',
                special_terms: 'Pets allowed',
                status: 'pending',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            vi.mocked(supabase.from).mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: mockInviteData,
                            error: null,
                        }),
                    }),
                }),
            } as any);

            const invite = await createRenterInvite({
                createdById: 'landlord-123',
                createdByType: 'landlord',
                propertyId: 'prop-123',
                landlordId: 'landlord-123',
                managingAgencyId: 'agency-456',
                proposedRentPcm: 2500,
                proposedDepositAmount: 2885,
                proposedMoveInDate: new Date('2025-03-01'),
                specialTerms: 'Pets allowed',
            });

            expect(invite.id).toBe('invite-1');
            expect(invite.proposedRentPcm).toBe(2500);
            expect(invite.proposedDepositAmount).toBe(2885);
            expect(invite.specialTerms).toBe('Pets allowed');
            expect(invite.managingAgencyId).toBe('agency-456');
        });

        it('should set expiry to 30 days from now', async () => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(false);

            const invite = await createRenterInvite({
                createdById: 'landlord-123',
                createdByType: 'landlord',
                propertyId: 'prop-123',
                landlordId: 'landlord-123',
                proposedRentPcm: 2500,
            });

            const expectedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const actualExpiry = new Date(invite.expiresAt);

            // Allow 1 second difference for test execution time
            expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
        });

        it('should create invite in localStorage when Supabase not configured', async () => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(false);

            const invite = await createRenterInvite({
                createdById: 'landlord-123',
                createdByType: 'landlord',
                propertyId: 'prop-123',
                landlordId: 'landlord-123',
                proposedRentPcm: 2500,
            });

            const stored = localStorage.getItem('renter-invites');
            expect(stored).toBeTruthy();

            const invites = JSON.parse(stored!);
            expect(invites).toHaveLength(1);
            expect(invites[0].code).toBe(invite.code);
        });

        it('should transform camelCase to snake_case for Supabase', async () => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(true);

            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'invite-1',
                            code: 'TEST1234',
                            created_by_id: 'landlord-123',
                            created_by_type: 'landlord',
                            property_id: 'prop-123',
                            landlord_id: 'landlord-123',
                            managing_agency_id: null,
                            proposed_rent_pcm: 2500,
                            proposed_deposit_amount: null,
                            proposed_move_in_date: null,
                            special_terms: null,
                            status: 'pending',
                            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        },
                        error: null,
                    }),
                }),
            });

            vi.mocked(supabase.from).mockReturnValue({
                insert: insertMock,
            } as any);

            await createRenterInvite({
                createdById: 'landlord-123',
                createdByType: 'landlord',
                propertyId: 'prop-123',
                landlordId: 'landlord-123',
                proposedRentPcm: 2500,
            });

            const insertCall = insertMock.mock.calls[0][0];
            expect(insertCall).toHaveProperty('created_by_id');
            expect(insertCall).toHaveProperty('created_by_type');
            expect(insertCall).toHaveProperty('property_id');
            expect(insertCall).toHaveProperty('proposed_rent_pcm');
        });
    });

    describe('validateInviteCode', () => {
        it('should return isValid=true for pending invite', async () => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(true);

            const mockPropertyData = {
                id: 'prop-123',
                street: '123 Test St',
                city: 'London',
                postcode: 'SW1A 1AA',
                council: 'Westminster',
                property_type: 'Flat',
                bedrooms: 2,
                bathrooms: 1,
                rent_pcm: 2500,
                deposit: 2885,
                furnishing: 'Furnished',
                images: [],
                description: 'Test',
                epc_rating: 'C',
                year_built: 2020,
                features: [],
                available_from: '2025-02-01',
                max_occupants: 4,
                tenancy_type: 'Periodic',
                pets_policy: JSON.stringify({ willConsiderPets: true, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 1 }),
                bills: JSON.stringify({ councilTaxBand: 'D', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false }),
                meets_decent_homes_standard: true,
                awaabs_law_compliant: true,
                landlord_id: 'landlord-123',
                landlord_type: 'individual',
                managing_agency_id: null,
                marketing_agent_id: null,
                prs_property_registration_number: 'PRS123',
                prs_property_registration_status: 'Registered',
                can_be_marketed: true,
                is_available: true,
                listing_date: '2025-01-01',
                preferred_minimum_stay: 12,
                accepts_short_term_tenants: false,
                max_rent_in_advance: 1,
            };

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: {
                                id: 'invite-1',
                                code: 'TEST1234',
                                created_by_id: 'landlord-123',
                                created_by_type: 'landlord',
                                property_id: 'prop-123',
                                landlord_id: 'landlord-123',
                                managing_agency_id: null,
                                proposed_rent_pcm: 2500,
                                proposed_deposit_amount: null,
                                proposed_move_in_date: null,
                                special_terms: null,
                                status: 'pending',
                                expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                                accepted_at: null,
                                accepted_by_renter_id: null,
                                created_match_id: null,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                                property: mockPropertyData,
                            },
                            error: null,
                        }),
                    }),
                }),
            } as any);

            const result = await validateInviteCode('TEST1234');

            expect(result.isValid).toBe(true);
            expect(result.invite).toBeDefined();
            expect(result.invite?.code).toBe('TEST1234');
            expect(result.property).toBeDefined();
        });

        it('should return not_found error for invalid code', async () => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(true);

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Not found' },
                        }),
                    }),
                }),
            } as any);

            const result = await validateInviteCode('INVALID1');

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('not_found');
        });

        it('should return expired error for expired invite', async () => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(true);

            vi.mocked(supabase.from).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: {
                                id: 'invite-1',
                                code: 'EXPIRED 1',
                                created_by_id: 'landlord-123',
                                created_by_type: 'landlord',
                                property_id: 'prop-123',
                                landlord_id: 'landlord-123',
                                managing_agency_id: null,
                                proposed_rent_pcm: 2500,
                                proposed_deposit_amount: null,
                                proposed_move_in_date: null,
                                special_terms: null,
                                status: 'pending',
                                expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                                accepted_at: null,
                                accepted_by_renter_id: null,
                                created_match_id: null,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                                property: null,
                            },
                            error: null,
                        }),
                    }),
                }),
            } as any);

            const result = await validateInviteCode('EXPIRED1');

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('expired');
        });
    });
});
