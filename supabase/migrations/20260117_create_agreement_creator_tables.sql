-- =====================================================
-- RRA 2025 AGREEMENT CREATOR TABLES
-- Creates tables for agreement templates, clauses, and generated agreements
-- =====================================================

-- =====================================================
-- AGREEMENT TEMPLATES TABLE
-- System-provided and custom agreement templates
-- =====================================================

CREATE TABLE IF NOT EXISTS agreement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,                       -- e.g., "RRA2025-v1.0"

  -- Template content (JSON structure with sections and clauses)
  sections JSONB NOT NULL,

  -- Metadata
  is_system_template BOOLEAN DEFAULT FALSE,    -- Built-in vs user-created
  created_by UUID,                             -- NULL for system templates
  is_active BOOLEAN DEFAULT TRUE,

  -- RRA compliance
  rra_compliant BOOLEAN DEFAULT TRUE,
  last_compliance_check TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AGREEMENT CLAUSES TABLE
-- Reusable clauses library
-- =====================================================

CREATE TABLE IF NOT EXISTS agreement_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  -- Categories: parties, property, term, rent, deposit, repairs, pets, termination, property_use, utilities, insurance, compliance, signatures

  title TEXT NOT NULL,
  content TEXT NOT NULL,                       -- The actual clause text with {{variables}}

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

-- =====================================================
-- GENERATED AGREEMENTS TABLE
-- Instances created from templates
-- =====================================================

