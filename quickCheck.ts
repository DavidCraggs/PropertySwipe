import './src/lib/loadEnv.js';
import { supabase } from './src/lib/supabase.js';

async function quickCheck() {
    // Check conversations
    const { data: convs, error } = await supabase
        .from('conversations')
        .select('id, match_id, conversation_type, messages');

    if (error) {
        console.log('❌ Error:', error);
    } else {
        console.log(`✅ Found ${convs?.length || 0} conversations in database`);
        convs?.forEach((c, i) => {
            console.log(`  ${i + 1}. Match: ${c.match_id}, Type: ${c.conversation_type}, Messages: ${c.messages?.length || 0}`);
        });
    }
}

quickCheck();
