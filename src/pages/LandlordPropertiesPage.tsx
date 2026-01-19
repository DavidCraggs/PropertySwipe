import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Home,
  Users,
  PoundSterling,
  TrendingUp,
  AlertTriangle,
  Filter,
  SortAsc,
  X,
} from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { getPropertiesWithDetails } from '../lib/storage';
import type {
  LandlordProfile,
  PropertyWithDetails,
  PropertyViewMode,
  OccupancyStatus,
} from '../types';
import { PropertyViewSwitcher } from '../components/molecules/PropertyViewSwitcher';
import { PropertyListItem } from '../components/molecules/PropertyListItem';
import { PropertyGridCard } from '../components/molecules/PropertyGridCard';
import { PropertyDetailCard } from '../components/molecules/PropertyDetailCard';
import { PropertyCostManager } from '../components/organisms/PropertyCostManager';
import { PropertyIssuesPanel } from '../components/organisms/PropertyIssuesPanel';
import { PropertyForm } from '../components/organisms/PropertyForm';
import { saveProperty } from '../lib/storage';
import { useToastStore } from '../components/organisms/toastUtils';
import type { Property } from '../types';

type SortOption = 'name' | 'rent' | 'occupancy' | 'profit';
type FilterOption = 'all' | 'occupied' | 'vacant' | 'ending_soon';

/**
 * Properties page for landlords with list/grid/card views
 * Shows all properties with financial tracking and tenant management
 */
