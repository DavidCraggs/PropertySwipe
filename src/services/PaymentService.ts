/**
 * Payment Service
 *
 * Integrates with Stripe for subscription management and payments.
 * Handles subscription creation, updates, cancellation, and billing.
 */

import { supabase } from '../lib/supabase';

// =====================================================
// SUBSCRIPTION TIERS
// =====================================================

export type SubscriptionTierId = 'free' | 'basic' | 'professional' | 'enterprise';
export type BillingInterval = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
export type UserSubscriptionType = 'landlord' | 'agency';

export interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  description: string;
  monthlyPrice: number; // GBP
  annualPrice: number; // GBP (with discount)
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  features: string[];
  limits: {
    properties: number;
    users: number;
    reportsPerMonth: number;
    apiAccess: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    dataExport: boolean;
    analyticsAdvanced: boolean;
  };
  recommended?: boolean;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For landlords just getting started',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Up to 1 property',
      'Basic messaging',
      'Standard support',
      'Match notifications',
    ],
    limits: {
      properties: 1,
      users: 1,
      reportsPerMonth: 0,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
      dataExport: false,
      analyticsAdvanced: false,
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For landlords with a small portfolio',
    monthlyPrice: 29,
    annualPrice: 290, // 2 months free
    features: [
      'Up to 5 properties',
      'Basic reporting',
      'Email support',
      'Tenant screening insights',
      'Data export (CSV)',
    ],
    limits: {
      properties: 5,
      users: 1,
      reportsPerMonth: 5,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
      dataExport: true,
      analyticsAdvanced: false,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing landlords and small agencies',
    monthlyPrice: 99,
    annualPrice: 990, // 2 months free
    recommended: true,
    features: [
      'Up to 50 properties',
      'Advanced analytics dashboard',
      'Priority support',
      'API access',
      'Team members (up to 5)',
      'Custom reports',
      'Bulk data export',
    ],
    limits: {
      properties: 50,
      users: 5,
      reportsPerMonth: 50,
      apiAccess: true,
      prioritySupport: true,
      customBranding: false,
      dataExport: true,
      analyticsAdvanced: true,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large agencies and portfolios',
    monthlyPrice: 299,
    annualPrice: 2990, // 2 months free
    features: [
      'Unlimited properties',
      'White-label branding',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantees',
      'Unlimited team members',
      'Advanced API access',
      'Custom analytics',
    ],
    limits: {
      properties: Infinity,
      users: Infinity,
      reportsPerMonth: Infinity,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
      dataExport: true,
      analyticsAdvanced: true,
    },
  },
];

// =====================================================
// SUBSCRIPTION TYPES
// =====================================================

export interface UserSubscription {
  id: string;
  userId: string;
  userType: UserSubscriptionType;
  tierId: SubscriptionTierId;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;

  // Stripe references
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  // Billing info
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;

  // Trial
  trialStart?: Date;
  trialEnd?: Date;

  // Usage
  propertiesUsed: number;
  usersUsed: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string; // visa, mastercard, etc.
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  periodStart: Date;
  periodEnd: Date;
  paidAt?: Date;
  invoiceUrl?: string;
  invoicePdfUrl?: string;
  createdAt: Date;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
  expiresAt: Date;
}

// =====================================================
// PAYMENT SERVICE
// =====================================================

class PaymentService {
  private stripePublishableKey: string;

  constructor() {
    this.stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return Boolean(this.stripePublishableKey);
  }

  /**
   * Get all subscription tiers
   */
  getSubscriptionTiers(): SubscriptionTier[] {
    return SUBSCRIPTION_TIERS;
  }

  /**
   * Get a specific tier by ID
   */
  getTier(tierId: SubscriptionTierId): SubscriptionTier | undefined {
    return SUBSCRIPTION_TIERS.find(t => t.id === tierId);
  }

  /**
   * Calculate price with discount for annual billing
   */
  getPrice(tierId: SubscriptionTierId, interval: BillingInterval): number {
    const tier = this.getTier(tierId);
    if (!tier) return 0;
    return interval === 'annual' ? tier.annualPrice : tier.monthlyPrice;
  }

  /**
   * Get monthly equivalent for annual price (for display)
   */
  getMonthlyEquivalent(tierId: SubscriptionTierId): number {
    const tier = this.getTier(tierId);
    if (!tier) return 0;
    return Math.round(tier.annualPrice / 12);
  }

  /**
   * Calculate savings for annual billing
   */
  getAnnualSavings(tierId: SubscriptionTierId): number {
    const tier = this.getTier(tierId);
    if (!tier) return 0;
    return (tier.monthlyPrice * 12) - tier.annualPrice;
  }

  // =====================================================
  // SUBSCRIPTION MANAGEMENT
  // =====================================================

  /**
   * Get user's current subscription
   */
  async getSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to get subscription:', error);
      return null;
    }

    if (!data) {
      // Return default free subscription
      return this.createDefaultSubscription(userId);
    }

    return this.transformSubscription(data);
  }

  /**
   * Create default free subscription for new users
   */
  private async createDefaultSubscription(userId: string): Promise<UserSubscription> {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription: UserSubscription = {
      id: `sub_free_${userId}`,
      userId,
      userType: 'landlord',
      tierId: 'free',
      status: 'active',
      billingInterval: 'monthly',
      currentPeriodStart: now,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
      propertiesUsed: 0,
      usersUsed: 1,
      createdAt: now,
      updatedAt: now,
    };

    // Store in database
    await supabase.from('subscriptions').upsert({
      id: subscription.id,
      user_id: subscription.userId,
      user_type: subscription.userType,
      tier_id: subscription.tierId,
      status: subscription.status,
      billing_interval: subscription.billingInterval,
      current_period_start: subscription.currentPeriodStart.toISOString(),
      current_period_end: subscription.currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancelAtPeriodEnd,
      properties_used: subscription.propertiesUsed,
      users_used: subscription.usersUsed,
      created_at: subscription.createdAt.toISOString(),
      updated_at: subscription.updatedAt.toISOString(),
    }, { onConflict: 'user_id' });

    return subscription;
  }

  /**
   * Create checkout session for subscription upgrade
   * In production, this calls your backend which uses Stripe's server-side SDK
   */
  async createCheckoutSession(
    userId: string,
    tierId: SubscriptionTierId,
    interval: BillingInterval
  ): Promise<CheckoutSession> {
    // In production, this would call your backend API
    const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store pending checkout in database
    await supabase.from('checkout_sessions').insert({
      id: sessionId,
      user_id: userId,
      tier_id: tierId,
      billing_interval: interval,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
    });

    return {
      sessionId,
      url: `/checkout?session=${sessionId}`, // Would be Stripe URL in production
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  /**
   * Process successful checkout (called by webhook in production)
   */
  async processCheckoutSuccess(
    sessionId: string,
    stripeSubscriptionId: string,
    stripeCustomerId: string
  ): Promise<UserSubscription> {
    // Get checkout session
    const { data: session } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new Error('Checkout session not found');
    }

    const tier = this.getTier(session.tier_id);
    if (!tier) {
      throw new Error('Invalid tier');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (session.billing_interval === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Create/update subscription
    const subscription: UserSubscription = {
      id: `sub_${session.user_id}`,
      userId: session.user_id,
      userType: 'landlord',
      tierId: session.tier_id,
      status: 'active',
      billingInterval: session.billing_interval,
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      propertiesUsed: 0,
      usersUsed: 1,
      createdAt: now,
      updatedAt: now,
    };

    await supabase.from('subscriptions').upsert({
      id: subscription.id,
      user_id: subscription.userId,
      user_type: subscription.userType,
      tier_id: subscription.tierId,
      status: subscription.status,
      billing_interval: subscription.billingInterval,
      stripe_customer_id: subscription.stripeCustomerId,
      stripe_subscription_id: subscription.stripeSubscriptionId,
      current_period_start: subscription.currentPeriodStart.toISOString(),
      current_period_end: subscription.currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancelAtPeriodEnd,
      properties_used: subscription.propertiesUsed,
      users_used: subscription.usersUsed,
      created_at: subscription.createdAt.toISOString(),
      updated_at: subscription.updatedAt.toISOString(),
    }, { onConflict: 'user_id' });

    // Update checkout session status
    await supabase
      .from('checkout_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId);

    return subscription;
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }

    // In production, also cancel on Stripe
    return true;
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to reactivate subscription:', error);
      return false;
    }

    return true;
  }

  // =====================================================
  // USAGE TRACKING
  // =====================================================

  /**
   * Check if user can add more properties
   */
  async canAddProperty(userId: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;

    const tier = this.getTier(subscription.tierId);
    if (!tier) return false;

    return subscription.propertiesUsed < tier.limits.properties;
  }

  /**
   * Increment property usage
   */
  async incrementPropertyUsage(userId: string): Promise<boolean> {
    const canAdd = await this.canAddProperty(userId);
    if (!canAdd) return false;

    const { error } = await supabase.rpc('increment_property_usage', {
      p_user_id: userId,
    });

    return !error;
  }

  /**
   * Decrement property usage
   */
  async decrementPropertyUsage(userId: string): Promise<void> {
    await supabase.rpc('decrement_property_usage', {
      p_user_id: userId,
    });
  }

  /**
   * Check feature access
   */
  async hasFeatureAccess(userId: string, feature: keyof SubscriptionTier['limits']): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;

    const tier = this.getTier(subscription.tierId);
    if (!tier) return false;

    const value = tier.limits[feature];
    return typeof value === 'boolean' ? value : value > 0;
  }

  // =====================================================
  // BILLING HISTORY
  // =====================================================

  /**
   * Get invoices for a user
   */
  async getInvoices(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(24);

    if (error) {
      console.error('Failed to get invoices:', error);
      return [];
    }

    return data.map(this.transformInvoice);
  }

  /**
   * Get payment methods for a user
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Failed to get payment methods:', error);
      return [];
    }

    return data.map(this.transformPaymentMethod);
  }

  // =====================================================
  // DEMO/DEVELOPMENT HELPERS
  // =====================================================

  /**
   * Simulate subscription upgrade (for development/demo)
   */
  async simulateUpgrade(
    userId: string,
    tierId: SubscriptionTierId,
    interval: BillingInterval = 'monthly'
  ): Promise<UserSubscription> {
    const session = await this.createCheckoutSession(userId, tierId, interval);
    return this.processCheckoutSuccess(
      session.sessionId,
      `stripe_sub_${Date.now()}`,
      `stripe_cus_${Date.now()}`
    );
  }

  // =====================================================
  // TRANSFORMERS
  // =====================================================

  private transformSubscription(data: Record<string, unknown>): UserSubscription {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      userType: (data.user_type as UserSubscriptionType) || 'landlord',
      tierId: (data.tier_id as SubscriptionTierId) || 'free',
      status: (data.status as SubscriptionStatus) || 'active',
      billingInterval: (data.billing_interval as BillingInterval) || 'monthly',
      stripeCustomerId: data.stripe_customer_id as string | undefined,
      stripeSubscriptionId: data.stripe_subscription_id as string | undefined,
      currentPeriodStart: new Date(data.current_period_start as string),
      currentPeriodEnd: new Date(data.current_period_end as string),
      cancelAtPeriodEnd: (data.cancel_at_period_end as boolean) || false,
      canceledAt: data.canceled_at ? new Date(data.canceled_at as string) : undefined,
      trialStart: data.trial_start ? new Date(data.trial_start as string) : undefined,
      trialEnd: data.trial_end ? new Date(data.trial_end as string) : undefined,
      propertiesUsed: (data.properties_used as number) || 0,
      usersUsed: (data.users_used as number) || 1,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private transformInvoice(data: Record<string, unknown>): Invoice {
    return {
      id: data.id as string,
      subscriptionId: data.subscription_id as string,
      stripeInvoiceId: data.stripe_invoice_id as string | undefined,
      amount: (data.amount as number) || 0,
      currency: (data.currency as string) || 'gbp',
      status: (data.status as Invoice['status']) || 'draft',
      periodStart: new Date(data.period_start as string),
      periodEnd: new Date(data.period_end as string),
      paidAt: data.paid_at ? new Date(data.paid_at as string) : undefined,
      invoiceUrl: data.invoice_url as string | undefined,
      invoicePdfUrl: data.invoice_pdf_url as string | undefined,
      createdAt: new Date(data.created_at as string),
    };
  }

  private transformPaymentMethod(data: Record<string, unknown>): PaymentMethod {
    return {
      id: data.id as string,
      type: (data.type as 'card' | 'bank_account') || 'card',
      last4: (data.last4 as string) || '****',
      brand: data.brand as string | undefined,
      expiryMonth: data.expiry_month as number | undefined,
      expiryYear: data.expiry_year as number | undefined,
      isDefault: (data.is_default as boolean) || false,
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export class for testing
export { PaymentService };
