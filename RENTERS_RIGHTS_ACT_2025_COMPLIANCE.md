# Renters' Rights Act 2025 Compliance Addendum

**Status:** Royal Assent received 27 October 2025
**Implementation:** Phased rollout Spring 2026 onwards
**Applies to:** England (Scotland, Wales, Northern Ireland have separate legislation)

---

## Executive Summary

The Renters' Rights Act 2025 fundamentally transforms UK private rental law. This addendum updates the Rental Transformation Plan to ensure full compliance with the new legislation, which affects every aspect of the platform's data model, workflows, and business logic.

---

## Critical Legal Changes Requiring Platform Updates

### 1. Abolition of Fixed-Term ASTs → Mandatory Periodic Tenancies

**Legal Requirement:**
- All tenancies become open-ended periodic tenancies (rolling contracts)
- NO MORE fixed 6/12/18/24-month terms
- Tenants can leave with 2 months' notice at any time
- Landlords CANNOT use Section 21 "no-fault" evictions

**Platform Impact:**

#### ❌ REMOVE from Data Model:
```typescript
// DELETE THIS TYPE - No longer legally valid
export type LeaseDuration =
  | '6 Months'
  | '12 Months'
  | '18 Months'
  | '24 Months'
  | 'Flexible';
```

#### ✅ UPDATE Property Interface:
```typescript
export interface Property {
  // REMOVE:
  // minLeaseDuration: LeaseDuration; ❌

  // ADD:
  tenancyType: 'Periodic'; // Always periodic, no fixed terms allowed
  minimumInitialPeriod?: number; // Optional: landlord preference (e.g., "prefer 6 months minimum")
  noticePeriodDays: 56; // Fixed by law: 2 months = 56 days for tenants

  // ... rest of fields
}
```

#### ✅ UPDATE LandlordProfile:
```typescript
export interface LandlordProfile {
  // REMOVE:
  // minTenancyLength: LeaseDuration; ❌

  // ADD:
  preferredMinimumStay?: number; // Preference only, not enforceable
  acceptsShortTermTenants: boolean; // Willing to accept tenants who may leave after 2 months

  // ... rest of fields
}
```

#### ✅ UPDATE Match Interface:
```typescript
export interface Match {
  // REMOVE:
  // tenancyEndDate?: Date; ❌ No fixed end date anymore

  // ADD:
  tenancyStartDate?: Date; // When tenancy began
  tenancyNoticedDate?: Date; // When tenant/landlord gave notice to end
  expectedMoveOutDate?: Date; // tenancyNoticedDate + 56 days (calculated)
  tenancyEndReason?: 'tenant_notice' | 'ground_1' | 'ground_1a' | 'ground_6' | 'ground_8' | 'ground_14'; // Legal grounds only

  // ... rest of fields
}
```

#### ✅ UPDATE UI Components:

**PropertyForm.tsx:**
```typescript
// REMOVE dropdown for "Minimum Lease Duration"
// REPLACE with:
<div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
  <h4 className="font-semibold mb-2">Tenancy Type: Periodic (Rolling Contract)</h4>
  <p className="text-sm text-neutral-700">
    Under the Renters' Rights Act 2025, all tenancies are now periodic (open-ended).
    Tenants can give 2 months' notice to leave at any time.
  </p>

  <label className="flex items-center gap-2 mt-3">
    <input type="checkbox" {...register('acceptsShortTermTenants')} />
    <span className="text-sm">I'm happy with tenants who may only stay short-term</span>
  </label>

  <FormField
    label="Preferred Minimum Stay (optional)"
    helperText="This is your preference only - tenants can still leave with 2 months notice"
    type="number"
    min={1}
    max={24}
    suffix="months"
    {...register('preferredMinimumStay')}
  />
</div>
```

**PropertyCard.tsx:**
```typescript
// UPDATE badges:
<Badge variant="info">
  Periodic Tenancy
</Badge>
<Badge variant="neutral">
  2 Months Notice
</Badge>

{property.preferredMinimumStay && (
  <Badge variant="outline">
    Landlord prefers {property.preferredMinimumStay}+ months
  </Badge>
)}
```

---

### 2. Private Rented Sector (PRS) Database Registration

**Legal Requirement:**
- ALL landlords must register on government PRS database
- ALL properties must be registered
- Unique identifiers assigned to each landlord and property
- Registration REQUIRED before marketing property
- Cannot obtain possession orders without valid registration
- Annual fees payable

**Platform Impact:**

#### ✅ UPDATE LandlordProfile:
```typescript
export interface LandlordProfile {
  // ... existing fields

  // NEW: PRS Database Registration
  prsRegistrationNumber?: string; // Government-issued unique identifier
  prsRegistrationStatus: 'not_registered' | 'pending' | 'active' | 'expired' | 'suspended';
  prsRegistrationDate?: Date;
  prsRegistrationExpiryDate?: Date;

  // NEW: Ombudsman Registration (also mandatory)
  ombudsmanScheme: 'not_registered' | 'property_redress_scheme' | 'property_ombudsman' | 'tpo';
  ombudsmanMembershipNumber?: string;

  isFullyCompliant: boolean; // Both PRS database AND ombudsman registered
}
```

#### ✅ UPDATE Property Interface:
```typescript
export interface Property {
  // ... existing fields

  // NEW: PRS Database Registration
  prsPropertyRegistrationNumber?: string; // Unique property identifier
  prsPropertyRegistrationStatus: 'not_registered' | 'active' | 'suspended';

  // NEW: Compliance Checks
  meetsDecentHomesStandard: boolean; // Mandatory as of Act
  awaabsLawCompliant: boolean; // Mandatory mould/damp hazard removal within 14 days
  lastSafetyInspectionDate?: Date;

  // NEW: Cannot market without registration
  canBeMarketed: boolean; // Calculated: prsPropertyRegistrationStatus === 'active' && landlord.isFullyCompliant
}
```

