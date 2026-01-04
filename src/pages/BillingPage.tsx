/**
 * Billing Page
 *
 * Subscription management, payment methods, and invoice history.
 */

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  FileText,
  Settings,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  paymentService,
  type UserSubscription,
  type Invoice,
  type PaymentMethod,
} from '../services/PaymentService';
import { SubscriptionManager } from '../components/organisms/SubscriptionManager';

type Tab = 'plan' | 'payment' | 'invoices';

export const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      loadBillingData();
    }
  }, [currentUser?.id]);

  const loadBillingData = async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    try {
      const [sub, invs, pms] = await Promise.all([
        paymentService.getSubscription(currentUser.id),
        paymentService.getInvoices(currentUser.id),
        paymentService.getPaymentMethods(currentUser.id),
      ]);
      setSubscription(sub);
      setInvoices(invs);
      setPaymentMethods(pms);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentUser?.id) return;

    setIsCanceling(true);
    try {
      await paymentService.cancelSubscription(currentUser.id);
      await loadBillingData();
      setShowCancelConfirm(false);
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivate = async () => {
    if (!currentUser?.id) return;

    try {
      await paymentService.reactivateSubscription(currentUser.id);
      await loadBillingData();
    } catch (err) {
      console.error('Failed to reactivate subscription:', err);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Paid
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Open
          </span>
        );
      case 'void':
      case 'uncollectible':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const currentTier = subscription ? paymentService.getTier(subscription.tierId) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">
            Manage your subscription, payment methods, and view invoices.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-6">
            <TabButton
              active={activeTab === 'plan'}
              onClick={() => setActiveTab('plan')}
              icon={<Settings className="w-4 h-4" />}
              label="Subscription"
            />
            <TabButton
              active={activeTab === 'payment'}
              onClick={() => setActiveTab('payment')}
              icon={<CreditCard className="w-4 h-4" />}
              label="Payment Methods"
            />
            <TabButton
              active={activeTab === 'invoices'}
              onClick={() => setActiveTab('invoices')}
              icon={<FileText className="w-4 h-4" />}
              label="Invoices"
            />
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <div className="space-y-8">
            {/* Current plan summary */}
            {subscription && currentTier && (
              <div className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {currentTier.name}
                    </p>
                    <p className="text-gray-600 mt-1">
                      {currentTier.monthlyPrice === 0
                        ? 'Free forever'
                        : `£${currentTier.monthlyPrice}/month`}
                    </p>
                  </div>
                  <div className="text-right">
                    {subscription.cancelAtPeriodEnd ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                          <AlertTriangle className="w-4 h-4" />
                          Cancels {subscription.currentPeriodEnd.toLocaleDateString()}
                        </span>
                        <button
                          onClick={handleReactivate}
                          className="block mt-2 text-sm text-blue-600 hover:underline"
                        >
                          Reactivate subscription
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                        <p className="text-sm text-gray-500 mt-2">
                          Renews {subscription.currentPeriodEnd.toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Usage */}
                <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Properties Used</p>
                    <p className="text-lg font-semibold">
                      {subscription.propertiesUsed} / {currentTier.limits.properties === Infinity ? '∞' : currentTier.limits.properties}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Team Members</p>
                    <p className="text-lg font-semibold">
                      {subscription.usersUsed} / {currentTier.limits.users === Infinity ? '∞' : currentTier.limits.users}
                    </p>
                  </div>
                </div>

                {/* Cancel button */}
                {subscription.tierId !== 'free' && !subscription.cancelAtPeriodEnd && (
                  <div className="mt-6 pt-6 border-t">
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Cancel subscription
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Plan selector */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {subscription?.tierId === 'free' ? 'Upgrade Your Plan' : 'Change Plan'}
              </h2>
              <SubscriptionManager
                onUpgradeComplete={loadBillingData}
                showCurrentPlan={false}
              />
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>

              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No payment methods on file</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add a payment method when you upgrade to a paid plan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {pm.brand?.toUpperCase()} •••• {pm.last4}
                          </p>
                          {pm.expiryMonth && pm.expiryYear && (
                            <p className="text-sm text-gray-500">
                              Expires {pm.expiryMonth}/{pm.expiryYear}
                            </p>
                          )}
                        </div>
                      </div>
                      {pm.isDefault && (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button className="mt-4 text-sm text-blue-600 hover:underline">
                + Add payment method
              </button>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
              </div>

              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No invoices yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Invoices will appear here after your first payment.
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {invoice.createdAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          £{invoice.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {invoice.invoiceUrl && (
                              <a
                                href={invoice.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {invoice.invoicePdfUrl && (
                              <a
                                href={invoice.invoicePdfUrl}
                                download
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cancel Subscription?
              </h3>
              <p className="text-gray-600 mb-6">
                Your subscription will remain active until{' '}
                <strong>{subscription?.currentPeriodEnd.toLocaleDateString()}</strong>.
                After that, you'll be downgraded to the Free plan.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isCanceling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Yes, Cancel Subscription
                </button>

                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tab button component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors ${
      active
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default BillingPage;
