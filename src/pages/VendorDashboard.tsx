import { useState, useCallback } from 'react';
import { Home, TrendingUp, Users, Heart, MessageSquare, Calendar, Eye, Clock, Edit, Trash2, LinkIcon, PlusCircle, AlertTriangle, CheckCircle2, UserPlus } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { useAppStore } from '../hooks';
import type { LandlordProfile, Match } from '../types';
import { ViewingScheduler } from '../components/organisms/ViewingScheduler';
import { PropertyLinker } from '../components/organisms/PropertyLinker';
import { PropertyForm } from '../components/organisms/PropertyForm';
import { PropertyImage } from '../components/atoms/PropertyImage';
import { AgencyLinkManager } from '../components/organisms/AgencyLinkManager';
import { CreateRenterInviteModal } from '../components/organisms/CreateRenterInviteModal';
import { useToastStore } from '../components/organisms/Toast';

/**
 * Dashboard for landlords showing their rental property listing and interested renters
 * Different from renter swipe interface
 */
export function VendorDashboard() {
  const { currentUser, updateProfile } = useAuthStore();
  const {
    matches,
    allProperties,
    confirmViewing,
    linkPropertyToLandlord,
    createProperty,
    updateProperty,
    deleteProperty,
    unlinkProperty
  } = useAppStore();
  const { addToast } = useToastStore();
  const [schedulingMatch, setSchedulingMatch] = useState<Match | null>(null);
  const [showPropertyLinker, setShowPropertyLinker] = useState(false);
  const [showPropertyCreator, setShowPropertyCreator] = useState(false);
  const [showPropertyEditor, setShowPropertyEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const landlordProfile = currentUser as LandlordProfile;

  // Find landlord's property if linked
  const landlordProperty = landlordProfile?.propertyId
    ? allProperties.find((p) => p.id === landlordProfile.propertyId)
    : null;

  const handleUnlinkProperty = useCallback(async () => {
    if (!landlordProfile?.id || !landlordProperty) return;
    try {
      unlinkProperty(landlordProperty.id, landlordProfile.id);
      await updateProfile({ propertyId: undefined });
      addToast({
        type: 'success',
        title: 'Property Unlinked',
        message: 'Property has been unlinked from your profile'
      });
    } catch (error) {
      console.error('[VendorDashboard] Unlink failed:', error);
      addToast({
        type: 'danger',
        title: 'Cannot Unlink',
        message: error instanceof Error ? error.message : 'Failed to unlink property'
      });
    }
  }, [landlordProfile, landlordProperty, unlinkProperty, updateProfile, addToast]);

  // Get matches where landlord is the property owner
  const allLandlordMatches = matches.filter((m) => m.landlordId === landlordProfile?.id);

  // Phase 4: Separate active tenancies from prospective matches
  const activeTenancies = allLandlordMatches.filter((m) => m.tenancyStatus === 'active');
  const renterInterests = allLandlordMatches.filter((m) => m.tenancyStatus === 'prospective');

  // FIX BUG #12: Calculate real stats from match data instead of random numbers
  const stats = {
    // Profile views = interested renters (each renter "viewed" the property by swiping right)
    totalViews: renterInterests.length,
    interestedRenters: renterInterests.length,
    messages: allLandlordMatches.reduce((acc, m) => acc + m.messages.length, 0),
    viewingsScheduled: renterInterests.filter((m) => m.hasViewingScheduled).length,
    viewingRequests: renterInterests.filter((m) => m.viewingPreference && !m.hasViewingScheduled).length,
    // Phase 4: Add active tenancy stats
    activeTenants: activeTenancies.length,
    totalIssuesOpen: activeTenancies.reduce((acc, m) => acc + (m.activeIssueIds?.length || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900">Landlord Dashboard</h1>
          <p className="text-neutral-600 mt-1">Manage your rental listing and connect with renters</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {landlordProfile?.names}!</h2>
          <p className="text-secondary-100">
            {landlordProfile?.preferredTenantTypes && landlordProfile.preferredTenantTypes.length > 0
              ? `Looking for ${landlordProfile.preferredTenantTypes.join(', ')} tenants`
              : 'Looking for quality tenants'} for your {landlordProfile?.propertyType} property
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.totalViews}</div>
            </div>
            <div className="text-sm text-neutral-600">Profile Views</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-success-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.interestedRenters}</div>
            </div>
            <div className="text-sm text-neutral-600">Interested Renters</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.messages}</div>
            </div>
            <div className="text-sm text-neutral-600">Messages</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.viewingsScheduled}</div>
            </div>
            <div className="text-sm text-neutral-600">Viewings Booked</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 relative">
            {stats.viewingRequests > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                {stats.viewingRequests}
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.viewingRequests > 0 ? 'bg-danger-100' : 'bg-neutral-100'
                }`}>
                <Clock className={`w-5 h-5 ${stats.viewingRequests > 0 ? 'text-danger-600' : 'text-neutral-600'
                  }`} />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.viewingRequests}</div>
            </div>
            <div className="text-sm text-neutral-600">
              {stats.viewingRequests > 0 ? 'Viewing Requests' : 'No Requests'}
            </div>
          </div>
        </div>

        {/* Property Listing Card */}
        {landlordProperty ? (
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="relative h-64 overflow-hidden">
              {/* FIX BUG #13: Use PropertyImage with loading states */}
              <PropertyImage
                src={landlordProperty.images[0]}
                alt={landlordProperty.address?.street || 'Property'}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-lg">
                £{landlordProperty.rentPcm.toLocaleString()} pcm
              </div>
            </div>
            <div className="p-6 relative z-10 bg-white">
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                {landlordProperty.address?.street || 'Property Address'}
              </h3>
              <p className="text-neutral-600 mb-4">
                {landlordProperty.address?.city || 'City'}, {landlordProperty.address?.postcode || 'Postcode'}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                  {landlordProperty.bedrooms || 0} bed
                </span>
                <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                  {landlordProperty.bathrooms || 0} bath
                </span>
                <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                  {landlordProperty.propertyType || 'Property'}
                </span>
                <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                  EPC: {landlordProperty.epcRating || 'N/A'}
                </span>
              </div>
              <p className="text-neutral-700 line-clamp-3 mb-4">{landlordProperty.description || 'No description available'}</p>

              {/* Property Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex-1 min-w-[140px] px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Renter
                </button>
                <button
                  onClick={() => setShowPropertyEditor(true)}
                  className="flex-1 min-w-[120px] px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Property
                </button>
                <button
                  onClick={handleUnlinkProperty}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  Unlink
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Home size={48} className="mx-auto text-neutral-400 mb-4" />
            <h3 className="text-xl font-bold text-neutral-900 mb-2">No Property Linked</h3>
            <p className="text-neutral-600 mb-4">
              Create a new property listing or link an existing one to start receiving interest from renters
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowPropertyCreator(true)}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Create New Property
              </button>
              <button
                onClick={() => setShowPropertyLinker(true)}
                className="px-6 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <LinkIcon className="w-5 h-5" />
                Link Existing
              </button>
            </div>
          </div>
        )}

        {/* Phase 4: Active Tenancies Section */}
        {activeTenancies.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Home size={24} className="text-success-600" />
              <h3 className="text-xl font-bold text-neutral-900">Active Tenancies</h3>
              <span className="ml-auto px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
                {stats.activeTenants} active
              </span>
            </div>

            <div className="space-y-4">
              {activeTenancies.map((match) => (
                <ActiveTenancyCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Interested Renters */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users size={24} className="text-secondary-600" />
            <h3 className="text-xl font-bold text-neutral-900">Interested Renters</h3>
            {stats.interestedRenters > 0 && (
              <span className="ml-auto px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
                {stats.interestedRenters} active
              </span>
            )}
          </div>

          {renterInterests.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto text-neutral-300 mb-4" />
              <h4 className="text-lg font-semibold text-neutral-700 mb-2">No renters yet</h4>
              <p className="text-neutral-500">
                When renters express interest in your property, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {renterInterests.map((match) => (
                <RenterInterestCard
                  key={match.id}
                  match={match}
                  onScheduleViewing={setSchedulingMatch}
                />
              ))}
            </div>
          )}
        </div>

        {/* Agency Relationships Section */}
        {landlordProfile?.id && landlordProperty && (
          <div>
            <AgencyLinkManager
              landlordId={landlordProfile.id}
              properties={landlordProperty ? [landlordProperty] : []}
            />
          </div>
        )}

        {/* Tips Card */}
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <TrendingUp size={24} className="text-primary-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-neutral-900 mb-2">Tips to attract renters:</h4>
              <ul className="space-y-1 text-sm text-neutral-700">
                <li>• Respond quickly to messages - renters appreciate fast communication</li>
                <li>• Be flexible with viewing times to accommodate more potential renters</li>
                <li>• Keep your property listing up-to-date with recent photos</li>
                <li>• Highlight unique features that match what renters are looking for</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Create Renter Invite Modal */}
      {showInviteModal && landlordProperty && landlordProfile && (
        <CreateRenterInviteModal
          isOpen={showInviteModal}
          property={landlordProperty}
          landlordId={landlordProfile.id}
          managingAgencyId={landlordProfile.managementAgencyId}
          createdByType="landlord"
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Viewing Scheduler Modal */}
      {schedulingMatch && (
        <ViewingScheduler
          isOpen={true}
          onClose={() => setSchedulingMatch(null)}
          match={schedulingMatch}
          onConfirm={(dateTime) => {
            confirmViewing(schedulingMatch.id, dateTime);
            addToast({
              type: 'success',
              title: 'Viewing Confirmed!',
              message: `Viewing scheduled for ${dateTime.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}`
            });
            setSchedulingMatch(null);
          }}
        />
      )}

      {/* Property Linker Modal */}
      {showPropertyLinker && (
        <PropertyLinker
          isOpen={true}
          onClose={() => setShowPropertyLinker(false)}
          availableProperties={allProperties}
          currentPropertyId={landlordProfile?.propertyId}
          onLinkProperty={async (propertyId) => {
            try {
              // Update property's landlordId to match current landlord
              if (landlordProfile?.id) {
                linkPropertyToLandlord(propertyId, landlordProfile.id);
              }
              // Update vendor profile with propertyId
              await updateProfile({ propertyId });
              addToast({
                type: 'success',
                title: 'Property Linked!',
                message: 'Your property has been linked to your vendor profile'
              });
              setShowPropertyLinker(false);
            } catch (error) {
              // Handle ownership validation errors gracefully
              console.error('[VendorDashboard] Property linking failed:', error);
              addToast({
                type: 'danger',
                title: 'Cannot Link Property',
                message: error instanceof Error ? error.message : 'Property is already linked to another vendor'
              });
            }
          }}
        />
      )}

      {/* Property Creator Modal */}
      {showPropertyCreator && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 py-8">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
              <PropertyForm
                mode="create"
                onSubmit={async (propertyData) => {
                  try {
                    if (!landlordProfile?.id) {
                      throw new Error('Vendor profile not found');
                    }

                    // Create property and get the new property ID
                    const newPropertyId = await createProperty(propertyData, landlordProfile.id);

                    // Link property to vendor profile
                    await updateProfile({ propertyId: newPropertyId });

                    addToast({
                      type: 'success',
                      title: 'Property Created!',
                      message: 'Your property listing has been created successfully'
                    });

                    setShowPropertyCreator(false);
                  } catch (error) {
                    console.error('[VendorDashboard] Property creation failed:', error);
                    addToast({
                      type: 'danger',
                      title: 'Creation Failed',
                      message: error instanceof Error ? error.message : 'Failed to create property'
                    });
                    throw error; // Re-throw to keep form open
                  }
                }}
                onCancel={() => setShowPropertyCreator(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Property Editor Modal */}
      {showPropertyEditor && landlordProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 py-8">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
              <PropertyForm
                mode="edit"
                initialData={landlordProperty}
                onSubmit={async (propertyData) => {
                  try {
                    if (!landlordProperty?.id) {
                      throw new Error('Property not found');
                    }

                    // Update property with new data
                    updateProperty(landlordProperty.id, propertyData);

                    addToast({
                      type: 'success',
                      title: 'Property Updated!',
                      message: 'Your property details have been updated'
                    });

                    setShowPropertyEditor(false);
                  } catch (error) {
                    console.error('[VendorDashboard] Property update failed:', error);
                    addToast({
                      type: 'danger',
                      title: 'Update Failed',
                      message: error instanceof Error ? error.message : 'Failed to update property'
                    });
                    throw error; // Re-throw to keep form open
                  }
                }}
                onCancel={() => setShowPropertyEditor(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && landlordProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-danger-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Delete Property?</h3>
            </div>

            <p className="text-neutral-700 mb-2">
              Are you sure you want to delete <strong>{landlordProperty.address.street}</strong>?
            </p>
            <p className="text-sm text-neutral-600 mb-6">
              This will permanently remove the property and all associated matches. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!landlordProperty?.id) return;

                    await deleteProperty(landlordProperty.id);
                    await updateProfile({ propertyId: undefined });

                    addToast({
                      type: 'success',
                      title: 'Property Deleted',
                      message: 'Property has been permanently removed'
                    });

                    setShowDeleteConfirm(false);
                  } catch (error) {
                    console.error('[VendorDashboard] Delete failed:', error);
                    addToast({
                      type: 'danger',
                      title: 'Delete Failed',
                      message: error instanceof Error ? error.message : 'Failed to delete property'
                    });
                  }
                }}
                className="flex-1 px-4 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg font-medium transition-colors"
              >
                Delete Property
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface RenterInterestCardProps {
  match: Match;
  onScheduleViewing: (match: Match) => void;
}

function RenterInterestCard({ match, onScheduleViewing }: RenterInterestCardProps) {
  const lastMessage = match.messages[match.messages.length - 1];

  return (
    <div className="border-2 border-neutral-200 rounded-xl p-4 hover:border-primary-300 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
          {match.renterName?.charAt(0).toUpperCase() || 'R'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-neutral-900">{match.renterName || 'Interested Renter'}</h4>
            {match.unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-danger-500 text-white text-xs font-bold rounded-full">
                {match.unreadCount}
              </span>
            )}
          </div>

          <p className="text-sm text-neutral-600 mb-2">
            Interested • {new Date(match.timestamp).toLocaleDateString()}
          </p>

          {/* Viewing Status */}
          {match.hasViewingScheduled && match.confirmedViewingDate && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2 text-success-700 mb-1">
                <Calendar size={14} />
                <span className="text-xs font-medium">Viewing Scheduled</span>
              </div>
              <p className="text-sm font-semibold text-success-900">
                {new Date(match.confirmedViewingDate).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
          {match.viewingPreference && !match.hasViewingScheduled && (
            <div className="bg-danger-50 border-2 border-danger-300 rounded-lg p-3 mb-2 animate-pulse">
              <div className="flex items-center gap-2 text-danger-700 mb-1">
                <Clock size={14} />
                <span className="text-xs font-bold">Viewing Request - Action Needed!</span>
              </div>
              <p className="text-xs text-danger-900 mb-1">
                <strong>Flexibility:</strong> {match.viewingPreference.flexibility}
              </p>
              {(match.viewingPreference.preferredTimes ?? []).length > 0 && (
                <div className="text-xs text-danger-900">
                  <strong>Preferred times:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(match.viewingPreference.preferredTimes ?? []).slice(0, 3).map((slot, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-danger-100 rounded text-xs">
                        {slot.dayType} {slot.timeOfDay}
                      </span>
                    ))}
                    {(match.viewingPreference.preferredTimes ?? []).length > 3 && (
                      <span className="px-2 py-0.5 bg-danger-100 rounded text-xs">
                        +{(match.viewingPreference.preferredTimes ?? []).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              {match.viewingPreference.additionalNotes && (
                <p className="text-xs text-danger-800 mt-2 italic">
                  "{match.viewingPreference.additionalNotes}"
                </p>
              )}
            </div>
          )}

          {/* Pet Request Review (RRA 2025) */}
          {match.petRequestStatus === 'requested' && (
            <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2 text-secondary-800 mb-2">
                <Clock size={16} />
                <span className="text-sm font-bold">Pet Request Pending</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirm('Approve pet request?')) {
                      useAppStore.getState().reviewPetRequest(match.id, 'approved');
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-success-500 text-white rounded-lg text-xs font-medium hover:bg-success-600 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Reason for refusal (Required by RRA 2025):');
                    if (reason) {
                      useAppStore.getState().reviewPetRequest(match.id, 'refused', reason);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-danger-500 text-white rounded-lg text-xs font-medium hover:bg-danger-600 transition-colors"
                >
                  Refuse
                </button>
              </div>
            </div>
          )}

          {/* Right to Rent Check (RRA 2025) */}
          {!match.rightToRentVerifiedAt && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-warning-800">Right to Rent Check Needed</span>
                <AlertTriangle size={14} className="text-warning-600" />
              </div>
              <button
                onClick={() => {
                  if (confirm('Confirm you have seen original documents proving the tenant\'s right to rent in the UK?')) {
                    useAppStore.getState().verifyRightToRent(match.id);
                  }
                }}
                className="w-full px-3 py-1.5 bg-white border border-warning-300 text-warning-700 rounded-lg text-xs font-medium hover:bg-warning-50 transition-colors"
              >
                Verify Documents
              </button>
            </div>
          )}

          {lastMessage && (
            <div className="bg-neutral-50 rounded-lg p-3 text-sm">
              <p className="text-xs text-neutral-500 mb-1">
                {lastMessage.senderType === 'renter' ? match.renterName : 'You'}
              </p>
              <p className="text-neutral-700 line-clamp-2">{lastMessage.content}</p>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-colors">
              View Chat
            </button>
            {!match.hasViewingScheduled && (
              <button
                onClick={() => onScheduleViewing(match)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium text-sm transition-colors"
              >
                Schedule Viewing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Phase 4: ActiveTenancyCard Component
 * Displays information about current tenants with issue tracking
 */
interface ActiveTenancyCardProps {
  match: Match;
}

function ActiveTenancyCard({ match }: ActiveTenancyCardProps) {
  const lastMessage = match.messages[match.messages.length - 1];
  const openIssuesCount = match.activeIssueIds?.length || 0;
  const totalIssues = match.totalIssuesRaised || 0;
  const resolvedIssues = match.totalIssuesResolved || 0;

  // Calculate tenancy duration
  const moveInDate = match.tenancyStartDate ? new Date(match.tenancyStartDate) : null;
  const tenancyDuration = moveInDate
    ? Math.floor((Date.now() - moveInDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  return (
    <div className="border-2 border-success-200 bg-success-50/30 rounded-xl p-4 hover:border-success-400 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center text-white font-bold">
          {match.renterName?.charAt(0).toUpperCase() || 'T'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-neutral-900">{match.renterName || 'Current Tenant'}</h4>
            <span className="px-2 py-0.5 bg-success-500 text-white text-xs font-bold rounded-full">
              ACTIVE
            </span>
            {match.unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-danger-500 text-white text-xs font-bold rounded-full">
                {match.unreadCount}
              </span>
            )}
          </div>

          {/* Tenancy Info */}
          <div className="flex items-center gap-4 mb-3 text-sm text-neutral-600">
            {moveInDate && (
              <span>
                Moved in: {moveInDate.toLocaleDateString()}
              </span>
            )}
            {tenancyDuration > 0 && (
              <span>
                • {tenancyDuration} month{tenancyDuration !== 1 ? 's' : ''}
              </span>
            )}
            {match.monthlyRentAmount && (
              <span>
                • £{match.monthlyRentAmount.toLocaleString()}/mo
              </span>
            )}
          </div>

          {/* Issue Status Banner */}
          {totalIssues > 0 && (
            <div className={`rounded-lg p-3 mb-3 ${openIssuesCount > 0
              ? 'bg-warning-50 border border-warning-200'
              : 'bg-success-50 border border-success-200'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {openIssuesCount > 0 ? (
                    <AlertTriangle size={16} className="text-warning-600" />
                  ) : (
                    <CheckCircle2 size={16} className="text-success-600" />
                  )}
                  <span className={`text-sm font-medium ${openIssuesCount > 0 ? 'text-warning-700' : 'text-success-700'
                    }`}>
                    {openIssuesCount > 0
                      ? `${openIssuesCount} Open Issue${openIssuesCount !== 1 ? 's' : ''}`
                      : 'No Open Issues'}
                  </span>
                </div>
                <span className="text-xs text-neutral-600">
                  {resolvedIssues}/{totalIssues} resolved
                </span>
              </div>
            </div>
          )}

          {/* Last Message Preview */}
          {lastMessage && (
            <div className="bg-white rounded-lg p-3 text-sm mb-3 border border-neutral-200">
              <p className="text-xs text-neutral-500 mb-1">
                {lastMessage.senderType === 'renter' ? match.renterName : 'You'}
              </p>
              <p className="text-neutral-700 line-clamp-2">{lastMessage.content}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
              <MessageSquare size={16} />
              View Messages
            </button>
            {openIssuesCount > 0 && (
              <button className="px-4 py-2 bg-warning-500 hover:bg-warning-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                <AlertTriangle size={16} />
                View Issues ({openIssuesCount})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
