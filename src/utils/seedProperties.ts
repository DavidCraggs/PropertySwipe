/**
 * Step 3: Seed Test Properties
 * Creates 5 realistic properties in Liverpool with correct Property type structure
 */

import type { Property } from '../types';
import { saveProperty } from '../lib/storage';
import { SEED_CONSTANTS, generatePropertyDescription, generatePlaceholderImage } from './seedHelpers';
import { GENERATED_IDS } from './seedUserProfiles';

/**
 * Property IDs generated during seeding
 */
export const PROPERTY_IDS = {
    property1Id: '',
    property2Id: '',
    property3Id: '',
    property4Id: '',
    property5Id: '',
};

/**
 * Create Property 1: Perfect match for test renter
 * 12 Duke Street - Modern 1-bed city center flat
 */
export async function createProperty1(): Promise<Property> {
    const property: Omit<Property, 'id'> & { seed_tag: string } = {
        seed_tag: SEED_CONSTANTS.PROPERTY_1_TAG,
        landlordId: GENERATED_IDS.landlordId,
        managingAgencyId: GENERATED_IDS.managementAgencyId,
        marketingAgentId: GENERATED_IDS.estateAgentId,
        address: {
            street: '12 Duke Street',
            city: 'Liverpool',
            postcode: 'L1 4JQ',
            council: 'Liverpool City Council',
        },
        rentPcm: 950,
        deposit: 1100,
        maxRentInAdvance: 1,
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 'Flat',
        epcRating: 'B',
        yearBuilt: 2018,
        features: ['Modern kitchen', 'Parking', 'High-speed internet', 'Double glazing', 'Central heating'],
        images: [
            generatePlaceholderImage(800, 600, '4f46e5'),
            generatePlaceholderImage(800, 600, '8b5cf6'),
        ],
        description: generatePropertyDescription({
            bedrooms: 1,
            propertyType: 'flat',
            area: 'Liverpool city center',
            features: ['Modern kitchen', 'Dedicated parking space', 'Recently renovated'],
        }),
        furnishing: 'Furnished',
        availableFrom: new Date().toISOString(),
        tenancyType: 'Periodic',
        maxOccupants: 2,
        petsPolicy: {
            willConsiderPets: true,
            preferredPetTypes: [],
            requiresPetInsurance: false,
            maxPetsAllowed: 0,
        },
        bills: {
            councilTaxBand: 'A',
            gasElectricIncluded: false,
            waterIncluded: false,
            internetIncluded: false,
        },
        meetsDecentHomesStandard: true,
        awaabsLawCompliant: true,
        prsPropertyRegistrationStatus: 'active',
        isAvailable: true,
        canBeMarketed: true,
        listingDate: new Date().toISOString(),
        acceptsShortTermTenants: false,
    };

    const saved = await saveProperty(property as any);
    PROPERTY_IDS.property1Id = saved.id;
    return saved;
}

/**
 * Create Property 2: Good match, slightly over budget
 * 45 Bold Street - 2-bed renovated flat
 */
export async function createProperty2(): Promise<Property> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const property: Omit<Property, 'id'> & { seed_tag: string } = {
        seed_tag: SEED_CONSTANTS.PROPERTY_2_TAG,
        landlordId: GENERATED_IDS.landlordId,
        managingAgencyId: GENERATED_IDS.managementAgencyId,
        marketingAgentId: GENERATED_IDS.estateAgentId,
        address: {
            street: '45 Bold Street',
            city: 'Liverpool',
            postcode: 'L1 4HR',
            council: 'Liverpool City Council',
        },
        rentPcm: 1100,
        deposit: 1275,
        maxRentInAdvance: 1,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'Flat',
        epcRating: 'C',
        yearBuilt: 1920,
        features: ['Period features', 'Garden access', 'Close to shops', 'Central heating', 'Recently renovated'],
        images: [
            generatePlaceholderImage(800, 600, '10b981'),
            generatePlaceholderImage(800, 600, '059669'),
        ],
        description: generatePropertyDescription({
            bedrooms: 2,
            propertyType: 'flat',
            area: 'Bold Street',
            features: ['Shared garden access', 'Character features', 'Close to amenities'],
        }),
        furnishing: 'Part Furnished',
        availableFrom: futureDate.toISOString(),
        tenancyType: 'Periodic',
        maxOccupants: 3,
        petsPolicy: {
            willConsiderPets: true,
            preferredPetTypes: ['cat', 'small_caged'],
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
        prsPropertyRegistrationStatus: 'active',
        isAvailable: true,
        canBeMarketed: true,
        listingDate: new Date().toISOString(),
        preferredMinimumStay: 12,
        acceptsShortTermTenants: false,
    };

    const saved = await saveProperty(property as any);
    PROPERTY_IDS.property2Id = saved.id;
    return saved;
}

