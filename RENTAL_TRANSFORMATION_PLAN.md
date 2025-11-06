# Rental Platform Transformation - Comprehensive Implementation Plan

## Executive Summary

**Objective:** Transform GetOn from a property purchasing platform into a rental property matching platform with bidirectional rating systems.

**Core Changes:**
- **Buyers → Renters** (terminology, data model, workflow)
- **Vendors → Landlords** (terminology, profiles, requirements)
- **Purchase → Rental** (pricing model from £100k-500k to £500-2000/month)
- **Viewings → Tenancy Applications** (process workflow)
- **Add Rating System** (renters rate landlords, landlords rate renters, bidirectional trust)

---

## Phase 1: Data Model & Type System Transformation

### 1.1 Update Core Type Definitions ([src/types/index.ts](src/types/index.ts))

**Changes Required:**

```typescript
// RENAME: UserType
export type UserType = 'landlord' | 'renter'; // was 'vendor' | 'buyer'

// REMOVE (purchase-specific):
export type Tenure = 'Freehold' | 'Leasehold' | 'Shared Ownership';
export type BuyerType = 'First Time Buyer' | 'Nothing To Sell' | ...;
export type PurchaseType = 'Mortgage' | 'Cash' | 'Loan' | 'Cash on Completion';
export type LookingFor = 'Family' | 'Investor';

// ADD (rental-specific):
export type RenterType =
  | 'Student'
  | 'Young Professional'
  | 'Family'
  | 'Couple'
  | 'Professional Sharers'
  | 'Retired';

export type EmploymentStatus =
  | 'Employed Full-Time'
  | 'Employed Part-Time'
  | 'Self-Employed'
  | 'Student'
  | 'Retired'
  | 'Unemployed';

export type PetsPreference =
  | 'No Pets'
  | 'Cat Friendly'
  | 'Dog Friendly'
  | 'Pets Considered';

export type FurnishingType =
  | 'Furnished'
  | 'Part Furnished'
  | 'Unfurnished';

export type LeaseDuration =
  | '6 Months'
  | '12 Months'
  | '18 Months'
  | '24 Months'
  | 'Flexible';

export type TenancyType =
  | 'AST' // Assured Shorthold Tenancy
  | 'Company Let'
  | 'Student Let';

// ADD: Rating System Types
export type RatingCategory =
  | 'communication'
  | 'cleanliness'
  | 'reliability'
  | 'property_condition'
  | 'respect_for_property';

export interface Rating {
  id: string;
  matchId: string;
  fromUserId: string;
  fromUserType: UserType;
  toUserId: string;
  toUserType: UserType;
  propertyId: string;
  overallScore: number; // 1-5
  categoryScores: {
    communication: number;
    cleanliness: number;
    reliability: number;
    property_condition?: number; // landlord rating only
    respect_for_property?: number; // renter rating only
  };
  review: string;
  wouldRecommend: boolean;
  tenancyStartDate: Date;
  tenancyEndDate: Date;
  isVerified: boolean; // verified tenancy completed
  createdAt: Date;
  reportedAt?: Date; // if flagged as inappropriate
}

export interface UserRatingsSummary {
  userId: string;
  userType: UserType;
  averageOverallScore: number;
  totalRatings: number;
  averageCategoryScores: {
    communication: number;
    cleanliness: number;
    reliability: number;
    property_condition?: number;
    respect_for_property?: number;
  };
  wouldRecommendPercentage: number;
  verifiedTenancies: number;
}

// UPDATE: Property interface
export interface Property {
  id: string;
  address: {
    street: string;
    city: string;
    postcode: string;
    council: string;
  };
  rentPcm: number; // CHANGED from 'price: number'
  deposit: number; // NEW - typically 5 weeks rent
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  images: string[];
  description: string;
  epcRating: EPCRating;
  furnishing: FurnishingType; // NEW
  availableFrom: string; // NEW - date string
  minLeaseDuration: LeaseDuration; // NEW
  maxOccupants: number; // NEW
  petsAllowed: PetsPreference; // NEW
  features: string[];
  bills: {
    councilTaxBand: string; // NEW
    gasElectricIncluded: boolean; // NEW
    waterIncluded: boolean; // NEW
    internetIncluded: boolean; // NEW
  };
  tenancyType: TenancyType; // NEW
  listingDate: string;
  landlordId: string; // CHANGED from 'vendorId'
  isAvailable: boolean; // NEW
}

// UPDATE: RenterProfile (was BuyerProfile)
export interface RenterProfile {
  id: string;
  situation: 'Single' | 'Couple' | 'Family' | 'Professional Sharers'; // UPDATED
  names: string;
  ages: string;
  localArea: LocalArea;
  renterType: RenterType; // CHANGED from buyerType
  employmentStatus: EmploymentStatus; // CHANGED from purchaseType
  monthlyIncome: number; // NEW - for affordability checks
  hasPets: boolean; // NEW
  petDetails?: string; // NEW
  smokingStatus: 'Non-Smoker' | 'Smoker' | 'Vaper'; // NEW
  hasGuarantor: boolean; // NEW
  preferredMoveInDate: Date; // NEW
  currentRentalSituation:
    | 'Living with Parents'
    | 'Currently Renting'
    | 'Homeowner'
    | 'Student Accommodation'; // NEW
  hasRentalHistory: boolean; // NEW
  previousLandlordReference: boolean; // NEW
  createdAt: Date;
  isComplete: boolean;
  ratingsSummary?: UserRatingsSummary; // NEW
}

// UPDATE: LandlordProfile (was VendorProfile)
export interface LandlordProfile {
  id: string;
  names: string;
  propertyType: PropertyType;
  furnishingPreference: FurnishingType; // CHANGED from lookingFor
  preferredTenantType: RenterType[]; // CHANGED from preferredPurchaseType
  petsPolicy: PetsPreference; // NEW
  minTenancyLength: LeaseDuration; // NEW
  isRegisteredLandlord: boolean; // NEW - legally required in some areas
  depositScheme: string; // NEW - DPS, MyDeposits, TDS
  estateAgentLink: string;
  propertyId?: string;
  createdAt: Date;
  isComplete: boolean;
  ratingsSummary?: UserRatingsSummary; // NEW
}

// UPDATE: Match interface
export interface Match {
  id: string;
  propertyId: string;
  property: Property;
  landlordId: string; // CHANGED from vendorId
  landlordName: string; // CHANGED from vendorName
  renterId: string; // CHANGED from buyerId
  renterName: string; // CHANGED from buyerName
  renterProfile?: RenterProfile; // CHANGED from buyerProfile
  timestamp: string;
  messages: Message[];
  lastMessageAt?: string;
  unreadCount: number;
  viewingPreference?: ViewingPreference;
  hasViewingScheduled: boolean;
  confirmedViewingDate?: Date;

  // NEW rental-specific fields
  applicationStatus:
    | 'pending'
    | 'viewing_requested'
    | 'viewing_completed'
    | 'application_submitted'
    | 'referencing'
    | 'offer_made'
    | 'offer_accepted'
    | 'tenancy_signed'
    | 'declined'
    | 'withdrawn';
  applicationSubmittedAt?: Date;
  tenancyStartDate?: Date;
  tenancyEndDate?: Date;
  tenancyCompletedAt?: Date;
  canRate: boolean; // true if tenancy completed or declined after viewing
  hasRenterRated: boolean; // NEW
  hasLandlordRated: boolean; // NEW
  renterRatingId?: string; // NEW
  landlordRatingId?: string; // NEW
}

// UPDATE: UserPreferences
export interface UserPreferences {
  locations: string[];
  priceRange: {
    min: number; // £500
    max: number; // £2000
  };
  bedrooms: {
    min: number;
    max: number;
  };
  propertyTypes: PropertyType[];
  furnishing: FurnishingType[]; // NEW
  petsRequired: boolean; // NEW
  mustHaveGarden: boolean;
  mustHaveParking: boolean;
  minMoveInDate?: Date; // NEW
  maxCommuteTo?: string; // NEW - location for commute calculations
}

// UPDATE: ViewingPreference
export interface ViewingPreference {
  id: string;
  matchId: string;
  renterId: string; // CHANGED from buyerId
  landlordId: string; // CHANGED from vendorId
  propertyId: string;
  preferredTimes: ViewingTimeSlot[];
  specificDateTime?: Date;
  flexibility: 'Flexible' | 'Specific' | 'ASAP';
  additionalNotes?: string;
  requiresVirtualViewing: boolean; // NEW - for remote renters
  status: 'pending' | 'confirmed' | 'declined' | 'rescheduled' | 'completed'; // ADDED 'completed'
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date; // NEW
}
```

