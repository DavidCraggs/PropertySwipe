# 

## Overview
An in-app tenancy agreement generator that creates legally compliant Assured Shorthold Tenancy (AST) agreements following the Renters' Rights Act 2025 requirements. Landlords can customize agreements using a guided form, and the system generates a professional PDF ready for electronic signing.

---

## 1. RRA 2025 Key Requirements

### Mandatory Clauses (Must Include)
1. **Periodic Tenancy by Default** - No fixed terms, rolling tenancy from day one
2. **Tenant Notice Period** - Minimum 2 months notice to leave
3. **Landlord Notice Period** - Minimum 2 months (no Section 21)
4. **Rent Increases** - Maximum once per 12 months, market rate only
5. **Deposit Cap** - Maximum 5 weeks rent (for rent < £50k/year)
6. **Holding Deposit Cap** - Maximum 1 week's rent
7. **Rent in Advance** - Maximum 1 month
8. **Pets Clause** - Landlord must consider pet requests, can only refuse with valid reason
9. **Decent Homes Standard** - Property must meet standard
10. **Awaab's Law Compliance** - Response times for repairs
11. **PRS Registration** - Landlord must be registered
12. **Ombudsman Membership** - Landlord must be member of approved scheme

### Prohibited Clauses (Cannot Include)
- No-fault eviction (Section 21 abolished)
- Blanket pet bans
- Fees beyond deposit and rent
- Fixed-term lock-in periods
- Rent review clauses exceeding once per year
- Clauses limiting tenant's right to challenge rent increases

### Required Prescribed Information
1. Deposit protection scheme details
2. EPC rating (minimum C for new tenancies)
3. Gas Safety Certificate confirmation
4. Electrical Installation Condition Report
5. How to Rent Guide acknowledgment
6. PRS registration number
7. Ombudsman scheme details

---

## 2. Database Schema

### New Tables

```sql
-- Agreement templates (system-provided and custom)
CREATE TABLE agreement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,                       -- e.g., "RRA2025-v1.0"

  -- Template content (JSON structure)
  sections JSONB NOT NULL,                     -- Array of sections with clauses

  -- Metadata
  is_system_template BOOLEAN DEFAULT FALSE,   -- Built-in vs user-created
  created_by UUID,                            -- NULL for system templates
  is_active BOOLEAN DEFAULT TRUE,

  -- RRA compliance
  rra_compliant BOOLEAN DEFAULT TRUE,
  last_compliance_check TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated agreements (instances from templates)
CREATE TABLE generated_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES agreement_templates(id),
  match_id UUID REFERENCES matches(id) NOT NULL,

  -- Parties
  landlord_id UUID REFERENCES landlord_profiles(id) NOT NULL,
  agency_id UUID REFERENCES agency_profiles(id),
  renter_id UUID REFERENCES renter_profiles(id) NOT NULL,
  property_id UUID REFERENCES properties(id) NOT NULL,

  -- Agreement data (filled form values)
  agreement_data JSONB NOT NULL,
  /*
    {
      "tenancyStartDate": "2025-03-01",
      "rentAmount": 1500,
      "rentPaymentDay": 1,
      "depositAmount": 1730,
      "depositScheme": "DPS",
      "depositSchemeRef": "ABC123",
      "petsAllowed": true,
      "petDetails": "1 cat",
      "additionalOccupants": [...],
      "specialConditions": [...],
      "inventoryIncluded": true,
      ...
    }
  */

  -- Generated document
  generated_pdf_path TEXT,
  generated_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  -- Values: draft, generated, sent_for_signing, signed, cancelled

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Clause library (reusable clauses)
CREATE TABLE agreement_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  -- Categories: rent, deposit, repairs, pets, termination, property_use, etc.

  title TEXT NOT NULL,
  content TEXT NOT NULL,                       -- The actual clause text

  -- Variables in clause (placeholders like {{rent_amount}})
  variables JSONB,

  -- Compliance
  is_mandatory BOOLEAN DEFAULT FALSE,          -- Required by RRA 2025
  is_prohibited BOOLEAN DEFAULT FALSE,         -- Forbidden by RRA 2025
  rra_reference TEXT,                          -- e.g., "Section 12(1)"

  -- Metadata
  is_system_clause BOOLEAN DEFAULT TRUE,
  created_by UUID,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_active ON agreement_templates(is_active);
CREATE INDEX idx_generated_match ON generated_agreements(match_id);
CREATE INDEX idx_generated_status ON generated_agreements(status);
CREATE INDEX idx_clauses_category ON agreement_clauses(category);
CREATE INDEX idx_clauses_mandatory ON agreement_clauses(is_mandatory);
```

