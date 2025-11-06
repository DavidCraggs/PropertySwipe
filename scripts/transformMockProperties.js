/**
 * Script to transform mockProperties.ts from purchase to rental platform
 * Converts all properties to rental format with RRA 2025 compliance
 */

const fs = require('fs');
const path = require('path');

const mockPropertiesPath = path.join(__dirname, '..', 'src', 'data', 'mockProperties.ts');

// Read the file
let content = fs.readFileSync(mockPropertiesPath, 'utf8');

// Cities mapping - convert to North West England
const cityMapping = {
  'London': 'Liverpool',
  'Manchester': 'Manchester',
  'Birmingham': 'Southport',
  'Edinburgh': 'Liverpool',
};

// Street mapping for realistic North West addresses
const streetMapping = {
  // London -> Liverpool
  'Kensington Gardens Square': 'Hope Street',
  'Shoreditch High Street': 'Bold Street',
  'Richmond Hill': 'Aigburth Vale',
  'Brixton Road': 'Lark Lane',
  'Canary Wharf': 'Mann Island',
  'Camden High Street': 'Hardman Street',
  'Greenwich Peninsula': 'Waterfront',

  // Birmingham -> Southport
  'Broad Street': 'Lord Street',
  'Edgbaston Park Road': 'Birkdale Park',
  'Jewellery Quarter': 'Chapel Street',
  'Harborne High Street': 'Station Road',
  'King\'s Heath': 'Portland Street',
  'Moseley Village': 'Roe Lane',

  // Edinburgh -> Liverpool
  'George Street': 'Rodney Street',
  'Stockbridge': 'Crosby',
  'Leith Walk': 'Duke Street',
  'Morningside Road': 'Allerton Road',
  'The Meadows': 'Sefton Park',
  'Portobello Road': 'Marine Drive',

  // Manchester stays Manchester
  'Deansgate': 'Deansgate',
  'Didsbury Park': 'Didsbury Park',
  'Northern Quarter': 'Northern Quarter',
  'Chorlton Green': 'Chorlton Green',
  'Altrincham Road': 'Altrincham Road',
  'Salford Quays': 'Salford Quays',
};

// Function to calculate 5 weeks deposit
const calculateDeposit = (rentPcm) => {
  return Math.round((rentPcm * 12 / 52) * 5);
};

// Function to convert price to realistic rental price
const convertPriceToRent = (price) => {
  // Typical rental yield is 4-6% annually
  // Monthly rent = (price * 0.05) / 12
  const estimatedRent = Math.round((price * 0.05) / 12 / 50) * 50; // Round to nearest £50
  // Cap at reasonable rental prices for North West
  return Math.min(estimatedRent, 3000);
};

console.log('Starting transformation of mockProperties.ts...\n');

// Transform the file systematically
let transformedContent = content;

// 1. Replace city mappings in addresses
Object.entries(cityMapping).forEach(([oldCity, newCity]) => {
  const regex = new RegExp(`city: '${oldCity}'`, 'g');
  transformedContent = transformedContent.replace(regex, `city: '${newCity}'`);
  console.log(`✓ Replaced city: ${oldCity} -> ${newCity}`);
});

// 2. Replace vendorId with landlordId
transformedContent = transformedContent.replace(/vendorId: '',/g, "landlordId: '',");
console.log('✓ Replaced vendorId with landlordId');

// 3. Remove old purchase-specific fields (tenure, squareFootage)
transformedContent = transformedContent.replace(/\n\s+tenure: '[^']+',/g, '');
transformedContent = transformedContent.replace(/\n\s+squareFootage: \d+,/g, '');
console.log('✓ Removed purchase-specific fields (tenure, squareFootage)');

// 4. Replace helper function comments
transformedContent = transformedContent.replace(
  '/**\n * Helper function to get properties by city\n */',
  '/**\n * Helper function to get rental properties by city\n */'
);
transformedContent = transformedContent.replace(
  '/**\n * Helper function to get properties within price range\n */',
  '/**\n * Helper function to get rental properties within rent range\n */'
);
transformedContent = transformedContent.replace(
  '/**\n * Helper function to filter properties by bedrooms\n */',
  '/**\n * Helper function to filter rental properties by bedrooms\n */'
);
console.log('✓ Updated helper function comments');

// 5. Update helper functions
transformedContent = transformedContent.replace(
  /export const getPropertiesByPriceRange = \(min: number, max: number\): Property\[\] => {\s+return mockProperties\.filter\(\(property\) => property\.price >= min && property\.price <= max\);/,
  `export const getPropertiesByRentRange = (min: number, max: number): Property[] => {
  return mockProperties.filter((property) => property.rentPcm >= min && property.rentPcm <= max);`
);
console.log('✓ Updated price range helper to rent range');

console.log('\n✅ Transformation complete!');
console.log('\nNote: You still need to manually add rental-specific fields to each property:');
console.log('  - furnishing');
console.log('  - availableFrom');
console.log('  - tenancyType');
console.log('  - maxOccupants');
console.log('  - petsPolicy');
console.log('  - bills');
console.log('  - meetsDecentHomesStandard');
console.log('  - awaabsLawCompliant');
console.log('\nAnd convert price to rentPcm + deposit for each property.');

// Write the transformed content
fs.writeFileSync(mockPropertiesPath, transformedContent, 'utf8');
console.log(`\n✅ File written to: ${mockPropertiesPath}`);
