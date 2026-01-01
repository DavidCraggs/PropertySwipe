/**
 * Step 2: Seed Test User Profiles
 * Creates 4 test users: Renter, Landlord, Estate Agent, Management Agency
 */

import type { RenterProfile, LandlordProfile, AgencyProfile } from '../types';
import {
    saveLandlordProfile,
    saveRenterProfile,
    saveAgencyProfile,
} from '../lib/storage';
import { supabase } from '../lib/supabase';
import { hashPassword } from './validation';
import { SEED_CONSTANTS, daysFromNow } from './seedHelpers';

/**
 * IDs generated during seeding (UUIDs from Supabase)
 * These are used by other seeding files for relationships
 */
export const GENERATED_IDS = {
    renterId: '',
    landlordId: '',
    estateAgentId: '',
    managementAgencyId: '',
};

/**
 * Create test renter profile (Emma Thompson)
 */
export async function createTestRenter(): Promise<RenterProfile> {
    const renter: Omit<RenterProfile, 'id'> & { seed_tag: string } = {
        seed_tag: SEED_CONSTANTS.RENTER_TAG,
        email: `test.renter@${SEED_CONSTANTS.EMAIL_DOMAIN}`,
        passwordHash: await hashPassword(SEED_CONSTANTS.DEFAULT_PASSWORD),
        names: 'Emma Thompson',
        ages: '28',
        situation: 'Single',
        localArea: 'Liverpool',
        renterType: 'Young Professional',
        employmentStatus: 'Employed Full-Time',
        monthlyIncome: 2500,
        hasPets: false,
        smokingStatus: 'Non-Smoker',
        hasGuarantor: false,
        preferredMoveInDate: daysFromNow(14), // 2 weeks from now
        currentRentalSituation: 'Currently Renting',
        hasRentalHistory: true,
        previousLandlordReference: true,
        receivesHousingBenefit: false,
        receivesUniversalCredit: false,
        createdAt: new Date(),
        onboardingComplete: true,
        status: 'prospective', // Actively searching
    };

    const saved = await saveRenterProfile(renter as unknown as RenterProfile);
    GENERATED_IDS.renterId = saved.id;
    return saved;
}

/**
 * Create test landlord profile (James Morrison)
 */
export async function createTestLandlord(): Promise<LandlordProfile> {
    const landlord: Omit<LandlordProfile, 'id'> & { seed_tag: string } = {
        seed_tag: SEED_CONSTANTS.LANDLORD_TAG,
        email: `test.landlord@${SEED_CONSTANTS.EMAIL_DOMAIN}`,
        passwordHash: await hashPassword(SEED_CONSTANTS.DEFAULT_PASSWORD),
        names: 'James Morrison',
        propertyType: 'Flat',
        furnishingPreference: 'Furnished',
        preferredTenantTypes: ['Young Professional', 'Couple'],
        defaultPetsPolicy: {
            willConsiderPets: true,
            requiresPetInsurance: true,
            preferredPetTypes: ['cat', 'small_caged'],
            maxPetsAllowed: 1,
        },
        prsRegistrationStatus: 'active',
        prsRegistrationNumber: 'PRS-LIV-2024-12345',
        prsRegistrationDate: new Date('2024-01-15'),
        prsRegistrationExpiryDate: new Date('2029-01-15'),
        ombudsmanScheme: 'property_redress_scheme',
        ombudsmanMembershipNumber: 'PRS-123456',
        isFullyCompliant: true,
        depositScheme: 'DPS',
        isRegisteredLandlord: true,
        estateAgentLink: 'https://example.com/agent-link',
        createdAt: new Date(),
        onboardingComplete: true,
    };

    const saved = await saveLandlordProfile(landlord as unknown as LandlordProfile);
    GENERATED_IDS.landlordId = saved.id;
    return saved;
}

/**
 * Create test estate agent profile (Sarah Bennett)
 */