CREATE TABLE IF NOT EXISTS generated_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES agreement_templates(id),
  match_id UUID REFERENCES matches(id) NOT NULL,

  -- Parties
  landlord_id UUID NOT NULL,
  agency_id UUID,
  renter_id UUID NOT NULL,
  property_id UUID NOT NULL,

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
      ...
    }
  */

  -- Generated document
  generated_pdf_path TEXT,
  generated_at TIMESTAMPTZ,

  -- Link to tenancy_agreements for signing
  tenancy_agreement_id UUID REFERENCES tenancy_agreements(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  -- Values: draft, generated, sent_for_signing, signed, cancelled

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_agreement_templates_active ON agreement_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_agreement_templates_system ON agreement_templates(is_system_template);

CREATE INDEX IF NOT EXISTS idx_agreement_clauses_category ON agreement_clauses(category);
CREATE INDEX IF NOT EXISTS idx_agreement_clauses_mandatory ON agreement_clauses(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_agreement_clauses_active ON agreement_clauses(is_active);

CREATE INDEX IF NOT EXISTS idx_generated_agreements_match ON generated_agreements(match_id);
CREATE INDEX IF NOT EXISTS idx_generated_agreements_status ON generated_agreements(status);
CREATE INDEX IF NOT EXISTS idx_generated_agreements_landlord ON generated_agreements(landlord_id);
CREATE INDEX IF NOT EXISTS idx_generated_agreements_renter ON generated_agreements(renter_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE agreement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_agreements ENABLE ROW LEVEL SECURITY;

-- Templates: Anyone can read active templates, only creators can modify their own
CREATE POLICY "agreement_templates_select_active" ON agreement_templates
  FOR SELECT USING (is_active = TRUE OR created_by = auth.uid());

CREATE POLICY "agreement_templates_insert" ON agreement_templates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "agreement_templates_update_own" ON agreement_templates
  FOR UPDATE USING (created_by = auth.uid() OR is_system_template = FALSE);

-- Clauses: Anyone can read active clauses
CREATE POLICY "agreement_clauses_select_active" ON agreement_clauses
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "agreement_clauses_insert" ON agreement_clauses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Generated agreements: Only involved parties can access
CREATE POLICY "generated_agreements_select_party" ON generated_agreements
  FOR SELECT USING (
    landlord_id = auth.uid() OR
    renter_id = auth.uid() OR
    agency_id = auth.uid() OR
    created_by = auth.uid()
  );

CREATE POLICY "generated_agreements_insert" ON generated_agreements
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "generated_agreements_update_creator" ON generated_agreements
  FOR UPDATE USING (
    created_by = auth.uid() OR
    landlord_id = auth.uid() OR
    agency_id = auth.uid()
  );

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER agreement_templates_updated_at
  BEFORE UPDATE ON agreement_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generated_agreements_updated_at
  BEFORE UPDATE ON generated_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT RRA 2025 TEMPLATE
-- =====================================================

INSERT INTO agreement_templates (
  id,
  name,
  description,
  version,
  is_system_template,
  rra_compliant,
  last_compliance_check,
  sections
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'RRA 2025 Assured Shorthold Tenancy Agreement',
  'Fully compliant periodic tenancy agreement under Renters Rights Act 2025. This template includes all mandatory clauses and complies with deposit caps, notice periods, and pet request requirements.',
  'RRA2025-v1.0',
  TRUE,
  TRUE,
  NOW(),
  '[
    {
      "id": "parties",
      "title": "1. Parties to this Agreement",
      "order": 1,
      "isRequired": true,
      "clauses": [
        {
          "id": "landlord-details",
          "title": "Landlord",
          "content": "The Landlord is {{landlord_name}} of {{landlord_address}}, PRS Registration Number: {{prs_registration_number}}.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "parties",
          "variables": [
            {"name": "landlord_name", "type": "text", "label": "Landlord Name", "required": true},
            {"name": "landlord_address", "type": "text", "label": "Landlord Address", "required": true},
            {"name": "prs_registration_number", "type": "text", "label": "PRS Registration Number", "required": true}
          ]
        },
        {
          "id": "tenant-details",
          "title": "Tenant",
          "content": "The Tenant is {{tenant_name}}.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "parties",
          "variables": [
            {"name": "tenant_name", "type": "text", "label": "Tenant Name", "required": true}
          ]
        },
        {
          "id": "agent-details",
          "title": "Managing Agent",
          "content": "The property is managed by {{agent_name}} of {{agent_address}} on behalf of the Landlord.",
          "isMandatory": false,
          "isProhibited": false,
          "category": "parties",
          "variables": [
            {"name": "agent_name", "type": "text", "label": "Agent Name", "required": false},
            {"name": "agent_address", "type": "text", "label": "Agent Address", "required": false}
          ]
        }
      ]
    },
    {
      "id": "property",
      "title": "2. The Property",
      "order": 2,
      "isRequired": true,
      "clauses": [
        {
          "id": "property-address",
          "title": "Property Address",
          "content": "The property let under this agreement is {{property_address}} (\"the Property\").",
          "isMandatory": true,
          "isProhibited": false,
          "category": "property",
          "variables": [
            {"name": "property_address", "type": "text", "label": "Full Property Address", "required": true}
          ]
        },
        {
          "id": "property-condition",
          "title": "Property Condition",
          "content": "The Property meets the Decent Homes Standard and complies with Awaab''s Law requirements. The current EPC Rating is {{epc_rating}}, valid until {{epc_expiry_date}}.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "property",
          "rraReference": "Decent Homes Standard",
          "variables": [
            {"name": "epc_rating", "type": "select", "label": "EPC Rating", "required": true, "options": ["A", "B", "C", "D", "E", "F", "G"]},
            {"name": "epc_expiry_date", "type": "date", "label": "EPC Expiry Date", "required": true}
          ]
        },
        {
          "id": "property-contents",
          "title": "Furnished Status",
          "content": "The Property is let {{furnishing_level}}. {{#if inventory_included}}An inventory and schedule of condition will be prepared and agreed by both parties at the start of the tenancy.{{/if}}",
          "isMandatory": false,
          "isProhibited": false,
          "category": "property",
          "variables": [
            {"name": "furnishing_level", "type": "select", "label": "Furnishing Level", "required": true, "options": ["unfurnished", "part furnished", "fully furnished"]},
            {"name": "inventory_included", "type": "boolean", "label": "Include Inventory", "required": false, "defaultValue": true}
          ]
        }
      ]
    },
    {
      "id": "term",
      "title": "3. Term of Tenancy",
      "order": 3,
      "isRequired": true,
      "clauses": [
        {
          "id": "periodic-tenancy",
          "title": "Periodic Tenancy",
          "content": "This is a periodic assured shorthold tenancy commencing on {{start_date}} and continuing on a rolling monthly basis until terminated in accordance with this agreement. Under the Renters'' Rights Act 2025, fixed-term tenancies are no longer permitted for new tenancies.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "term",
          "rraReference": "RRA 2025 - Periodic tenancies only",
          "variables": [
            {"name": "start_date", "type": "date", "label": "Tenancy Start Date", "required": true}
          ]
        },
        {
          "id": "tenant-notice",
          "title": "Tenant Notice to Quit",
          "content": "The Tenant may end this tenancy by giving the Landlord at least 2 months'' written notice. Notice must be given in writing and will take effect at the end of a rental period.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "term",
          "rraReference": "RRA 2025 - Tenant notice periods"
        },
        {
          "id": "landlord-notice",
          "title": "Landlord Notice Requirements",
          "content": "The Landlord may only seek possession on specific grounds as defined in the Housing Act 1988 (as amended by the Renters'' Rights Act 2025) and must give at least 2 months'' notice using the appropriate legal notice. Section 21 ''no fault'' evictions have been abolished.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "term",
          "rraReference": "RRA 2025 - Section 21 abolished"
        }
      ]
    },
    {
      "id": "rent",
      "title": "4. Rent",
      "order": 4,
      "isRequired": true,
      "clauses": [
        {
          "id": "rent-amount",
          "title": "Rent Payment",
          "content": "The rent is £{{rent_amount}} per calendar month, payable in advance on the {{payment_day}} day of each month by {{payment_method}}. The first payment of rent is due on the start date of this tenancy.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "rent",
          "variables": [
            {"name": "rent_amount", "type": "number", "label": "Monthly Rent (£)", "required": true, "validation": {"min": 1}},
            {"name": "payment_day", "type": "number", "label": "Payment Day of Month", "required": true, "validation": {"min": 1, "max": 28}},
            {"name": "payment_method", "type": "select", "label": "Payment Method", "required": true, "options": ["bank transfer", "standing order", "direct debit"]}
          ]
        },
        {
          "id": "rent-increase",
          "title": "Rent Review",
          "content": "The Landlord may increase the rent no more than once in any 12-month period. Any increase must be to market rate and the Landlord must give at least 2 months'' notice using the prescribed Section 13 notice. The Tenant has the right to refer the proposed increase to the First-tier Tribunal (Property Chamber) if they believe the proposed rent exceeds the market rate.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "rent",
          "rraReference": "RRA 2025 - Rent increase limits"
        },
        {
          "id": "rent-arrears",
          "title": "Rent Arrears",
          "content": "If rent is not paid within 14 days of the due date, the Landlord may charge interest on the outstanding amount at a rate of 3% above the Bank of England base rate. Persistent rent arrears may constitute grounds for possession under Ground 8, 10, or 11 of Schedule 2 to the Housing Act 1988.",
          "isMandatory": false,
          "isProhibited": false,
          "category": "rent"
        }
      ]
    },
    {
      "id": "deposit",
      "title": "5. Deposit",
      "order": 5,
      "isRequired": true,
      "clauses": [
        {
          "id": "deposit-amount",
          "title": "Deposit Amount",
          "content": "A deposit of £{{deposit_amount}} has been paid. This represents {{deposit_weeks}} weeks'' rent and does not exceed the maximum permitted under the Tenant Fees Act 2019 (5 weeks'' rent where annual rent is below £50,000, or 6 weeks'' rent where annual rent is £50,000 or above).",
          "isMandatory": true,
          "isProhibited": false,
          "category": "deposit",
          "rraReference": "Tenant Fees Act 2019",
          "variables": [
            {"name": "deposit_amount", "type": "number", "label": "Deposit Amount (£)", "required": true, "validation": {"min": 0}},
            {"name": "deposit_weeks", "type": "number", "label": "Deposit in Weeks", "required": true, "validation": {"min": 0, "max": 6}}
          ]
        },
        {
          "id": "deposit-protection",
          "title": "Deposit Protection",
          "content": "The deposit is protected with {{deposit_scheme}} (Scheme Reference: {{deposit_scheme_ref}}). The deposit was protected on {{deposit_protected_date}}. The Tenant has been provided with the prescribed information about the protection of the deposit within 30 days of receiving the deposit.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "deposit",
          "rraReference": "Housing Act 2004",
          "variables": [
            {"name": "deposit_scheme", "type": "select", "label": "Deposit Protection Scheme", "required": true, "options": ["DPS (Deposit Protection Service)", "TDS (Tenancy Deposit Scheme)", "MyDeposits"]},
            {"name": "deposit_scheme_ref", "type": "text", "label": "Scheme Reference Number", "required": false},
            {"name": "deposit_protected_date", "type": "date", "label": "Date Deposit Protected", "required": false}
          ]
        },
        {
          "id": "deposit-deductions",
          "title": "Deposit Deductions",
          "content": "At the end of the tenancy, the deposit may be used to cover: (a) any damage to the Property beyond fair wear and tear; (b) any missing items listed on the inventory; (c) any outstanding rent or other sums owed; (d) cleaning costs if the Property is not returned in a reasonably clean condition. Any deductions will be itemised and evidenced.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "deposit"
        }
      ]
    },
    {
      "id": "pets",
      "title": "6. Pets",
      "order": 6,
      "isRequired": true,
      "clauses": [
        {
          "id": "pet-request",
          "title": "Pet Requests",
          "content": "The Tenant may make a written request to keep a pet at the Property. The Landlord will respond in writing within 42 days. The Landlord may only refuse if there is a reasonable ground to do so (such as the property being unsuitable for the type of pet, or where keeping a pet would breach a superior lease) and must provide written reasons for any refusal. The Landlord may require the Tenant to obtain pet damage insurance as a condition of consent.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "pets",
          "rraReference": "RRA 2025 - Pet provisions"
        },
        {
          "id": "pet-current",
          "title": "Agreed Pets",
          "content": "{{#if pets_allowed}}The following pets are permitted at the Property: {{pet_details}}. The Tenant agrees to keep the pet(s) under control and to clean up after them. The Tenant is responsible for any damage caused by the pet(s).{{else}}No pets have been agreed at the start of this tenancy. The Tenant may request permission to keep a pet at any time during the tenancy.{{/if}}",
          "isMandatory": false,
          "isProhibited": false,
          "category": "pets",
          "variables": [
            {"name": "pets_allowed", "type": "boolean", "label": "Pets Agreed at Start", "required": true, "defaultValue": false},
            {"name": "pet_details", "type": "text", "label": "Pet Details", "required": false}
          ]
        }
      ]
    },
    {
      "id": "repairs",
      "title": "7. Repairs and Maintenance",
      "order": 7,
      "isRequired": true,
      "clauses": [
        {
          "id": "landlord-repairs",
          "title": "Landlord Obligations",
          "content": "The Landlord is responsible for: (a) the structure and exterior of the Property; (b) installations for the supply of water, gas and electricity; (c) installations for sanitation, including basins, sinks, baths and toilets; (d) installations for space heating and heating water; (e) ensuring the Property meets the Decent Homes Standard throughout the tenancy.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "repairs",
          "rraReference": "Landlord and Tenant Act 1985, Section 11"
        },
        {
          "id": "awaabs-law",
          "title": "Awaab''s Law Compliance",
          "content": "The Landlord will respond to repair requests in accordance with Awaab''s Law timeframes: Emergency repairs affecting health and safety will be made safe within 24 hours; Urgent repairs will be addressed within 7 days; Non-urgent repairs will be completed within 28 days. The Tenant must report any repairs needed as soon as reasonably practicable.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "repairs",
          "rraReference": "Awaab''s Law"
        },
        {
          "id": "tenant-obligations",
          "title": "Tenant Maintenance",
          "content": "The Tenant agrees to: (a) keep the interior in a clean and tidy condition; (b) not damage or permit damage to the Property; (c) report any repairs needed promptly; (d) allow reasonable access for repairs with appropriate notice; (e) use the Property in a tenant-like manner.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "repairs"
        }
      ]
    },
    {
      "id": "utilities",
      "title": "8. Utilities and Council Tax",
      "order": 8,
      "isRequired": true,
      "clauses": [
        {
          "id": "utilities-responsibility",
          "title": "Utility Bills",
          "content": "{{#if utilities_included}}The following utilities are included in the rent: {{included_utilities}}. The Tenant is responsible for all other utility costs.{{else}}The Tenant is responsible for all utility bills including gas, electricity, water, and broadband. The Tenant must register with utility providers and ensure bills are paid on time.{{/if}}",
          "isMandatory": true,
          "isProhibited": false,
          "category": "utilities",
          "variables": [
            {"name": "utilities_included", "type": "boolean", "label": "Any Utilities Included", "required": true, "defaultValue": false},
            {"name": "included_utilities", "type": "text", "label": "Included Utilities", "required": false}
          ]
        },
        {
          "id": "council-tax",
          "title": "Council Tax",
          "content": "The {{council_tax_responsibility}} is responsible for Council Tax. {{#if council_tax_band}}The Property is in Council Tax Band {{council_tax_band}}.{{/if}}",
          "isMandatory": true,
          "isProhibited": false,
          "category": "utilities",
          "variables": [
            {"name": "council_tax_responsibility", "type": "select", "label": "Council Tax Responsibility", "required": true, "options": ["Tenant", "Landlord"]},
            {"name": "council_tax_band", "type": "select", "label": "Council Tax Band", "required": false, "options": ["A", "B", "C", "D", "E", "F", "G", "H"]}
          ]
        }
      ]
    },
    {
      "id": "compliance",
      "title": "9. Compliance and Legal Information",
      "order": 9,
      "isRequired": true,
      "clauses": [
        {
          "id": "prs-registration",
          "title": "PRS Registration",
          "content": "The Landlord is registered with the Private Rented Sector Database. Registration Number: {{prs_registration_number}}. The Tenant may verify this registration at the PRS Database website.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "compliance",
          "rraReference": "RRA 2025 - PRS Database",
          "variables": [
            {"name": "prs_registration_number", "type": "text", "label": "PRS Registration Number", "required": true}
          ]
        },
        {
          "id": "ombudsman",
          "title": "Ombudsman Membership",
          "content": "The Landlord is a member of {{ombudsman_scheme}} (Membership Number: {{ombudsman_membership_number}}). The Tenant may refer complaints to this scheme if unable to resolve issues directly with the Landlord.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "compliance",
          "rraReference": "RRA 2025 - Ombudsman requirement",
          "variables": [
            {"name": "ombudsman_scheme", "type": "select", "label": "Ombudsman Scheme", "required": true, "options": ["Housing Ombudsman Service", "Property Ombudsman", "Property Redress Scheme"]},
            {"name": "ombudsman_membership_number", "type": "text", "label": "Membership Number", "required": true}
          ]
        },
        {
          "id": "how-to-rent",
          "title": "How to Rent Guide",
          "content": "The Tenant confirms receipt of the Government ''How to Rent'' guide, which provides information about tenants'' rights and responsibilities.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "compliance"
        },
        {
          "id": "gas-safety",
          "title": "Gas Safety",
          "content": "{{#if has_gas}}A valid Gas Safety Certificate has been provided, dated {{gas_safety_date}}. A new certificate will be provided annually. The Tenant must allow access for the annual gas safety inspection.{{else}}The Property does not have a gas supply.{{/if}}",
          "isMandatory": true,
          "isProhibited": false,
          "category": "compliance",
          "rraReference": "Gas Safety (Installation and Use) Regulations 1998",
          "variables": [
            {"name": "has_gas", "type": "boolean", "label": "Property Has Gas", "required": true, "defaultValue": true},
            {"name": "gas_safety_date", "type": "date", "label": "Gas Safety Certificate Date", "required": false}
          ]
        },
        {
          "id": "electrical-safety",
          "title": "Electrical Safety",
          "content": "A valid Electrical Installation Condition Report (EICR) has been provided, dated {{eicr_date}}. The report confirms the electrical installations are satisfactory.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "compliance",
          "rraReference": "Electrical Safety Standards Regulations 2020",
          "variables": [
            {"name": "eicr_date", "type": "date", "label": "EICR Date", "required": true}
          ]
        }
      ]
    },
    {
      "id": "general",
      "title": "10. General Terms",
      "order": 10,
      "isRequired": true,
      "clauses": [
        {
          "id": "property-use",
          "title": "Use of Property",
          "content": "The Tenant agrees to: (a) use the Property as a private residence only; (b) not use the Property for any business or commercial purpose without written consent; (c) not cause nuisance or annoyance to neighbours; (d) comply with all laws and regulations.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "property_use"
        },
        {
          "id": "alterations",
          "title": "Alterations",
          "content": "The Tenant must not make any alterations to the Property without the prior written consent of the Landlord. This includes decorating, installing fixtures, or making structural changes.",
          "isMandatory": false,
          "isProhibited": false,
          "category": "property_use"
        },
        {
          "id": "access",
          "title": "Access",
          "content": "The Landlord may enter the Property to inspect its condition, carry out repairs, or show prospective tenants (in the last 2 months of tenancy). The Landlord will give at least 24 hours'' written notice except in emergency.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "property_use"
        },
        {
          "id": "insurance",
          "title": "Insurance",
          "content": "The Landlord is responsible for buildings insurance. The Tenant is responsible for insuring their own belongings (contents insurance) and is advised to obtain appropriate cover.",
          "isMandatory": true,
          "isProhibited": false,
          "category": "insurance"
        }
      ]
    },
    {
      "id": "special-conditions",
      "title": "11. Special Conditions",
      "order": 11,
      "isRequired": false,
      "clauses": [
        {
          "id": "parking",
          "title": "Parking",
          "content": "{{#if parking_included}}Parking is included at {{parking_details}}.{{else}}No parking is included with this tenancy.{{/if}}",
          "isMandatory": false,
          "isProhibited": false,
          "category": "property",
          "variables": [
            {"name": "parking_included", "type": "boolean", "label": "Parking Included", "required": true, "defaultValue": false},
            {"name": "parking_details", "type": "text", "label": "Parking Details", "required": false}
          ]
        },
        {
          "id": "garden",
          "title": "Garden Maintenance",
          "content": "{{#if has_garden}}Garden maintenance is the responsibility of the {{garden_maintenance}}. The garden must be kept in a reasonable condition.{{/if}}",
          "isMandatory": false,
          "isProhibited": false,
          "category": "property",
          "variables": [
            {"name": "has_garden", "type": "boolean", "label": "Property Has Garden", "required": true, "defaultValue": false},
            {"name": "garden_maintenance", "type": "select", "label": "Garden Maintenance", "required": false, "options": ["Tenant", "Landlord", "shared"]}
          ]
        },
        {
          "id": "additional-conditions",
          "title": "Additional Conditions",
          "content": "{{#if additional_conditions}}The following additional conditions apply:\n{{additional_conditions}}{{/if}}",
          "isMandatory": false,
          "isProhibited": false,
          "category": "special",
          "variables": [
            {"name": "additional_conditions", "type": "text", "label": "Additional Conditions", "required": false}
          ]
        }
      ]
    },
    {
      "id": "signatures",
      "title": "12. Signatures",
      "order": 12,
      "isRequired": true,
      "clauses": [
        {
          "id": "signature-block",
          "title": "Agreement and Signatures",
          "content": "By signing this agreement, both parties confirm they have read, understood and agree to be bound by the terms set out above.\n\nThis agreement is entered into on {{agreement_date}}.\n\n---\n\nLANDLORD/AGENT:\nSignature: _________________________\nName: {{landlord_name}}\nDate: _________________________\n\n---\n\nTENANT:\nSignature: _________________________\nName: {{tenant_name}}\nDate: _________________________",
          "isMandatory": true,
          "isProhibited": false,
          "category": "signatures",
          "variables": [
            {"name": "agreement_date", "type": "date", "label": "Agreement Date", "required": true}
          ]
        }
      ]
    }
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  sections = EXCLUDED.sections,
  version = EXCLUDED.version,
  updated_at = NOW();

-- =====================================================
-- INSERT MANDATORY CLAUSES INTO CLAUSE LIBRARY
-- =====================================================

INSERT INTO agreement_clauses (id, category, title, content, is_mandatory, is_system_clause, rra_reference) VALUES
('c0000000-0000-0000-0000-000000000001', 'term', 'Periodic Tenancy (Mandatory)', 'This is a periodic assured shorthold tenancy. Fixed-term tenancies are not permitted under the Renters'' Rights Act 2025.', TRUE, TRUE, 'RRA 2025'),
('c0000000-0000-0000-0000-000000000002', 'term', 'Tenant Notice Period (Mandatory)', 'The Tenant may end this tenancy by giving at least 2 months'' written notice.', TRUE, TRUE, 'RRA 2025'),
('c0000000-0000-0000-0000-000000000003', 'term', 'No Section 21 (Mandatory)', 'The Landlord may only seek possession on specific grounds. Section 21 no-fault evictions have been abolished.', TRUE, TRUE, 'RRA 2025 - S21 abolished'),
('c0000000-0000-0000-0000-000000000004', 'rent', 'Rent Increase Limits (Mandatory)', 'Rent may only be increased once per 12-month period to market rate with 2 months'' notice.', TRUE, TRUE, 'RRA 2025'),
('c0000000-0000-0000-0000-000000000005', 'deposit', 'Deposit Cap (Mandatory)', 'The deposit must not exceed 5 weeks'' rent (or 6 weeks for annual rent over £50,000).', TRUE, TRUE, 'Tenant Fees Act 2019'),
('c0000000-0000-0000-0000-000000000006', 'pets', 'Pet Requests (Mandatory)', 'Tenants may request to keep a pet. Landlords must respond within 42 days and can only refuse with valid written reasons.', TRUE, TRUE, 'RRA 2025'),
('c0000000-0000-0000-0000-000000000007', 'repairs', 'Awaab''s Law (Mandatory)', 'Landlords must respond to repairs within prescribed timeframes: emergencies 24 hours, urgent 7 days, non-urgent 28 days.', TRUE, TRUE, 'Awaab''s Law'),
('c0000000-0000-0000-0000-000000000008', 'compliance', 'PRS Registration (Mandatory)', 'The Landlord must be registered with the Private Rented Sector Database.', TRUE, TRUE, 'RRA 2025'),
('c0000000-0000-0000-0000-000000000009', 'compliance', 'Ombudsman Membership (Mandatory)', 'The Landlord must be a member of an approved ombudsman scheme.', TRUE, TRUE, 'RRA 2025')
ON CONFLICT (id) DO NOTHING;

-- Insert prohibited clauses
INSERT INTO agreement_clauses (id, category, title, content, is_prohibited, is_system_clause, rra_reference) VALUES
('c0000000-0000-0000-0000-000000000010', 'term', 'Fixed Term Tenancy (PROHIBITED)', 'Fixed-term tenancies are prohibited under RRA 2025.', TRUE, TRUE, 'RRA 2025'),
('c0000000-0000-0000-0000-000000000011', 'term', 'Section 21 Notice (PROHIBITED)', 'Section 21 no-fault evictions are prohibited under RRA 2025.', TRUE, TRUE, 'RRA 2025'),
('c0000000-0000-0000-0000-000000000012', 'pets', 'Blanket Pet Ban (PROHIBITED)', 'Blanket bans on pets are prohibited. Landlords must consider pet requests.', TRUE, TRUE, 'RRA 2025'),
('c0000000-0000-0000-0000-000000000013', 'rent', 'Multiple Rent Increases (PROHIBITED)', 'Increasing rent more than once per year is prohibited.', TRUE, TRUE, 'RRA 2025'),
('c0000000-0000-0000-0000-000000000014', 'rent', 'Rent in Advance Over 1 Month (PROHIBITED)', 'Requesting more than 1 month rent in advance is prohibited.', TRUE, TRUE, 'Tenant Fees Act 2019')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Agreement Creator tables migration completed successfully!';
  RAISE NOTICE '  - Created agreement_templates table';
  RAISE NOTICE '  - Created agreement_clauses table';
  RAISE NOTICE '  - Created generated_agreements table';
  RAISE NOTICE '  - Added indexes and RLS policies';
  RAISE NOTICE '  - Inserted default RRA 2025 AST template';
  RAISE NOTICE '  - Inserted mandatory and prohibited clauses';
END $$;
