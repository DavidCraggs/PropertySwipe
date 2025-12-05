// Quick check: Do the properties from those matches exist?
import './src/lib/loadEnv.js';
import { supabase } from './src/lib/supabase.js';

const propertyIds = [
    '9e2cd2dc-07b1-4f95-802f-5abafce3fa98',
    '06d64a9a-b864-44ec-a05b-4c6d85ea7206',
    'ad86f19f-8614-40d1-a69f-2008a707e8cf',
    'c805fbef-7c77-49da-ab58-91fb2c2b633e'
];

async function checkProperties() {
    for (const id of propertyIds) {
        const { data, error } = await supabase
            .from('properties')
            .select('id, address_street, address_city')
            .eq('id', id)
            .single();

        if (error) {
            console.log(`❌ Property ${id}: NOT FOUND`);
        } else {
            console.log(`✅ Property ${id}: ${data.address_street}, ${data.address_city}`);
        }
    }
}

checkProperties();