**Implementation Strategy:**
1. Create new types alongside existing ones (for migration safety)
2. Update all imports across codebase to use new type names
3. Add database migration SQL for new columns
4. Keep old types temporarily with `@deprecated` JSDoc comments
5. Remove old types after full migration

---

## Phase 2: Database Schema Updates

### 2.1 Supabase Schema Migration SQL

**Create new migration file:** `supabase-rental-migration.sql`

```sql
-- =====================================================
-- RENTAL PLATFORM MIGRATION
-- Transforms purchasing platform to rental platform
-- =====================================================

-- =====================================================
-- UPDATE PROFILES TABLES
-- =====================================================

-- Update vendor_profiles to landlord_profiles
ALTER TABLE vendor_profiles RENAME TO landlord_profiles;
ALTER TABLE landlord_profiles RENAME COLUMN property_type TO property_type;
ALTER TABLE landlord_profiles RENAME COLUMN looking_for TO furnishing_preference;
ALTER TABLE landlord_profiles RENAME COLUMN preferred_purchase_type TO preferred_tenant_types;
ALTER TABLE landlord_profiles ADD COLUMN pets_policy TEXT DEFAULT 'No Pets';
ALTER TABLE landlord_profiles ADD COLUMN min_tenancy_length TEXT DEFAULT '12 Months';
ALTER TABLE landlord_profiles ADD COLUMN is_registered_landlord BOOLEAN DEFAULT false;
ALTER TABLE landlord_profiles ADD COLUMN deposit_scheme TEXT;
ALTER TABLE landlord_profiles ADD COLUMN average_rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE landlord_profiles ADD COLUMN total_ratings INTEGER DEFAULT 0;

-- Update buyer_profiles to renter_profiles
ALTER TABLE buyer_profiles RENAME TO renter_profiles;
ALTER TABLE renter_profiles RENAME COLUMN buyer_type TO renter_type;
ALTER TABLE renter_profiles RENAME COLUMN purchase_type TO employment_status;
ALTER TABLE renter_profiles ADD COLUMN monthly_income INTEGER;
ALTER TABLE renter_profiles ADD COLUMN has_pets BOOLEAN DEFAULT false;
ALTER TABLE renter_profiles ADD COLUMN pet_details TEXT;
ALTER TABLE renter_profiles ADD COLUMN smoking_status TEXT DEFAULT 'Non-Smoker';
ALTER TABLE renter_profiles ADD COLUMN has_guarantor BOOLEAN DEFAULT false;
ALTER TABLE renter_profiles ADD COLUMN preferred_move_in_date DATE;
ALTER TABLE renter_profiles ADD COLUMN current_rental_situation TEXT;
ALTER TABLE renter_profiles ADD COLUMN has_rental_history BOOLEAN DEFAULT false;
ALTER TABLE renter_profiles ADD COLUMN previous_landlord_reference BOOLEAN DEFAULT false;
ALTER TABLE renter_profiles ADD COLUMN average_rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE renter_profiles ADD COLUMN total_ratings INTEGER DEFAULT 0;

-- =====================================================
-- UPDATE PROPERTIES TABLE
-- =====================================================

ALTER TABLE properties RENAME COLUMN price TO rent_pcm;
ALTER TABLE properties RENAME COLUMN vendor_id TO landlord_id;
ALTER TABLE properties ADD COLUMN deposit INTEGER; -- typically 5 weeks rent
ALTER TABLE properties ADD COLUMN furnishing TEXT NOT NULL DEFAULT 'Unfurnished';
ALTER TABLE properties ADD COLUMN available_from DATE DEFAULT CURRENT_DATE;
ALTER TABLE properties ADD COLUMN min_lease_duration TEXT DEFAULT '12 Months';
ALTER TABLE properties ADD COLUMN max_occupants INTEGER DEFAULT 2;
ALTER TABLE properties ADD COLUMN pets_allowed TEXT DEFAULT 'No Pets';
ALTER TABLE properties ADD COLUMN council_tax_band TEXT;
ALTER TABLE properties ADD COLUMN gas_electric_included BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN water_included BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN internet_included BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN tenancy_type TEXT DEFAULT 'AST';
ALTER TABLE properties ADD COLUMN is_available BOOLEAN DEFAULT true;
ALTER TABLE properties DROP COLUMN tenure; -- not relevant for rentals
ALTER TABLE properties DROP COLUMN square_footage; -- less critical for rentals

-- Update existing property data (set deposits to 5 weeks rent)
UPDATE properties
SET deposit = ROUND(rent_pcm * 1.25);

-- =====================================================
-- UPDATE MATCHES TABLE
-- =====================================================

ALTER TABLE matches RENAME COLUMN vendor_id TO landlord_id;
ALTER TABLE matches RENAME COLUMN buyer_id TO renter_id;
ALTER TABLE matches RENAME COLUMN buyer_name TO renter_name;
ALTER TABLE matches RENAME COLUMN buyer_profile TO renter_profile;
ALTER TABLE matches ADD COLUMN application_status TEXT DEFAULT 'pending';
ALTER TABLE matches ADD COLUMN application_submitted_at TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN tenancy_start_date DATE;
ALTER TABLE matches ADD COLUMN tenancy_end_date DATE;
ALTER TABLE matches ADD COLUMN tenancy_completed_at TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN can_rate BOOLEAN DEFAULT false;
ALTER TABLE matches ADD COLUMN has_renter_rated BOOLEAN DEFAULT false;
ALTER TABLE matches ADD COLUMN has_landlord_rated BOOLEAN DEFAULT false;
ALTER TABLE matches ADD COLUMN renter_rating_id TEXT;
ALTER TABLE matches ADD COLUMN landlord_rating_id TEXT;

-- =====================================================
-- CREATE RATINGS TABLE
-- =====================================================

CREATE TABLE ratings (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    from_user_type TEXT NOT NULL CHECK (from_user_type IN ('landlord', 'renter')),
    to_user_id TEXT NOT NULL,
    to_user_type TEXT NOT NULL CHECK (to_user_type IN ('landlord', 'renter')),
    property_id TEXT NOT NULL,

    -- Overall rating
    overall_score INTEGER NOT NULL CHECK (overall_score >= 1 AND overall_score <= 5),

    -- Category scores
    communication_score INTEGER NOT NULL CHECK (communication_score >= 1 AND communication_score <= 5),
    cleanliness_score INTEGER NOT NULL CHECK (cleanliness_score >= 1 AND cleanliness_score <= 5),
    reliability_score INTEGER NOT NULL CHECK (reliability_score >= 1 AND reliability_score <= 5),
    property_condition_score INTEGER CHECK (property_condition_score >= 1 AND property_condition_score <= 5), -- landlord only
    respect_for_property_score INTEGER CHECK (respect_for_property_score >= 1 AND respect_for_property_score <= 5), -- renter only

    -- Review text
    review TEXT NOT NULL CHECK (LENGTH(review) >= 50 AND LENGTH(review) <= 1000),
    would_recommend BOOLEAN NOT NULL,

    -- Tenancy info
    tenancy_start_date DATE NOT NULL,
    tenancy_end_date DATE NOT NULL,
    is_verified BOOLEAN DEFAULT false, -- admin verified this was a real tenancy

    -- Moderation
    reported_at TIMESTAMPTZ,
    report_reason TEXT,
    is_hidden BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate ratings
    UNIQUE(match_id, from_user_id)
);

-- Indexes for ratings
CREATE INDEX idx_ratings_to_user ON ratings(to_user_id, to_user_type);
CREATE INDEX idx_ratings_from_user ON ratings(from_user_id, from_user_type);
CREATE INDEX idx_ratings_property ON ratings(property_id);
CREATE INDEX idx_ratings_verified ON ratings(is_verified) WHERE is_verified = true;

-- =====================================================
-- CREATE RATING AGGREGATES MATERIALIZED VIEW
-- =====================================================

CREATE MATERIALIZED VIEW user_ratings_summary AS
SELECT
    to_user_id as user_id,
    to_user_type as user_type,
    COUNT(*) as total_ratings,
    AVG(overall_score) as average_overall_score,
    AVG(communication_score) as average_communication,
    AVG(cleanliness_score) as average_cleanliness,
    AVG(reliability_score) as average_reliability,
    AVG(property_condition_score) as average_property_condition,
    AVG(respect_for_property_score) as average_respect_for_property,
    ROUND(100.0 * SUM(CASE WHEN would_recommend THEN 1 ELSE 0 END) / COUNT(*), 1) as would_recommend_percentage,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_tenancies
FROM ratings
WHERE is_hidden = false
GROUP BY to_user_id, to_user_type;

-- Index on materialized view
CREATE UNIQUE INDEX idx_user_ratings_summary ON user_ratings_summary(user_id, user_type);

-- Refresh function (call after new rating added)
CREATE OR REPLACE FUNCTION refresh_ratings_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_ratings_summary;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES (Production-ready)
-- =====================================================

-- Ratings: Users can read all ratings for other users
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all non-hidden ratings"
ON ratings FOR SELECT
USING (is_hidden = false);

CREATE POLICY "Users can create ratings for their own matches"
ON ratings FOR INSERT
WITH CHECK (
    from_user_id = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM matches
        WHERE id = match_id
        AND (renter_id = auth.uid()::text OR landlord_id = auth.uid()::text)
        AND can_rate = true
    )
);

-- Prevent users from editing ratings after creation (immutability)
CREATE POLICY "Ratings cannot be updated"
ON ratings FOR UPDATE
USING (false);

-- Only admins can delete ratings
CREATE POLICY "Only admins can delete ratings"
ON ratings FOR DELETE
USING (false); -- Require admin role check in application layer

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update rating aggregates after insert
CREATE OR REPLACE FUNCTION update_user_rating_aggregate()
RETURNS TRIGGER AS $$
BEGIN
    -- Update renter or landlord profile aggregate rating
    IF NEW.to_user_type = 'renter' THEN
        UPDATE renter_profiles
        SET
            average_rating = (
                SELECT AVG(overall_score)
                FROM ratings
                WHERE to_user_id = NEW.to_user_id
                AND to_user_type = 'renter'
                AND is_hidden = false
            ),
            total_ratings = (
                SELECT COUNT(*)
                FROM ratings
                WHERE to_user_id = NEW.to_user_id
                AND to_user_type = 'renter'
                AND is_hidden = false
            )
        WHERE id = NEW.to_user_id;
    ELSIF NEW.to_user_type = 'landlord' THEN
        UPDATE landlord_profiles
        SET
            average_rating = (
                SELECT AVG(overall_score)
                FROM ratings
                WHERE to_user_id = NEW.to_user_id
                AND to_user_type = 'landlord'
                AND is_hidden = false
            ),
            total_ratings = (
                SELECT COUNT(*)
                FROM ratings
                WHERE to_user_id = NEW.to_user_id
                AND to_user_type = 'landlord'
                AND is_hidden = false
            )
        WHERE id = NEW.to_user_id;
    END IF;

    -- Mark match as rated
    IF NEW.from_user_type = 'renter' THEN
        UPDATE matches
        SET has_renter_rated = true, renter_rating_id = NEW.id
        WHERE id = NEW.match_id;
    ELSIF NEW.from_user_type = 'landlord' THEN
        UPDATE matches
        SET has_landlord_rated = true, landlord_rating_id = NEW.id
        WHERE id = NEW.match_id;
    END IF;

    -- Refresh materialized view
    PERFORM refresh_ratings_summary();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on ratings insert
CREATE TRIGGER trigger_update_rating_aggregate
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating_aggregate();

-- Function to mark match as ratable after viewing completed
CREATE OR REPLACE FUNCTION mark_match_ratable_after_viewing()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE matches
        SET can_rate = true
        WHERE id = NEW.match_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger when viewing status changes to completed
-- (Assuming viewing_preferences table exists or create one)
-- This would need adjustment based on current viewing storage

COMMENT ON TABLE ratings IS 'Bidirectional rating system for renters and landlords after tenancy';
COMMENT ON TABLE landlord_profiles IS 'Landlord profiles (formerly vendor_profiles)';
COMMENT ON TABLE renter_profiles IS 'Renter profiles (formerly buyer_profiles)';
```

