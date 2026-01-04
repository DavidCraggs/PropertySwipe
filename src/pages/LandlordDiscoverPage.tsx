/**
 * Landlord Discover Page
 *
 * Allows landlords to view and review renters who have shown interest
 * in their properties. Two-sided matching - landlord must approve for match.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  SortAsc,
  SortDesc,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../hooks/useAuthStore';
import { useToast } from '../components/organisms/toastUtils';
import { RenterCard } from '../components/molecules/RenterCard';
import { supabase } from '../lib/supabase';
import { calculateCompatibility } from '../utils/matchScoring';
import type { RenterCard as RenterCardType, Interest, Property } from '../types';

// =====================================================
// TYPES
// =====================================================

type SortOption = 'compatibility' | 'recent' | 'expiring';
type FilterOption = 'all' | 'high_match' | 'has_guarantor' | 'no_pets';

interface InterestWithDetails extends Interest {
  renter: RenterCardType;
  property: Property;
}

// =====================================================
// PAGE COMPONENT
// =====================================================

export const LandlordDiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const toast = useToast();

  const [interests, setInterests] = useState<InterestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('compatibility');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  // =====================================================
  // DATA LOADING
  // =====================================================

  const loadInterests = useCallback(async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    try {
      // Load landlord's properties
      const { data: propertiesData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', currentUser.id);

      if (propError) throw propError;
      setProperties(propertiesData || []);

      // Load pending interests
      const { data: interestsData, error: intError } = await supabase
        .from('interests')
        .select(`
          *,
          renter_profiles!inner(*)
        `)
        .eq('landlord_id', currentUser.id)
        .eq('status', 'pending')
        .order('interested_at', { ascending: false });

      if (intError) throw intError;

      // Transform to InterestWithDetails
      const enrichedInterests: InterestWithDetails[] = (interestsData || []).map((interest) => {
        const property = propertiesData?.find((p) => p.id === interest.property_id);
        const renterProfile = interest.renter_profiles;

        // Calculate compatibility score
        const compatibilityScore = calculateCompatibility(
          renterProfile,
          property || ({} as Property)
        );

        const renterCard: RenterCardType = {
          renterId: renterProfile.id,
          interestId: interest.id,
          situation: renterProfile.situation || 'Single',
          employmentStatus: renterProfile.employment_status || 'Employed',
          monthlyIncome: renterProfile.monthly_income || 0,
          hasPets: renterProfile.has_pets || false,
          petDetails: renterProfile.pet_details,
          hasGuarantor: renterProfile.has_guarantor || false,
          hasRentalHistory: renterProfile.has_rental_history || false,
          preferredMoveInDate: renterProfile.preferred_move_in_date,
          smokingStatus: renterProfile.smoking_status || 'Non-Smoker',
          rating: renterProfile.ratings_summary,
          compatibilityScore,
          interestedAt: new Date(interest.interested_at),
          propertyId: interest.property_id,
          propertyAddress: property?.address?.street
            ? `${property.address.street}, ${property.address.city}`
            : 'Unknown property',
        };

        return {
          ...interest,
          id: interest.id,
          renterId: interest.renter_id,
          landlordId: interest.landlord_id,
          propertyId: interest.property_id,
          interestedAt: new Date(interest.interested_at),
          status: interest.status,
          expiresAt: new Date(interest.expires_at),
          createdAt: new Date(interest.created_at),
          updatedAt: new Date(interest.updated_at),
          renter: renterCard,
          property: property || ({} as Property),
        };
      });

      setInterests(enrichedInterests);
    } catch (error) {
      console.error('Failed to load interests:', error);
      toast.error('Failed to load interested renters');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, toast]);

  useEffect(() => {
    loadInterests();
  }, [loadInterests]);

  // =====================================================
  // ACTIONS
  // =====================================================

  const handleLike = async (interestId: string) => {
    setActionLoading(interestId);
    try {
      // Call the confirm_interest function
      const { error } = await supabase.rpc('confirm_interest', {
        p_interest_id: interestId,
      });

      if (error) throw error;

      // Remove from list
      setInterests((prev) => prev.filter((i) => i.id !== interestId));
      toast.success("It's a match! You can now chat with this renter.");

      // Could navigate to matches or show a modal
    } catch (error) {
      console.error('Failed to confirm interest:', error);
      toast.error('Failed to create match');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePass = async (interestId: string) => {
    setActionLoading(interestId);
    try {
      const { error } = await supabase.rpc('decline_interest', {
        p_interest_id: interestId,
      });

      if (error) throw error;

      setInterests((prev) => prev.filter((i) => i.id !== interestId));
      toast.info('Passed on renter');
    } catch (error) {
      console.error('Failed to decline interest:', error);
      toast.error('Failed to pass');
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================================
  // FILTERING & SORTING
  // =====================================================

  const filteredInterests = interests.filter((interest) => {
    // Property filter
    if (selectedProperty && interest.propertyId !== selectedProperty) {
      return false;
    }

    // Type filter
    switch (filterBy) {
      case 'high_match':
        return interest.renter.compatibilityScore.overall >= 70;
      case 'has_guarantor':
        return interest.renter.hasGuarantor;
      case 'no_pets':
        return !interest.renter.hasPets;
      default:
        return true;
    }
  });

  const sortedInterests = [...filteredInterests].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'compatibility':
        comparison =
          a.renter.compatibilityScore.overall - b.renter.compatibilityScore.overall;
        break;
      case 'recent':
        comparison =
          new Date(a.interestedAt).getTime() - new Date(b.interestedAt).getTime();
        break;
      case 'expiring':
        comparison =
          new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Discover Renters
                </h1>
                <p className="text-sm text-gray-500">
                  {interests.length} interested renter
                  {interests.length !== 1 ? 's' : ''} to review
                </p>
              </div>
            </div>

            <button
              onClick={loadInterests}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Property filter */}
            <select
              value={selectedProperty || ''}
              onChange={(e) => setSelectedProperty(e.target.value || null)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address?.street || p.id}
                </option>
              ))}
            </select>

            {/* Type filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">All Renters</option>
              <option value="high_match">High Match (70%+)</option>
              <option value="has_guarantor">Has Guarantor</option>
              <option value="no_pets">No Pets</option>
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="compatibility">Compatibility</option>
                <option value="recent">Most Recent</option>
                <option value="expiring">Expiring Soon</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
                className="p-2 border rounded-lg hover:bg-gray-50"
                aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'desc' ? (
                  <SortDesc className="w-4 h-4" />
                ) : (
                  <SortAsc className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Result count */}
            <span className="text-sm text-gray-500 ml-auto">
              {sortedInterests.length} result
              {sortedInterests.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : sortedInterests.length === 0 ? (
          <EmptyState hasFilters={filterBy !== 'all' || selectedProperty !== null} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {sortedInterests.map((interest) => (
                <motion.div
                  key={interest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <RenterCard
                    renter={interest.renter}
                    onInfoClick={() => {
                      // Could show modal with more details
                    }}
                  />
                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handlePass(interest.id)}
                      disabled={actionLoading === interest.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {actionLoading === interest.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Pass
                    </button>
                    <button
                      onClick={() => handleLike(interest.id)}
                      disabled={actionLoading === interest.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      {actionLoading === interest.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Match
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

// =====================================================
// EMPTY STATE
// =====================================================

interface EmptyStateProps {
  hasFilters: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasFilters }) => (
  <div className="text-center py-20">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Users className="w-8 h-8 text-gray-400" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 mb-2">
      {hasFilters ? 'No matching renters' : 'No interested renters yet'}
    </h2>
    <p className="text-gray-500 max-w-md mx-auto">
      {hasFilters
        ? 'Try adjusting your filters to see more renters.'
        : "When renters swipe right on your properties, they'll appear here for you to review."}
    </p>
  </div>
);

export default LandlordDiscoverPage;