---

## 3. TypeScript Types

### New Types (add to `/src/types/index.ts`)

```typescript
// Agreement template structure
export interface AgreementTemplate {
  id: string;
  name: string;
  description?: string;
  version: string;
  sections: AgreementSection[];
  isSystemTemplate: boolean;
  createdBy?: string;
  isActive: boolean;
  rraCompliant: boolean;
  lastComplianceCheck?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgreementSection {
  id: string;
  title: string;
  order: number;
  clauses: AgreementClause[];
  isRequired: boolean;
}

export interface AgreementClause {
  id: string;
  category: ClauseCategory;
  title: string;
  content: string;
  variables?: ClauseVariable[];
  isMandatory: boolean;
  isProhibited: boolean;
  rraReference?: string;
  isSelected: boolean;  // For customization
}

export type ClauseCategory =
  | 'parties'
  | 'property'
  | 'term'
  | 'rent'
  | 'deposit'
  | 'repairs'
  | 'pets'
  | 'termination'
  | 'property_use'
  | 'utilities'
  | 'insurance'
  | 'compliance'
  | 'signatures';

export interface ClauseVariable {
  name: string;           // e.g., "rent_amount"
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  label: string;          // e.g., "Monthly Rent"
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: string[];     // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Generated agreement
export interface GeneratedAgreement {
  id: string;
  templateId: string;
  matchId: string;
  landlordId: string;
  agencyId?: string;
  renterId: string;
  propertyId: string;

  agreementData: AgreementFormData;
  generatedPdfPath?: string;
  generatedAt?: Date;

  status: 'draft' | 'generated' | 'sent_for_signing' | 'signed' | 'cancelled';

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  // Joined data
  template?: AgreementTemplate;
  property?: Property;
  landlord?: LandlordProfile;
  renter?: RenterProfile;
}

// Form data structure
export interface AgreementFormData {
  // Tenancy details
  tenancyStartDate: string;

  // Rent
  rentAmount: number;
  rentPaymentDay: number;           // 1-28
  rentPaymentMethod: 'bank_transfer' | 'standing_order' | 'direct_debit';

  // Deposit
  depositAmount: number;
  depositScheme: 'DPS' | 'TDS' | 'MyDeposits';
  depositSchemeRef?: string;
  depositProtectedDate?: string;

  // Occupants
  additionalOccupants: Array<{
    name: string;
    relationship: string;
    dateOfBirth?: string;
  }>;
  maxOccupants: number;

  // Pets
  petsAllowed: boolean;
  petDetails?: string;
  petDeposit?: number;

  // Utilities
  utilitiesIncluded: string[];      // ['water', 'gas', 'electricity', 'internet']
  councilTaxResponsibility: 'tenant' | 'landlord';

  // Property specifics
  furnishingLevel: 'unfurnished' | 'part_furnished' | 'fully_furnished';
  inventoryIncluded: boolean;
  parkingIncluded: boolean;
  gardenMaintenance: 'tenant' | 'landlord' | 'shared';

  // Compliance (auto-filled from property/landlord data)
  epcRating: string;
  epcExpiryDate: string;
  gasSafetyCertDate: string;
  eicrDate: string;
  prsRegistrationNumber: string;
  ombudsmanScheme: string;
  ombudsmanMembershipNumber: string;

  // Special conditions
  specialConditions: string[];

  // Signatures
  landlordSignature?: string;
  renterSignature?: string;
}

// Validation result
export interface ComplianceCheckResult {
  isCompliant: boolean;
  errors: ComplianceError[];
  warnings: ComplianceWarning[];
}

export interface ComplianceError {
  field: string;
  message: string;
  rraReference: string;
}

export interface ComplianceWarning {
  field: string;
  message: string;
  suggestion: string;
}
```

---

## 4. Component Architecture