---

## Phase 3: Constants & Configuration Updates

### 3.1 Update [src/utils/constants.ts](src/utils/constants.ts)

```typescript
/**
 * Rental price range options (monthly rent in GBP)
 */
export const RENT_RANGES = [
  { label: '£400', value: 400 },
  { label: '£500', value: 500 },
  { label: '£600', value: 600 },
  { label: '£700', value: 700 },
  { label: '£800', value: 800 },
  { label: '£900', value: 900 },
  { label: '£1,000', value: 1000 },
  { label: '£1,200', value: 1200 },
  { label: '£1,500', value: 1500 },
  { label: '£1,800', value: 1800 },
  { label: '£2,000', value: 2000 },
  { label: '£2,500+', value: 2500 },
] as const;

/**
 * Renter types available
 */
export const RENTER_TYPES = [
  'Student',
  'Young Professional',
  'Family',
  'Couple',
  'Professional Sharers',
  'Retired',
] as const;

/**
 * Employment status options
 */
export const EMPLOYMENT_STATUSES = [
  'Employed Full-Time',
  'Employed Part-Time',
  'Self-Employed',
  'Student',
  'Retired',
  'Unemployed',
] as const;

/**
 * Pets preferences
 */
export const PETS_PREFERENCES = [
  'No Pets',
  'Cat Friendly',
  'Dog Friendly',
  'Pets Considered',
] as const;

/**
 * Furnishing types
 */
export const FURNISHING_TYPES = [
  'Furnished',
  'Part Furnished',
  'Unfurnished',
] as const;

/**
 * Lease duration options
 */
export const LEASE_DURATIONS = [
  '6 Months',
  '12 Months',
  '18 Months',
  '24 Months',
  'Flexible',
] as const;

/**
 * Rating categories for renters rating landlords
 */
export const LANDLORD_RATING_CATEGORIES = [
  { key: 'communication', label: 'Communication', description: 'Responsiveness and clarity' },
  { key: 'property_condition', label: 'Property Condition', description: 'Maintenance and upkeep' },
  { key: 'reliability', label: 'Reliability', description: 'Kept promises and commitments' },
  { key: 'respect', label: 'Respect for Privacy', description: 'Notice for inspections' },
] as const;

/**
 * Rating categories for landlords rating renters
 */
export const RENTER_RATING_CATEGORIES = [
  { key: 'communication', label: 'Communication', description: 'Responsiveness and clarity' },
  { key: 'cleanliness', label: 'Cleanliness', description: 'Property maintenance' },
  { key: 'reliability', label: 'Reliability', description: 'Rent payments and compliance' },
  { key: 'respect_for_property', label: 'Respect for Property', description: 'Care and damage prevention' },
] as const;

/**
 * Match probability for demo (will be replaced with landlord approval)
 */
export const MATCH_PROBABILITY = 0.3; // 30% chance

/**
 * Message templates for simulated landlord responses
 */
export const LANDLORD_MESSAGE_TEMPLATES = [
  "Hi! Thanks for your interest in this property. I'd be happy to answer any questions you have.",
  "Hello! This property is still available. Would you like to arrange a viewing?",
  "Thanks for reaching out! The property has some great features. What would you like to know?",
  "Hi there! I'm pleased you're interested. When would be a good time for a viewing?",
  "Hello! Yes, this property is available. Feel free to ask any questions about the tenancy.",
] as const;

/**
 * Default rental preferences
 */
export const DEFAULT_RENTAL_PREFERENCES = {
  locations: [] as string[],
  priceRange: {
    min: 500,
    max: 1500,
  },
  bedrooms: {
    min: 1,
    max: 3,
  },
  propertyTypes: [] as PropertyType[],
  furnishing: [] as FurnishingType[],
  petsRequired: false,
  mustHaveGarden: false,
  mustHaveParking: false,
};

/**
 * LocalStorage keys (update naming)
 */
export const STORAGE_KEYS = {
  USER: 'geton_user',
  PREFERENCES: 'geton_rental_preferences',
  LIKED_PROPERTIES: 'geton_liked',
  MATCHES: 'geton_matches',
  MESSAGES: 'geton_messages',
  SWIPE_HISTORY: 'geton_swipe_history',
  RATINGS: 'geton_ratings',
} as const;
```