/**
 * Create Property 3: Outside budget, luxury
 * 78 Water Street - Waterfront luxury apartment
 */
export async function createProperty3(): Promise<Property> {
    const property: Omit<Property, 'id'> & { seed_tag: string } = {
        seed_tag: SEED_CONSTANTS.PROPERTY_3_TAG,
        landlordId: GENERATED_IDS.landlordId,
        managingAgencyId: GENERATED_IDS.managementAgencyId,
        marketingAgentId: GENERATED_IDS.estateAgentId,
        address: {
            street: '78 Water Street',
            city: 'Liverpool',
            postcode: 'L2 8TD',
            council: 'Liverpool City Council',
        },
        rentPcm: 1500,
        deposit: 1725,
        maxRentInAdvance: 1,
        bedrooms: 2,
        bathrooms: 2,
        propertyType: 'Flat',
        epcRating: 'A',
        yearBuilt: 2020,
        features: ['Waterfront', 'Concierge', 'Gym access', 'Balcony', 'Underground parking', 'Modern'],
        images: [
            generatePlaceholderImage(800, 600, 'f59e0b'),
            generatePlaceholderImage(800, 600, 'd97706'),
        ],
        description: generatePropertyDescription({
            bedrooms: 2,
            propertyType: 'luxury apartment',
            area: 'Liverpool Waterfront',
            features: ['Concierge service', '24/7 security', 'Spectacular river views'],
        }),
        furnishing: 'Furnished',
        availableFrom: new Date().toISOString(),
        tenancyType: 'Periodic',
        maxOccupants: 3,
        petsPolicy: {
            willConsiderPets: true,
            preferredPetTypes: ['cat', 'small_caged'],
            requiresPetInsurance: true,
            maxPetsAllowed: 1,
            propertyUnsuitableFor: ['large_dogs', 'multiple_dogs'],
        },
        bills: {
            councilTaxBand: 'C',
            gasElectricIncluded: false,
            waterIncluded: true,
            internetIncluded: true,
        },
        meetsDecentHomesStandard: true,
        awaabsLawCompliant: true,
        prsPropertyRegistrationStatus: 'active',
        isAvailable: true,
        canBeMarketed: true,
        listingDate: new Date().toISOString(),
        preferredMinimumStay: 12,
        acceptsShortTermTenants: false,
    };

    const saved = await saveProperty(property as any);
    PROPERTY_IDS.property3Id = saved.id;
    return saved;
}

/**
 * Create Property 4: Suburban family house
 * 23 Penny Lane - Family house in suburbs
 */
