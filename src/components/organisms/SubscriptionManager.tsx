/**
 * Subscription Manager Component
 *
 * Displays subscription tiers and handles plan selection/upgrade.
 */

import React, { useState, useEffect } from 'react';
import { Check, Zap, Building2, Crown, Sparkles, Loader2 } from 'lucide-react';
import {
  paymentService,
  SUBSCRIPTION_TIERS,
  type SubscriptionTierId,
  type BillingInterval,
  type UserSubscription,
  type SubscriptionTier,
} from '../../services/PaymentService';
import { useAuthStore } from '../../hooks/useAuthStore';

interface SubscriptionManagerProps {
  onUpgradeComplete?: () => void;
  showCurrentPlan?: boolean;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  onUpgradeComplete,
  showCurrentPlan = true,
}) => {
  const { currentUser } = useAuthStore();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<SubscriptionTierId | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTierId | null>(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadSubscription();
    }
  }, [currentUser?.id]);

  const loadSubscription = async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      const sub = await paymentService.getSubscription(currentUser.id);
      setCurrentSubscription(sub);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTier = async (tierId: SubscriptionTierId) => {
    if (!currentUser?.id) return;

    // Can't downgrade to free or select current plan
    if (tierId === 'free' || tierId === currentSubscription?.tierId) return;

    setSelectedTier(tierId);

    // Check if Stripe is configured
    if (!paymentService.isConfigured()) {
      setShowDemoModal(true);
      return;
    }

    setUpgrading(tierId);
    try {
      const session = await paymentService.createCheckoutSession(
        currentUser.id,
        tierId,
        billingInterval
      );
      // In production, redirect to Stripe
      window.location.href = session.url;
    } catch (err) {
      console.error('Failed to create checkout:', err);
    } finally {
      setUpgrading(null);
    }
  };

  const handleDemoUpgrade = async () => {
    if (!currentUser?.id || !selectedTier) return;

    setUpgrading(selectedTier);
    try {
      const sub = await paymentService.simulateUpgrade(
        currentUser.id,
        selectedTier,
        billingInterval
      );
      setCurrentSubscription(sub);
      setShowDemoModal(false);
      onUpgradeComplete?.();
    } catch (err) {
      console.error('Demo upgrade failed:', err);
    } finally {
      setUpgrading(null);
    }
  };

  const getTierIcon = (tierId: SubscriptionTierId) => {
    switch (tierId) {
      case 'free':
        return <Sparkles className="w-6 h-6" />;
      case 'basic':
        return <Building2 className="w-6 h-6" />;
      case 'professional':
        return <Zap className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
    }
  };

  const getTierColor = (tierId: SubscriptionTierId, isSelected: boolean) => {
    if (isSelected) {
      return 'border-blue-500 bg-blue-50 ring-2 ring-blue-500';
    }
    switch (tierId) {
      case 'free':
        return 'border-gray-200 hover:border-gray-300';
      case 'basic':
        return 'border-blue-200 hover:border-blue-300';
      case 'professional':
        return 'border-purple-200 hover:border-purple-300';
      case 'enterprise':
        return 'border-amber-200 hover:border-amber-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing interval toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'annual'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-1 text-green-600 text-xs">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Subscription tiers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUBSCRIPTION_TIERS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            billingInterval={billingInterval}
            isCurrentPlan={currentSubscription?.tierId === tier.id}
            isUpgrading={upgrading === tier.id}
            onSelect={() => handleSelectTier(tier.id)}
            icon={getTierIcon(tier.id)}
            colorClass={getTierColor(tier.id, currentSubscription?.tierId === tier.id)}
          />
        ))}
      </div>

      {/* Current plan info */}
      {showCurrentPlan && currentSubscription && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            Current plan: <span className="font-semibold">{paymentService.getTier(currentSubscription.tierId)?.name}</span>
            {currentSubscription.cancelAtPeriodEnd && (
              <span className="ml-2 text-orange-600">(Cancels {currentSubscription.currentPeriodEnd.toLocaleDateString()})</span>
            )}
          </p>
        </div>
      )}

      {/* Demo mode modal */}
      {showDemoModal && selectedTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <Zap className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Demo: Stripe Checkout
              </h3>
              <p className="text-gray-600 mb-4">
                In production, this would redirect to Stripe Checkout.
                For demo purposes, simulate the upgrade:
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="font-medium">{paymentService.getTier(selectedTier)?.name} Plan</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{paymentService.getPrice(selectedTier, billingInterval)}
                  <span className="text-sm font-normal text-gray-500">
                    /{billingInterval === 'annual' ? 'year' : 'month'}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDemoUpgrade}
                  disabled={upgrading !== null}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {upgrading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Simulate Successful Payment
                </button>

                <button
                  onClick={() => setShowDemoModal(false)}
                  className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// TIER CARD COMPONENT
// =====================================================

interface TierCardProps {
  tier: SubscriptionTier;
  billingInterval: BillingInterval;
  isCurrentPlan: boolean;
  isUpgrading: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  colorClass: string;
}

const TierCard: React.FC<TierCardProps> = ({
  tier,
  billingInterval,
  isCurrentPlan,
  isUpgrading,
  onSelect,
  icon,
  colorClass,
}) => {
  // price is calculated but monthlyEquivalent is used for display
  const monthlyEquivalent = billingInterval === 'annual' ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice;
  const savings = billingInterval === 'annual' ? (tier.monthlyPrice * 12) - tier.annualPrice : 0;

  return (
    <div
      className={`relative rounded-xl border-2 p-6 transition-all ${colorClass} ${
        tier.recommended ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      {/* Recommended badge */}
      {tier.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Recommended
          </span>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${tier.recommended ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{tier.name}</h3>
          <p className="text-sm text-gray-500">{tier.description}</p>
        </div>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        {tier.id === 'free' ? (
          <div className="text-3xl font-bold text-gray-900">Free</div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">£{monthlyEquivalent}</span>
              <span className="text-gray-500">/month</span>
            </div>
            {billingInterval === 'annual' && savings > 0 && (
              <p className="text-sm text-green-600 mt-1">
                Save £{savings}/year (billed annually)
              </p>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {tier.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={onSelect}
        disabled={isCurrentPlan || tier.id === 'free' || isUpgrading}
        className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : tier.id === 'free'
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : tier.recommended
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {isUpgrading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : tier.id === 'free' ? (
          'Free Forever'
        ) : (
          'Upgrade'
        )}
      </button>
    </div>
  );
};

export default SubscriptionManager;
