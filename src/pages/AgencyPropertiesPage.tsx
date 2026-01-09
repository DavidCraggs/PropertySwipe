import { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Users,
  PoundSterling,
  AlertTriangle,
  Filter,
  SortAsc,
  Building2,
  User,
} from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { getAllProperties, getAllMatches, getLandlordProfile, getPropertyCosts, getIssuesForProperty } from '../lib/storage';
import type {
  AgencyProfile,
  PropertyWithDetails,
  PropertyViewMode,
  OccupancyStatus,
  LandlordProfile,
} from '../types';
import { PropertyViewSwitcher } from '../components/molecules/PropertyViewSwitcher';
import { PropertyListItem } from '../components/molecules/PropertyListItem';
import { PropertyGridCard } from '../components/molecules/PropertyGridCard';
import { PropertyDetailCard } from '../components/molecules/PropertyDetailCard';

type SortOption = 'name' | 'rent' | 'occupancy' | 'landlord';
type FilterOption = 'all' | 'occupied' | 'vacant' | 'ending_soon';

interface PropertyWithLandlord extends PropertyWithDetails {
  landlordName?: string;
}

/**
 * Properties page for agencies (estate agents and management agencies)
 * Shows managed properties grouped by landlord with financial tracking
 */
export function AgencyPropertiesPage() {
  const { currentUser } = useAuthStore();
  const agencyProfile = currentUser as AgencyProfile;

  const [properties, setProperties] = useState<PropertyWithLandlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<PropertyViewMode>(() => {
    const stored = localStorage.getItem('agency-properties-view');
    return (stored as PropertyViewMode) || 'list';
  });
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('landlord');
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithLandlord | null>(null);

  // Load properties on mount
  useEffect(() => {
    const loadProperties = async () => {
      if (!agencyProfile?.id) return;
      setLoading(true);
      try {
        // Get all properties managed by this agency
        const allProps = await getAllProperties();
        const managedProps = allProps.filter(
          (p) => p.managingAgencyId === agencyProfile.id || p.marketingAgentId === agencyProfile.id
        );

        if (managedProps.length === 0) {
          setProperties([]);
          setLoading(false);
          return;
        }

        // Get all matches
        const allMatches = await getAllMatches();

        // Get landlord profiles for each property
        const landlordIds = [...new Set(managedProps.map((p) => p.landlordId))];
        const landlordProfiles = await Promise.all(
          landlordIds.map((id) => getLandlordProfile(id))
        );
        const landlordMap = new Map<string, LandlordProfile>();
        landlordProfiles.forEach((profile) => {
          if (profile) landlordMap.set(profile.id, profile);
        });

        // Get costs and issues for each property
        const enrichedProps: PropertyWithLandlord[] = await Promise.all(
          managedProps.map(async (property) => {
            const costs = await getPropertyCosts(property.id);
            const issues = await getIssuesForProperty(property.id);

            // Find active tenancy
            const activeMatch = allMatches.find(
              (m) =>
                m.propertyId === property.id &&
                (m.tenancyStatus === 'active' || m.applicationStatus === 'tenancy_signed')
            );

            // Calculate occupancy status
            let occupancyStatus: OccupancyStatus = 'vacant';
            if (activeMatch) {
              if (activeMatch.tenancyStatus === 'notice_given') {
                occupancyStatus = 'ending_soon';
              } else {
                occupancyStatus = 'occupied';
              }
            }

            // Calculate monthly costs
            const monthlyCosts = costs.reduce((sum, cost) => {
              switch (cost.frequency) {
                case 'monthly':
                  return sum + cost.amount;
                case 'quarterly':
                  return sum + cost.amount / 3;
                case 'annually':
                  return sum + cost.amount / 12;
                default:
                  return sum;
              }
            }, 0);

            const monthlyIncome = activeMatch
              ? activeMatch.monthlyRentAmount || property.rentPcm
              : 0;

            const activeIssuesCount = issues.filter(
              (i) => !['resolved', 'closed'].includes(i.status)
            ).length;

            const landlord = landlordMap.get(property.landlordId);

            return {
              ...property,
              occupancyStatus,
              activeIssuesCount,
              unreadMessagesCount: 0,
              monthlyCosts: Math.round(monthlyCosts * 100) / 100,
              monthlyIncome,
              monthlyProfit: Math.round((monthlyIncome - monthlyCosts) * 100) / 100,
              costs,
              matchId: activeMatch?.id,
              currentTenant: activeMatch?.renterProfile
                ? {
                    name: activeMatch.renterName || activeMatch.renterProfile.names || 'Tenant',
                    renterId: activeMatch.renterId,
                    moveInDate: activeMatch.tenancyStartDate || new Date(),
                    monthlyRent: activeMatch.monthlyRentAmount || property.rentPcm,
                  }
                : undefined,
              landlordName: landlord?.names,
            };
          })
        );

        setProperties(enrichedProps);
      } catch (error) {
        console.error('[AgencyPropertiesPage] Failed to load properties:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, [agencyProfile?.id]);

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('agency-properties-view', viewMode);
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
    const landlordCount = new Set(properties.map((p) => p.landlordId)).size;

    return { total, occupied, occupancyRate, totalIncome, totalCosts, totalProfit, totalIssues, landlordCount };
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
      case 'landlord':
        result.sort((a, b) => (a.landlordName || '').localeCompare(b.landlordName || ''));
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

  const handlePropertySelect = (property: PropertyWithLandlord) => {
    setSelectedProperty(property);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading portfolio...</p>
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
              <h1 className="text-2xl font-bold text-neutral-900">Portfolio</h1>
              <p className="text-sm text-neutral-500">
                {properties.length} {properties.length === 1 ? 'property' : 'properties'} • {stats.landlordCount} {stats.landlordCount === 1 ? 'landlord' : 'landlords'}
              </p>
            </div>
            <PropertyViewSwitcher
              currentView={viewMode}
              onViewChange={setViewMode}
            />
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
              <User className="h-3.5 w-3.5" />
              Landlords
            </div>
            <div className="text-xl font-bold text-neutral-900">{stats.landlordCount}</div>
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
            <option value="landlord">Sort by Landlord</option>
            <option value="name">Sort by Name</option>
            <option value="rent">Sort by Rent</option>
            <option value="occupancy">Sort by Occupancy</option>
          </select>
        </div>
      </div>

      {/* Properties Content */}
      <div className="px-4">
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-neutral-100">
            <Building2 className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {properties.length === 0 ? 'No Properties Yet' : 'No Properties Match Filter'}
            </h3>
            <p className="text-neutral-500 mb-4">
              {properties.length === 0
                ? 'Properties assigned to your agency will appear here'
                : 'Try adjusting your filter to see more properties'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          // List View with Landlord badges
          <div className="space-y-3">
            {filteredProperties.map((property) => (
              <div key={property.id} className="relative">
                {property.landlordName && (
                  <div className="absolute -top-2 left-4 z-10">
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                      {property.landlordName}
                    </span>
                  </div>
                )}
                <PropertyListItem
                  property={property}
                  onSelect={() => handlePropertySelect(property)}
                />
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((property) => (
              <div key={property.id} className="relative">
                {property.landlordName && (
                  <div className="absolute -top-2 left-4 z-10">
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                      {property.landlordName}
                    </span>
                  </div>
                )}
                <PropertyGridCard
                  property={property}
                  onSelect={() => handlePropertySelect(property)}
                />
              </div>
            ))}
          </div>
        ) : (
          // Card View
          <div className="space-y-6">
            {filteredProperties.map((property) => (
              <div key={property.id}>
                {property.landlordName && (
                  <div className="mb-2">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                      Landlord: {property.landlordName}
                    </span>
                  </div>
                )}
                <PropertyDetailCard property={property} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Property Modal (for list/grid views) */}
      {selectedProperty && viewMode !== 'card' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <PropertyDetailCard
              property={selectedProperty}
              onClose={() => setSelectedProperty(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