---

## Phase 4: Component & Page Updates

### 4.1 Renter Onboarding ([src/pages/RenterOnboarding.tsx](src/pages/RenterOnboarding.tsx))

**Replace [BuyerOnboarding.tsx](src/pages/BuyerOnboarding.tsx) with new file**

Key Changes:
1. Rename component from `BuyerOnboarding` to `RenterOnboarding`
2. Update form data interface to match `RenterProfile`
3. Replace "buyer type" step with "employment status"
4. Replace "purchase type" step with "renter type & pets"
5. Add monthly income field (with validation)
6. Add pets preference questions
7. Add guarantor question
8. Update all UI copy from purchasing to renting terminology

**New Steps:**
- Step 0: Personal Info (situation, names, ages)
- Step 1: Location (same as before)
- Step 2: Employment Status (Employed/Student/Self-Employed/etc.)
- Step 3: Renter Type & Pets (Student/Professional/Family + pets questions)
- Step 4: Income & Move-in Date (monthly income, preferred move-in, guarantor)
- Step 5: Review & Confirm

### 4.2 Landlord Onboarding ([src/pages/LandlordOnboarding.tsx](src/pages/LandlordOnboarding.tsx))

**Replace [VendorOnboarding.tsx](src/pages/VendorOnboarding.tsx)**

Key Changes:
1. Rename from `VendorOnboarding` to `LandlordOnboarding`
2. Update form to match `LandlordProfile`
3. Replace "looking for" with "furnishing preference"
4. Replace "purchase preference" with "preferred tenant types"
5. Add pets policy selection
6. Add minimum tenancy length
7. Add deposit scheme registration question

**New Steps:**
- Step 0: Personal Info (names)
- Step 1: Property Type (same as before)
- Step 2: Furnishing & Pets Policy (Furnished/Unfurnished + pets allowed)
- Step 3: Preferred Tenant Types (Student/Professional/Family - multi-select)
- Step 4: Tenancy Terms (min lease duration, deposit scheme)
- Step 5: Estate Agent Link (optional)
- Step 6: Review & Confirm

### 4.3 SwipePage - Renter Interface

**Update [src/pages/SwipePage.tsx](src/pages/SwipePage.tsx)**

Changes:
1. Update terminology in UI (buyer → renter, vendor → landlord)
2. Display monthly rent instead of purchase price
3. Show deposit amount (5 weeks rent)
4. Show furnishing status badge
5. Show availability date
6. Show pets policy
7. Show bills included information
8. Update match celebration copy to rental language
9. Update viewing modal copy