export async function createProperty4(): Promise<Property> {
    const property: Omit<Property, 'id'> & { seed_tag: string } = {
        seed_tag: SEED_CONSTANTS.PROPERTY_4_TAG,
        landlordId: GENERATED_IDS.landlordId,
        managingAgencyId: GENERATED_IDS.managementAgencyId,
        marketingAgentId: GENERATED_IDS.estateAgentId,
        address: {
            street: '23 Penny Lane',
            city: 'Liverpool',
            postcode: 'L18 9HF',
            council: 'Liverpool City Council',
        },
        rentPcm: 1200,
        deposit: 1380,
        maxRentInAdvance: 1,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'Terraced',
        epcRating: 'C',
        yearBuilt: 1950,
        features: ['Large garden', 'Family-friendly', 'Driveway', 'Close to schools', 'Quiet area'],
        images: [
            generatePlaceholderImage(800, 600, 'ef4444'),
            generatePlaceholderImage(800, 600, 'dc2626'),
        ],
        description: generatePropertyDescription({
            bedrooms: 3,
            propertyType: 'terraced house',
            area: 'Penny Lane',
            features: ['Large garden', 'Family-friendly neighborhood', 'Off-street parking'],
        }),
        furnishing: 'Unfurnished',
        availableFrom: new Date().toISOString(),
        tenancyType: 'Periodic',
        maxOccupants: 5,
        petsPolicy: {
            willConsiderPets: true,
            preferredPetTypes: ['cat', 'dog', 'small_caged'],
            requiresPetInsurance: true,
            maxPetsAllowed: 2,
        },
        bills: {
            councilTaxBand: 'C',
            gasElectricIncluded: false,
            waterIncluded: false,
            internetIncluded: false,
        },
        meetsDecentHomesStandard: true,
        awaabsLawCompliant: true,
        prsPropertyRegistrationStatus: 'active',
        isAvailable: true,
        canBeMarketed: true,
        listingDate: new Date().toISOString(),
        preferredMinimumStay: 12,
        acceptsShortTermTenants: false,
    };

    const saved = await saveProperty(property as any);
    PROPERTY_IDS.property4Id = saved.id;
    return saved;
}

/**
 * Create Property 5: Period flat, future availability
 * 56 Rodney Street - Period flat
 */
export async function createProperty5(): Promise<Property> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);

    const property: Omit<Property, 'id'> & { seed_tag: string } = {
        seed_tag: SEED_CONSTANTS.PROPERTY_5_TAG,
        landlordId: GENERATED_IDS.landlordId,
        managingAgencyId: GENERATED_IDS.managementAgencyId,
        marketingAgentId: GENERATED_IDS.estateAgentId,
        address: {
            street: '56 Rodney Street',
            city: 'Liverpool',
            postcode: 'L1 9EW',
            council: 'Liverpool City Council',
        },
        rentPcm: 900,
        deposit: 1035,
        maxRentInAdvance: 1,
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 'Flat',
        epcRating: 'D',
        yearBuilt: 1890,
        features: ['Period features', 'High ceilings', 'City center', 'Character property'],
        images: [
            generatePlaceholderImage(800, 600, '06b6d4'),
            generatePlaceholderImage(800, 600, '0891b2'),
        ],
        description: generatePropertyDescription({
            bedrooms: 1,
            propertyType: 'period flat',
            area: 'Rodney Street',
            features: ['Original features', 'Period charm', 'Central location'],
        }),
        furnishing: 'Furnished',
        availableFrom: futureDate.toISOString(),
        tenancyType: 'Periodic',
        maxOccupants: 2,
        petsPolicy: {
            willConsiderPets: true,
            preferredPetTypes: ['cat', 'small_caged'],
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
        prsPropertyRegistrationStatus: 'active',
        isAvailable: true,
        canBeMarketed: true,
        listingDate: new Date().toISOString(),
        acceptsShortTermTenants: false,
    };

    const saved = await saveProperty(property as any);
    PROPERTY_IDS.property5Id = saved.id;
    return saved;
}

/**
 * Seed all test properties
 * @returns Number of properties created
 */
export async function seedProperties(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Creating test properties...');

    const properties = await Promise.all([
        createProperty1(),
        createProperty2(),
        createProperty3(),
        createProperty4(),
        createProperty5(),
    ]);

    if (verbose) {
        console.log(`[Seed] ✓ Created ${properties.length} properties:`);
        properties.forEach(p => console.log(`  - ${p.id}: ${p.address.street}, ${p.address.city}`));
        console.log(`[Seed] Property IDs:`, PROPERTY_IDS);
    }

    return properties.length;
}
