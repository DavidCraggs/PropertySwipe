# Import Properties from XLSX to Supabase

Quick guide to import your property list into the database.

---

## Step 1: Prepare Your XLSX File

### Required Columns:

Your XLSX spreadsheet should have these columns (names are flexible):

**Address:**
- `Street` or `Address`
- `City`
- `Postcode` or `PostCode`
- `Council` (optional)

**Property Details:**
- `Price` (number, e.g., 250000)
- `Bedrooms` or `Beds` (number)
- `Bathrooms` or `Baths` (number)
- `Type` or `PropertyType` (Flat, Terraced, Semi-detached, Detached, Bungalow)
- `SquareFootage` or `SqFt` (optional)
- `YearBuilt` or `Year` (optional)

**Listing Info:**
- `Description` (optional - will use default if missing)
- `EPC` (A-G, optional - defaults to C)
- `Tenure` (Freehold/Leasehold, optional)

### Example XLSX Structure:

| Street | City | Postcode | Price | Bedrooms | Bathrooms | Type | EPC |
|--------|------|----------|-------|----------|-----------|------|-----|
| 123 High Street | London | SW1A 1AA | 450000 | 2 | 1 | Flat | C |
| 45 Oak Avenue | Manchester | M1 1AB | 275000 | 3 | 2 | Terraced | D |

---

## Step 2: Place Your File

1. **Save your XLSX file** as `properties.xlsx`
2. **Move it to** the project root: `C:\Users\david\PropertySwipe\properties.xlsx`

---

## Step 3: Run the Import

Open Command Prompt and run:

```bash
cd C:\Users\david\PropertySwipe
node import-properties.js
```

The script will:
1. ✅ Read your XLSX file
2. ✅ Show a preview of the first property
3. ✅ Import all properties to Supabase
4. ✅ Show a summary (success/fail counts)

---

## Step 4: Add Images Later

The import script adds **placeholder images** from Unsplash. You can:

### Option A: Update via Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/ihbveuhvckvqnhjzanzc/editor
2. Open `properties` table
3. Click on a row
4. Edit the `images` column (it's a TEXT array)
5. Replace with your image URLs

### Option B: Update via the App

1. Log in as vendor
2. Link property to your vendor profile
3. Edit property
4. Upload new images

### Option C: Bulk Update with Script

If you have image URLs, I can create a script to bulk update them!

---

## Troubleshooting

### "File not found: properties.xlsx"
- Make sure the file is named exactly `properties.xlsx`
- Place it in `C:\Users\david\PropertySwipe\`

### "Column X not found"
The script tries to match common column names. If your columns are named differently:

1. Open `import-properties.js`
2. Find the section that says `// Map XLSX columns`
3. Update the column names to match YOUR spreadsheet

Example:
```javascript
street: row['Address Line 1'] || row['Street'],  // If your column is "Address Line 1"
price: parseInt(row['Asking Price'] || row['Price']),  // If your column is "Asking Price"
```

### "Failed to import property"
Check the error message - common issues:
- Price must be > 0
- Bedrooms/Bathrooms must be >= 0
- EPC must be A-G
- Tenure must be "Freehold" or "Leasehold"
- Year built must be 1800-2025

---

## After Import

### Check Supabase:
https://supabase.com/dashboard/project/ihbveuhvckvqnhjzanzc/editor

Click "properties" table to see your imported properties.

### Check the App:

1. Open your Vercel URL
2. Create a buyer account
3. Properties should appear in the swipe deck!

---

## Need to Re-import?

To clear and re-import:

1. **Delete existing properties** in Supabase:
   ```sql
   DELETE FROM properties;
   ```

2. **Run import again**:
   ```bash
   node import-properties.js
   ```

---

## Column Name Mapping

The script automatically maps common column name variations:

| Your Column | Maps To |
|-------------|---------|
| Street, Address | street |
| City | city |
| Postcode, PostCode | postcode |
| Price | price |
| Bedrooms, Beds | bedrooms |
| Bathrooms, Baths | bathrooms |
| Type, PropertyType | property_type |
| SquareFootage, SqFt | square_footage |
| YearBuilt, Year | year_built |
| Description | description |
| EPC | epc_rating |
| Tenure | tenure |

**Don't match exactly?** Just edit `import-properties.js` to match your column names!

---

## Quick Start Checklist

- [ ] XLSX file saved as `properties.xlsx`
- [ ] File placed in project root
- [ ] Columns have headers (Street, City, Price, etc.)
- [ ] Run: `node import-properties.js`
- [ ] Check Supabase for imported properties
- [ ] Test in app as buyer

---

## Questions?

Common scenarios:

**"My columns are in a different language"**
→ Edit `import-properties.js` line ~60 to map your column names

**"I don't have some columns"**
→ That's OK! Script uses sensible defaults

**"I want to add images in bulk"**
→ Let me know and I'll create an image update script

**"Properties aren't showing in the app"**
→ Check browser console for errors
→ Verify properties table has data in Supabase
→ Make sure Vercel has environment variables set
