import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
const envContent = fs.readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

console.log('🔍 Checking current properties...\n');

const { data: allProps } = await supabase.from('properties').select('id, street, city');

console.log(`Found ${allProps.length} total properties:\n`);
allProps.forEach((p, i) => console.log(`${i+1}. ${p.street}, ${p.city}`));

console.log('\n🧹 Deleting ALL properties...');
const { error: deleteError } = await supabase.from('properties').delete().neq('id', '');

if (deleteError) {
  console.error('❌ Error:', deleteError.message);
  process.exit(1);
}

console.log('✅ All properties deleted!\n');
console.log('Now run: node import-with-base64-images.js');