#### ✅ CREATE New Component: `PRSRegistrationVerification.tsx`
```typescript
interface PRSRegistrationVerificationProps {
  landlord: LandlordProfile;
  property?: Property;
}

/**
 * Displays PRS database and ombudsman registration status
 * Warns landlords if not compliant
 * Prevents property marketing if not registered
 */
export function PRSRegistrationVerification({ landlord, property }: PRSRegistrationVerificationProps) {
  const isLandlordCompliant =
    landlord.prsRegistrationStatus === 'active' &&
    landlord.ombudsmanScheme !== 'not_registered';

  const isPropertyCompliant =
    property?.prsPropertyRegistrationStatus === 'active';

  const canMarketProperty = isLandlordCompliant && isPropertyCompliant;

  if (!canMarketProperty) {
    return (
      <div className="bg-danger-50 border-2 border-danger-500 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-danger-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg text-danger-900 mb-2">
              Registration Required
            </h3>
            <p className="text-danger-800 mb-4">
              Under the Renters' Rights Act 2025, you must register with the PRS database
              and join an approved ombudsman scheme before marketing your property.
            </p>

            <div className="space-y-2 mb-4">
              <RegistrationStatusRow
                label="PRS Database Registration"
                status={landlord.prsRegistrationStatus}
                registrationNumber={landlord.prsRegistrationNumber}
              />
              <RegistrationStatusRow
                label="Ombudsman Membership"
                status={landlord.ombudsmanScheme !== 'not_registered' ? 'active' : 'not_registered'}
                registrationNumber={landlord.ombudsmanMembershipNumber}
              />
              {property && (
                <RegistrationStatusRow
                  label="Property Registration"
                  status={property.prsPropertyRegistrationStatus}
                  registrationNumber={property.prsPropertyRegistrationNumber}
                />
              )}
            </div>

            <div className="space-y-2">
              <Button
                variant="primary"
                href="https://www.gov.uk/government/collections/private-rented-sector-database"
                target="_blank"
                icon={<ExternalLink />}
              >
                Register on PRS Database
              </Button>
              <Button
                variant="secondary"
                href="https://www.gov.uk/private-rented-sector-ombudsman"
                target="_blank"
                icon={<ExternalLink />}
              >
                Join Approved Ombudsman
              </Button>
            </div>

            <p className="text-xs text-danger-700 mt-4">
              <strong>Legal Consequence:</strong> Without valid registration, you cannot market
              your property and will not be able to obtain possession orders.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-success-50 border border-success-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-success-800">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Fully Registered & Compliant</span>
      </div>
      <div className="text-sm text-success-700 mt-2">
        <div>PRS Registration: {landlord.prsRegistrationNumber}</div>
        {property?.prsPropertyRegistrationNumber && (
          <div>Property ID: {property.prsPropertyRegistrationNumber}</div>
        )}
        <div>Ombudsman: {landlord.ombudsmanScheme.replace(/_/g, ' ')}</div>
      </div>
    </div>
  );
}
```

#### ✅ UPDATE PropertyForm Validation:
```typescript
const validateProperty = (data: PropertyFormData): string[] => {
  const errors: string[] = [];

  // Existing validations...

  // NEW: Check landlord compliance before allowing property creation
  if (!landlord.isFullyCompliant) {
    errors.push('You must register with the PRS database and join an ombudsman scheme before listing properties');
  }

  if (!data.meetsDecentHomesStandard) {
    errors.push('Property must meet the Decent Homes Standard to be listed');
  }

  if (!data.awaabsLawCompliant) {
    errors.push("Property must be compliant with Awaab's Law (no serious damp, mould, or hazards)");
  }

  return errors;
};
```

#### ✅ UPDATE Database Schema:
```sql
-- Add PRS registration fields
ALTER TABLE landlord_profiles
ADD COLUMN prs_registration_number TEXT UNIQUE,
ADD COLUMN prs_registration_status TEXT DEFAULT 'not_registered' CHECK (prs_registration_status IN ('not_registered', 'pending', 'active', 'expired', 'suspended')),
ADD COLUMN prs_registration_date DATE,
ADD COLUMN prs_registration_expiry_date DATE,
ADD COLUMN ombudsman_scheme TEXT DEFAULT 'not_registered' CHECK (ombudsman_scheme IN ('not_registered', 'property_redress_scheme', 'property_ombudsman', 'tpo')),
ADD COLUMN ombudsman_membership_number TEXT,
ADD COLUMN is_fully_compliant BOOLEAN GENERATED ALWAYS AS (
  prs_registration_status = 'active' AND ombudsman_scheme != 'not_registered'
) STORED;

ALTER TABLE properties
ADD COLUMN prs_property_registration_number TEXT UNIQUE,
ADD COLUMN prs_property_registration_status TEXT DEFAULT 'not_registered' CHECK (prs_property_registration_status IN ('not_registered', 'active', 'suspended')),
ADD COLUMN meets_decent_homes_standard BOOLEAN DEFAULT false,
ADD COLUMN awaabs_law_compliant BOOLEAN DEFAULT false,
ADD COLUMN last_safety_inspection_date DATE,
ADD COLUMN can_be_marketed BOOLEAN GENERATED ALWAYS AS (
  prs_property_registration_status = 'active' AND meets_decent_homes_standard = true AND awaabs_law_compliant = true
) STORED;

-- Prevent marketing non-compliant properties
CREATE OR REPLACE FUNCTION check_property_compliance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_available = true AND NEW.can_be_marketed = false THEN
    RAISE EXCEPTION 'Cannot market property without valid PRS registration and compliance certifications';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_property_compliance
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION check_property_compliance();
```