export async function createTestEstateAgent(): Promise<AgencyProfile> {
    // Use Record to allow DB fields alongside interface fields
    const agent: Record<string, unknown> = {
        seed_tag: SEED_CONSTANTS.ESTATE_AGENT_TAG,
        email: `test.estateagent@${SEED_CONSTANTS.EMAIL_DOMAIN}`,
        passwordHash: await hashPassword(SEED_CONSTANTS.DEFAULT_PASSWORD),
        companyName: 'Liverpool Prime Lettings',
        agencyType: 'estate_agent',
        primaryContactName: 'Sarah Bennett',
        phone: '0151 123 4567',
        address: {
            street: '45 Castle Street',
            city: 'Liverpool',
            postcode: 'L2 4SQ',
        },
        serviceAreas: ['Liverpool', 'Southport'],
        registrationNumber: '12345678',
        propertyOmbudsmanMember: true,
        managedPropertyIds: [],
        landlordClientIds: [],
        activeTenantsCount: 0,
        totalPropertiesManaged: 0,
        slaConfiguration: {
            emergencyResponseHours: 4,
            urgentResponseHours: 24,
            routineResponseHours: 72,
            maintenanceResponseDays: 14,
        },
        performanceMetrics: {
            averageResponseTimeHours: 24,
            slaComplianceRate: 98,
            totalIssuesResolved: 150,
            totalIssuesRaised: 155,
            currentOpenIssues: 5,
        },
        isActive: true,
        createdAt: new Date(),
        onboardingComplete: true,
    };

    const saved = await saveAgencyProfile(agent as Omit<AgencyProfile, 'id'>);
    GENERATED_IDS.estateAgentId = saved.id;
    return saved;
}

/**
 * Create test management agency profile (PropertyCare Solutions)
 */
export async function createTestManagementAgency(): Promise<AgencyProfile> {
    // Use Record to allow DB fields alongside interface fields
    const agency: Record<string, unknown> = {
        seed_tag: SEED_CONSTANTS.MANAGEMENT_AGENCY_TAG,
        email: `test.managementagency@${SEED_CONSTANTS.EMAIL_DOMAIN}`,
        passwordHash: await hashPassword(SEED_CONSTANTS.DEFAULT_PASSWORD),
        companyName: 'PropertyCare Solutions',
        agencyType: 'management_agency',
        primaryContactName: 'Michael Chen',
        phone: '0151 987 6543',
        address: {
            street: '78 Water Street',
            city: 'Liverpool',
            postcode: 'L2 8TD',
        },
        serviceAreas: ['Liverpool', 'Southport', 'Formby'],
        registrationNumber: '87654321',
        propertyOmbudsmanMember: true,
        managedPropertyIds: [],
        landlordClientIds: [],
        activeTenantsCount: 0,
        totalPropertiesManaged: 0,
        slaConfiguration: {
            emergencyResponseHours: 4,
            urgentResponseHours: 24,
            routineResponseHours: 72,
            maintenanceResponseDays: 5,
        },
        performanceMetrics: {
            averageResponseTimeHours: 12,
            slaComplianceRate: 99,
            totalIssuesResolved: 300,
            totalIssuesRaised: 305,
            currentOpenIssues: 5,
        },
        isActive: true,
        createdAt: new Date(),
        onboardingComplete: true,
    };

    const saved = await saveAgencyProfile(agency as Omit<AgencyProfile, 'id'>);
    GENERATED_IDS.managementAgencyId = saved.id;
    return saved;
}

/**
 * Seed all test user profiles
 * @returns Number of profiles created
 */
export async function seedUserProfiles(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Creating test user profiles...');

    if (verbose) console.log('[Seed] Creating test user profiles...');

    // Cleanup existing test users to avoid duplicate key errors
    const testEmails = [
        `test.renter@${SEED_CONSTANTS.EMAIL_DOMAIN}`,
        `test.landlord@${SEED_CONSTANTS.EMAIL_DOMAIN}`,
        `test.estateagent@${SEED_CONSTANTS.EMAIL_DOMAIN}`,
        `test.managementagency@${SEED_CONSTANTS.EMAIL_DOMAIN}`
    ];

    if (verbose) console.log('[Seed] Cleaning up any existing test users...');

    await supabase.from('renter_profiles').delete().in('email', testEmails);
    await supabase.from('landlord_profiles').delete().in('email', testEmails);
    await supabase.from('agency_profiles').delete().in('email', testEmails);

    const profiles = await Promise.all([
        createTestRenter(),
        createTestLandlord(),
        createTestEstateAgent(),
        createTestManagementAgency(),
    ]);

    if (verbose) {
        console.log(`[Seed] ✓ Created ${profiles.length} user profiles`);
        console.log(`[Seed] Generated IDs:`, GENERATED_IDS);
    }

    return profiles.length;
}