### Component Tree

```
src/components/
├── organisms/
│   ├── agreement-creator/
│   │   ├── AgreementCreatorWizard.tsx     # Main multi-step wizard
│   │   ├── steps/
│   │   │   ├── PartiesStep.tsx            # Landlord & tenant details
│   │   │   ├── PropertyStep.tsx           # Property details (auto-filled)
│   │   │   ├── RentDepositStep.tsx        # Rent and deposit configuration
│   │   │   ├── OccupantsStep.tsx          # Additional occupants
│   │   │   ├── PetsStep.tsx               # Pet policy
│   │   │   ├── UtilitiesStep.tsx          # Bills and utilities
│   │   │   ├── ComplianceStep.tsx         # Legal compliance checks
│   │   │   ├── SpecialConditionsStep.tsx  # Custom clauses
│   │   │   ├── ReviewStep.tsx             # Preview agreement
│   │   │   └── GenerateStep.tsx           # Generate and send
│   │   │
│   │   ├── ClauseSelector.tsx             # Select optional clauses
│   │   ├── ClauseEditor.tsx               # Edit clause text
│   │   ├── ComplianceChecker.tsx          # Real-time compliance validation
│   │   ├── AgreementPreview.tsx           # Live preview panel
│   │   └── RRAInfoPanel.tsx               # RRA 2025 guidance tooltips
│   │
│   └── templates/
│       ├── TemplateSelector.tsx           # Choose agreement template
│       └── TemplateManager.tsx            # Manage custom templates
│
├── molecules/
│   ├── ClauseCard.tsx                     # Display single clause
│   ├── ComplianceStatus.tsx               # Compliance indicator
│   ├── RentCalculator.tsx                 # Calculate deposit caps
│   └── DepositSchemeSelector.tsx          # Choose deposit scheme
│
└── pages/
    └── CreateAgreementPage.tsx            # Agreement creator page
```

### Key Components

#### 1. AgreementCreatorWizard

```typescript
interface AgreementCreatorWizardProps {
  match: Match;
  onComplete: (agreement: GeneratedAgreement) => void;
  onCancel: () => void;
}

// Features:
// - 10-step wizard with progress bar
// - Auto-save draft to localStorage
// - Real-time compliance checking
// - Live preview panel (optional)
// - Back/Next navigation
// - Skip optional steps
```

#### 2. ComplianceChecker

```typescript
interface ComplianceCheckerProps {
  formData: Partial<AgreementFormData>;
  property: Property;
  landlord: LandlordProfile;
}

// Features:
// - Real-time validation against RRA 2025
// - Error messages with RRA references
// - Warnings for best practices
// - Links to official guidance
// - Auto-fix suggestions
```

#### 3. ClauseSelector

```typescript
interface ClauseSelectorProps {
  category: ClauseCategory;
  selectedClauses: string[];
  onSelectionChange: (clauseIds: string[]) => void;
}

// Features:
// - List available clauses by category
// - Mandatory clauses pre-selected and locked
// - Prohibited clauses hidden/disabled
// - Search and filter
// - Preview clause text
// - Custom clause creation
```

#### 4. AgreementPreview

```typescript
interface AgreementPreviewProps {
  template: AgreementTemplate;
  formData: AgreementFormData;
  showLive?: boolean;  // Real-time updates
}

// Features:
// - Rendered HTML preview
// - Variable substitution
// - Print-friendly styling
// - Section navigation
// - Highlight changes
```

---

## 5. Service Layer

### File: `/src/lib/agreementCreatorService.ts`

