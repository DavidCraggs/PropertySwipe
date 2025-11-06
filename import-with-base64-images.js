/**
 * Import Properties from XLSX with Base64 Images
 *
 * This avoids Supabase Storage issues by embedding images as base64 data URLs
 * Good for demo with small number of properties
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const XLSX_FILE = 'Kuavo_Properties_Formatted.xlsx';
const IMAGES_FOLDER = 'C:\\Users\\david\\Downloads\\Property images';

// Load environment variables
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Convert image to base64 data URL
 */
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
}

/**
 * Get base64 images for a property
 */
function getPropertyImages(streetName) {
  const folderPath = path.join(IMAGES_FOLDER, streetName);

  if (!fs.existsSync(folderPath)) {
    console.warn(`   ⚠️  No images folder: ${streetName}`);
    return ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'];
  }

  const imageFiles = fs.readdirSync(folderPath)
    .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
    .sort()
    .slice(0, 10); // Limit to 10 images to avoid size issues

  if (imageFiles.length === 0) {
    return ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'];
  }

  console.log(`   📸 Converting ${imageFiles.length} images to base64...`);

  const base64Images = imageFiles.map(file => {
    const filePath = path.join(folderPath, file);
    return imageToBase64(filePath);
  });

  return base64Images;
}

/**
 * Clear existing properties
 */
async function clearProperties() {
  console.log('🧹 Clearing existing properties...');
  const { error } = await supabase
    .from('properties')
    .delete()
    .neq('id', '');

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Failed to clear:', error.message);
    throw error;
  }
  console.log('✅ Cleared\n');
}

/**
 * Parse XLSX
 */
function parseXLSX(filePath) {
  console.log(`📖 Reading: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log(`📊 Found ${data.length} properties\n`);
  return data;
}

/**
 * Import properties
 */
async function importProperties(xlsxData) {
  console.log('🚀 Starting import...\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < xlsxData.length; i++) {
    const row = xlsxData[i];
    const propertyNum = i + 1;

    console.log(`[${propertyNum}/${xlsxData.length}] ${row['street']}`);

    // Get images
    const imageUrls = getPropertyImages(row['street']);
    console.log(`   ✅ ${imageUrls.length} images ready`);

    // Parse price
    const priceStr = (row['price'] || '250000').toString().replace(/[£,]/g, '');
    const price = parseInt(priceStr) || 250000;

    const property = {
      id: `property-${Date.now()}-${i}`,
      vendor_id: null,
      street: row['street'],
      city: row['city'] || 'London',
      postcode: row['postcode'] || 'SW1A 1AA',
      council: row['council'] || row['city'] || 'Westminster',
      price: price,
      bedrooms: parseInt(row['bedrooms']) || 2,
      bathrooms: parseInt(row['bathrooms']) || 1,
      property_type: row['property_type'] || 'Flat',
      square_footage: parseInt(row['square_footage']) || 800,
      year_built: parseInt(row['year_built']) || 2000,
      description: row['description'] || `Beautiful property in ${row['city']}.`,
      epc_rating: (row['epc_rating'] || 'C').toUpperCase() || 'C',
      tenure: row['tenure'] || 'Freehold',
      images: imageUrls,
      features: row['features'] ? row['features'].split(',').map(f => f.trim()) : ['Double Glazing'],
      listing_date: new Date().toISOString().split('T')[0],
    };

    try {
      const { error } = await supabase.from('properties').insert(property);

      if (error) {
        console.error(`   ❌ Failed:`, error.message);
        failCount++;
      } else {
        console.log(`   ✅ Imported\n`);
        successCount++;
      }
    } catch (err) {
      console.error(`   ❌ Error:`, err.message);
      failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed:  ${failCount}`);
  console.log(`📝 Total:   ${xlsxData.length}`);
  console.log(`${'='.repeat(50)}\n`);
}

/**
 * Main
 */
async function main() {
  console.log('🏠 GetOn Property Importer (Base64)\n');

  const xlsxPath = path.join(__dirname, XLSX_FILE);

  if (!fs.existsSync(xlsxPath)) {
    console.error(`❌ XLSX not found: ${XLSX_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(IMAGES_FOLDER)) {
    console.error(`❌ Images folder not found: ${IMAGES_FOLDER}`);
    process.exit(1);
  }

  await clearProperties();
  const xlsxData = parseXLSX(xlsxPath);
  await importProperties(xlsxData);

  console.log('✨ Done!\n');
  console.log('🔗 Check Supabase:');
  console.log('   https://supabase.com/dashboard/project/ihbveuhvckvqnhjzanzc/editor\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