### 4.4 LandlordDashboard

**Replace [src/pages/VendorDashboard.tsx](src/pages/VendorDashboard.tsx) with `LandlordDashboard.tsx`**

Changes:
1. Rename component and all references
2. Update UI copy (vendor → landlord, buyer → renter)
3. Show monthly rent instead of price
4. Display renter employment status instead of buyer type
5. Add rating summary display (average rating, total ratings)
6. Add "Rate Renter" buttons for completed tenancies
7. Update stats to show "Applications" instead of "Interested Buyers"

### 4.5 Property Card Components

**Update [src/components/molecules/PropertyCard.tsx](src/components/molecules/PropertyCard.tsx)**

Changes:
1. Display `rentPcm` with "£X pcm" format instead of purchase price
2. Add deposit display "Deposit: £X"
3. Add furnishing badge
4. Add availability date badge
5. Add pets policy icon
6. Update truncation and layout for rental-specific info

### 4.6 Property Form

**Update [src/components/organisms/PropertyForm.tsx](src/components/organisms/PropertyForm.tsx)**

Changes:
1. Replace "Price" field with "Monthly Rent (£ pcm)"
2. Add "Deposit (£)" field (default to 5 weeks rent calculation)
3. Replace tenure field with furnishing dropdown
4. Add "Available From" date picker
5. Add "Minimum Lease Duration" dropdown
6. Add "Maximum Occupants" number field
7. Add "Pets Policy" dropdown
8. Add bills included checkboxes (Council Tax Band, Gas/Electric, Water, Internet)
9. Add "Tenancy Type" dropdown (AST/Company Let/Student Let)
10. Remove purchase-specific fields (tenure, square footage less critical)

---

## Phase 5: Rating System Implementation

### 5.1 Create Rating Components

**New File: [src/components/organisms/RatingModal.tsx](src/components/organisms/RatingModal.tsx)**

```typescript
interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  userType: 'renter' | 'landlord';
  onSubmitRating: (rating: Partial<Rating>) => Promise<void>;
}

/**
 * Modal for submitting ratings after tenancy
 * Shows category sliders, overall score, review textarea
 * Different categories for renter vs landlord
 */
export function RatingModal({ isOpen, onClose, match, userType, onSubmitRating }: RatingModalProps) {
  const [overallScore, setOverallScore] = useState(0);
  const [categoryScores, setCategoryScores] = useState({...});
  const [review, setReview] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const categories = userType === 'renter'
    ? LANDLORD_RATING_CATEGORIES
    : RENTER_RATING_CATEGORIES;

  const validateRating = (): boolean => {
    const newErrors: string[] = [];

    if (overallScore < 1) {
      newErrors.push('Please select an overall rating');
    }

    Object.values(categoryScores).forEach(score => {
      if (score < 1) {
        newErrors.push('Please rate all categories');
        return;
      }
    });

    if (review.trim().length < 50) {
      newErrors.push('Review must be at least 50 characters');
    }

    if (review.trim().length > 1000) {
      newErrors.push('Review must be less than 1000 characters');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateRating()) return;

    setIsSubmitting(true);

    try {
      await onSubmitRating({
        matchId: match.id,
        fromUserId: userType === 'renter' ? match.renterId : match.landlordId,
        fromUserType: userType,
        toUserId: userType === 'renter' ? match.landlordId : match.renterId,
        toUserType: userType === 'renter' ? 'landlord' : 'renter',
        propertyId: match.propertyId,
        overallScore,
        categoryScores,
        review: review.trim(),
        wouldRecommend,
        tenancyStartDate: match.tenancyStartDate!,
        tenancyEndDate: match.tenancyEndDate!,
      });

      onClose();
    } catch (error) {
      setErrors(['Failed to submit rating. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          Rate Your {userType === 'renter' ? 'Landlord' : 'Renter'}
        </h2>

        <div className="mb-6">
          <PropertyCard property={match.property} compact />
          <div className="mt-2 text-sm text-neutral-600">
            Tenancy: {formatDate(match.tenancyStartDate)} - {formatDate(match.tenancyEndDate)}
          </div>
        </div>

        {/* Overall Rating Stars */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2">Overall Rating</label>
          <StarRating value={overallScore} onChange={setOverallScore} size="large" />
        </div>

        {/* Category Ratings */}
        <div className="space-y-4 mb-6">
          {categories.map((category) => (
            <div key={category.key}>
              <label className="block font-medium mb-1">{category.label}</label>
              <p className="text-sm text-neutral-600 mb-2">{category.description}</p>
              <StarRating
                value={categoryScores[category.key]}
                onChange={(val) => setCategoryScores({...categoryScores, [category.key]: val})}
              />
            </div>
          ))}
        </div>

        {/* Review Text */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Your Review</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={`Share your experience as a ${userType}...`}
            className="w-full h-32 px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            maxLength={1000}
          />
          <div className="text-sm text-neutral-500 mt-1">
            {review.length}/1000 characters (minimum 50)
          </div>
        </div>

        {/* Would Recommend */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wouldRecommend}
              onChange={(e) => setWouldRecommend(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="font-medium">
              I would recommend this {userType === 'renter' ? 'landlord' : 'renter'} to others
            </span>
          </label>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-xl">
            <ul className="list-disc list-inside text-danger-700 text-sm">
              {errors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-neutral-300 rounded-xl font-semibold hover:bg-neutral-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>

        <p className="text-xs text-neutral-500 mt-4 text-center">
          Your rating will be publicly visible and cannot be edited after submission.
        </p>
      </div>
    </Modal>
  );
}
```

**New Component: [src/components/molecules/StarRating.tsx](src/components/molecules/StarRating.tsx)**

```typescript
interface StarRatingProps {
  value: number; // 0-5
  onChange?: (value: number) => void;
  size?: 'small' | 'medium' | 'large';
  readOnly?: boolean;
}

/**
 * Interactive or display-only star rating component
 * 5-star system with half-star support for display
 */
export function StarRating({ value, onChange, size = 'medium', readOnly = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  const displayValue = hoverValue || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHoverValue(star)}
          onMouseLeave={() => !readOnly && setHoverValue(0)}
          disabled={readOnly}
          className={`${sizeClasses[size]} transition-transform ${
            !readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
          }`}
        >
          <Star
            className={`w-full h-full ${
              star <= displayValue
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-neutral-300'
            }`}
          />
        </button>
      ))}
      {readOnly && (
        <span className="ml-2 text-sm font-medium text-neutral-700">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
```

**New Component: [src/components/molecules/RatingsSummaryCard.tsx](src/components/molecules/RatingsSummaryCard.tsx)**