```typescript
// Templates
export async function getActiveTemplates(): Promise<AgreementTemplate[]>
export async function getTemplateById(id: string): Promise<AgreementTemplate | null>

// Clauses
export async function getClausesByCategory(category: ClauseCategory): Promise<AgreementClause[]>
export async function getMandatoryClauses(): Promise<AgreementClause[]>

// Agreement generation
export async function createDraftAgreement(
  matchId: string,
  templateId: string
): Promise<GeneratedAgreement>

export async function updateAgreementData(
  agreementId: string,
  data: Partial<AgreementFormData>
): Promise<GeneratedAgreement>

export async function generateAgreementPdf(
  agreementId: string
): Promise<string>  // Returns PDF path

// Compliance
export async function checkCompliance(
  formData: AgreementFormData,
  property: Property,
  landlord: LandlordProfile
): Promise<ComplianceCheckResult>

// Calculations (RRA 2025 caps)
export function calculateMaxDeposit(monthlyRent: number): number {
  // 5 weeks rent for annual rent < £50k
  const annualRent = monthlyRent * 12;
  if (annualRent >= 50000) {
    return monthlyRent * 6; // 6 weeks for high-value
  }
  return (monthlyRent * 12 / 52) * 5; // 5 weeks
}

export function calculateMaxHoldingDeposit(monthlyRent: number): number {
  return (monthlyRent * 12 / 52) * 1; // 1 week
}

export function calculateMaxRentInAdvance(): number {
  return 1; // Maximum 1 month
}
```

### File: `/src/lib/pdfGenerator.ts`

```typescript
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateAgreementPdf(
  template: AgreementTemplate,
  formData: AgreementFormData,
  property: Property,
  landlord: LandlordProfile,
  renter: RenterProfile
): Promise<Uint8Array> {
  // Create PDF document
  // Add header with logo
  // Add parties section
  // Add property details
  // Add all clauses with filled variables
  // Add signature pages
  // Add prescribed information appendix
  // Return PDF bytes
}

// Variable substitution
function substituteVariables(
  text: string,
  formData: AgreementFormData,
  property: Property
): string {
  return text
    .replace(/\{\{rent_amount\}\}/g, formatCurrency(formData.rentAmount))
    .replace(/\{\{deposit_amount\}\}/g, formatCurrency(formData.depositAmount))
    .replace(/\{\{property_address\}\}/g, formatAddress(property.address))
    .replace(/\{\{start_date\}\}/g, formatDate(formData.tenancyStartDate))
    // ... more substitutions
}
```

---

## 6. RRA 2025 Compliance Rules

### Built-in Validation Rules

```typescript
const RRA_COMPLIANCE_RULES = {
  // Deposit caps
  deposit: {
    maxWeeks: 5,
    maxWeeksHighValue: 6,
    highValueThreshold: 50000, // Annual rent
    validate: (deposit: number, monthlyRent: number) => {
      const maxDeposit = calculateMaxDeposit(monthlyRent);
      if (deposit > maxDeposit) {
        return {
          valid: false,
          error: `Deposit exceeds RRA 2025 cap of ${formatCurrency(maxDeposit)}`,
          reference: 'Tenant Fees Act 2019, Schedule 1'
        };
      }
      return { valid: true };
    }
  },

  // Rent in advance
  rentInAdvance: {
    maxMonths: 1,
    validate: (months: number) => {
      if (months > 1) {
        return {
          valid: false,
          error: 'Cannot request more than 1 month rent in advance',
          reference: 'RRA 2025, Section X'
        };
      }
      return { valid: true };
    }
  },

  // Rent increases
  rentIncrease: {
    minIntervalMonths: 12,
    mustBeMarketRate: true,
    mustGiveNotice: true,
    noticeMonths: 2
  },

  // Notice periods
  noticePeriods: {
    tenantMinimum: 2, // months
    landlordMinimum: 2, // months (no Section 21)
    validate: (tenantNotice: number, landlordNotice: number) => {
      const errors = [];
      if (tenantNotice < 2) {
        errors.push({
          error: 'Tenant notice period must be at least 2 months',
          reference: 'RRA 2025, Section Y'
        });
      }
      if (landlordNotice < 2) {
        errors.push({
          error: 'Landlord notice period must be at least 2 months',
          reference: 'RRA 2025, Section Z'
        });
      }
      return { valid: errors.length === 0, errors };
    }
  },

  // Property compliance
  property: {
    minEpcRating: 'C', // For new tenancies
    requireGasSafety: true,
    requireEicr: true,
    requirePrsRegistration: true,
    validate: (property: Property, landlord: LandlordProfile) => {
      const errors = [];

      if (['D', 'E', 'F', 'G'].includes(property.epcRating)) {
        errors.push({
          error: 'Property EPC rating must be C or above for new tenancies',
          reference: 'MEES Regulations 2025'
        });
      }

      if (landlord.prsRegistrationStatus !== 'registered') {
        errors.push({
          error: 'Landlord must be registered with PRS',
          reference: 'RRA 2025, Section A'
        });
      }

      if (!landlord.ombudsmanScheme) {
        errors.push({
          error: 'Landlord must be member of approved ombudsman scheme',
          reference: 'RRA 2025, Section B'
        });
      }

      return { valid: errors.length === 0, errors };
    }
  },

  // Pets
  pets: {
    cannotBlanketBan: true,
    mustConsiderRequest: true,
    canRequireInsurance: true,
    validate: (petsClause: string) => {
      if (petsClause.toLowerCase().includes('no pets') &&
          !petsClause.toLowerCase().includes('request')) {
        return {
          valid: false,
          error: 'Cannot include blanket pet ban. Must allow pet requests.',
          reference: 'RRA 2025, Section P'
        };
      }
      return { valid: true };
    }
  }
};
```

