/**
 * Import Properties from XLSX to Supabase
 *
 * Usage:
 * 1. Place your XLSX file in this directory and name it "properties.xlsx"
 * 2. Run: node import-properties.js
 * 3. Properties will be imported to Supabase
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Default placeholder images (Unsplash property photos)
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
];

// Default features
const DEFAULT_FEATURES = [
  'Double Glazing',
  'Central Heating',
  'Parking',
];

/**
 * Parse XLSX file and convert to Property objects
 */
function parseXLSX(filePath) {
  console.log(`📖 Reading XLSX file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Found ${data.length} rows in spreadsheet`);

  return data.map((row, index) => {
    // Generate a unique ID
    const propertyId = `property-${Date.now()}-${index}`;

    // Map XLSX columns to property format
    // Adjust these column names to match YOUR XLSX file
    const property = {
      id: propertyId,
      vendor_id: null, // No vendor initially

      // Address - adjust column names to match your XLSX
      street: row['Street'] || row['Address'] || row['street'] || 'Unknown Street',
      city: row['City'] || row['city'] || 'London',
      postcode: row['Postcode'] || row['PostCode'] || row['postcode'] || 'SW1A 1AA',
      council: row['Council'] || row['council'] || 'Westminster',

      // Basic details
      price: parseInt(row['Price'] || row['price'] || 250000),
      bedrooms: parseInt(row['Bedrooms'] || row['bedrooms'] || row['Beds'] || 2),
      bathrooms: parseInt(row['Bathrooms'] || row['bathrooms'] || row['Baths'] || 1),
      property_type: row['Type'] || row['PropertyType'] || row['property_type'] || 'Flat',
      square_footage: parseInt(row['SquareFootage'] || row['square_footage'] || row['SqFt'] || 800),
      year_built: parseInt(row['YearBuilt'] || row['year_built'] || row['Year'] || 2000),

      // Listing details
      description: row['Description'] || row['description'] || 'Beautiful property in excellent location.',
      epc_rating: (row['EPC'] || row['epc_rating'] || 'C').toUpperCase(),
      tenure: row['Tenure'] || row['tenure'] || 'Freehold',
      images: DEFAULT_IMAGES, // You can update these later
      features: DEFAULT_FEATURES,
      listing_date: new Date().toISOString().split('T')[0],
    };

    return property;
  });
}

/**
 * Import properties to Supabase
 */
async function importProperties(properties) {
  console.log(`\n🚀 Starting import of ${properties.length} properties...`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    try {
      const { error } = await supabase
        .from('properties')
        .insert(property);

      if (error) {
        console.error(`❌ Failed to import property ${i + 1}:`, error.message);
        failCount++;
      } else {
        console.log(`✅ Imported property ${i + 1}/${properties.length}: ${property.street}, ${property.city}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error importing property ${i + 1}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${properties.length}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🏠 GetOn Property Importer\n');

  // Check if XLSX file exists
  const xlsxPath = path.join(__dirname, 'properties.xlsx');

  if (!fs.existsSync(xlsxPath)) {
    console.error('❌ File not found: properties.xlsx');
    console.log('\n📝 Instructions:');
    console.log('   1. Place your XLSX file in the project root');
    console.log('   2. Name it "properties.xlsx"');
    console.log('   3. Run this script again: node import-properties.js');
    console.log('\n💡 Your XLSX should have columns like:');
    console.log('   - Street, City, Postcode');
    console.log('   - Price, Bedrooms, Bathrooms');
    console.log('   - Type (Flat/Terraced/etc), EPC, Tenure');
    process.exit(1);
  }

  // Parse XLSX
  const properties = parseXLSX(xlsxPath);

  // Show preview
  console.log('\n📋 Preview of first property:');
  console.log(JSON.stringify(properties[0], null, 2));

  console.log('\n⏳ Starting import in 3 seconds... (Ctrl+C to cancel)');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Import to Supabase
  await importProperties(properties);

  console.log('\n✨ Import complete!');
  console.log('🔗 Check your Supabase dashboard:');
  console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/editor`);
}

main().catch(console.error);