---

### 3. Ban on Rent Bidding Wars

**Legal Requirement:**
- Landlords CANNOT request or accept offers above advertised rent
- Landlords CANNOT encourage tenants to bid higher
- Civil penalties up to £7,000 for violations

**Platform Impact:**

#### ✅ UPDATE Property Listing Logic:
```typescript
// PropertyForm.tsx - Add warning
<div className="p-4 bg-warning-50 border border-warning-500 rounded-xl">
  <div className="flex gap-3">
    <AlertTriangle className="w-5 h-5 text-warning-700" />
    <div>
      <h4 className="font-semibold text-warning-900">Rent Bidding is Illegal</h4>
      <p className="text-sm text-warning-800 mt-1">
        Under the Renters' Rights Act 2025, you cannot request or accept offers
        above your advertised rent. This includes suggesting tenants offer more
        to secure the property.
      </p>
      <p className="text-xs text-warning-700 mt-2">
        <strong>Penalty:</strong> Up to £7,000 fine per violation
      </p>
    </div>
  </div>
</div>

<FormField
  label="Monthly Rent"
  type="number"
  min={100}
  step={50}
  required
  helperText="This rent is fixed - you cannot accept higher offers"
  {...register('rentPcm', { required: true })}
/>
```

#### ✅ REMOVE Any Bidding Features:
```typescript
// DELETE any components that allow:
// - "Make an offer" buttons
// - Rent negotiation UI
// - Auction-style features
// - "Bid higher" prompts

// Property cards should show rent as FIXED
<div className="text-2xl font-bold text-primary-600">
  £{property.rentPcm} pcm
  <Badge variant="info" className="ml-2 text-xs">Fixed</Badge>
</div>
```

#### ✅ UPDATE Messaging Templates:
```typescript
// Remove any template messages suggesting rent negotiation
const BANNED_LANDLORD_MESSAGES = [
  "The rent is negotiable", // ❌ ILLEGAL
  "Best offer wins", // ❌ ILLEGAL
  "What's your maximum budget?", // ❌ ILLEGAL
  "Other applicants have offered more", // ❌ ILLEGAL
];

// Validation in message submission
const validateMessage = (content: string): boolean => {
  const lowerContent = content.toLowerCase();

  const bannedPhrases = [
    'bid', 'offer more', 'increase your offer', 'pay more',
    'higher rent', 'best offer', 'negotiable'
  ];

  for (const phrase of bannedPhrases) {
    if (lowerContent.includes(phrase)) {
      throw new Error(
        'Your message may violate rent bidding laws. Please revise to comply with the Renters\' Rights Act 2025.'
      );
    }
  }

  return true;
};
```

---

### 4. Maximum Rent in Advance: 1 Month Only

**Legal Requirement:**
- Landlords CANNOT demand more than 1 month's rent in advance
- Exceptions for company lets and students may apply
- Applies to initial payment and any advance rent requests

**Platform Impact:**

#### ✅ UPDATE Property Interface:
```typescript
export interface Property {
  // ... existing fields

  // NEW: Advance rent constraints
  maxRentInAdvance: 1; // Fixed by law (in months)
  advanceRentMonths: 1; // Always 1, cannot be changed

  // REMOVE if exists:
  // allowsMultipleMonthsAdvance: boolean; ❌ No longer allowed
}
```

#### ✅ UPDATE PropertyForm:
```typescript
// REMOVE any fields allowing landlords to set advance rent > 1 month
// REPLACE with informational message:

<div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
  <h4 className="font-semibold mb-2">Rent in Advance: Maximum 1 Month</h4>
  <p className="text-sm text-neutral-700">
    The Renters' Rights Act 2025 limits rent in advance to 1 month maximum.
    This applies to all new tenancies.
  </p>

  <div className="mt-3 space-y-1 text-sm">
    <div className="flex justify-between">
      <span className="text-neutral-600">Monthly Rent:</span>
      <span className="font-medium">£{rentPcm}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-neutral-600">Maximum Advance Payment:</span>
      <span className="font-medium">£{rentPcm} (1 month)</span>
    </div>
    <div className="flex justify-between">
      <span className="text-neutral-600">Deposit (separate):</span>
      <span className="font-medium">£{deposit} (5 weeks)</span>
    </div>
    <div className="flex justify-between pt-2 border-t border-neutral-200 font-semibold">
      <span>Total Upfront Cost:</span>
      <span>£{rentPcm + deposit}</span>
    </div>
  </div>
</div>
```

#### ✅ UPDATE RenterProfile Validation:
```typescript
// Remove fields asking for ability to pay 3/6 months upfront
// Renters no longer need to specify this as it's illegal to request

// REMOVE:
// canPayMultipleMonthsAdvance: boolean; ❌
// monthsAdvanceAvailable: number; ❌
```

---

### 5. Mandatory Pet Consent (Cannot Unreasonably Refuse)

**Legal Requirement:**
- Landlords CANNOT blanket ban pets
- Must consider each request individually
- Can only refuse with valid reason (e.g., property unsuitability)
- Can require pet insurance

**Platform Impact:**