---

## 7. Default Template Structure

### RRA 2025 AST Template

```typescript
const RRA2025_AST_TEMPLATE: AgreementTemplate = {
  id: 'rra2025-ast-v1',
  name: 'RRA 2025 Assured Shorthold Tenancy Agreement',
  version: 'RRA2025-v1.0',
  description: 'Fully compliant periodic tenancy agreement under Renters Rights Act 2025',
  isSystemTemplate: true,
  rraCompliant: true,
  sections: [
    {
      id: 'parties',
      title: '1. Parties to this Agreement',
      order: 1,
      isRequired: true,
      clauses: [
        {
          id: 'landlord-details',
          title: 'Landlord',
          content: `The Landlord is {{landlord_name}} of {{landlord_address}},
                    PRS Registration Number: {{prs_registration_number}}.`,
          isMandatory: true,
          variables: [
            { name: 'landlord_name', type: 'text', label: 'Landlord Name', required: true },
            { name: 'landlord_address', type: 'text', label: 'Landlord Address', required: true },
            { name: 'prs_registration_number', type: 'text', label: 'PRS Number', required: true }
          ]
        },
        {
          id: 'tenant-details',
          title: 'Tenant',
          content: `The Tenant is {{tenant_name}}.`,
          isMandatory: true,
          variables: [
            { name: 'tenant_name', type: 'text', label: 'Tenant Name', required: true }
          ]
        }
      ]
    },
    {
      id: 'property',
      title: '2. The Property',
      order: 2,
      isRequired: true,
      clauses: [
        {
          id: 'property-address',
          title: 'Property Address',
          content: `The property let under this agreement is {{property_address}}
                    ("the Property").`,
          isMandatory: true
        },
        {
          id: 'property-condition',
          title: 'Property Condition',
          content: `The Property meets the Decent Homes Standard and complies with
                    Awaab's Law requirements. EPC Rating: {{epc_rating}}.`,
          isMandatory: true
        }
      ]
    },
    {
      id: 'term',
      title: '3. Term of Tenancy',
      order: 3,
      isRequired: true,
      clauses: [
        {
          id: 'periodic-tenancy',
          title: 'Periodic Tenancy',
          content: `This is a periodic assured shorthold tenancy commencing on
                    {{start_date}} and continuing on a rolling monthly basis
                    until terminated in accordance with this agreement.`,
          isMandatory: true,
          rraReference: 'RRA 2025 - No fixed terms'
        },
        {
          id: 'tenant-notice',
          title: 'Tenant Notice to Quit',
          content: `The Tenant may end this tenancy by giving the Landlord at least
                    2 months' written notice.`,
          isMandatory: true,
          rraReference: 'RRA 2025, Section X'
        },
        {
          id: 'landlord-notice',
          title: 'Landlord Notice Requirements',
          content: `The Landlord may only seek possession on specific grounds as
                    defined in the Housing Act 1988 (as amended) and must give at
                    least 2 months' notice.`,
          isMandatory: true,
          rraReference: 'RRA 2025 - Section 21 abolished'
        }
      ]
    },
    {
      id: 'rent',
      title: '4. Rent',
      order: 4,
      isRequired: true,
      clauses: [
        {
          id: 'rent-amount',
          title: 'Rent Payment',
          content: `The rent is {{rent_amount}} per calendar month, payable in
                    advance on the {{payment_day}} day of each month by
                    {{payment_method}}.`,
          isMandatory: true
        },
        {
          id: 'rent-increase',
          title: 'Rent Review',
          content: `The Landlord may increase the rent no more than once in any
                    12-month period. Any increase must be to market rate and the
                    Landlord must give at least 2 months' notice using the
                    prescribed Section 13 notice. The Tenant has the right to
                    refer the proposed increase to the First-tier Tribunal.`,
          isMandatory: true,
          rraReference: 'RRA 2025, Section R'
        }
      ]
    },
    {
      id: 'deposit',
      title: '5. Deposit',
      order: 5,
      isRequired: true,
      clauses: [
        {
          id: 'deposit-amount',
          title: 'Deposit Amount',
          content: `A deposit of {{deposit_amount}} has been paid. This does not
                    exceed {{deposit_weeks}} weeks' rent as required by law.`,
          isMandatory: true
        },
        {
          id: 'deposit-protection',
          title: 'Deposit Protection',
          content: `The deposit is protected with {{deposit_scheme}} (Scheme
                    Reference: {{deposit_scheme_ref}}). The Tenant has been
                    provided with the prescribed information about the protection
                    of the deposit.`,
          isMandatory: true
        }
      ]
    },
    {
      id: 'pets',
      title: '6. Pets',
      order: 6,
      isRequired: true,
      clauses: [
        {
          id: 'pet-request',
          title: 'Pet Requests',
          content: `The Tenant may make a written request to keep a pet at the
                    Property. The Landlord will respond within 42 days. The
                    Landlord may only refuse if there is a reasonable ground to
                    do so and must provide written reasons. The Landlord may
                    require the Tenant to obtain pet damage insurance.`,
          isMandatory: true,
          rraReference: 'RRA 2025, Section P'
        },
        {
          id: 'pet-current',
          title: 'Agreed Pets',
          content: `{{#if pets_allowed}}The following pets are permitted:
                    {{pet_details}}.{{else}}No pets have been agreed at the
                    start of this tenancy.{{/if}}`,
          isMandatory: false
        }
      ]
    },
    {
      id: 'repairs',
      title: '7. Repairs and Maintenance',
      order: 7,
      isRequired: true,
      clauses: [
        {
          id: 'landlord-repairs',
          title: 'Landlord Obligations',
          content: `The Landlord is responsible for maintaining the structure,
                    exterior, installations for water, gas, electricity,
                    sanitation, and heating. The Landlord will respond to repair
                    requests in accordance with Awaab's Law timeframes.`,
          isMandatory: true,
          rraReference: 'Awaab\'s Law'
        },
        {
          id: 'awaabs-law',
          title: 'Awaab\'s Law Compliance',
          content: `Emergency repairs will be addressed within 24 hours.
                    Non-emergency repairs affecting health and safety will be
                    addressed within 7 days. All other repairs within 28 days.`,
          isMandatory: true,
          rraReference: 'Awaab\'s Law'
        }
      ]
    },
    {
      id: 'compliance',
      title: '8. Compliance and Legal Information',
      order: 8,
      isRequired: true,
      clauses: [
        {
          id: 'ombudsman',
          title: 'Ombudsman Membership',
          content: `The Landlord is a member of {{ombudsman_scheme}}
                    (Membership Number: {{ombudsman_number}}). The Tenant may
                    refer complaints to this scheme.`,
          isMandatory: true,
          rraReference: 'RRA 2025, Section O'
        },
        {
          id: 'how-to-rent',
          title: 'How to Rent Guide',
          content: `The Tenant confirms receipt of the "How to Rent" guide
                    published by the Government.`,
          isMandatory: true
        },
        {
          id: 'epc',
          title: 'Energy Performance Certificate',
          content: `A valid EPC has been provided. Rating: {{epc_rating}},
                    Valid until: {{epc_expiry}}.`,
          isMandatory: true
        },
        {
          id: 'gas-safety',
          title: 'Gas Safety',
          content: `A valid Gas Safety Certificate has been provided, dated
                    {{gas_safety_date}}.`,
          isMandatory: true
        }
      ]
    },
    {
      id: 'signatures',
      title: '9. Signatures',
      order: 9,
      isRequired: true,
      clauses: [
        {
          id: 'signature-block',
          title: 'Agreement',
          content: `This agreement is entered into on {{agreement_date}}.

                    LANDLORD:
                    Signature: _______________________
                    Name: {{landlord_name}}
                    Date: _______________________

                    TENANT:
                    Signature: _______________________
                    Name: {{tenant_name}}
                    Date: _______________________`,
          isMandatory: true
        }
      ]
    }
  ]
};
```

---

## 8. User Flow

### Creating an Agreement

```
1. Landlord/Agent navigates to match with offer_accepted status
2. Clicks "Create Tenancy Agreement"
3. Template selection (default RRA 2025 AST)
4. Multi-step wizard begins:

   Step 1: Parties
   - Landlord details (auto-filled)
   - Agent details if applicable
   - Tenant details (auto-filled from match)

   Step 2: Property
   - Address (auto-filled)
   - EPC rating (auto-filled)
   - Property type

   Step 3: Rent & Deposit
   - Monthly rent amount
   - Payment day (1-28)
   - Payment method
   - Deposit amount (with RRA cap indicator)
   - Deposit scheme selection

   Step 4: Occupants
   - Main tenant (auto-filled)
   - Additional permitted occupants
   - Maximum occupancy

   Step 5: Pets
   - Current pet agreement
   - Pet details if applicable
   - Insurance requirements

   Step 6: Utilities
   - Included bills
   - Council tax responsibility
   - Garden maintenance

   Step 7: Compliance Check
   - Auto-validation against RRA 2025
   - Show errors that must be fixed
   - Show warnings/suggestions

   Step 8: Special Conditions
   - Add custom clauses
   - Review optional clauses

   Step 9: Review
   - Full agreement preview
   - Final compliance check
   - Edit any section

   Step 10: Generate & Send
   - Generate PDF
   - Preview PDF
   - Send for signatures

