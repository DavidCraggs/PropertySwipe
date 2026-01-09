import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PoundSterling,
  Users,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuthStore';
import { getPropertiesWithDetails } from '../../lib/storage';
import type { LandlordProfile, PropertyWithDetails } from '../../types';

interface PortfolioFinancialsProps {
  onManageCosts?: () => void;
  onViewAll?: () => void;
}

/**
 * Portfolio financial summary dashboard card
 * Shows occupancy, income, costs, and profit overview
 */
export function PortfolioFinancials({
  onManageCosts,
  onViewAll,
}: PortfolioFinancialsProps) {
  const { currentUser } = useAuthStore();
  const landlordProfile = currentUser as LandlordProfile;

  const [properties, setProperties] = useState<PropertyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Load properties with financial details
  useEffect(() => {
    const loadData = async () => {
      if (!landlordProfile?.id) return;
      setLoading(true);
      try {
        const props = await getPropertiesWithDetails(landlordProfile.id);
        setProperties(props);
      } catch (error) {
        console.error('[PortfolioFinancials] Failed to load properties:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [landlordProfile?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totalProperties = properties.length;
  const occupiedCount = properties.filter((p) => p.occupancyStatus === 'occupied').length;
  const occupancyRate = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;
  const totalIncome = properties.reduce((sum, p) => sum + p.monthlyIncome, 0);
  const totalCosts = properties.reduce((sum, p) => sum + p.monthlyCosts, 0);
  const totalProfit = properties.reduce((sum, p) => sum + p.monthlyProfit, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (totalProperties === 0) {
    return null; // Don't show if no properties
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
        <h3 className="font-semibold text-neutral-900">Portfolio Overview</h3>
        {onManageCosts && (
          <button
            onClick={onManageCosts}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Settings className="h-4 w-4" />
            Manage Costs
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Occupancy */}
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <Users className="h-4 w-4" />
              Occupancy
            </div>
            <div className="text-2xl font-bold text-neutral-900">{occupancyRate}%</div>
            <div className="text-xs text-neutral-500">
              {occupiedCount} of {totalProperties} units
            </div>
          </div>

          {/* Income */}
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Income
            </div>
            <div className="text-2xl font-bold text-success-600">{formatCurrency(totalIncome)}</div>
            <div className="text-xs text-neutral-500">per month</div>
          </div>

          {/* Costs */}
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <TrendingDown className="h-4 w-4" />
              Costs
            </div>
            <div className="text-2xl font-bold text-danger-600">{formatCurrency(totalCosts)}</div>
            <div className="text-xs text-neutral-500">per month</div>
          </div>

          {/* Profit */}
          <div className={`rounded-xl p-4 ${totalProfit >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <PoundSterling className="h-4 w-4" />
              Profit
            </div>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
              {formatCurrency(totalProfit)}
            </div>
            <div className="text-xs text-neutral-500">per month</div>
          </div>
        </div>

        {/* Property Breakdown (compact) */}
        {properties.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-neutral-700">By Property</span>
              {onViewAll && (
                <button
                  onClick={onViewAll}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {properties.slice(0, 5).map((property) => (
                <div
                  key={property.id}
                  className="flex items-center gap-3 p-2 bg-neutral-50 rounded-lg"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      property.occupancyStatus === 'occupied'
                        ? 'bg-success-500'
                        : property.occupancyStatus === 'ending_soon'
                          ? 'bg-warning-500'
                          : 'bg-danger-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 truncate">
                      {property.address.street}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold ${
                        property.monthlyProfit >= 0 ? 'text-success-600' : 'text-danger-600'
                      }`}
                    >
                      {formatCurrency(property.monthlyProfit)}
                    </div>
                    <div className="text-xs text-neutral-500">profit/mo</div>
                  </div>
                </div>
              ))}
              {properties.length > 5 && (
                <div className="text-center pt-2">
                  <button
                    onClick={onViewAll}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    +{properties.length - 5} more properties
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