#### ✅ UPDATE Property Interface:
```typescript
export interface Property {
  // CHANGE:
  // petsAllowed: PetsPreference; ❌ Old way

  // NEW:
  petsPolicy: {
    willConsiderPets: true; // Must always be true (cannot blanket refuse)
    preferredPetTypes: ('cat' | 'dog' | 'small_caged' | 'fish')[]; // Preferences, not bans
    requiresPetInsurance: boolean; // Can require insurance
    petDeposit?: number; // Can request additional deposit for pets (within legal limits)
    additionalPetRent?: number; // Some landlords charge extra monthly pet rent
    maxPetsAllowed: number; // Reasonable limit (e.g., 2)
    propertyUnsuitableFor?: ('large_dogs' | 'multiple_dogs')[]; // Valid objections only
  };
}
```

#### ✅ UPDATE LandlordProfile:
```typescript
export interface LandlordProfile {
  // REMOVE:
  // petsPolicy: PetsPreference; ❌ Cannot blanket ban

  // ADD:
  defaultPetsPolicy: {
    willConsiderPets: true; // Legally required
    requiresPetInsurance: boolean;
    preferredPetTypes: ('cat' | 'dog' | 'small_caged' | 'fish')[];
    // ... same fields as Property.petsPolicy
  };
}
```

#### ✅ UPDATE RenterProfile:
```typescript
export interface RenterProfile {
  // UPDATE:
  hasPets: boolean;
  petDetails?: {
    type: 'cat' | 'dog' | 'small_caged' | 'fish' | 'other';
    breed?: string; // For dogs
    count: number;
    hasInsurance: boolean;
    description: string; // Size, behavior, training, etc.
  }[];
}
```

#### ✅ UPDATE PropertyForm:
```typescript
<div className="space-y-4">
  <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
    <h4 className="font-semibold mb-2">Pets Policy</h4>
    <p className="text-sm text-primary-900 mb-3">
      Under the Renters' Rights Act 2025, you must consider all reasonable pet requests.
      You can only refuse if you have a valid reason (e.g., property is unsuitable for large dogs).
    </p>
  </div>

  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={true}
      disabled
      className="opacity-50 cursor-not-allowed"
    />
    <span className="text-sm text-neutral-600">
      Will consider pet requests (required by law)
    </span>
  </label>

  <FormField
    label="Maximum Number of Pets"
    type="number"
    min={1}
    max={5}
    defaultValue={2}
    helperText="Set a reasonable limit based on property size"
    {...register('petsPolicy.maxPetsAllowed')}
  />

  <div>
    <label className="block font-medium mb-2">Preferred Pet Types</label>
    <p className="text-sm text-neutral-600 mb-2">
      Select your preferences (not bans - you must still consider all requests)
    </p>
    <div className="space-y-2">
      {['cat', 'dog', 'small_caged', 'fish'].map(type => (
        <label key={type} className="flex items-center gap-2">
          <input type="checkbox" {...register(`petsPolicy.preferredPetTypes.${type}`)} />
          <span className="capitalize">{type.replace('_', ' ')}</span>
        </label>
      ))}
    </div>
  </div>

  <label className="flex items-center gap-2">
    <input type="checkbox" {...register('petsPolicy.requiresPetInsurance')} />
    <span className="text-sm">Require pet insurance (legally allowed)</span>
  </label>

  <FormField
    label="Additional Pet Rent (optional)"
    type="number"
    min={0}
    max={100}
    step={10}
    prefix="£"
    suffix="/ month"
    helperText="Optional additional monthly charge for pets"
    {...register('petsPolicy.additionalPetRent')}
  />
</div>
```

#### ✅ UPDATE Pet Matching Logic:
```typescript
// Don't automatically filter out properties based on pets
// Instead, show all properties and let landlords consider requests

const filterProperties = (properties: Property[], preferences: UserPreferences) => {
  return properties.filter(property => {
    // REMOVE automatic pet filtering:
    // if (preferences.hasPets && property.petsAllowed === 'No Pets') {
    //   return false; ❌
    // }

    // All properties must be shown - landlord decides case-by-case
    return true;
  });
};
```

#### ✅ CREATE PetRequestModal Component:
```typescript
/**
 * Modal for renters to formally request permission for pets
 * Shown after match, before tenancy agreement
 */
export function PetRequestModal({ match, renterProfile }: Props) {
  return (
    <Modal>
      <h2>Request Permission for Pets</h2>
      <p>
        Under the Renters' Rights Act 2025, landlords must consider your pet request
        and can only refuse with a valid reason.
      </p>

      {renterProfile.petDetails?.map(pet => (
        <PetDetailCard key={pet.type}>
          <h3>{pet.type} - {pet.breed}</h3>
          <div>Count: {pet.count}</div>
          <div>Has Insurance: {pet.hasInsurance ? 'Yes' : 'No'}</div>
          <div>Description: {pet.description}</div>
        </PetDetailCard>
      ))}

      {property.petsPolicy.requiresPetInsurance && !renterProfile.petDetails?.every(p => p.hasInsurance) && (
        <Alert variant="warning">
          This landlord requires pet insurance. Please obtain insurance before proceeding.
        </Alert>
      )}

      <Button onClick={submitPetRequest}>Submit Pet Request</Button>
    </Modal>
  );
}
```

---

### 6. Ban on Discrimination: Benefits & Children

**Legal Requirement:**
- ILLEGAL to discriminate against tenants on benefits (Universal Credit, Housing Benefit)
- ILLEGAL to discriminate against families with children
- Cannot refuse tenants solely based on benefit status or having children

**Platform Impact:**

#### ✅ REMOVE All Discriminatory Filters:

```typescript
// DELETE these fields from LandlordProfile:
// acceptsBenefitTenants: boolean; ❌ ILLEGAL
// acceptsFamiliesWithChildren: boolean; ❌ ILLEGAL
// preferredTenantAge: string; ❌ Could be discriminatory
```