export function LandlordPropertiesPage() {
  const { currentUser } = useAuthStore();
  const landlordProfile = currentUser as LandlordProfile;

  const [properties, setProperties] = useState<PropertyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<PropertyViewMode>(() => {
    const stored = localStorage.getItem('landlord-properties-view');
    return (stored as PropertyViewMode) || 'list';
  });
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithDetails | null>(null);
  const [costManagerProperty, setCostManagerProperty] = useState<PropertyWithDetails | null>(null);
  const [issuesPanelProperty, setIssuesPanelProperty] = useState<PropertyWithDetails | null>(null);
  const [editingProperty, setEditingProperty] = useState<PropertyWithDetails | null>(null);
  const { addToast } = useToastStore();

  // Load properties on mount
  useEffect(() => {
    const loadProperties = async () => {
      if (!landlordProfile?.id) return;
      setLoading(true);
      try {
        const props = await getPropertiesWithDetails(landlordProfile.id);
        setProperties(props);
      } catch (error) {
        console.error('[LandlordPropertiesPage] Failed to load properties:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, [landlordProfile?.id]);

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('landlord-properties-view', viewMode);
  }, [viewMode]);

  // Calculate portfolio stats
  const stats = useMemo(() => {
    const total = properties.length;
    const occupied = properties.filter((p) => p.occupancyStatus === 'occupied').length;
    const totalIncome = properties.reduce((sum, p) => sum + p.monthlyIncome, 0);
    const totalCosts = properties.reduce((sum, p) => sum + p.monthlyCosts, 0);
    const totalProfit = properties.reduce((sum, p) => sum + p.monthlyProfit, 0);
    const totalIssues = properties.reduce((sum, p) => sum + p.activeIssuesCount, 0);
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, occupied, occupancyRate, totalIncome, totalCosts, totalProfit, totalIssues };
  }, [properties]);

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Apply filter
    if (filter !== 'all') {
      result = result.filter((p) => p.occupancyStatus === filter);
    }

    // Apply sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.address.street.localeCompare(b.address.street));
        break;
      case 'rent':
        result.sort((a, b) => b.rentPcm - a.rentPcm);
        break;
      case 'occupancy':
        const order: Record<OccupancyStatus, number> = { occupied: 0, ending_soon: 1, vacant: 2 };
        result.sort((a, b) => order[a.occupancyStatus] - order[b.occupancyStatus]);
        break;
      case 'profit':
        result.sort((a, b) => b.monthlyProfit - a.monthlyProfit);
        break;
    }

    return result;
  }, [properties, filter, sortBy]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePropertySelect = (property: PropertyWithDetails) => {
    if (viewMode === 'card') {
      setSelectedProperty(property);
    } else {
      // For list/grid, expand to card view
      setSelectedProperty(property);
    }
  };

  const handleAddProperty = () => {
    // TODO: Navigate to property creation
    console.log('[LandlordPropertiesPage] Add property clicked');
  };

  const handleEditProperty = (property: PropertyWithDetails) => {
    setEditingProperty(property);
    setSelectedProperty(null); // Close detail modal if open
  };

  const handleEditSubmit = async (data: Omit<Property, 'id'>) => {
    if (!editingProperty) return;

    try {
      await saveProperty({
        ...data,
        id: editingProperty.id,
        landlordId: landlordProfile?.id || editingProperty.landlordId,
      });

      addToast({
        type: 'success',
        title: 'Property Updated',
        message: 'Your property has been updated successfully.',
      });

      // Reload properties to get updated data
      const props = await getPropertiesWithDetails(landlordProfile!.id);
      setProperties(props);
      setEditingProperty(null);
    } catch (error) {
      console.error('[LandlordPropertiesPage] Failed to update property:', error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update property. Please try again.',
      });
    }
  };

  const handleManageCosts = (property: PropertyWithDetails) => {
    setCostManagerProperty(property);
  };

  const handleViewIssues = (property: PropertyWithDetails) => {
    setIssuesPanelProperty(property);
  };

  const handleCostsUpdated = async () => {
    // Reload properties to get updated cost data
    if (!landlordProfile?.id) return;
    try {
      const props = await getPropertiesWithDetails(landlordProfile.id);
      setProperties(props);
    } catch (error) {
      console.error('[LandlordPropertiesPage] Failed to reload properties:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">My Properties</h1>
              <p className="text-sm text-neutral-500">
                {properties.length} {properties.length === 1 ? 'property' : 'properties'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PropertyViewSwitcher
                currentView={viewMode}
                onViewChange={setViewMode}
              />
              <button
                onClick={handleAddProperty}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Property</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-neutral-100 min-w-[100px]">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Home className="h-3.5 w-3.5" />
              Total
            </div>
            <div className="text-xl font-bold text-neutral-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-neutral-100 min-w-[100px]">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Users className="h-3.5 w-3.5" />
              Occupied
            </div>
            <div className="text-xl font-bold text-success-600">
              {stats.occupied} <span className="text-sm font-normal text-neutral-500">({stats.occupancyRate}%)</span>
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-neutral-100 min-w-[120px]">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <PoundSterling className="h-3.5 w-3.5" />
              Income
            </div>
            <div className="text-xl font-bold text-neutral-900">{formatCurrency(stats.totalIncome)}</div>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-neutral-100 min-w-[120px]">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5 rotate-180" />
              Costs
            </div>
            <div className="text-xl font-bold text-danger-600">{formatCurrency(stats.totalCosts)}</div>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-neutral-100 min-w-[120px]">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Profit
            </div>
            <div className={`text-xl font-bold ${stats.totalProfit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {formatCurrency(stats.totalProfit)}
            </div>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-neutral-100 min-w-[100px]">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Issues
            </div>
            <div className={`text-xl font-bold ${stats.totalIssues > 0 ? 'text-warning-600' : 'text-neutral-900'}`}>
              {stats.totalIssues}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Sort */}
      <div className="px-4 pb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Properties</option>
            <option value="occupied">Occupied</option>
            <option value="vacant">Vacant</option>
            <option value="ending_soon">Ending Soon</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-neutral-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="name">Sort by Name</option>
            <option value="rent">Sort by Rent</option>
            <option value="occupancy">Sort by Occupancy</option>
            <option value="profit">Sort by Profit</option>
          </select>
        </div>
      </div>

      {/* Properties Content */}
      <div className="px-4">
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-neutral-100">
            <Home className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {properties.length === 0 ? 'No Properties Yet' : 'No Properties Match Filter'}
            </h3>
            <p className="text-neutral-500 mb-4">
              {properties.length === 0
                ? 'Add your first property to start managing your portfolio'
                : 'Try adjusting your filter to see more properties'}
            </p>
            {properties.length === 0 && (
              <button
                onClick={handleAddProperty}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Property
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          // List View
          <div className="space-y-3">
            {filteredProperties.map((property) => (
              <PropertyListItem
                key={property.id}
                property={property}
                onSelect={handlePropertySelect}
                onEdit={handleEditProperty}
              />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((property) => (
              <PropertyGridCard
                key={property.id}
                property={property}
                onSelect={handlePropertySelect}
              />
            ))}
          </div>
        ) : (
          // Card View
          <div className="space-y-6">
            {filteredProperties.map((property) => (
              <PropertyDetailCard
                key={property.id}
                property={property}
                onEdit={handleEditProperty}
                onManageCosts={handleManageCosts}
                onViewIssues={handleViewIssues}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Property Modal (for list/grid views) */}
      {selectedProperty && viewMode !== 'card' && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-8 overflow-y-auto"
          onClick={() => setSelectedProperty(null)}
        >
          <div
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <PropertyDetailCard
              property={selectedProperty}
              onClose={() => setSelectedProperty(null)}
              onEdit={handleEditProperty}
              onManageCosts={handleManageCosts}
              onViewIssues={handleViewIssues}
            />
          </div>
        </div>
      )}

      {/* Property Cost Manager Modal */}
      {costManagerProperty && (
        <PropertyCostManager
          property={costManagerProperty}
          isOpen={true}
          onClose={() => setCostManagerProperty(null)}
          onCostsUpdated={handleCostsUpdated}
        />
      )}

      {/* Property Issues Panel */}
      {issuesPanelProperty && (
        <PropertyIssuesPanel
          property={issuesPanelProperty}
          isOpen={true}
          onClose={() => setIssuesPanelProperty(null)}
          onIssuesUpdated={handleCostsUpdated}
        />
      )}

      {/* Property Edit Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="bg-white rounded-2xl max-w-2xl mx-auto p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">Edit Property</h2>
                <button
                  onClick={() => setEditingProperty(null)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>
              <PropertyForm
                mode="edit"
                initialData={{
                  id: editingProperty.id,
                  address: editingProperty.address,
                  rentPcm: editingProperty.rentPcm,
                  deposit: editingProperty.deposit,
                  bedrooms: editingProperty.bedrooms,
                  bathrooms: editingProperty.bathrooms,
                  propertyType: editingProperty.propertyType,
                  yearBuilt: editingProperty.yearBuilt,
                  maxOccupants: editingProperty.maxOccupants,
                  furnishing: editingProperty.furnishing,
                  availableFrom: editingProperty.availableFrom,
                  acceptsShortTermTenants: editingProperty.acceptsShortTermTenants,
                  petsPolicy: editingProperty.petsPolicy,
                  description: editingProperty.description,
                  epcRating: editingProperty.epcRating,
                  images: editingProperty.images,
                  features: editingProperty.features,
                  landlordId: editingProperty.landlordId,
                }}
                onSubmit={handleEditSubmit}
                onCancel={() => setEditingProperty(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
