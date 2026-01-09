-- =====================================================
-- Property Costs Table Migration
-- =====================================================
-- Creates the property_costs table for tracking recurring
-- and one-time costs associated with properties.
--
-- Created: 2026-01-08
-- =====================================================

-- Step 1: Create the property_costs table
CREATE TABLE IF NOT EXISTS property_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'mortgage',
        'insurance',
        'maintenance',
        'management_fee',
        'service_charge',
        'ground_rent',
        'utilities',
        'other'
    )),
    description TEXT NOT NULL DEFAULT '',
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    frequency TEXT NOT NULL CHECK (frequency IN (
        'monthly',
        'quarterly',
        'annually',
        'one_time'
    )),
    is_recurring BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Step 2: Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_property_costs_property_id
    ON property_costs(property_id);

CREATE INDEX IF NOT EXISTS idx_property_costs_category
    ON property_costs(category);

-- Step 3: Enable Row Level Security
ALTER TABLE property_costs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Policy: Users can view costs for properties they own or manage
CREATE POLICY "property_costs_select_policy" ON property_costs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_costs.property_id
            AND (
                p.landlord_id = auth.uid()
                OR p.managing_agency_id = auth.uid()
                OR p.marketing_agent_id = auth.uid()
            )
        )
    );

-- Policy: Users can insert costs for properties they own or manage
CREATE POLICY "property_costs_insert_policy" ON property_costs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_costs.property_id
            AND (
                p.landlord_id = auth.uid()
                OR p.managing_agency_id = auth.uid()
            )
        )
    );

-- Policy: Users can update costs for properties they own or manage
CREATE POLICY "property_costs_update_policy" ON property_costs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_costs.property_id
            AND (
                p.landlord_id = auth.uid()
                OR p.managing_agency_id = auth.uid()
            )
        )
    );

-- Policy: Users can delete costs for properties they own or manage
CREATE POLICY "property_costs_delete_policy" ON property_costs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_costs.property_id
            AND (
                p.landlord_id = auth.uid()
                OR p.managing_agency_id = auth.uid()
            )
        )
    );

-- Step 5: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_property_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_costs_updated_at_trigger
    BEFORE UPDATE ON property_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_property_costs_updated_at();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Property costs migration completed successfully!';
    RAISE NOTICE '   - Created property_costs table';
    RAISE NOTICE '   - Added indexes for property_id and category';
    RAISE NOTICE '   - Enabled RLS with CRUD policies';
    RAISE NOTICE '   - Added updated_at trigger';
END $$;