#### ✅ UPDATE RenterProfile:
```typescript
export interface RenterProfile {
  // KEEP these fields (for matching purposes):
  situation: 'Single' | 'Couple' | 'Family' | 'Professional Sharers';
  employmentStatus: EmploymentStatus;
  monthlyIncome: number; // For affordability only, not discrimination

  // ADD:
  receivesHousingBenefit: boolean; // Track but CANNOT be used to exclude
  numberOfChildren?: number; // Track but CANNOT be used to exclude

  // Protected characteristics (cannot be used for discrimination)
  hasChildren: boolean;
  receivesUniversalCredit: boolean;
}
```

#### ✅ UPDATE Filtering Logic:
```typescript
const filterProperties = (properties: Property[], renterProfile: RenterProfile) => {
  return properties.filter(property => {
    // ❌ REMOVE any checks like:
    // if (renterProfile.receivesHousingBenefit && !property.acceptsBenefitTenants) {
    //   return false;
    // }

    // ✅ ONLY filter based on legitimate criteria:
    // - Rent affordability (income must be 2.5x rent)
    // - Number of bedrooms vs occupants
    // - Location preferences

    // Affordability check (standard 2.5x rule)
    if (renterProfile.monthlyIncome < property.rentPcm * 2.5) {
      return false; // Can legitimately exclude if unaffordable
    }

    // Occupancy check (ensure enough bedrooms)
    const occupants = calculateOccupants(renterProfile);
    if (occupants > property.maxOccupants) {
      return false; // Can legitimately exclude if overcrowded
    }

    return true;
  });
};
```

#### ✅ ADD Compliance Warning in UI:
```typescript
// PropertyForm.tsx or LandlordDashboard.tsx

<div className="p-4 bg-danger-50 border-2 border-danger-500 rounded-xl mb-6">
  <div className="flex gap-3">
    <AlertTriangle className="w-6 h-6 text-danger-600" />
    <div>
      <h3 className="font-bold text-danger-900">Discrimination is Illegal</h3>
      <p className="text-sm text-danger-800 mt-1">
        You cannot refuse tenants because they:
      </p>
      <ul className="list-disc list-inside text-sm text-danger-800 mt-2 space-y-1">
        <li>Receive Universal Credit or Housing Benefit</li>
        <li>Have children</li>
        <li>Are a single parent</li>
      </ul>
      <p className="text-xs text-danger-700 mt-3">
        <strong>Penalty:</strong> Unlimited fines and potential prosecution under the Equality Act 2010
      </p>
    </div>
  </div>
</div>
```

#### ✅ UPDATE Match Cards:
```typescript
// RenterMatchCard.tsx - Remove any displays of benefit status or children

// ❌ REMOVE:
// {renterProfile.receivesUniversalCredit && <Badge>On Benefits</Badge>}
// {renterProfile.hasChildren && <Badge>Has Children</Badge>}

// These are protected characteristics and showing them
// could encourage discriminatory decisions
```

---

### 7. Enhanced Section 8 Grounds for Possession

**Legal Requirement:**
- Section 21 abolished - landlords can ONLY evict using Section 8 grounds
- New grounds added (e.g., landlord moving in, selling to buyer needing vacant possession)
- Stricter evidence requirements
- Longer notice periods

**Platform Impact:**

#### ✅ ADD New Eviction Grounds Type:
```typescript
export type EvictionGround =
  // Mandatory grounds (court must grant possession if proven)
  | 'ground_8' // 8 weeks+ rent arrears (mandatory)
  | 'ground_7a' // Persistent rent arrears (mandatory)

  // Discretionary grounds (court may grant possession)
  | 'ground_1' // Landlord wants to live in property (new - replaces Section 21)
  | 'ground_1a' // Landlord wants to sell to buyer needing vacant possession (new)
  | 'ground_6' // Substantial redevelopment
  | 'ground_14' // Anti-social behavior
  | 'ground_14a' // Serious criminal activity
  | 'ground_14za' // Domestic abuse
  | 'ground_17' // False statement to obtain tenancy;

export interface EvictionNotice {
  id: string;
  matchId: string;
  landlordId: string;
  renterId: string;
  propertyId: string;
  ground: EvictionGround;
  noticeServedDate: Date;
  earliestPossessionDate: Date; // Calculated based on ground
  reason: string; // Required detailed explanation
  evidence: string[]; // Required supporting evidence
  status: 'served' | 'challenged' | 'court_hearing_scheduled' | 'possession_granted' | 'possession_denied';
  courtHearingDate?: Date;
  outcomeDate?: Date;
  createdAt: Date;
}
```

#### ✅ UPDATE Match Interface:
```typescript
export interface Match {
  // ... existing fields

  // NEW: Eviction tracking
  evictionNotice?: EvictionNotice;
  isUnderEvictionProceedings: boolean;
  canLandlordEvict: boolean; // Calculated based on grounds availability

  // NEW: Rent arrears tracking (for Ground 8)
  rentArrears: {
    totalOwed: number;
    monthsMissed: number;
    consecutiveMonthsMissed: number;
    lastPaymentDate?: Date;
  };
}
```

