/**
 * Import Properties from XLSX with Local Images to Supabase
 *
 * This script:
 * 1. Clears existing properties from Supabase
 * 2. Uploads images from local folders to Supabase Storage
 * 3. Imports properties from XLSX with the uploaded image URLs
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
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
  console.error('❌ Supabase credentials not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Clear all existing properties
 */
async function clearProperties() {
  console.log('🧹 Clearing existing properties from database...');

  const { error } = await supabase
    .from('properties')
    .delete()
    .neq('id', ''); // Delete all rows

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found (ok)
    console.error('❌ Failed to clear properties:', error.message);
    throw error;
  }

  console.log('✅ Existing properties cleared');
}

/**
 * Upload images for a property to Supabase Storage
 */
async function uploadPropertyImages(streetName) {
  const folderPath = path.join(IMAGES_FOLDER, streetName);

  if (!fs.existsSync(folderPath)) {
    console.warn(`⚠️  No images folder found for: ${streetName}`);
    return [];
  }

  const imageFiles = fs.readdirSync(folderPath)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .sort();

  if (imageFiles.length === 0) {
    console.warn(`⚠️  No images found in folder: ${streetName}`);
    return [];
  }

  const uploadedUrls = [];

  for (const imageFile of imageFiles) {
    const filePath = path.join(folderPath, imageFile);
    const fileBuffer = fs.readFileSync(filePath);

    // Generate unique filename
    const ext = path.extname(imageFile);
    const sanitizedStreet = streetName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const storagePath = `properties/${sanitizedStreet}_${timestamp}_${random}${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(storagePath, fileBuffer, {
          contentType: `image/${ext.slice(1)}`,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`❌ Failed to upload ${imageFile}:`, uploadError.message);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(storagePath);

      uploadedUrls.push(publicUrl);
      console.log(`   ✅ Uploaded: ${imageFile}`);
    } catch (err) {
      console.error(`❌ Error uploading ${imageFile}:`, err.message);
    }
  }

  return uploadedUrls;
}

/**
 * Parse XLSX file
 */
function parseXLSX(filePath) {
  console.log(`\n📖 Reading XLSX file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Found ${data.length} properties in spreadsheet\n`);

  return data;
}

/**
 * Import properties with images
 */
async function importProperties(xlsxData) {
  console.log('🚀 Starting property import with images...\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < xlsxData.length; i++) {
    const row = xlsxData[i];
    const propertyNum = i + 1;

    console.log(`\n[${propertyNum}/${xlsxData.length}] Processing property...`);

    // Extract street name from XLSX
    const street = row['street'] || row['Address'] || row['Street'] || 'Unknown';
    console.log(`   📍 Address: ${street}`);

    // Upload images for this property
    console.log(`   📸 Uploading images...`);
    const imageUrls = await uploadPropertyImages(street);

    if (imageUrls.length === 0) {
      console.warn(`   ⚠️  No images uploaded, using placeholders`);
      imageUrls.push('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800');
    }

    console.log(`   ✅ ${imageUrls.length} images ready`);

    // Create property object
    const propertyId = `property-${Date.now()}-${i}`;

    // Parse price (remove £ and commas)
    const priceStr = (row['price'] || '250000').toString().replace(/[£,]/g, '');
    const price = parseInt(priceStr) || 250000;

    const property = {
      id: propertyId,
      vendor_id: null,

      // Address
      street: street,
      city: row['city'] || 'London',
      postcode: row['postcode'] || 'SW1A 1AA',
      council: row['council'] || row['city'] || 'Westminster',

      // Basic details
      price: price,
      bedrooms: parseInt(row['bedrooms']) || 2,
      bathrooms: parseInt(row['bathrooms']) || 1,
      property_type: row['property_type'] || 'Flat',
      square_footage: parseInt(row['square_footage']) || 800,
      year_built: parseInt(row['year_built']) || 2000,

      // Listing details
      description: row['description'] || `Beautiful ${row['property_type'] || 'property'} in ${row['city'] || 'London'}.`,
      epc_rating: (row['epc_rating'] || 'C').toUpperCase() || 'C',
      tenure: row['tenure'] || 'Freehold',
      images: imageUrls,
      features: row['features'] ? row['features'].split(',').map(f => f.trim()) : ['Double Glazing', 'Central Heating'],
      listing_date: new Date().toISOString().split('T')[0],
    };

    // Insert into Supabase
    try {
      const { error } = await supabase
        .from('properties')
        .insert(property);

      if (error) {
        console.error(`   ❌ Failed to import:`, error.message);
        failCount++;
      } else {
        console.log(`   ✅ Property imported successfully`);
        successCount++;
      }
    } catch (err) {
      console.error(`   ❌ Error:`, err.message);
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 IMPORT SUMMARY');
  console.log(`${'='.repeat(50)}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed:  ${failCount}`);
  console.log(`📝 Total:   ${xlsxData.length}`);
  console.log(`${'='.repeat(50)}\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🏠 GetOn Property Importer with Images\n');
  console.log(`${'='.repeat(50)}\n`);

  // Check files exist
  const xlsxPath = path.join(__dirname, XLSX_FILE);

  if (!fs.existsSync(xlsxPath)) {
    console.error(`❌ XLSX file not found: ${XLSX_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(IMAGES_FOLDER)) {
    console.error(`❌ Images folder not found: ${IMAGES_FOLDER}`);
    process.exit(1);
  }

  console.log('✅ Files verified');
  console.log(`   📄 XLSX: ${XLSX_FILE}`);
  console.log(`   📁 Images: ${IMAGES_FOLDER}`);

  // Clear existing properties
  await clearProperties();

  // Parse XLSX
  const xlsxData = parseXLSX(xlsxPath);

  // Import with images
  await importProperties(xlsxData);

  console.log('✨ Import complete!\n');
  console.log('🔗 Check your Supabase dashboard:');
  console.log(`   https://supabase.com/dashboard/project/ihbveuhvckvqnhjzanzc/editor\n`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