```typescript
interface RatingsSummaryCardProps {
  summary: UserRatingsSummary;
  userType: 'renter' | 'landlord';
}

/**
 * Display aggregate rating statistics for a user
 * Shows overall score, category breakdown, recommendation %
 */
export function RatingsSummaryCard({ summary, userType }: RatingsSummaryCardProps) {
  if (summary.totalRatings === 0) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-center">
        <p className="text-neutral-600">No ratings yet</p>
      </div>
    );
  }

  const categories = userType === 'landlord'
    ? LANDLORD_RATING_CATEGORIES
    : RENTER_RATING_CATEGORIES;

  return (
    <div className="bg-white border-2 border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl font-bold text-neutral-900">
            {summary.averageOverallScore.toFixed(1)}
          </div>
          <StarRating value={summary.averageOverallScore} readOnly size="small" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">
            {summary.wouldRecommendPercentage}%
          </div>
          <div className="text-xs text-neutral-600">would recommend</div>
        </div>
      </div>

      <div className="text-sm text-neutral-600 mb-4">
        Based on {summary.totalRatings} rating{summary.totalRatings !== 1 ? 's' : ''}
        {summary.verifiedTenancies > 0 && ` (${summary.verifiedTenancies} verified)`}
      </div>

      <div className="space-y-2">
        {categories.map((category) => {
          const score = summary.averageCategoryScores[category.key];
          if (!score) return null;

          return (
            <div key={category.key} className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">{category.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
                <span className="font-medium text-neutral-900 w-8">
                  {score.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 5.2 Integrate Ratings into Matches

**Update [src/pages/MatchesPage.tsx](src/pages/MatchesPage.tsx)**

Add:
1. Display ratings summary for matched landlord/renter
2. Show "Rate This Landlord/Renter" button for completed tenancies
3. Display rating badges on match cards
4. Filter matches by "Can Rate" status

**Update Match Cards:**
- Show rating stars and count for other party
- Show "Rated" badge if already rated
- Show "Rate Now" CTA if eligible

---

## Phase 6: Store & State Management Updates

### 6.1 Update useAppStore

**File: [src/hooks/useAppStore.ts](src/hooks/useAppStore.ts)**

Changes:
1. Rename all buyer/vendor references to renter/landlord
2. Add rating state and actions
3. Update property price filtering to use rentPcm
4. Add furnishing filtering
5. Add pets filtering
6. Update match logic to support application statuses

**New Actions:**
```typescript
interface AppState {
  // ... existing state
  ratings: Rating[];

  // New rating actions
  submitRating: (rating: Partial<Rating>) => Promise<void>;
  getRatingsForUser: (userId: string, userType: UserType) => Rating[];
  getUserRatingsSummary: (userId: string, userType: UserType) => UserRatingsSummary | null;
  markMatchAsRatable: (matchId: string) => void;

  // Updated actions (rename)
  linkPropertyToLandlord: (propertyId: string, landlordId: string) => void; // was linkPropertyToVendor
}
```

### 6.2 Update useAuthStore

**File: [src/hooks/useAuthStore.ts](src/hooks/useAuthStore.ts)**

Changes:
1. Rename VendorProfile/BuyerProfile types to LandlordProfile/RenterProfile
2. Update storage keys
3. Update login/logout logic for new profile types

### 6.3 Update Storage Layer

**File: [src/lib/storage.ts](src/lib/storage.ts)**

Changes:
1. Rename functions: `saveVendorProfile` → `saveLandlordProfile`
2. Rename functions: `saveBuyerProfile` → `saveRenterProfile`
3. Add rating storage functions:
   - `saveRating(rating: Rating): Promise<Rating>`
   - `getRatingsForUser(userId: string, userType: UserType): Promise<Rating[]>`
   - `getUserRatingsSummary(userId: string, userType: UserType): Promise<UserRatingsSummary>`
4. Update Supabase table name mappings

---

## Phase 7: Formatter & Filter Updates

### 7.1 Update Formatters

**File: [src/utils/formatters.ts](src/utils/formatters.ts)**

Add/Update:
```typescript
/**
 * Format monthly rent with pcm suffix
 */
export const formatRent = (rentPcm: number): string => {
  return `£${rentPcm.toLocaleString()} pcm`;
};

/**
 * Format deposit amount
 */
export const formatDeposit = (deposit: number): string => {
  return `£${deposit.toLocaleString()}`;
};

/**
 * Calculate deposit from monthly rent (typically 5 weeks)
 */
export const calculateDeposit = (rentPcm: number): number => {
  return Math.round((rentPcm * 12 / 52) * 5);
};

/**
 * Format furnishing status with icon
 */
export const formatFurnishing = (furnishing: FurnishingType): string => {
  const icons = {
    'Furnished': '🛋️',
    'Part Furnished': '🪑',
    'Unfurnished': '📦',
  };
  return `${icons[furnishing]} ${furnishing}`;
};

/**
 * Format availability date
 */
export const formatAvailability = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();

  if (date <= now) {
    return 'Available Now';
  }

  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    return 'Available This Week';
  }

  if (diffDays <= 30) {
    return `Available in ${Math.ceil(diffDays / 7)} weeks`;
  }

  return `Available ${date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
};
```

### 7.2 Update Filters

**File: [src/utils/filters.ts](src/utils/filters.ts)**

Update `filterProperties` function:
```typescript
export const filterProperties = (
  properties: Property[],
  preferences: UserPreferences
): Property[] => {
  return properties.filter((property) => {
    // Rent range check (was price range)
    if (property.rentPcm < preferences.priceRange.min ||
        property.rentPcm > preferences.priceRange.max) {
      return false;
    }

    // NEW: Furnishing filter
    if (preferences.furnishing.length > 0 &&
        !preferences.furnishing.includes(property.furnishing)) {
      return false;
    }

    // NEW: Pets filter
    if (preferences.petsRequired &&
        property.petsAllowed === 'No Pets') {
      return false;
    }

    // NEW: Availability filter
    if (preferences.minMoveInDate) {
      const availableDate = new Date(property.availableFrom);
      if (availableDate > preferences.minMoveInDate) {
        return false;
      }
    }

    // ... rest of existing filters (bedrooms, location, property type, etc.)

    return true;
  });
};
```

---

## Phase 8: UI Copy & Language Updates

### 8.1 Global Search & Replace

Perform case-sensitive find/replace across entire codebase:

| Find | Replace |
|------|---------|
| `Buyer` | `Renter` |
| `buyer` | `renter` |
| `Vendor` | `Landlord` |
| `vendor` | `landlord` |
| `purchase` | `rent` |
| `Purchase` | `Rent` |
| `Buying` | `Renting` |
| `buying` | `renting` |
| `Sell` | `Let` |
| `sell` | `let` |
| `Seller` | `Landlord` |
| `seller` | `landlord` |
| `Looking to Buy` | `Looking to Rent` |
| `Interested buyers` | `Interested renters` |

