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
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../hooks/useAuthStore';
import { useIsMobile } from '../hooks/useMediaQuery';
import { SlideDrawer } from '../components/organisms/SlideDrawer';
import { Button } from '../components/atoms/Button';
import { pageShell, pageHeader, card, heading, subText } from '../utils/conceptCStyles';
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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

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
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center" style={pageShell}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--color-sub)' }}>Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] pb-24" style={{ ...pageShell, paddingBottom: 96 }}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ ...pageHeader }}>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 style={heading(32)}>Portfolio</h1>
              <p style={{ ...subText(14), marginTop: 4 }}>
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
          <div className="rounded-xl px-4 py-3 min-w-[100px]" style={{ ...card }}>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--color-sub)' }}>
              <Home className="h-3.5 w-3.5" />
              Total
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.total}</div>
          </div>
          <div className="rounded-xl px-4 py-3 min-w-[100px]" style={{ ...card }}>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--color-sub)' }}>
              <User className="h-3.5 w-3.5" />
              Landlords
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.landlordCount}</div>
          </div>
          <div className="rounded-xl px-4 py-3 min-w-[100px]" style={{ ...card }}>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--color-sub)' }}>
              <Users className="h-3.5 w-3.5" />
              Occupied
            </div>
            <div className="text-xl font-bold text-success-600">
              {stats.occupied} <span className="text-sm font-normal" style={{ color: 'var(--color-sub)' }}>({stats.occupancyRate}%)</span>
            </div>
          </div>
          <div className="rounded-xl px-4 py-3 min-w-[120px]" style={{ ...card }}>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--color-sub)' }}>
              <PoundSterling className="h-3.5 w-3.5" />
              Income
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{formatCurrency(stats.totalIncome)}</div>
          </div>
          <div className="rounded-xl px-4 py-3 min-w-[100px]" style={{ ...card }}>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--color-sub)' }}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Issues
            </div>
            <div className={`text-xl font-bold ${stats.totalIssues > 0 ? 'text-warning-600' : ''}`} style={{ color: stats.totalIssues > 0 ? undefined : 'var(--color-text)' }}>
              {stats.totalIssues}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Sort */}
      {!isMobile ? (
        <div className="px-4 pb-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" style={{ color: 'var(--color-sub)' }} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterOption)}
              className="px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)', color: 'var(--color-text)' }}
            >
              <option value="all">All Properties</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="ending_soon">Ending Soon</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4" style={{ color: 'var(--color-sub)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)', color: 'var(--color-text)' }}
            >
              <option value="landlord">Sort by Landlord</option>
              <option value="name">Sort by Name</option>
              <option value="rent">Sort by Rent</option>
              <option value="occupancy">Sort by Occupancy</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4">
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 999,
              border: '1.5px solid var(--color-line)',
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Filter className="h-4 w-4" style={{ color: 'var(--color-teal)' }} />
            Filter & Sort
            {filter !== 'all' && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-teal)' }} />
            )}
          </button>
        </div>
      )}

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {isMobile && isFilterDrawerOpen && (
          <SlideDrawer
            isOpen={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            title="Filter & Sort"
          >
            <div style={{ padding: '8px 0' }}>
              <p style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-sub)', marginBottom: 12 }}>
                Filter
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {([
                  { value: 'all', label: 'All Properties' },
                  { value: 'occupied', label: 'Occupied' },
                  { value: 'vacant', label: 'Vacant' },
                  { value: 'ending_soon', label: 'Ending Soon' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: 'none',
                      textAlign: 'left' as const,
                      cursor: 'pointer',
                      fontFamily: "'Libre Franklin', sans-serif",
                      fontSize: 14,
                      fontWeight: filter === opt.value ? 700 : 500,
                      color: filter === opt.value ? 'var(--color-teal)' : 'var(--color-text)',
                      background: filter === opt.value ? 'rgba(13,148,136,0.08)' : 'transparent',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ height: 1.5, background: 'var(--color-line)', margin: '20px 0' }} />

              <p style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--color-sub)', marginBottom: 12 }}>
                Sort by
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {([
                  { value: 'landlord', label: 'Landlord' },
                  { value: 'name', label: 'Name' },
                  { value: 'rent', label: 'Rent' },
                  { value: 'occupancy', label: 'Occupancy' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: 'none',
                      textAlign: 'left' as const,
                      cursor: 'pointer',
                      fontFamily: "'Libre Franklin', sans-serif",
                      fontSize: 14,
                      fontWeight: sortBy === opt.value ? 700 : 500,
                      color: sortBy === opt.value ? 'var(--color-teal)' : 'var(--color-text)',
                      background: sortBy === opt.value ? 'rgba(13,148,136,0.08)' : 'transparent',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 32 }}>
                <Button variant="primary" onClick={() => setIsFilterDrawerOpen(false)} className="w-full">
                  Apply
                </Button>
              </div>
            </div>
          </SlideDrawer>
        )}
      </AnimatePresence>

      {/* Properties Content */}
      <div className="px-4">
        {filteredProperties.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ ...card, padding: 24 }}>
            <Building2 className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-sub)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              {properties.length === 0 ? 'No Properties Yet' : 'No Properties Match Filter'}
            </h3>
            <p className="mb-4" style={{ color: 'var(--color-sub)' }}>
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
