import { Calendar, Clock, MapPin, User, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { useAppStore } from '../../hooks/useAppStore';
import { useAuthStore } from '../../hooks/useAuthStore';
import type { Match } from '../../types';

/**
 * ViewingsList component showing upcoming, pending, and past viewings
 * Different views for renters and landlords
 */
export function ViewingsList() {
  const { matches, getUpcomingViewings } = useAppStore();
  const { userType } = useAuthStore();

  const upcomingViewings = getUpcomingViewings();
  const pendingRequests = matches.filter((m) => m.viewingPreference && !m.hasViewingScheduled);
  const pastViewings = matches.filter(
    (m) => m.hasViewingScheduled && m.confirmedViewingDate && new Date(m.confirmedViewingDate) <= new Date()
  );

  const isRenter = userType === 'renter';

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
              <PendingViewingCard key={match.id} match={match} isRenter={isRenter} />
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
    </div>
  );
}

interface ViewingCardProps {
  match: Match;
  isRenter: boolean;
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
        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={match.property.images[0]}
            alt={match.property.address.street}
            className="w-full h-full object-cover"
          />
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

function PendingViewingCard({ match, isRenter }: ViewingCardProps) {
  const preference = match.viewingPreference;
  if (!preference) return null;

  return (
    <div className="bg-white rounded-xl border-2 border-secondary-200 p-5">
      <div className="flex gap-4">
        {/* Property Image */}
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={match.property.images[0]}
            alt={match.property.address.street}
            className="w-full h-full object-cover"
          />
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
                ? 'Awaiting vendor response'
                : 'Awaiting your response'}
            </span>
          </div>

          {/* Preferences */}
          {preference.flexibility && (
            <div className="text-xs text-neutral-600">
              Flexibility: <span className="font-medium text-neutral-900">{preference.flexibility}</span>
              {preference.preferredTimes.length > 0 && (
                <span className="ml-2">
                  ({preference.preferredTimes.length} time{preference.preferredTimes.length > 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isRenter && (
          <div className="flex flex-col gap-2">
            <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
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
