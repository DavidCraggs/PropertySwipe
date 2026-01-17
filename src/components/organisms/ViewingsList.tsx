import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useAppStore } from '../../hooks/useAppStore';
import { useToastStore } from './toastUtils';
import type { Match } from '../../types';

interface ViewingsListProps {
  refetchTrigger?: number;
  onViewingConfirmed?: () => void;
}

/**
 * ViewingsList component showing upcoming, pending, and past viewings
 * Different views for renters and landlords
 */
export function ViewingsList({ refetchTrigger = 0, onViewingConfirmed }: ViewingsListProps) {
  const { userType, currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Confirm viewing modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmingMatch, setConfirmingMatch] = useState<Match | null>(null);
  const [viewingDate, setViewingDate] = useState('');
  const [viewingTime, setViewingTime] = useState('14:00');

  // Fetch matches from Supabase
  useEffect(() => {
    const fetchMatches = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const { supabase } = await import('../../lib/supabase');

        let query = supabase
          .from('matches')
          .select(`
            *,
            property:properties(*)
          `);

        if (userType === 'renter') {
          query = query.eq('renter_id', currentUser.id);
        } else if (userType === 'landlord') {
          query = query.eq('landlord_id', currentUser.id);
        } else if (userType === 'agency') {
          const { data: managedProperties } = await supabase
            .from('properties')
            .select('id')
            .eq('managing_agency_id', currentUser.id);

          if (managedProperties && managedProperties.length > 0) {
            const propertyIds = managedProperties.map(p => p.id);
            query = query.in('property_id', propertyIds);
          } else {
            setMatches([]);
            setIsLoading(false);
            return;
          }
        }

        const { data: matchData, error } = await query;

        if (error) {
          console.error('[ViewingsList] Error fetching matches:', error);
          setMatches([]);
          setIsLoading(false);
          return;
        }

        if (matchData && matchData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transformedMatches: Match[] = matchData
            .filter((m: any) => m.property)
            .map((m: any) => {
              const p = m.property;
              return {
                id: m.id,
                renterId: m.renter_id,
                landlordId: m.landlord_id,
                landlordName: 'Landlord',
                propertyId: m.property_id,
                renterName: m.renter_name,
                timestamp: m.created_at,
                messages: m.messages || [],
                unreadCount: m.unread_count || 0,
                hasViewingScheduled: m.has_viewing_scheduled || false,
                confirmedViewingDate: m.confirmed_viewing_date ? new Date(m.confirmed_viewing_date) : undefined,
                viewingPreference: m.viewing_preference || undefined,
                applicationStatus: m.application_status || 'pending',
                tenancyStatus: (m.tenancy_status || 'prospective') as Match['tenancyStatus'],
                canRate: m.can_rate || false,
                hasRenterRated: m.has_renter_rated || false,
                hasLandlordRated: m.has_landlord_rated || false,
                isUnderEvictionProceedings: m.is_under_eviction_proceedings || false,
                petRequestStatus: m.pet_request_status || 'none',
                rentArrears: {
                  totalOwed: m.rent_arrears_total_owed || 0,
                  monthsMissed: m.rent_arrears_months_missed || 0,
                  consecutiveMonthsMissed: m.rent_arrears_consecutive_months || 0,
                  lastPaymentDate: m.rent_arrears_last_payment ? new Date(m.rent_arrears_last_payment) : undefined,
                },
                activeIssueIds: m.active_issue_ids || [],
                totalIssuesRaised: m.total_issues_raised || 0,
                totalIssuesResolved: m.total_issues_resolved || 0,
                property: {
                  id: p.id,
                  landlordId: p.landlord_id,
                  managingAgencyId: p.managing_agency_id,
                  marketingAgentId: p.marketing_agent_id,
                  address: {
                    street: p.street || '',
                    city: p.city || '',
                    postcode: p.postcode || '',
                    council: p.council || '',
                  },
                  rentPcm: p.rent_pcm || 0,
                  deposit: p.deposit || 0,
                  maxRentInAdvance: 1 as const,
                  bedrooms: p.bedrooms || 1,
                  bathrooms: p.bathrooms || 1,
                  propertyType: p.property_type || 'house',
                  availableFrom: p.available_from || new Date().toISOString(),
                  images: p.images || [],
                  features: p.features || [],
                  description: p.description || '',
                  epcRating: p.epc_rating || 'C',
                  yearBuilt: p.year_built || 2000,
                  furnishing: p.furnishing || 'unfurnished',
                  tenancyType: p.tenancy_type || 'Periodic',
                  maxOccupants: p.max_occupants || 4,
                  petsPolicy: {
                    willConsiderPets: true,
                    preferredPetTypes: p.preferred_pet_types || [],
                    requiresPetInsurance: p.requires_pet_insurance || false,
                    maxPetsAllowed: p.max_pets_allowed || 2,
                  },
                  bills: {
                    councilTaxBand: p.council_tax_band || 'C',
                    gasElectricIncluded: p.gas_electric_included || false,
                    waterIncluded: p.water_included || false,
                    internetIncluded: p.internet_included || false,
                  },
                  meetsDecentHomesStandard: p.meets_decent_homes_standard || false,
                  awaabsLawCompliant: p.awaabs_law_compliant || false,
                  prsPropertyRegistrationStatus: p.prs_property_registration_status || 'not_registered',
                  isAvailable: p.is_available ?? true,
                  canBeMarketed: p.can_be_marketed || false,
                  listingDate: p.listing_date || new Date().toISOString(),
                },
              } as Match;
            });

          setMatches(transformedMatches);
        } else {
          setMatches([]);
        }
      } catch (error) {
        console.error('[ViewingsList] Failed to fetch matches:', error);
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [currentUser, userType, refetchTrigger]);

  // Filter matches for viewings
  const upcomingViewings = matches.filter(
    (m) => m.hasViewingScheduled && m.confirmedViewingDate && new Date(m.confirmedViewingDate) > new Date()
  );
  const pendingRequests = matches.filter((m) => m.viewingPreference && !m.hasViewingScheduled);
  const pastViewings = matches.filter(
    (m) => m.hasViewingScheduled && m.confirmedViewingDate && new Date(m.confirmedViewingDate) <= new Date()
  );

  const isRenter = userType === 'renter';

  // Handle opening confirm modal
  const handleSuggestTime = (match: Match) => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setViewingDate(tomorrow.toISOString().split('T')[0]);
    setViewingTime('14:00');
    setConfirmingMatch(match);
    setShowConfirmModal(true);
  };

  // Handle confirming the viewing
  const handleConfirmViewing = async () => {
    if (!confirmingMatch || !viewingDate || !viewingTime) {
      addToast({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please select both a date and time for the viewing.',
      });
      return;
    }

    const dateTime = new Date(`${viewingDate}T${viewingTime}`);
    if (isNaN(dateTime.getTime())) {
      addToast({
        type: 'danger',
        title: 'Invalid Date',
        message: 'Please enter a valid date and time.',
      });
      return;
    }

    try {
      await useAppStore.getState().confirmViewing(confirmingMatch.id, dateTime);
      addToast({
        type: 'success',
        title: 'Viewing Confirmed',
        message: `Viewing scheduled for ${dateTime.toLocaleDateString('en-GB')} at ${dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
      });
      setShowConfirmModal(false);
      setConfirmingMatch(null);
      // Trigger refetch in parent
      onViewingConfirmed?.();
    } catch (error) {
      console.error('[ViewingsList] Failed to confirm viewing:', error);
      addToast({
        type: 'danger',
        title: 'Failed to Confirm',
        message: 'Could not confirm the viewing. Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Viewings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Upcoming Viewings
          </h2>
          {upcomingViewings.length > 0 && (
            <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
              {upcomingViewings.length} confirmed
            </span>
          )}
        </div>

        {upcomingViewings.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-neutral-200 p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
            <h3 className="font-semibold text-neutral-700 mb-1">No upcoming viewings</h3>
            <p className="text-sm text-neutral-500">
              {isRenter
                ? 'Schedule viewings with landlords to see them here'
                : 'Confirmed viewings with renters will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingViewings.map((match) => (
              <UpcomingViewingCard key={match.id} match={match} isRenter={isRenter} />
            ))}
          </div>
        )}
      </section>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary-600" />
              Pending Requests
            </h2>
            <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
              {pendingRequests.length} pending
            </span>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((match) => (
              <PendingViewingCard
                key={match.id}
                match={match}
                isRenter={isRenter}
                onSuggestTime={() => handleSuggestTime(match)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past Viewings */}
      {pastViewings.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-neutral-600" />
            Past Viewings
          </h2>

          <div className="space-y-3">
            {pastViewings.map((match) => (
              <PastViewingCard key={match.id} match={match} isRenter={isRenter} />
            ))}
          </div>
        </section>
      )}

      {/* Confirm Viewing Modal */}
      {showConfirmModal && confirmingMatch && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Confirm Viewing</h3>
            <p className="text-sm text-neutral-600 mb-6">
              {confirmingMatch.property.address.street}
            </p>

            <div className="space-y-4">
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={viewingDate}
                  onChange={(e) => setViewingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                />
              </div>

              {/* Time Picker */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={viewingTime}
                  onChange={(e) => setViewingTime(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                />
              </div>

              {/* Quick Time Buttons */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Quick Select
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['10:00', '12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setViewingTime(time)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        viewingTime === time
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Renter's Preference Info */}
              {confirmingMatch.viewingPreference && (
                <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-secondary-700 mb-1">Renter's preference:</p>
                  <p className="text-sm text-secondary-900">
                    {confirmingMatch.viewingPreference.flexibility === 'ASAP' && 'Available as soon as possible'}
                    {confirmingMatch.viewingPreference.flexibility === 'Flexible' && 'Flexible timing'}
                    {confirmingMatch.viewingPreference.flexibility === 'Specific' && 'Specific time requested'}
                    {confirmingMatch.viewingPreference.preferredTimes && confirmingMatch.viewingPreference.preferredTimes.length > 0 && (
                      <span className="block text-xs text-secondary-600 mt-1">
                        Prefers: {confirmingMatch.viewingPreference.preferredTimes.map(t => `${t.dayType} ${t.timeOfDay}`).join(', ')}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmingMatch(null);
                  }}
                  className="flex-1 py-3 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmViewing}
                  className="flex-1 py-3 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium"
                >
                  Confirm Viewing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ViewingCardProps {
  match: Match;
  isRenter: boolean;
}

interface PendingViewingCardProps extends ViewingCardProps {
  onSuggestTime?: () => void;
}

function UpcomingViewingCard({ match, isRenter }: ViewingCardProps) {
  const viewingDate = match.confirmedViewingDate ? new Date(match.confirmedViewingDate) : null;
  if (!viewingDate) return null;

  const daysUntil = Math.ceil((viewingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const timeUntil = getTimeUntilString(viewingDate);

  return (
    <div className="bg-white rounded-xl border-2 border-success-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Property Image */}
        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-200">
          {match.property.images?.[0] && (
            <img
              src={match.property.images[0]}
              alt={match.property.address.street}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Property Info */}
          <h3 className="font-semibold text-neutral-900 mb-1 truncate">
            {match.property.address.street}
          </h3>
          <p className="text-sm text-neutral-600 mb-3 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {match.property.address.city}, {match.property.address.postcode}
          </p>

          {/* Date/Time */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success-50 border border-success-200 rounded-lg text-sm">
              <Calendar className="w-4 h-4 text-success-700" />
              <span className="font-medium text-success-900">
                {viewingDate.toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success-50 border border-success-200 rounded-lg text-sm">
              <Clock className="w-4 h-4 text-success-700" />
              <span className="font-medium text-success-900">
                {viewingDate.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Countdown */}
          <p className="text-xs text-neutral-600 mb-2">
            {daysUntil === 0 ? '🔥 Today' : daysUntil === 1 ? '📅 Tomorrow' : `⏰ in ${timeUntil}`}
          </p>

          {/* Contact Info */}
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <User className="w-4 h-4" />
            <span>
              {isRenter ? `Landlord: ${match.landlordName}` : `Renter: ${match.renterName}`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors">
            Details
          </button>
          <button className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingViewingCard({ match, isRenter, onSuggestTime }: PendingViewingCardProps) {
  const preference = match.viewingPreference;
  if (!preference) return null;

  return (
    <div className="bg-white rounded-xl border-2 border-secondary-200 p-5">
      <div className="flex gap-4">
        {/* Property Image */}
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          {match.property.images?.[0] && (
            <img
              src={match.property.images[0]}
              alt={match.property.address.street}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Property Info */}
          <h3 className="font-semibold text-neutral-900 mb-1 truncate">
            {match.property.address.street}
          </h3>
          <p className="text-sm text-neutral-600 mb-2">£{match.property.rentPcm.toLocaleString()} pcm</p>

          {/* Status */}
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-secondary-600" />
            <span className="text-sm text-secondary-700 font-medium">
              {isRenter
                ? 'Awaiting landlord response'
                : 'Awaiting your response'}
            </span>
          </div>

          {/* Preferences */}
          {preference.flexibility && (
            <div className="text-xs text-neutral-600">
              Flexibility: <span className="font-medium text-neutral-900">{preference.flexibility}</span>
              {(preference.preferredTimes ?? []).length > 0 && (
                <span className="ml-2">
                  ({(preference.preferredTimes ?? []).length} time{(preference.preferredTimes ?? []).length > 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isRenter && (
          <div className="flex flex-col gap-2">
            <button
              onClick={onSuggestTime}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Suggest Time
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PastViewingCard({ match, isRenter }: ViewingCardProps) {
  const viewingDate = match.confirmedViewingDate ? new Date(match.confirmedViewingDate) : null;
  if (!viewingDate) return null;

  return (
    <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-5 opacity-75">
      <div className="flex gap-4">
        {/* Property Image */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 grayscale">
          <img
            src={match.property.images[0]}
            alt={match.property.address.street}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-700 mb-1 truncate">
            {match.property.address.street}
          </h3>
          <p className="text-sm text-neutral-500 mb-2">
            Viewed on {viewingDate.toLocaleDateString('en-GB')}
          </p>
          <p className="text-xs text-neutral-500">
            {isRenter ? `Landlord: ${match.landlordName}` : `Renter: ${match.renterName}`}
          </p>
        </div>

        <button className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-medium rounded-lg transition-colors h-fit">
          View Chat
        </button>
      </div>
    </div>
  );
}

function getTimeUntilString(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return 'less than an hour';
  }
}