#### ✅ CREATE EvictionNoticeComponent:
```typescript
/**
 * Landlord-side component to serve eviction notice
 * Must follow strict legal requirements
 */
export function ServeEvictionNotice({ match }: { match: Match }) {
  const [selectedGround, setSelectedGround] = useState<EvictionGround | null>(null);
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);

  const groundDescriptions: Record<EvictionGround, { title: string; description: string; noticePeriod: number; requirements: string }> = {
    ground_8: {
      title: 'Rent Arrears (8+ weeks)',
      description: 'Tenant owes at least 8 weeks rent (mandatory ground)',
      noticePeriod: 28, // 4 weeks
      requirements: 'You must prove arrears of at least 8 weeks. Court MUST grant possession if proven.',
    },
    ground_1: {
      title: 'Landlord Moving In',
      description: 'You or your family need to live in the property',
      noticePeriod: 56, // 8 weeks (2 months)
      requirements: 'You must prove you genuinely intend to occupy. Cannot be used within 12 months of tenancy start.',
    },
    ground_1a: {
      title: 'Selling to Buyer Needing Vacant Possession',
      description: 'Selling property to buyer who needs it vacant',
      noticePeriod: 56, // 8 weeks
      requirements: 'You must have a signed contract of sale. Cannot be used within 12 months of tenancy start.',
    },
    ground_14: {
      title: 'Anti-Social Behavior',
      description: 'Tenant or household member causing nuisance',
      noticePeriod: 28, // 4 weeks minimum
      requirements: 'You must provide evidence of anti-social behavior (neighbor complaints, police reports, etc.)',
    },
    // ... other grounds
  };

  const validateNotice = (): string[] => {
    const errors: string[] = [];

    if (!selectedGround) {
      errors.push('Select a ground for possession');
    }

    if (reason.trim().length < 100) {
      errors.push('Detailed reason required (minimum 100 characters)');
    }

    if (evidence.length === 0) {
      errors.push('Supporting evidence is required');
    }

    // Ground-specific validation
    if (selectedGround === 'ground_8') {
      if (match.rentArrears.consecutiveMonthsMissed < 2) {
        errors.push('Ground 8 requires at least 8 weeks consecutive arrears');
      }
    }

    if (selectedGround === 'ground_1' || selectedGround === 'ground_1a') {
      const tenancyMonths = differenceInMonths(new Date(), match.tenancyStartDate!);
      if (tenancyMonths < 12) {
        errors.push(`${selectedGround === 'ground_1' ? 'Ground 1' : 'Ground 1A'} cannot be used within first 12 months`);
      }
    }

    return errors;
  };

  const serveNotice = async () => {
    const errors = validateNotice();
    if (errors.length > 0) {
      showErrors(errors);
      return;
    }

    const groundInfo = groundDescriptions[selectedGround!];
    const earliestPossessionDate = addDays(new Date(), groundInfo.noticePeriod);

    await createEvictionNotice({
      matchId: match.id,
      ground: selectedGround!,
      noticeServedDate: new Date(),
      earliestPossessionDate,
      reason,
      evidence,
    });

    showToast({
      type: 'success',
      title: 'Eviction Notice Served',
      message: `Tenant has been notified. Earliest possession date: ${format(earliestPossessionDate, 'dd MMMM yyyy')}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-warning-50 border border-warning-500 rounded-xl">
        <h3 className="font-bold text-warning-900 mb-2">
          Important: Section 21 No Longer Available
        </h3>
        <p className="text-sm text-warning-800">
          Under the Renters' Rights Act 2025, you can only evict tenants using Section 8 grounds.
          You must have a valid reason and provide evidence.
        </p>
      </div>

      <div>
        <label className="block font-semibold mb-3">Select Ground for Possession</label>
        <div className="space-y-3">
          {Object.entries(groundDescriptions).map(([ground, info]) => (
            <GroundCard
              key={ground}
              ground={ground as EvictionGround}
              info={info}
              isSelected={selectedGround === ground}
              onSelect={setSelectedGround}
            />
          ))}
        </div>
      </div>

      {selectedGround && (
        <>
          <div>
            <label className="block font-semibold mb-2">Detailed Reason (minimum 100 characters)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-32 px-4 py-3 border rounded-xl"
              placeholder={`Explain why you are using ${groundDescriptions[selectedGround].title}...`}
            />
            <div className="text-sm text-neutral-600 mt-1">
              {reason.length}/500 characters
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Supporting Evidence</label>
            <p className="text-sm text-neutral-600 mb-3">
              {groundDescriptions[selectedGround].requirements}
            </p>
            <FileUpload
              accept=".pdf,.jpg,.png,.doc,.docx"
              multiple
              onChange={setEvidence}
            />
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl">
            <h4 className="font-semibold mb-2">Notice Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Notice Period:</span>
                <span className="font-medium">
                  {groundDescriptions[selectedGround].noticePeriod} days
                </span>
              </div>
              <div className="flex justify-between">
                <span>Earliest Possession Date:</span>
                <span className="font-medium">
                  {format(addDays(new Date(), groundDescriptions[selectedGround].noticePeriod), 'dd MMMM yyyy')}
                </span>
              </div>
            </div>
          </div>

          <Button onClick={serveNotice} variant="danger" fullWidth>
            Serve Eviction Notice
          </Button>

          <p className="text-xs text-neutral-600 text-center">
            Tenant will be notified immediately and can challenge this notice.
            You may need to apply to court if tenant does not leave voluntarily.
          </p>
        </>
      )}
    </div>
  );
}
```

#### ✅ UPDATE Rating System:
```typescript
// Tenants can ONLY rate after:
// 1. Tenancy completed naturally (tenant gave notice)
// 2. Eviction completed (possession granted)

