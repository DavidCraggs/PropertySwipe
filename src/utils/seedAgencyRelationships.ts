/**
 * Step 9: Seed Agency Relationships
 * Creates agency_property_links to establish relationships between agencies, landlords, and properties
 */

import { supabase } from '../lib/supabase';
import { GENERATED_IDS } from './seedUserProfiles';
import { PROPERTY_IDS } from './seedProperties';

/**
 * Seed agency relationships - creates links between properties and agencies
 * @param verbose - Whether to log detailed progress
 * @returns Number of relationships created
 */
export async function seedAgencyRelationships(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Creating agency relationships...');

    const relationships = [];
    const propertyIds = [
        PROPERTY_IDS.property1Id,
        PROPERTY_IDS.property2Id,
        PROPERTY_IDS.property3Id,
        PROPERTY_IDS.property4Id,
        PROPERTY_IDS.property5Id,
    ];

    // Create links for each property to both agencies
    for (let i = 0; i < propertyIds.length; i++) {
        const propertyId = propertyIds[i];

        // Management agency link
        const managementLink = {
            landlord_id: GENERATED_IDS.landlordId,
            agency_id: GENERATED_IDS.managementAgencyId,
            property_id: propertyId,
            link_type: 'management_agency',
            commission_rate: 10.00, // 10% for management
            is_active: true,
            seed_tag: `seed-agency-link-mgmt-${i + 1}`,
        };

        // Estate agent link
        const estateAgentLink = {
            landlord_id: GENERATED_IDS.landlordId,
            agency_id: GENERATED_IDS.estateAgentId,
            property_id: propertyId,
            link_type: 'estate_agent',
            commission_rate: 1.50, // 1.5% for marketing
            is_active: true,
            seed_tag: `seed-agency-link-agent-${i + 1}`,
        };

        relationships.push(managementLink, estateAgentLink);

        if (verbose) {
            console.log(`[Seed] Linking property ${i + 1} to management agency`);
            console.log(`[Seed] Linking property ${i + 1} to estate agent`);
        }
    }

    // Insert all relationships
    try {
        const { data, error } = await supabase
            .from('agency_property_links')
            .insert(relationships)
            .select();

        if (error) {
            console.error('[Seed] Error creating agency relationships:', error);
            throw error;
        }

        if (verbose) {
            console.log(`[Seed] ✓ Created ${data?.length || 0} agency property links`);
        }

        return data?.length || 0;
    } catch (error) {
        console.error('[Seed] Failed to create agency relationships:', error);
        throw error;
    }
}
