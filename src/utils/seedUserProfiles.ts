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

    const saved = await saveRenterProfile(renter as any);
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

    const saved = await saveLandlordProfile(landlord as any);
    GENERATED_IDS.landlordId = saved.id;
    return saved;
}

/**
 * Create test estate agent profile (Sarah Bennett)
 */
export async function createTestEstateAgent(): Promise<AgencyProfile> {
    const agent: any = {
        seed_tag: SEED_CONSTANTS.ESTATE_AGENT_TAG,
        email: `test.estateagent@${SEED_CONSTANTS.EMAIL_DOMAIN}`,
        password_hash: await hashPassword(SEED_CONSTANTS.DEFAULT_PASSWORD),
        company_name: 'Liverpool Prime Lettings',
        agency_type: 'estate_agent',
        primary_contact_name: 'Sarah Bennett',
        phone: '0151 123 4567',
        address_street: '45 Castle Street',
        address_city: 'Liverpool',
        address_postcode: 'L2 4SQ',
        service_areas: ['Liverpool', 'Southport'],
        registration_number: '12345678',
        property_ombudsman_member: true,
        managed_property_ids: [],
        landlord_client_ids: [],
        active_tenants_count: 0,
        total_properties_managed: 0,
        sla_emergency_response_hours: 4,
        sla_urgent_response_hours: 24,
        sla_routine_response_hours: 72,
        sla_maintenance_response_days: 14,
        avg_response_time_hours: 24,
        sla_compliance_rate: 98,
        total_issues_resolved: 150,
        total_issues_raised: 155,
        current_open_issues: 5,
        is_active: true,
        created_at: new Date(),
        is_complete: true,
    };

    const saved = await saveAgencyProfile(agent);
    GENERATED_IDS.estateAgentId = saved.id;
    return saved;
}

/**
 * Create test management agency profile (PropertyCare Solutions)
 */
export async function createTestManagementAgency(): Promise<AgencyProfile> {
    const agency: any = {
        seed_tag: SEED_CONSTANTS.MANAGEMENT_AGENCY_TAG,
        email: `test.managementagency@${SEED_CONSTANTS.EMAIL_DOMAIN}`,
        password_hash: await hashPassword(SEED_CONSTANTS.DEFAULT_PASSWORD),
        company_name: 'PropertyCare Solutions',
        agency_type: 'management_agency',
        primary_contact_name: 'Michael Chen',
        phone: '0151 987 6543',
        address_street: '78 Water Street',
        address_city: 'Liverpool',
        address_postcode: 'L2 8TD',
        service_areas: ['Liverpool', 'Southport', 'Formby'],
        registration_number: '87654321',
        property_ombudsman_member: true,
        managed_property_ids: [],
        landlord_client_ids: [],
        active_tenants_count: 0,
        total_properties_managed: 0,
        sla_emergency_response_hours: 4,
        sla_urgent_response_hours: 24,
        sla_routine_response_hours: 72,
        sla_maintenance_response_days: 5,
        avg_response_time_hours: 12,
        sla_compliance_rate: 99,
        total_issues_resolved: 300,
        total_issues_raised: 305,
        current_open_issues: 5,
        is_active: true,
        created_at: new Date(),
        is_complete: true,
    };

    const saved = await saveAgencyProfile(agency);
    GENERATED_IDS.managementAgencyId = saved.id;
    return saved;
}

/**
 * Seed all test user profiles
 * @returns Number of profiles created
 */
export async function seedUserProfiles(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Creating test user profiles...');

    const profiles = await Promise.all([
        createTestRenter(),
        createTestLandlord(),
        createTestEstateAgent(),
        createTestManagementAgency(),
    ]);

    if (verbose) {
        console.log(`[Seed] ✓ Created ${profiles.length} user profiles:`);
        profiles.forEach(p => console.log(`  - ${p.id}: ${'email' in p ? p.email : 'N/A'}`));
        console.log(`[Seed] Generated IDs:`, GENERATED_IDS);
    }

    return profiles.length;
}