const canRateLandlord = (match: Match): boolean => {
  if (match.tenancyCompletedAt) {
    return true; // Natural end
  }

  if (match.evictionNotice?.status === 'possession_granted' && match.evictionNotice.outcomeDate) {
    return true; // Eviction completed
  }

  return false;
};
```

---

### 8. Private Rented Sector Ombudsman

**Legal Requirement:**
- ALL landlords must join approved ombudsman scheme
- Free dispute resolution for tenants
- Binding decisions
- Ombudsman can order compensation, apologies, remedial action

**Platform Impact:**

Already covered in Section 2 (PRS Database Registration) - Ombudsman membership is part of landlord compliance checks.

#### ✅ ADD Dispute Resolution Feature:
```typescript
export interface Dispute {
  id: string;
  matchId: string;
  landlordId: string;
  renterId: string;
  propertyId: string;
  raisedBy: 'renter' | 'landlord';
  category: 'repairs' | 'deposit' | 'rent_increase' | 'harassment' | 'illegal_eviction' | 'discrimination' | 'other';
  description: string;
  evidence: string[]; // Photos, documents, etc.
  desiredOutcome: string;
  status: 'open' | 'investigating' | 'mediation' | 'resolved' | 'escalated_to_ombudsman';
  resolution?: string;
  compensationAwarded?: number;
  createdAt: Date;
  resolvedAt?: Date;
}

// Component for raising disputes
export function RaiseDisputeModal({ match }: { match: Match }) {
  // Allow renters to raise disputes directly in the platform
  // Platform notifies landlord and tracks resolution
  // If unresolved after 8 weeks, auto-escalate to ombudsman
}
```

---

### 9. Decent Homes Standard & Awaab's Law

**Legal Requirement:**
- Properties MUST meet Decent Homes Standard
- Landlords MUST fix hazards within 14 days (Awaab's Law for damp/mould)
- Serious hazards (e.g., gas, fire safety) must be addressed immediately

**Platform Impact:**

Already partially covered in Section 2 (PRS Database Registration) - added `meetsDecentHomesStandard` and `awaabsLawCompliant` fields.

#### ✅ ADD Hazard Reporting System:
```typescript
export interface HazardReport {
  id: string;
  matchId: string;
  propertyId: string;
  reportedBy: 'renter' | 'inspection';
  hazardType: 'damp_mould' | 'gas_safety' | 'fire_safety' | 'electrical' | 'structural' | 'other';
  severity: 'immediate' | 'serious' | 'moderate';
  description: string;
  photos: string[];
  reportedAt: Date;

  // Legal timeline tracking
  landlordNotifiedAt?: Date;
  deadline: Date; // 14 days for most, immediate for serious
  fixedAt?: Date;
  isOverdue: boolean;

  // Enforcement
  localAuthorityNotifiedAt?: Date; // If landlord doesn't fix
  penaltyIssued?: {
    amount: number;
    reason: string;
  };
}

// Component
export function ReportHazard({ match }: { match: Match }) {
  // Renters can report hazards
  // System automatically calculates deadline (14 days or immediate)
  // Sends notifications to landlord
  // If not fixed by deadline, offers option to escalate to local authority
}
```

---

## Database Migration SQL (Compliance Update)

```sql
-- =====================================================
-- RENTERS' RIGHTS ACT 2025 COMPLIANCE MIGRATION
-- =====================================================

-- 1. Remove fixed-term tenancy fields
ALTER TABLE properties
DROP COLUMN IF EXISTS min_lease_duration;

ALTER TABLE landlord_profiles
DROP COLUMN IF EXISTS min_tenancy_length;

-- 2. Add periodic tenancy fields
ALTER TABLE properties
ADD COLUMN tenancy_type TEXT DEFAULT 'Periodic' CHECK (tenancy_type = 'Periodic'),
ADD COLUMN preferred_minimum_stay INTEGER, -- preference only
ADD COLUMN accepts_short_term_tenants BOOLEAN DEFAULT true;

-- 3. Update matches table for open-ended tenancies
ALTER TABLE matches
DROP COLUMN IF EXISTS tenancy_end_date;

ALTER TABLE matches
ADD COLUMN tenancy_noticed_date DATE,
ADD COLUMN expected_move_out_date DATE,
ADD COLUMN tenancy_end_reason TEXT CHECK (tenancy_end_reason IN ('tenant_notice', 'ground_1', 'ground_1a', 'ground_6', 'ground_8', 'ground_14'));

-- 4. Add PRS registration (already covered in Section 2)
-- See earlier SQL in this document

-- 5. Remove discriminatory fields
ALTER TABLE landlord_profiles
DROP COLUMN IF EXISTS accepts_benefit_tenants,
DROP COLUMN IF EXISTS accepts_families_with_children,
DROP COLUMN IF EXISTS preferred_tenant_age;

-- 6. Update pets policy
ALTER TABLE properties
DROP COLUMN IF EXISTS pets_allowed;

ALTER TABLE properties
ADD COLUMN pets_policy JSONB DEFAULT '{
  "willConsiderPets": true,
  "preferredPetTypes": [],
  "requiresPetInsurance": false,
  "maxPetsAllowed": 2
}'::jsonb;

-- 7. Add rent protection (no bidding, max 1 month advance)
ALTER TABLE properties
ADD COLUMN max_rent_in_advance INTEGER DEFAULT 1 CHECK (max_rent_in_advance = 1),
ADD COLUMN allows_rent_bidding BOOLEAN DEFAULT false CHECK (allows_rent_bidding = false);

-- 8. Create eviction notices table
CREATE TABLE eviction_notices (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id),
  landlord_id TEXT NOT NULL,
  renter_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  ground TEXT NOT NULL CHECK (ground IN ('ground_8', 'ground_7a', 'ground_1', 'ground_1a', 'ground_6', 'ground_14', 'ground_14a', 'ground_14za', 'ground_17')),
  notice_served_date DATE NOT NULL,
  earliest_possession_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (LENGTH(reason) >= 100),
  evidence TEXT[] NOT NULL,
  status TEXT DEFAULT 'served' CHECK (status IN ('served', 'challenged', 'court_hearing_scheduled', 'possession_granted', 'possession_denied')),
  court_hearing_date DATE,
  outcome_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create disputes table