5. Agreement sent to signing portal (from Plan 1)
```

---

## 9. Implementation Phases

### Phase 1: Foundation (3-4 days)
- [ ] Database tables and types
- [ ] Default RRA 2025 template in database
- [ ] agreementCreatorService.ts core functions
- [ ] Compliance rules engine

### Phase 2: Wizard Steps 1-4 (3-4 days)
- [ ] AgreementCreatorWizard shell
- [ ] PartiesStep component
- [ ] PropertyStep component
- [ ] RentDepositStep with calculators
- [ ] OccupantsStep component

### Phase 3: Wizard Steps 5-8 (3-4 days)
- [ ] PetsStep component
- [ ] UtilitiesStep component
- [ ] ComplianceStep with real-time validation
- [ ] SpecialConditionsStep with clause selector

### Phase 4: Review & Generate (3-4 days)
- [ ] ReviewStep with full preview
- [ ] PDF generation service (pdf-lib)
- [ ] Variable substitution engine
- [ ] GenerateStep with send action

### Phase 5: Integration (2-3 days)
- [ ] Integration with Document Upload Portal (Plan 1)
- [ ] Link from MatchesPage
- [ ] Notifications for agreement ready
- [ ] Status tracking in matches

### Phase 6: Polish (2 days)
- [ ] RRA info tooltips and guidance
- [ ] Accessibility audit
- [ ] Mobile responsiveness
- [ ] Error handling

---

## 10. Dependencies

### NPM Packages

```json
{
  "pdf-lib": "^1.17.x",           // PDF generation
  "handlebars": "^4.7.x",         // Template variable substitution
  "date-fns": "^3.x"              // Date formatting
}
```

---

## 11. Future Enhancements

### Version 2 Features
- Custom template builder
- Clause library management
- Multi-language support
- Integration with Land Registry
- Rent guarantee insurance integration
- Reference checking integration
- Inventory management link

### Accessibility
- Screen reader support
- Keyboard navigation
- High contrast mode
- Plain English summaries

---

## 12. Legal Disclaimer

This tool generates agreements based on the Renters' Rights Act 2025 requirements as understood at development time. Landlords should:
- Seek independent legal advice
- Keep agreements updated with legislative changes
- Verify compliance with local authority requirements
- Ensure all prescribed information is provided

The generated agreement is a template and may need modification for specific circumstances.
