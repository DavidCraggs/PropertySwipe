import { useState } from 'react';
import { Home, TrendingUp, Users, Heart, MessageSquare, Calendar, Eye, Clock, Edit, Trash2, LinkIcon, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { useAppStore } from '../hooks';
import type { VendorProfile, Match } from '../types';
import { formatPrice } from '../utils/formatters';
import { ViewingScheduler } from '../components/organisms/ViewingScheduler';
import { PropertyLinker } from '../components/organisms/PropertyLinker';
import { PropertyForm } from '../components/organisms/PropertyForm';
import { PropertyImage } from '../components/atoms/PropertyImage';
import { useToastStore } from '../components/organisms/Toast';

/**
 * Dashboard for vendors showing their property listing and interested buyers
 * Different from buyer swipe interface
 */
export function VendorDashboard() {
  const { currentUser, updateProfile } = useAuthStore();
  const {
    matches,
    allProperties,
    confirmViewing,
    linkPropertyToVendor,
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

  const vendorProfile = currentUser as VendorProfile;

  // Find vendor's property if linked
  const vendorProperty = vendorProfile?.propertyId
    ? allProperties.find((p) => p.id === vendorProfile.propertyId)
    : null;

  // Get matches where vendor is the seller
  const buyerInterests = matches.filter((m) => m.vendorId === vendorProfile?.id);

  // FIX BUG #12: Calculate real stats from match data instead of random numbers
  const stats = {
    // Profile views = interested buyers (each buyer "viewed" the property by swiping right)
    totalViews: buyerInterests.length,
    interestedBuyers: buyerInterests.length,
    messages: buyerInterests.reduce((acc, m) => acc + m.messages.length, 0),
    viewingsScheduled: buyerInterests.filter((m) => m.hasViewingScheduled).length,
    viewingRequests: buyerInterests.filter((m) => m.viewingPreference && !m.hasViewingScheduled).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900">Vendor Dashboard</h1>
          <p className="text-neutral-600 mt-1">Manage your listing and connect with buyers</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {vendorProfile?.names}!</h2>
          <p className="text-secondary-100">
            You're looking for {vendorProfile?.lookingFor === 'Family' ? 'a family buyer' : 'an investor'} for your{' '}
            {vendorProfile?.propertyType} property
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
              <div className="text-2xl font-bold text-neutral-900">{stats.interestedBuyers}</div>
            </div>
            <div className="text-sm text-neutral-600">Interested Buyers</div>
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
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stats.viewingRequests > 0 ? 'bg-danger-100' : 'bg-neutral-100'
              }`}>
                <Clock className={`w-5 h-5 ${
                  stats.viewingRequests > 0 ? 'text-danger-600' : 'text-neutral-600'
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
        {vendorProperty ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="relative h-64">
              {/* FIX BUG #13: Use PropertyImage with loading states */}
              <PropertyImage
                src={vendorProperty.images[0]}
                alt={vendorProperty.address.street}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-lg">
                {formatPrice(vendorProperty.price)}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                {vendorProperty.address.street}
              </h3>
              <p className="text-neutral-600 mb-4">
                {vendorProperty.address.city}, {vendorProperty.address.postcode}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                  {vendorProperty.bedrooms} bed
                </span>
                <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                  {vendorProperty.bathrooms} bath
                </span>
                <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                  {vendorProperty.propertyType}
                </span>
                <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                  EPC: {vendorProperty.epcRating}
                </span>
              </div>
              <p className="text-neutral-700 line-clamp-3 mb-4">{vendorProperty.description}</p>

              {/* Property Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowPropertyEditor(true)}
                  className="flex-1 min-w-[120px] px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Property
                </button>
                <button
                  onClick={() => {
                    if (!vendorProfile?.id) return;
                    try {
                      unlinkProperty(vendorProperty.id, vendorProfile.id);
                      updateProfile({ propertyId: undefined });
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
                  }}
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
              Create a new property listing or link an existing one to start receiving interest from buyers
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

        {/* Interested Buyers */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users size={24} className="text-secondary-600" />
            <h3 className="text-xl font-bold text-neutral-900">Interested Buyers</h3>
            {stats.interestedBuyers > 0 && (
              <span className="ml-auto px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
                {stats.interestedBuyers} active
              </span>
            )}
          </div>

          {buyerInterests.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto text-neutral-300 mb-4" />
              <h4 className="text-lg font-semibold text-neutral-700 mb-2">No buyers yet</h4>
              <p className="text-neutral-500">
                When buyers express interest in your property, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {buyerInterests.map((match) => (
                <BuyerInterestCard
                  key={match.id}
                  match={match}
                  onScheduleViewing={setSchedulingMatch}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tips Card */}
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <TrendingUp size={24} className="text-primary-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-neutral-900 mb-2">Tips to attract buyers:</h4>
              <ul className="space-y-1 text-sm text-neutral-700">
                <li>• Respond quickly to messages - buyers appreciate fast communication</li>
                <li>• Be flexible with viewing times to accommodate more potential buyers</li>
                <li>• Keep your property listing up-to-date with recent photos</li>
                <li>• Highlight unique features that match what buyers are looking for</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

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
          currentPropertyId={vendorProfile?.propertyId}
          onLinkProperty={(propertyId) => {
            try {
              // Update property's vendorId to match current vendor
              if (vendorProfile?.id) {
                linkPropertyToVendor(propertyId, vendorProfile.id);
              }
              // Update vendor profile with propertyId
              updateProfile({ propertyId });
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
                    if (!vendorProfile?.id) {
                      throw new Error('Vendor profile not found');
                    }

                    // Create property and get the new property ID
                    const newPropertyId = await createProperty(propertyData, vendorProfile.id);

                    // Link property to vendor profile
                    updateProfile({ propertyId: newPropertyId });

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
      {showPropertyEditor && vendorProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 py-8">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
              <PropertyForm
                mode="edit"
                initialData={vendorProperty}
                onSubmit={async (propertyData) => {
                  try {
                    if (!vendorProperty?.id) {
                      throw new Error('Property not found');
                    }

                    // Update property with new data
                    updateProperty(vendorProperty.id, propertyData);

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
      {showDeleteConfirm && vendorProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-danger-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Delete Property?</h3>
            </div>

            <p className="text-neutral-700 mb-2">
              Are you sure you want to delete <strong>{vendorProperty.address.street}</strong>?
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
                onClick={() => {
                  try {
                    if (!vendorProperty?.id) return;

                    deleteProperty(vendorProperty.id);
                    updateProfile({ propertyId: undefined });

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

interface BuyerInterestCardProps {
  match: Match;
  onScheduleViewing: (match: Match) => void;
}

function BuyerInterestCard({ match, onScheduleViewing }: BuyerInterestCardProps) {
  const lastMessage = match.messages[match.messages.length - 1];

  return (
    <div className="border-2 border-neutral-200 rounded-xl p-4 hover:border-primary-300 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
          {match.buyerName?.charAt(0).toUpperCase() || 'B'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-neutral-900">{match.buyerName || 'Interested Buyer'}</h4>
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
              {match.viewingPreference.preferredTimes.length > 0 && (
                <div className="text-xs text-danger-900">
                  <strong>Preferred times:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {match.viewingPreference.preferredTimes.slice(0, 3).map((slot, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-danger-100 rounded text-xs">
                        {slot.dayType} {slot.timeOfDay}
                      </span>
                    ))}
                    {match.viewingPreference.preferredTimes.length > 3 && (
                      <span className="px-2 py-0.5 bg-danger-100 rounded text-xs">
                        +{match.viewingPreference.preferredTimes.length - 3} more
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

          {lastMessage && (
            <div className="bg-neutral-50 rounded-lg p-3 text-sm">
              <p className="text-xs text-neutral-500 mb-1">
                {lastMessage.senderType === 'buyer' ? match.buyerName : 'You'}
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