CREATE TABLE disputes (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id),
  landlord_id TEXT NOT NULL,
  renter_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  raised_by TEXT NOT NULL CHECK (raised_by IN ('renter', 'landlord')),
  category TEXT NOT NULL CHECK (category IN ('repairs', 'deposit', 'rent_increase', 'harassment', 'illegal_eviction', 'discrimination', 'other')),
  description TEXT NOT NULL,
  evidence TEXT[],
  desired_outcome TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'mediation', 'resolved', 'escalated_to_ombudsman')),
  resolution TEXT,
  compensation_awarded INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 10. Create hazard reports table
CREATE TABLE hazard_reports (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id),
  property_id TEXT NOT NULL REFERENCES properties(id),
  reported_by TEXT NOT NULL CHECK (reported_by IN ('renter', 'inspection')),
  hazard_type TEXT NOT NULL CHECK (hazard_type IN ('damp_mould', 'gas_safety', 'fire_safety', 'electrical', 'structural', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('immediate', 'serious', 'moderate')),
  description TEXT NOT NULL,
  photos TEXT[],
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  landlord_notified_at TIMESTAMPTZ,
  deadline DATE NOT NULL,
  fixed_at TIMESTAMPTZ,
  is_overdue BOOLEAN GENERATED ALWAYS AS (fixed_at IS NULL AND deadline < CURRENT_DATE) STORED,
  local_authority_notified_at TIMESTAMPTZ,
  penalty_issued JSONB
);

-- Indexes
CREATE INDEX idx_eviction_notices_match ON eviction_notices(match_id);
CREATE INDEX idx_disputes_match ON disputes(match_id);
CREATE INDEX idx_hazard_reports_property ON hazard_reports(property_id);
CREATE INDEX idx_hazard_reports_overdue ON hazard_reports(is_overdue) WHERE is_overdue = true;

COMMENT ON TABLE eviction_notices IS 'Section 8 eviction notices (Section 21 abolished by Renters Rights Act 2025)';
COMMENT ON TABLE disputes IS 'Dispute resolution system (required by Private Rented Sector Ombudsman scheme)';
COMMENT ON TABLE hazard_reports IS 'Property hazards (Decent Homes Standard & Awaabs Law compliance)';
```

---

## Implementation Priority

Given the Renters' Rights Act 2025 is being phased in during 2026:

### Phase 1 (CRITICAL - Before Spring 2026):
1. ✅ Remove fixed-term ASTs, implement periodic tenancies only
2. ✅ Add PRS database registration fields and compliance checks
3. ✅ Remove rent bidding features
4. ✅ Limit rent in advance to 1 month
5. ✅ Remove discriminatory filters (benefits, children)

### Phase 2 (HIGH - Before Spring 2026):
6. ✅ Update pets policy (cannot blanket ban)
7. ✅ Add Section 8 eviction grounds system
8. ✅ Add ombudsman membership tracking

### Phase 3 (MEDIUM - Before Summer 2026):
9. ✅ Add Decent Homes Standard compliance
10. ✅ Add Awaab's Law hazard reporting
11. ✅ Add dispute resolution system

### Phase 4 (ONGOING):
12. ✅ Monitor regulatory changes and update as needed
13. ✅ Add enforcement tracking for local authorities
14. ✅ Regular compliance audits

---

## Legal Disclaimer

This platform must display prominent legal disclaimers:

```typescript
// Add to footer and landlord registration:
export function LegalDisclaimer() {
  return (
    <div className="p-6 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-700">
      <h3 className="font-bold text-neutral-900 mb-2">Legal Compliance Notice</h3>
      <p className="mb-3">
        This platform is designed to comply with the Renters' Rights Act 2025.
        However, landlords and renters are responsible for ensuring their own compliance
        with all applicable laws and regulations.
      </p>
      <p className="mb-3">
        <strong>Landlords must:</strong>
      </p>
      <ul className="list-disc list-inside space-y-1 mb-3">
        <li>Register with the Private Rented Sector Database before marketing properties</li>
        <li>Join an approved ombudsman scheme</li>
        <li>Ensure properties meet the Decent Homes Standard</li>
        <li>Comply with Awaab's Law for damp and mould hazards</li>
        <li>Only evict using valid Section 8 grounds (Section 21 abolished)</li>
        <li>Not discriminate against tenants on benefits or with children</li>
        <li>Consider all reasonable pet requests</li>
        <li>Not request or accept rent offers above advertised price</li>
        <li>Not demand more than 1 month's rent in advance</li>
      </ul>
      <p className="text-xs text-neutral-600">
        This platform is not a substitute for legal advice. Consult a solicitor or
        letting agent for specific legal guidance.
      </p>
    </div>
  );
}
```

---

## Success Criteria (Compliance)

**Transformation Complete When:**
1. ✅ All fixed-term tenancy references removed
2. ✅ PRS database registration enforced before property marketing
3. ✅ Rent bidding features completely removed
4. ✅ Rent in advance limited to 1 month
5. ✅ Discriminatory filters removed (benefits, children)
6. ✅ Pets policy updated to "must consider"
7. ✅ Section 8 eviction system implemented
8. ✅ Ombudsman membership tracking added
9. ✅ Decent Homes Standard compliance checks added
10. ✅ Legal disclaimers displayed prominently

---

**End of Renters' Rights Act 2025 Compliance Addendum**
**Version:** 1.0
**Last Updated:** January 2025
**Legal Status:** Based on Act receiving Royal Assent October 2025
**Next Review:** Monitor government guidance and commencement dates

