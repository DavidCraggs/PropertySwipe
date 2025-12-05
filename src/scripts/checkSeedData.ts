// Load environment variables FIRST before any other imports
import '../lib/loadEnv';
import { supabase } from '../lib/supabase';

async function checkSeedData() {
    console.log('Checking seed data...');

    // 1. Check Renter
    const email = 'test.renter@test.geton.com';
    const { data: renter, error: renterError } = await supabase
        .from('renter_profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (renterError) {
        console.error('Error fetching renter:', renterError);
        return;
    }

    if (!renter) {
        console.error('Renter not found!');
        return;
    }

    console.log('Renter found:', { id: renter.id, email: renter.email });

    // 2. Check Properties
    const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('*')
        .not('seed_tag', 'is', null);

    if (propError) {
        console.error('Error fetching properties:', propError);
    } else {
        console.log(`\nFound ${properties?.length || 0} seeded properties.`);
        properties?.forEach(p => {
            console.log(`- Property: ${p.address_street}, ${p.address_city} (ID: ${p.id})`);
        });
    }

    // 3. Check Matches
    const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('renter_id', renter.id);

    if (matchError) {
        console.error('Error fetching matches:', matchError);
        return;
    }

    console.log(`\nFound ${matches?.length || 0} matches for renter.`);

    if (matches && matches.length > 0) {
        for (const m of matches) {
            console.log(`\n- Match ID: ${m.id}`);
            console.log(`  Property ID: ${m.property_id}`);
            console.log(`  Status: ${m.application_status}`);
            console.log(`  Landlord ID: ${m.landlord_id}`);
            console.log(`  Agency ID: ${m.managing_agency_id}`);

            // Fetch property details separately
            const { data: prop } = await supabase
                .from('properties')
                .select('address_street, address_city')
                .eq('id', m.property_id)
                .single();

            if (prop) {
                console.log(`  Property: ${prop.address_street}, ${prop.address_city}`);
            } else {
                console.log(`  ⚠️ Property not found for ID: ${m.property_id}`);
            }
        }
    }

    // 4. Check Conversations
    let conversations: any[] | null = null;
    if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id);
        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .in('match_id', matchIds);

        if (convError) {
            console.error('\nError fetching conversations:', convError);
        } else {
            conversations = convData;
            console.log(`\n📨 Found ${conversations?.length || 0} conversations.`);
            if (conversations && conversations.length > 0) {
                conversations.forEach(c => {
                    console.log(`  - ${c.conversation_type} conversation for match ${c.match_id}`);
                    console.log(`    Messages: ${c.messages?.length || 0}`);
                    console.log(`    Unread (renter): ${c.unread_count_renter}`);
                    console.log(`    Unread (other): ${c.unread_count_other}`);
                });
            } else {
                console.log('\n⚠️  NO CONVERSATIONS FOUND!');
                console.log('   This is why the dual-messaging UI is not working.');
                console.log('   The seedConversations step likely failed or didn\'t run.');
            }
        }
    }

    console.log('\n=== Summary ===');
    console.log(`Renter: ✅`);
    console.log(`Properties: ${properties?.length || 0}`);
    console.log(`Matches: ${matches?.length || 0}`);
    console.log(`Conversations: ${conversations?.length || 0} ⚠️ SHOULD BE ${(matches?.length || 0) * 2} (landlord + agency per match)`);
}

checkSeedData().catch(console.error);
