/**
 * Commission Service
 *
 * Handles commission calculations and tracking for estate agents
 * and management agencies.
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TYPES
// =====================================================

export type CommissionType = 'letting_fee' | 'management_fee' | 'renewal_fee' | 'finding_fee';
export type CommissionStatus = 'pending' | 'invoiced' | 'paid' | 'cancelled';

export interface Commission {
  id: string;
  agencyId: string;
  landlordId: string;
  propertyId: string;
  matchId?: string;

  type: CommissionType;
  description: string;

  // Financial
  baseAmount: number; // The rent or fee the commission is based on
  percentage: number; // Commission rate (e.g., 10 = 10%)
  amount: number; // Calculated commission amount
  currency: string;

  // Period (for recurring commissions)
  periodStart?: Date;
  periodEnd?: Date;

  // Status
  status: CommissionStatus;
  invoiceId?: string;
  paidAt?: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionSummary {
  agencyId: string;
  period: { from: Date; to: Date };

  // Totals
  totalEarned: number;
  totalPending: number;
  totalPaid: number;

  // Breakdown by type
  byType: {
    type: CommissionType;
    count: number;
    amount: number;
  }[];

  // Breakdown by landlord
  byLandlord: {
    landlordId: string;
    landlordName: string;
    count: number;
    amount: number;
  }[];

  // Breakdown by property
  byProperty: {
    propertyId: string;
    propertyAddress: string;
    count: number;
    amount: number;
  }[];
}

export interface CommissionRate {
  id: string;
  agencyId: string;
  landlordId?: string; // Optional: if set, specific to this landlord
  propertyId?: string; // Optional: if set, specific to this property

  type: CommissionType;
  percentage: number;
  minimumFee?: number;
  maximumFee?: number;

  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// DEFAULT COMMISSION RATES
// =====================================================

export const DEFAULT_COMMISSION_RATES: Omit<CommissionRate, 'id' | 'agencyId' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'letting_fee',
    percentage: 8, // 8% of annual rent (one month's rent)
    minimumFee: 500,
    effectiveFrom: new Date(),
    isActive: true,
  },
  {
    type: 'management_fee',
    percentage: 10, // 10% of monthly rent
    effectiveFrom: new Date(),
    isActive: true,
  },
  {
    type: 'renewal_fee',
    percentage: 4, // 4% of annual rent (half of letting fee)
    minimumFee: 250,
    effectiveFrom: new Date(),
    isActive: true,
  },
  {
    type: 'finding_fee',
    percentage: 6, // 6% of annual rent (tenant find only)
    minimumFee: 400,
    effectiveFrom: new Date(),
    isActive: true,
  },
];

// =====================================================
// COMMISSION SERVICE
// =====================================================

class CommissionService {
  // =====================================================
  // COMMISSION RATES
  // =====================================================

  /**
   * Get commission rates for an agency
   */
  async getCommissionRates(agencyId: string): Promise<CommissionRate[]> {
    const { data, error } = await supabase
      .from('commission_rates')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('is_active', true)
      .order('type');

    if (error) {
      console.error('Failed to get commission rates:', error);
      return this.getDefaultRates(agencyId);
    }

    return data.length > 0 ? data.map(this.transformRate) : this.getDefaultRates(agencyId);
  }

  /**
   * Get default rates for an agency
   */
  private getDefaultRates(agencyId: string): CommissionRate[] {
    return DEFAULT_COMMISSION_RATES.map((rate, idx) => ({
      ...rate,
      id: `default_${agencyId}_${idx}`,
      agencyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  /**
   * Get rate for specific type/landlord/property
   */
  async getApplicableRate(
    agencyId: string,
    type: CommissionType,
    landlordId?: string,
    propertyId?: string
  ): Promise<CommissionRate | null> {
    // Try to find specific rate for property
    if (propertyId) {
      const { data } = await supabase
        .from('commission_rates')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('type', type)
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .single();

      if (data) return this.transformRate(data);
    }

    // Try to find specific rate for landlord
    if (landlordId) {
      const { data } = await supabase
        .from('commission_rates')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('type', type)
        .eq('landlord_id', landlordId)
        .is('property_id', null)
        .eq('is_active', true)
        .single();

      if (data) return this.transformRate(data);
    }

    // Fall back to agency default
    const { data } = await supabase
      .from('commission_rates')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('type', type)
      .is('landlord_id', null)
      .is('property_id', null)
      .eq('is_active', true)
      .single();

    if (data) return this.transformRate(data);

    // Return hardcoded default
    const defaults = this.getDefaultRates(agencyId);
    return defaults.find(r => r.type === type) || null;
  }

  /**
   * Set custom commission rate
   */
  async setCommissionRate(rate: Omit<CommissionRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommissionRate | null> {
    const now = new Date();

    const { data, error } = await supabase
      .from('commission_rates')
      .upsert({
        agency_id: rate.agencyId,
        landlord_id: rate.landlordId || null,
        property_id: rate.propertyId || null,
        type: rate.type,
        percentage: rate.percentage,
        minimum_fee: rate.minimumFee || null,
        maximum_fee: rate.maximumFee || null,
        effective_from: rate.effectiveFrom.toISOString(),
        effective_to: rate.effectiveTo?.toISOString() || null,
        is_active: rate.isActive,
        updated_at: now.toISOString(),
      }, {
        onConflict: 'agency_id,landlord_id,property_id,type',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to set commission rate:', error);
      return null;
    }

    return this.transformRate(data);
  }

  // =====================================================
  // COMMISSION CALCULATION
  // =====================================================

  /**
   * Calculate letting fee (one-time, on new tenancy)
   */
  calculateLettingFee(
    monthlyRent: number,
    rate: CommissionRate
  ): number {
    const annualRent = monthlyRent * 12;
    let fee = (annualRent * rate.percentage) / 100;

    if (rate.minimumFee && fee < rate.minimumFee) {
      fee = rate.minimumFee;
    }
    if (rate.maximumFee && fee > rate.maximumFee) {
      fee = rate.maximumFee;
    }

    return Math.round(fee * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate monthly management fee
   */
  calculateManagementFee(
    monthlyRent: number,
    rate: CommissionRate
  ): number {
    let fee = (monthlyRent * rate.percentage) / 100;

    if (rate.minimumFee && fee < rate.minimumFee) {
      fee = rate.minimumFee;
    }
    if (rate.maximumFee && fee > rate.maximumFee) {
      fee = rate.maximumFee;
    }

    return Math.round(fee * 100) / 100;
  }

  // =====================================================
  // COMMISSION TRACKING
  // =====================================================

  /**
   * Create a commission record
   */
  async createCommission(
    commission: Omit<Commission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Commission | null> {
    const now = new Date();

    const { data, error } = await supabase
      .from('commissions')
      .insert({
        agency_id: commission.agencyId,
        landlord_id: commission.landlordId,
        property_id: commission.propertyId,
        match_id: commission.matchId || null,
        type: commission.type,
        description: commission.description,
        base_amount: commission.baseAmount,
        percentage: commission.percentage,
        amount: commission.amount,
        currency: commission.currency,
        period_start: commission.periodStart?.toISOString() || null,
        period_end: commission.periodEnd?.toISOString() || null,
        status: commission.status,
        invoice_id: commission.invoiceId || null,
        paid_at: commission.paidAt?.toISOString() || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create commission:', error);
      return null;
    }

    return this.transformCommission(data);
  }

  /**
   * Record letting fee when tenancy starts
   */
  async recordLettingFee(
    agencyId: string,
    landlordId: string,
    propertyId: string,
    matchId: string,
    monthlyRent: number
  ): Promise<Commission | null> {
    const rate = await this.getApplicableRate(agencyId, 'letting_fee', landlordId, propertyId);
    if (!rate) return null;

    const fee = this.calculateLettingFee(monthlyRent, rate);

    return this.createCommission({
      agencyId,
      landlordId,
      propertyId,
      matchId,
      type: 'letting_fee',
      description: `Letting fee for new tenancy`,
      baseAmount: monthlyRent * 12,
      percentage: rate.percentage,
      amount: fee,
      currency: 'GBP',
      status: 'pending',
    });
  }

  /**
   * Record monthly management fee
   */
  async recordManagementFee(
    agencyId: string,
    landlordId: string,
    propertyId: string,
    matchId: string,
    monthlyRent: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Commission | null> {
    const rate = await this.getApplicableRate(agencyId, 'management_fee', landlordId, propertyId);
    if (!rate) return null;

    const fee = this.calculateManagementFee(monthlyRent, rate);

    return this.createCommission({
      agencyId,
      landlordId,
      propertyId,
      matchId,
      type: 'management_fee',
      description: `Management fee for ${periodStart.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
      baseAmount: monthlyRent,
      percentage: rate.percentage,
      amount: fee,
      currency: 'GBP',
      periodStart,
      periodEnd,
      status: 'pending',
    });
  }

  /**
   * Get commissions for an agency
   */
  async getCommissions(
    agencyId: string,
    options?: {
      status?: CommissionStatus;
      type?: CommissionType;
      landlordId?: string;
      from?: Date;
      to?: Date;
      limit?: number;
    }
  ): Promise<Commission[]> {
    let query = supabase
      .from('commissions')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.landlordId) {
      query = query.eq('landlord_id', options.landlordId);
    }
    if (options?.from) {
      query = query.gte('created_at', options.from.toISOString());
    }
    if (options?.to) {
      query = query.lte('created_at', options.to.toISOString());
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get commissions:', error);
      return [];
    }

    return data.map(this.transformCommission);
  }

  /**
   * Get commission summary for an agency
   */
  async getCommissionSummary(
    agencyId: string,
    from: Date,
    to: Date
  ): Promise<CommissionSummary> {
    const commissions = await this.getCommissions(agencyId, { from, to });

    const summary: CommissionSummary = {
      agencyId,
      period: { from, to },
      totalEarned: 0,
      totalPending: 0,
      totalPaid: 0,
      byType: [],
      byLandlord: [],
      byProperty: [],
    };

    // Calculate totals
    const typeMap = new Map<CommissionType, { count: number; amount: number }>();
    const landlordMap = new Map<string, { count: number; amount: number }>();
    const propertyMap = new Map<string, { count: number; amount: number }>();

    for (const c of commissions) {
      summary.totalEarned += c.amount;

      if (c.status === 'paid') {
        summary.totalPaid += c.amount;
      } else if (c.status === 'pending' || c.status === 'invoiced') {
        summary.totalPending += c.amount;
      }

      // By type
      const typeEntry = typeMap.get(c.type) || { count: 0, amount: 0 };
      typeEntry.count++;
      typeEntry.amount += c.amount;
      typeMap.set(c.type, typeEntry);

      // By landlord
      const landlordEntry = landlordMap.get(c.landlordId) || { count: 0, amount: 0 };
      landlordEntry.count++;
      landlordEntry.amount += c.amount;
      landlordMap.set(c.landlordId, landlordEntry);

      // By property
      const propertyEntry = propertyMap.get(c.propertyId) || { count: 0, amount: 0 };
      propertyEntry.count++;
      propertyEntry.amount += c.amount;
      propertyMap.set(c.propertyId, propertyEntry);
    }

    summary.byType = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      ...data,
    }));

    summary.byLandlord = Array.from(landlordMap.entries()).map(([landlordId, data]) => ({
      landlordId,
      landlordName: '', // Would need to fetch from profiles
      ...data,
    }));

    summary.byProperty = Array.from(propertyMap.entries()).map(([propertyId, data]) => ({
      propertyId,
      propertyAddress: '', // Would need to fetch from properties
      ...data,
    }));

    return summary;
  }

  /**
   * Mark commission as paid
   */
  async markAsPaid(commissionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('commissions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commissionId);

    return !error;
  }

  // =====================================================
  // TRANSFORMERS
  // =====================================================

  private transformCommission(data: Record<string, unknown>): Commission {
    return {
      id: data.id as string,
      agencyId: data.agency_id as string,
      landlordId: data.landlord_id as string,
      propertyId: data.property_id as string,
      matchId: data.match_id as string | undefined,
      type: data.type as CommissionType,
      description: data.description as string,
      baseAmount: data.base_amount as number,
      percentage: data.percentage as number,
      amount: data.amount as number,
      currency: (data.currency as string) || 'GBP',
      periodStart: data.period_start ? new Date(data.period_start as string) : undefined,
      periodEnd: data.period_end ? new Date(data.period_end as string) : undefined,
      status: data.status as CommissionStatus,
      invoiceId: data.invoice_id as string | undefined,
      paidAt: data.paid_at ? new Date(data.paid_at as string) : undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private transformRate(data: Record<string, unknown>): CommissionRate {
    return {
      id: data.id as string,
      agencyId: data.agency_id as string,
      landlordId: data.landlord_id as string | undefined,
      propertyId: data.property_id as string | undefined,
      type: data.type as CommissionType,
      percentage: data.percentage as number,
      minimumFee: data.minimum_fee as number | undefined,
      maximumFee: data.maximum_fee as number | undefined,
      effectiveFrom: new Date(data.effective_from as string),
      effectiveTo: data.effective_to ? new Date(data.effective_to as string) : undefined,
      isActive: (data.is_active as boolean) ?? true,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }
}

// Export singleton instance
export const commissionService = new CommissionService();

// Export class for testing
export { CommissionService };