**IMPORTANT:** Manual review required after replace to ensure context is correct (e.g., don't replace "buyer" in external URLs or comments about old code).

### 8.2 UI String Updates

**Welcome Screen:**
- "Find Your Perfect Home" → "Find Your Perfect Rental"
- "Swipe through UK properties" → "Swipe through UK rental properties"

**Role Selection:**
- "Looking to Buy" → "Looking to Rent"
- "Find your dream home" → "Find your ideal rental property"
- "Vendor" → "Landlord"
- "Sell your property" → "Let your property"

**Onboarding:**
- "What's your purchasing situation?" → "What's your rental situation?"
- "First Time Buyer" → "First Time Renter"
- "Purchase Type" → "Employment Status"

**Swipe Page:**
- "Properties Viewed" → "Properties Viewed"
- "Like" → "Like" (unchanged)
- "Pass" → "Pass" (unchanged)
- "It's a Match!" → "It's a Match!" (unchanged)

**Property Details:**
- "Price: £XXX,XXX" → "Rent: £XXX pcm"
- "Tenure:" → "Furnishing:"
- Add "Deposit:" field
- Add "Available:" field
- Add "Pets Policy:" field

**Dashboard:**
- "Interested Buyers" → "Interested Renters"
- "Create Property Listing" → "Create Rental Listing"
- "Purchase Type" → "Employment Status"

**Matches Page:**
- "Your Matches" → "Your Matches" (unchanged)
- "Start chatting with buyers" → "Start chatting with renters"
- "Schedule a viewing" → "Schedule a viewing" (unchanged)

---

## Phase 9: Property Data Migration

### 9.1 Update Existing Properties Script

**Create: `migrate-properties-to-rental.js`**

```javascript
/**
 * Migrate existing purchase properties to rental format
 * Updates prices from purchase (£100k-500k) to rental (£500-2000 pcm)
 */

import { createClient } from '@supabase/supabase-js';

// Conversion: Purchase price to monthly rent (rough approximation)
// £150k house → ~£800 pcm rent
const convertPriceToRent = (purchasePrice) => {
  // Annual rent is roughly 5-6% of property value
  const annualRent = purchasePrice * 0.055;
  const monthlyRent = Math.round(annualRent / 12);

  // Round to nearest £50
  return Math.round(monthlyRent / 50) * 50;
};

const calculateDeposit = (rentPcm) => {
  // 5 weeks rent (standard in UK)
  return Math.round((rentPcm * 12 / 52) * 5);
};

async function migrateProperties() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

  // Get all properties
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*');

  if (error) {
    console.error('Failed to fetch properties:', error);
    return;
  }

  console.log(`Migrating ${properties.length} properties...`);

  for (const property of properties) {
    const rentPcm = convertPriceToRent(property.price);
    const deposit = calculateDeposit(rentPcm);

    const updates = {
      rent_pcm: rentPcm,
      deposit: deposit,
      furnishing: 'Unfurnished', // default
      available_from: property.listing_date,
      min_lease_duration: '12 Months',
      max_occupants: property.bedrooms === 1 ? 2 : property.bedrooms * 2,
      pets_allowed: 'No Pets', // default
      council_tax_band: 'B', // default assumption
      gas_electric_included: false,
      water_included: false,
      internet_included: false,
      tenancy_type: 'AST',
      is_available: true,
    };

    const { error: updateError } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', property.id);

    if (updateError) {
      console.error(`Failed to update property ${property.id}:`, updateError);
    } else {
      console.log(`✓ ${property.address.street}: £${property.price} → £${rentPcm} pcm`);
    }
  }

  console.log('Migration complete!');
}

migrateProperties();
```

### 9.2 Update XLSX Import Script

**Update: `import-with-base64-images.js`**

Changes:
1. Update XLSX column mappings (price → rent_pcm)
2. Add deposit calculation
3. Add furnishing column parsing
4. Add availability date parsing
5. Add pets policy parsing
6. Add bills columns
7. Update table name from `properties` to use new schema

---

## Phase 10: Testing & Validation Plan

### 10.1 Manual Testing Checklist

**Renter Flow:**
- [ ] Create new renter profile (all steps)
- [ ] View property cards with rent/deposit displayed
- [ ] Filter properties by rent range
- [ ] Filter properties by furnishing type
- [ ] Filter properties with pets allowed
- [ ] Swipe right on property
- [ ] Receive match notification (30% probability)
- [ ] Schedule viewing
- [ ] Send messages to landlord
- [ ] View landlord's rating summary
- [ ] Complete tenancy and rate landlord
- [ ] Verify rating appears in landlord's profile

**Landlord Flow:**
- [ ] Create new landlord profile (all steps)
- [ ] Link existing property or create new rental listing
- [ ] Set rental price, deposit, furnishing, pets policy
- [ ] View interested renters
- [ ] See renter employment status and details
- [ ] Confirm viewing
- [ ] Send messages to renter
- [ ] View renter's rating summary (if has history)
- [ ] After tenancy, rate renter
- [ ] Verify rating appears in renter's profile

**Rating System:**
- [ ] Rating modal opens after tenancy complete
- [ ] Cannot submit rating without all required fields
- [ ] Category scores required (1-5 stars each)
- [ ] Overall score required
- [ ] Review text min 50 characters enforced
- [ ] Review text max 1000 characters enforced
- [ ] Rating appears in user's profile immediately
- [ ] Aggregate ratings update correctly
- [ ] Cannot rate same match twice
- [ ] Rating is immutable after submission

**Data Integrity:**
- [ ] All prices converted from purchase to rental
- [ ] Deposits calculated correctly (5 weeks rent)
- [ ] Furnishing defaults set
- [ ] Availability dates set
- [ ] Existing matches updated with new field names
- [ ] No broken foreign key relationships
- [ ] localStorage keys updated and working

### 10.2 Database Validation Queries

```sql
-- Verify all properties have rental data
SELECT COUNT(*) FROM properties WHERE rent_pcm IS NULL OR deposit IS NULL;
-- Should return 0

-- Verify deposit calculations are correct (roughly 5 weeks)
SELECT
  id,
  rent_pcm,
  deposit,
  ROUND((rent_pcm * 12 / 52) * 5) as expected_deposit
FROM properties
WHERE ABS(deposit - ROUND((rent_pcm * 12 / 52) * 5)) > 50;
-- Should return empty (deposits within £50 of expected)

-- Verify all renters have employment status
SELECT COUNT(*) FROM renter_profiles WHERE employment_status IS NULL;
-- Should return 0

-- Verify all landlords have pets policy
SELECT COUNT(*) FROM landlord_profiles WHERE pets_policy IS NULL;
-- Should return 0

-- Verify rating aggregates match actual ratings
SELECT
  r.to_user_id,
  r.to_user_type,
  COUNT(*) as actual_count,
  AVG(r.overall_score) as actual_avg,
  s.total_ratings,
  s.average_overall_score
FROM ratings r
LEFT JOIN user_ratings_summary s ON s.user_id = r.to_user_id AND s.user_type = r.to_user_type
GROUP BY r.to_user_id, r.to_user_type, s.total_ratings, s.average_overall_score
HAVING COUNT(*) != s.total_ratings OR ABS(AVG(r.overall_score) - s.average_overall_score) > 0.1;
-- Should return empty (aggregates match)

-- Verify no orphaned ratings
SELECT COUNT(*) FROM ratings
WHERE match_id NOT IN (SELECT id FROM matches);
-- Should return 0

-- Verify bidirectional rating constraints
SELECT
  match_id,
  COUNT(*) as rating_count
FROM ratings
GROUP BY match_id
HAVING COUNT(*) > 2;
-- Should return empty (max 2 ratings per match: landlord + renter)
```

---

## Phase 11: Deployment & Rollout Strategy

### 11.1 Phased Rollout Plan

**Phase A: Backend Migration (Week 1)**
1. Run database migration SQL on Supabase (test environment first)
2. Verify all tables renamed correctly
3. Run property data migration script
4. Verify data integrity with validation queries
5. Test Supabase storage functions with new table names
6. Backup database before production migration

**Phase B: Frontend Core Updates (Week 2)**
1. Update type definitions
2. Update constants and formatters
3. Update storage layer
4. Update stores (useAppStore, useAuthStore)
5. Test stores in isolation
6. Deploy to preview environment

**Phase C: Component Updates (Week 3)**
1. Update onboarding flows (renter + landlord)
2. Update property cards and forms
3. Update swipe page
4. Update dashboard
5. Test full renter flow end-to-end
6. Test full landlord flow end-to-end

**Phase D: Rating System (Week 4)**
1. Create rating components
2. Integrate into matches page
3. Test rating submission
4. Test rating aggregation
5. Test rating display
6. Verify immutability and validation

**Phase E: Polish & Testing (Week 5)**
1. Global UI copy updates
2. Accessibility testing
3. Mobile responsive testing
4. Performance testing
5. Cross-browser testing
6. User acceptance testing

**Phase F: Production Deployment (Week 6)**
1. Final database backup
2. Run production migration
3. Deploy frontend to Vercel
4. Monitor error logs
5. Check analytics
6. Gather user feedback

### 11.2 Rollback Plan

If critical issues discovered post-deployment:

**Database Rollback:**
```sql
-- Revert table names
ALTER TABLE landlord_profiles RENAME TO vendor_profiles;
ALTER TABLE renter_profiles RENAME TO buyer_profiles;
ALTER TABLE properties RENAME COLUMN rent_pcm TO price;
ALTER TABLE properties RENAME COLUMN landlord_id TO vendor_id;
-- ... (revert all column changes)

-- Drop new tables
DROP TABLE ratings CASCADE;
DROP MATERIALIZED VIEW user_ratings_summary CASCADE;
```

**Frontend Rollback:**
- Revert to previous Vercel deployment (one-click rollback)
- Restore localStorage keys with old names
- Clear user caches

### 11.3 User Communication

**Email to existing users:**
```
Subject: GetOn is now a Rental Platform! 🏡

Hi [Name],

We're excited to announce that GetOn has transformed into a rental property matching platform!

What's Changed:
✓ Monthly rent instead of purchase prices
✓ New renter and landlord profiles
✓ Rating system for trust and transparency
✓ Rental-specific filters (furnishing, pets, bills)

What This Means for You:
- Your existing account data has been migrated
- Please update your profile with rental preferences
- Start swiping on rental properties today!

New Feature: Rating System
After completing a tenancy, you can now rate your landlord or renter. Build your reputation and help others make informed decisions.

Questions? Visit our FAQ or contact support.

Happy renting!
The GetOn Team
```

---

## Phase 12: Documentation Updates

### 12.1 Update README.md

- Replace all purchasing terminology with rental
- Update feature list to include rating system
- Update screenshots with rental UI
- Update setup instructions if changed

### 12.2 Update PROJECT_SUMMARY.md

- Rewrite executive summary for rental platform
- Update all feature descriptions
- Document rating system architecture
- Update roadmap with rental-specific features

### 12.3 Create New Docs

**Create: RATING_SYSTEM.md**
- Explain bidirectional rating system
- Document rating categories
- Explain verification process
- Describe moderation policies
- FAQ about ratings

**Create: RENTAL_TERMINOLOGY.md**
- Glossary of rental terms (AST, PCM, deposit, etc.)
- UK rental law references
- Explanation of deposit schemes
- Tenant rights information

---

## Success Criteria

**Transformation Complete When:**
1. ✅ All database tables migrated and verified
2. ✅ All property prices converted to monthly rent
3. ✅ Renter onboarding flow functional
4. ✅ Landlord onboarding flow functional
5. ✅ Property listings show rental information
6. ✅ Rating system fully functional (submit + view)
7. ✅ All UI copy updated to rental terminology
8. ✅ All existing properties have rental data
9. ✅ Zero TypeScript errors
10. ✅ All manual tests passing
11. ✅ Production deployment successful
12. ✅ User feedback positive

---

## Estimated Effort

**Total Development Time:** 4-6 weeks (1 senior developer)

**Breakdown:**
- Database migration: 3-5 days
- Type system updates: 2-3 days
- Store updates: 3-4 days
- Component updates: 10-12 days
- Rating system: 5-7 days
- Testing & QA: 5-7 days
- Documentation: 2-3 days
- Deployment & monitoring: 2-3 days

**Priority Order:**
1. HIGH: Database migration (blocking for everything)
2. HIGH: Type system (blocking for components)
3. HIGH: Core flows (renter/landlord onboarding)
4. MEDIUM: Rating system (can launch without, add later)
5. MEDIUM: UI polish and copy updates
6. LOW: Documentation updates

---

## Risk Assessment

**High Risk:**
- Data migration errors (mitigate: extensive testing, backups)
- Breaking changes to existing users (mitigate: rollback plan)
- localStorage quota issues with ratings (mitigate: exclude from persist)

**Medium Risk:**
- Rating spam/abuse (mitigate: verification system, moderation)
- Rating disputes (mitigate: clear policies, immutable ratings)
- SEO impact from terminology changes (mitigate: redirects, updated sitemaps)

**Low Risk:**
- UI bugs in new components (mitigate: thorough testing)
- Performance with rating calculations (mitigate: materialized view, caching)

---

## Next Steps After Transformation

**Post-Launch Enhancements:**
1. Add landlord verification badges (registered landlord status)
2. Add renter verification (employment, references, credit check)
3. Add in-app tenancy agreement signing
4. Add rent payment tracking
5. Add maintenance request system
6. Add property inspection scheduling
7. Add landlord insurance information
8. Add dispute resolution workflow
9. Add automatic rating reminders after tenancy ends
10. Add rating response system (landlords/renters can respond to ratings)

---

**End of Transformation Plan**
**Version:** 1.0
**Last Updated:** January 2025
**Status:** Ready for Implementation
