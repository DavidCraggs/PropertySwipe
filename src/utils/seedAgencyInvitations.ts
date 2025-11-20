/**
 * Step 10: Seed Agency Invitations
 * Creates sample agency_link_invitations to demonstrate the invitation workflow
 */

import { supabase } from '../lib/supabase';
import { daysAgo } from './seedHelpers';
import { GENERATED_IDS } from './seedUserProfiles';

/**
 * Seed agency invitations - creates sample invitation records
 * @param verbose - Whether to log detailed progress
 * @returns Number of invitations created
 */
export async function seedAgencyInvitations(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Creating agency invitations...');

    const invitations = [
        // Accepted invitation from management agency to landlord
        {
            agency_id: GENERATED_IDS.managementAgencyId,
            landlord_id: GENERATED_IDS.landlordId,
            invitation_type: 'management_agency',
            status: 'accepted',
            message: 'We would like to manage your properties. Our team provides 24/7 support and comprehensive maintenance services.',
            commission_rate: 10.00,
            created_at: daysAgo(30).toISOString(),
            responded_at: daysAgo(28).toISOString(),
            seed_tag: 'seed-invitation-mgmt-accepted',
        },
        // Accepted invitation from estate agent to landlord
        {
            agency_id: GENERATED_IDS.estateAgentId,
            landlord_id: GENERATED_IDS.landlordId,
            invitation_type: 'estate_agent',
            status: 'accepted',
            message: 'Let us market your properties to our extensive database of quality tenants. Professional photography and viewings included.',
            commission_rate: 1.50,
            created_at: daysAgo(30).toISOString(),
            responded_at: daysAgo(29).toISOString(),
            seed_tag: 'seed-invitation-agent-accepted',
        },
        // Pending invitation (for demo purposes - shows workflow)
        {
            agency_id: GENERATED_IDS.managementAgencyId,
            landlord_id: GENERATED_IDS.landlordId, // Same landlord, different property potentially
            invitation_type: 'management_agency',
            status: 'pending',
            message: 'We noticed you have additional properties. Would you like us to manage those as well?',
            commission_rate: 10.00,
            created_at: daysAgo(2).toISOString(),
            responded_at: null,
            seed_tag: 'seed-invitation-mgmt-pending',
        },
        // Declined invitation (for demo purposes - shows rejection flow)
        {
            agency_id: GENERATED_IDS.estateAgentId,
            landlord_id: GENERATED_IDS.landlordId,
            invitation_type: 'estate_agent',
            status: 'declined',
            message: 'Exclusive marketing opportunity for your premium properties.',
            commission_rate: 2.00,
            created_at: daysAgo(15).toISOString(),
            responded_at: daysAgo(14).toISOString(),
            seed_tag: 'seed-invitation-agent-declined',
        },
    ];

    try {
        const { data, error } = await supabase
            .from('agency_link_invitations')
            .insert(invitations)
            .select();

        if (error) {
            console.error('[Seed] Error creating agency invitations:', error);
            throw error;
        }

        if (verbose) {
            console.log(`[Seed] ✓ Created ${data?.length || 0} agency invitations:`);
            data?.forEach(inv => {
                console.log(`  - ${inv.invitation_type}: ${inv.status}`);
            });
        }

        return data?.length || 0;
    } catch (error) {
        console.error('[Seed] Failed to create agency invitations:', error);
        throw error;
    }
}
