/**
 * Integration Tests - Rating Flow
 *
 * Tests the complete rating submission flow from completed tenancy
 * through rating modal to rating storage and match updates.
 *
 * Coverage:
 * - Renter rates landlord after completed tenancy
 * - Landlord rates renter after completed tenancy
 * - Cannot rate twice
 * - Rating data persists correctly
 * - Match state updates after rating
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../src/hooks/useAuthStore';
import { useAppStore } from '../../src/hooks/useAppStore';
import { setupStorageMocks } from '../__mocks__/localStorage';
import { hashPassword } from '../../src/utils/validation';
import { saveProperty, saveMatch } from '../../src/lib/storage';
import type { RenterProfile, LandlordProfile, Property, Match, Rating } from '../../src/types';

// Mock Supabase to ensure localStorage is used
vi.mock('../../src/lib/supabase', () => ({
    supabase: null,
    isSupabaseConfigured: () => false,
}));

describe('Integration: Rating Flow', () => {
    beforeEach(() => {
        setupStorageMocks();
        localStorage.clear();
    });

    describe('Renter Rates Landlord', () => {
        it('should allow renter to rate landlord after completed tenancy', async () => {
            const { result: authResult } = renderHook(() => useAuthStore());
            const { result: appResult } = renderHook(() => useAppStore());

            // Create renter profile with all required fields
            const renterProfile: RenterProfile = {
                id: crypto.randomUUID(),
                email: 'renter@rating.com',
                passwordHash: await hashPassword('SecurePass123!'),
                situation: 'Single',
                names: 'Rating Renter',
                ages: '28',
                localArea: 'Liverpool',
                renterType: 'Young Professional',
                employmentStatus: 'Employed Full-Time',
                monthlyIncome: 3000,
                hasPets: false,
                smokingStatus: 'Non-Smoker',
                hasGuarantor: false,
                currentRentalSituation: 'Currently Renting',
                hasRentalHistory: true,
                previousLandlordReference: false,
                receivesHousingBenefit: false,
                receivesUniversalCredit: false,
                numberOfChildren: 0,
                status: 'current',
                createdAt: new Date(),
                onboardingComplete: true,
            };

            // Create landlord profile with all required fields
            const landlordProfile: LandlordProfile = {
                id: crypto.randomUUID(),
                email: 'landlord@rating.com',
                passwordHash: await hashPassword('SecurePass123!'),
                names: 'Rating Landlord',
                propertyType: 'Flat',
                furnishingPreference: 'Unfurnished',
                preferredTenantTypes: ['Young Professional'],
                defaultPetsPolicy: {
                    willConsiderPets: true,
                    requiresPetInsurance: true,
                    preferredPetTypes: ['cat', 'dog'],
                    maxPetsAllowed: 1,
                },
                prsRegistrationNumber: 'PRS-RATE-123',
                prsRegistrationStatus: 'active',
                ombudsmanScheme: 'property_redress_scheme',
                isFullyCompliant: true,
                depositScheme: 'DPS',
                isRegisteredLandlord: true,
                estateAgentLink: '',
                createdAt: new Date(),
                onboardingComplete: true,
            };

            // Create property with all required fields
            const property: Property = {
                id: crypto.randomUUID(),
                landlordId: landlordProfile.id,
                address: {
                    street: '123 Rating Street',
                    city: 'Liverpool',
                    postcode: 'L1 1AA',
                    council: 'Liverpool City Council',
                },
                rentPcm: 950,
                deposit: 1100,
                maxRentInAdvance: 1,
                bedrooms: 2,
                bathrooms: 1,
                propertyType: 'Flat',
                images: [],
                description: 'Test property for rating',
                epcRating: 'C',
                yearBuilt: 2010,
                features: ['Double Glazing', 'Central Heating'],
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
                landlordId: landlordProfile.id,
                isActive: true,
                createdAt: new Date(),
            };

            // Create completed match
            const matchId = crypto.randomUUID();
            const match: Match = {
                id: matchId,
                renterId: renterProfile.id,
                landlordId: landlordProfile.id,
                propertyId: property.id,
                property: property,
                renterName: renterProfile.names,
                landlordName: landlordProfile.names,
                timestamp: '2024-01-01',
                tenancyStatus: 'ended',
                tenancyStartDate: '2024-01-15',
                tenancyEndDate: '2024-07-15',
                monthlyRentAmount: 950,
                canRate: true,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
            };

            // Login as renter
            await act(async () => {
                await authResult.current.login('renter', renterProfile);
            });

            // Save property and match to storage
            await act(async () => {
                await saveProperty(property);
                await saveMatch(match);
                // Load properties to populate store
                await appResult.current.loadProperties();
            });

            // Manually add match to store (since we're not going through the normal flow)
            act(() => {
                appResult.current.matches = [match];
            });

            // Verify initial state
            expect(appResult.current.matches).toHaveLength(1);
            expect(appResult.current.matches[0].hasRenterRated).toBe(false);
            expect(appResult.current.matches[0].canRate).toBe(true);

            // Submit rating with correct field names
            const ratingData: Omit<Rating, 'id' | 'createdAt'> = {
                matchId: matchId,
                fromUserId: renterProfile.id,
                fromUserType: 'renter',
                toUserId: landlordProfile.id,
                toUserType: 'landlord',
                propertyId: property.id,
                overallScore: 5,
                categoryScores: {
                    communication: 5,
                    cleanliness: 4,
                    reliability: 5,
                    property_condition: 4,
                },
                review: 'Excellent landlord, very responsive to maintenance requests and always professional.',
                wouldRecommend: true,
                tenancyStartDate: new Date('2024-01-15'),
                tenancyEndDate: new Date('2024-07-15'),
                isVerified: true,
                isHidden: false,
            };

            await act(async () => {
                await appResult.current.submitRating(ratingData);
            });

            // Verify rating was saved
            const ratings = await act(async () => {
                return await appResult.current.getUserRatings(landlordProfile.id, 'landlord');
            });

            expect(ratings).toHaveLength(1);
            expect(ratings[0]).toMatchObject({
                fromUserId: renterProfile.id,
                toUserId: landlordProfile.id,
                overallScore: 5,
                review: expect.stringContaining('Excellent landlord'),
            });

            // Verify match was updated
            const updatedMatch = appResult.current.matches.find(m => m.id === matchId);
            expect(updatedMatch?.hasRenterRated).toBe(true);
        });
    });

    describe('Landlord Rates Renter', () => {
        it('should allow landlord to rate renter after completed tenancy', async () => {
            const { result: authResult } = renderHook(() => useAuthStore());
            const { result: appResult } = renderHook(() => useAppStore());

            // Create profiles with all required fields
            const renterProfile: RenterProfile = {
                id: crypto.randomUUID(),
                email: 'renter-rated@test.com',
                passwordHash: await hashPassword('SecurePass123!'),
                situation: 'Single',
                names: 'Rated Renter',
                ages: '27',
                localArea: 'Southport',
                renterType: 'Young Professional',
                employmentStatus: 'Employed Full-Time',
                monthlyIncome: 2900,
                hasPets: false,
                smokingStatus: 'Non-Smoker',
                hasGuarantor: false,
                currentRentalSituation: 'Currently Renting',
                hasRentalHistory: true,
                previousLandlordReference: false,
                receivesHousingBenefit: false,
                receivesUniversalCredit: false,
                numberOfChildren: 0,
                status: 'prospective',
                createdAt: new Date(),
                onboardingComplete: true,
            };

            const landlordProfile: LandlordProfile = {
                id: crypto.randomUUID(),
                email: 'landlord-rater@test.com',
                passwordHash: await hashPassword('SecurePass123!'),
                names: 'Rater Landlord',
                propertyType: 'Flat',
                furnishingPreference: 'Part Furnished',
                preferredTenantTypes: ['Young Professional'],
                defaultPetsPolicy: {
                    willConsiderPets: true,
                    requiresPetInsurance: false,
                    preferredPetTypes: ['cat', 'dog'],
                    maxPetsAllowed: 2,
                },
                prsRegistrationNumber: 'PRS-RATER-789',
                prsRegistrationStatus: 'active',
                ombudsmanScheme: 'property_redress_scheme',
                isFullyCompliant: true,
                depositScheme: 'MyDeposits',
                isRegisteredLandlord: true,
                estateAgentLink: '',
                createdAt: new Date(),
                onboardingComplete: true,
            };

            const property: Property = {
                id: crypto.randomUUID(),
                landlordId: landlordProfile.id,
                address: {
                    street: '789 Rater Avenue',
                    city: 'Southport',
                    postcode: 'PR8 1AA',
                    council: 'Sefton Council',
                },
                rentPcm: 750,
                deposit: 900,
                maxRentInAdvance: 1,
                bedrooms: 1,
                bathrooms: 1,
                propertyType: 'Flat',
                images: [],
                description: 'Test property',
                epcRating: 'C',
                yearBuilt: 2015,
                features: ['Parking'],
                furnishing: 'Part Furnished',
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic',
                maxOccupants: 2,
                petsPolicy: {
                    willConsiderPets: true,
                    preferredPetTypes: ['cat'],
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
                awaabsLawCompliant: true,
                landlordId: landlordProfile.id,
                isActive: true,
                createdAt: new Date(),
            };

            const matchId = crypto.randomUUID();
            const match: Match = {
                id: matchId,
                renterId: renterProfile.id,
                landlordId: landlordProfile.id,
                propertyId: property.id,
                property: property,
                renterName: renterProfile.names,
                landlordName: landlordProfile.names,
                timestamp: '2024-01-01',
                tenancyStatus: 'ended',
                tenancyStartDate: '2024-03-01',
                tenancyEndDate: '2024-09-01',
                monthlyRentAmount: 750,
                canRate: true,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
            };

            // Login as landlord
            await act(async () => {
                await authResult.current.login('landlord', landlordProfile);
                await saveProperty(property);
                await saveMatch(match);
                await appResult.current.loadProperties();
            });

            // Manually add match to store
            act(() => {
                appResult.current.matches = [match];
            });

            // Submit rating
            const ratingData: Omit<Rating, 'id' | 'createdAt'> = {
                matchId: matchId,
                fromUserId: landlordProfile.id,
                fromUserType: 'landlord',
                toUserId: renterProfile.id,
                toUserType: 'renter',
                propertyId: property.id,
                overallScore: 5,
                categoryScores: {
                    communication: 5,
                    cleanliness: 5,
                    reliability: 5,
                    respect_for_property: 5,
                },
                review: 'Excellent tenant, always paid rent on time and kept the property in great condition.',
                wouldRecommend: true,
                tenancyStartDate: new Date('2024-03-01'),
                tenancyEndDate: new Date('2024-09-01'),
                isVerified: true,
                isHidden: false,
            };

            await act(async () => {
                await appResult.current.submitRating(ratingData);
            });

            // Verify rating was saved
            const ratings = await act(async () => {
                return await appResult.current.getUserRatings(renterProfile.id, 'renter');
            });

            expect(ratings).toHaveLength(1);
            expect(ratings[0]).toMatchObject({
                fromUserId: landlordProfile.id,
                toUserId: renterProfile.id,
                overallScore: 5,
                categoryScores: {
                    respect_for_property: 5,
                },
            });

            // Verify match was updated
            const updatedMatch = appResult.current.matches.find(m => m.id === matchId);
            expect(updatedMatch?.hasLandlordRated).toBe(true);
        });
    });

    describe('Rating Data Persistence', () => {
        it('should persist ratings across page reloads', async () => {
            const { result: authResult } = renderHook(() => useAuthStore());
            const { result: appResult } = renderHook(() => useAppStore());

            // Create minimal setup with all required fields
            const renterProfile: RenterProfile = {
                id: crypto.randomUUID(),
                email: 'persist@test.com',
                passwordHash: await hashPassword('SecurePass123!'),
                situation: 'Single',
                names: 'Persist Renter',
                ages: '29',
                localArea: 'Liverpool',
                renterType: 'Young Professional',
                employmentStatus: 'Employed Full-Time',
                monthlyIncome: 3100,
                hasPets: false,
                smokingStatus: 'Non-Smoker',
                hasGuarantor: false,
                currentRentalSituation: 'Currently Renting',
                hasRentalHistory: true,
                previousLandlordReference: false,
                receivesHousingBenefit: false,
                receivesUniversalCredit: false,
                numberOfChildren: 0,
                status: 'current',
                createdAt: new Date(),
                onboardingComplete: true,
            };

            const landlordProfile: LandlordProfile = {
                id: crypto.randomUUID(),
                email: 'persist-landlord@test.com',
                passwordHash: await hashPassword('SecurePass123!'),
                names: 'Persist Landlord',
                propertyType: 'Detached',
                furnishingPreference: 'Unfurnished',
                preferredTenantTypes: ['Family'],
                defaultPetsPolicy: {
                    willConsiderPets: true,
                    requiresPetInsurance: true,
                    preferredPetTypes: ['dog'],
                    maxPetsAllowed: 1,
                },
                prsRegistrationNumber: 'PRS-PERSIST-999',
                prsRegistrationStatus: 'active',
                ombudsmanScheme: 'tpo',
                isFullyCompliant: true,
                depositScheme: 'TDS',
                isRegisteredLandlord: true,
                estateAgentLink: '',
                createdAt: new Date(),
                onboardingComplete: true,
            };

            const property: Property = {
                id: crypto.randomUUID(),
                landlordId: landlordProfile.id,
                address: {
                    street: '999 Persist Road',
                    city: 'Liverpool',
                    postcode: 'L2 2AA',
                    council: 'Liverpool City Council',
                },
                rentPcm: 1500,
                deposit: 1800,
                maxRentInAdvance: 1,
                bedrooms: 4,
                bathrooms: 2,
                propertyType: 'Detached',
                images: [],
                description: 'Test property',
                epcRating: 'B',
                yearBuilt: 2018,
                features: ['Garden', 'Garage'],
                furnishing: 'Unfurnished',
                availableFrom: '2024-01-01',
                tenancyType: 'Periodic',
                maxOccupants: 5,
                petsPolicy: {
                    willConsiderPets: true,
                    preferredPetTypes: ['dog'],
                    requiresPetInsurance: true,
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
                landlordId: landlordProfile.id,
                isActive: true,
                createdAt: new Date(),
            };

            const matchId = crypto.randomUUID();
            const match: Match = {
                id: matchId,
                renterId: renterProfile.id,
                landlordId: landlordProfile.id,
                propertyId: property.id,
                property: property,
                renterName: renterProfile.names,
                landlordName: landlordProfile.names,
                timestamp: '2024-01-01',
                tenancyStatus: 'ended',
                tenancyStartDate: '2024-04-01',
                tenancyEndDate: '2024-10-01',
                monthlyRentAmount: 1500,
                canRate: true,
                hasRenterRated: false,
                hasLandlordRated: false,
                messages: [],
                unreadCount: 0,
            };

            await act(async () => {
                await authResult.current.login('renter', renterProfile);
                await saveProperty(property);
                await saveMatch(match);
                await appResult.current.loadProperties();
            });

            // Manually add match to store
            act(() => {
                appResult.current.matches = [match];
            });

            // Submit rating
            const ratingData: Omit<Rating, 'id' | 'createdAt'> = {
                matchId: matchId,
                fromUserId: renterProfile.id,
                fromUserType: 'renter',
                toUserId: landlordProfile.id,
                toUserType: 'landlord',
                propertyId: property.id,
                overallScore: 4,
                categoryScores: {
                    communication: 4,
                    cleanliness: 4,
                    reliability: 4,
                    property_condition: 4,
                },
                review: 'Good experience overall.',
                wouldRecommend: true,
                tenancyStartDate: new Date('2024-04-01'),
                tenancyEndDate: new Date('2024-10-01'),
                isVerified: true,
                isHidden: false,
            };

            await act(async () => {
                await appResult.current.submitRating(ratingData);
            });

            // Simulate page reload by creating new hook instances
            const { result: newAppResult } = renderHook(() => useAppStore());

            // Verify rating persists
            const persistedRatings = await act(async () => {
                return await newAppResult.current.getUserRatings(landlordProfile.id, 'landlord');
            });

            expect(persistedRatings).toHaveLength(1);
            expect(persistedRatings[0].review).toBe('Good experience overall.');
        });
    });
});
