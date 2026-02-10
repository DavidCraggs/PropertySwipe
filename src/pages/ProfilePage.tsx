import { useState, useEffect } from 'react';
import { User, TrendingUp, Heart, X, Home, LogOut, ShoppingBag, MapPin, CreditCard, Users, Download, Trash2, Shield, FileText, Pencil } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { useAppStore } from '../hooks';
import { useAuthStore } from '../hooks/useAuthStore';
import { useToastStore } from '../components/organisms/toastUtils';
import { RatingsSummaryCard } from '../components/molecules/RatingsSummaryCard';
import { ConfirmationModal } from '../components/molecules/ConfirmationModal';
import { EditProfileModal } from '../components/organisms/EditProfileModal';
import { exportUserData, downloadExportData } from '../services/DataExportService';
import { DataDeletionService } from '../services/DataDeletionService';

import type { RenterProfile, LandlordProfile, AgencyProfile, UserRatingsSummary } from '../types';
import { calculateUserRatingsSummary } from '../utils/ratingCalculations';

export const ProfilePage: React.FC = () => {
  const { getStats, resetApp, getUserRatings } = useAppStore();
  const { currentUser, userType, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const stats = getStats();
  const [ratingsSummary, setRatingsSummary] = useState<UserRatingsSummary | null>(null);
  const [isLoadingRatings, setIsLoadingRatings] = useState(true);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load user ratings on mount
  useEffect(() => {
    const loadRatings = async () => {
      if (!currentUser || !userType) {
        setIsLoadingRatings(false);
        return;
      }

      try {
        setIsLoadingRatings(true);
        const ratings = await getUserRatings(currentUser.id, userType === 'renter' ? 'renter' : 'landlord');
        const summary = calculateUserRatingsSummary(ratings, currentUser.id, userType);
        setRatingsSummary(summary);
      } catch (error) {
        console.error('Failed to load ratings:', error);
      } finally {
        setIsLoadingRatings(false);
      }
    };

    loadRatings();
  }, [currentUser, userType, getUserRatings]);

  const handleLogout = () => {
    logout();
    resetApp();
    // Clear hasVisited flag so user sees welcome screen after logout
    localStorage.removeItem('get-on-has-visited');
    addToast({
      type: 'info',
      message: 'You have been logged out successfully',
    });
    window.location.reload();
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    resetApp();
    logout();
    window.location.reload();
  };

  const handleExportData = async () => {
    if (!currentUser || !userType) return;

    try {
      setIsExportingData(true);

      const result = await exportUserData(currentUser.id, userType, {
        format: 'both',
        includeMetadata: true
      });

      if (result.success) {
        downloadExportData(result, `propertyswipe-data-${currentUser.id}`);

        addToast({
          type: 'success',
          message: 'Your data has been exported successfully',
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      addToast({
        type: 'error',
        message: 'Failed to export your data. Please try again.',
      });
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDeleteClick = () => {
    if (!currentUser || !userType) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentUser || !userType) return;
    setShowDeleteConfirm(false);

    try {
      setIsDeletingAccount(true);

      const deletionRequest = await DataDeletionService.requestDeletion(
        currentUser.id,
        userType,
        {
          reason: 'User requested account deletion from profile page'
        }
      );

      addToast({
        type: 'info',
        message: `Account deletion requested. Please check your email to verify. Deletion scheduled for ${new Date(deletionRequest.scheduledDeletionDate).toLocaleDateString()}.`,
      });

      // Optionally log out the user
      setTimeout(() => {
        handleLogout();
      }, 3000);
    } catch (error) {
      console.error('Failed to request deletion:', error);
      addToast({
        type: 'error',
        message: 'Failed to request account deletion. Please try again.',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <User size={64} className="mx-auto mb-4" style={{ color: 'var(--color-sub)' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>No Profile Yet</h2>
          <p style={{ color: 'var(--color-sub)' }}>Please sign up to get started!</p>
        </div>
      </div>
    );
  }

  const isRenter = userType === 'renter';
  const isAgency = userType === 'estate_agent' || userType === 'management_agency';
  const renterProfile = isRenter ? (currentUser as RenterProfile) : null;
  const landlordProfile = userType === 'landlord' ? (currentUser as LandlordProfile) : null;



  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', paddingBottom: 96 }}>
      {/* Header */}
      <header className="px-4 py-6" style={{ background: 'var(--color-card)', borderBottom: '1px solid var(--color-line)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, color: 'var(--color-text)', margin: 0 }}>Profile</h1>
            <p className="mt-1" style={{ color: 'var(--color-sub)' }}>
              {isRenter ? 'Your renter account' : 'Your vendor account'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<LogOut size={18} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* User Info Card */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)', borderRadius: 16 }}>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ background: isRenter ? 'var(--color-teal)' : 'var(--color-teal)' }}>
              {isRenter ? <ShoppingBag size={32} /> : <Home size={32} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {isAgency
                    ? (currentUser as AgencyProfile).companyName
                    : (currentUser as RenterProfile | LandlordProfile).names}
                </h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${isRenter ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700'}`}>
                  {isRenter ? 'Renter' : isAgency ? 'Agency' : 'Vendor'}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-sub)' }}>
                Member since {new Date(currentUser.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Pencil size={16} />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit
            </Button>
          </div>
        </div>

        {/* Ratings Summary - Show for renters and landlords only */}
        {!isAgency && (
          <div>
            {isLoadingRatings ? (
              <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)', borderRadius: 16 }}>
                <div className="animate-pulse">
                  <div className="h-6 rounded w-1/3 mb-4" style={{ background: 'var(--color-line)' }}></div>
                  <div className="h-20 rounded" style={{ background: 'var(--color-line)' }}></div>
                </div>
              </div>
            ) : (
              <RatingsSummaryCard
                summary={ratingsSummary}
                userType={userType === 'renter' ? 'renter' : 'landlord'}
                showDetails={true}
              />
            )}
          </div>
        )}

        {/* Statistics */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)', borderRadius: 16 }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={24} style={{ color: 'var(--color-teal)' }} />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: 'var(--color-text)' }}>Your Activity</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-line)', borderRadius: 12 }}>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Home size={24} style={{ color: 'var(--color-teal)' }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.propertiesViewed}</div>
              <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Viewed</div>
            </div>

            <div className="text-center p-4 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-line)', borderRadius: 12 }}>
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart size={24} className="text-success-600" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.propertiesLiked}</div>
              <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Liked</div>
            </div>

            <div className="text-center p-4 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-line)', borderRadius: 12 }}>
              <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <X size={24} className="text-danger-600" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.propertiesPassed}</div>
              <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Passed</div>
            </div>

            <div className="text-center p-4 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-line)', borderRadius: 12 }}>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart size={24} className="text-purple-600" fill="currentColor" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.matchesCount}</div>
              <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Matches</div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        {isRenter && renterProfile && (
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)', borderRadius: 16 }}>
            <h3 className="mb-4 flex items-center gap-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: 'var(--color-text)' }}>
              <User size={20} />
              Renter Profile
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <span style={{ color: 'var(--color-sub)' }}>Situation</span>
                <span className="font-medium flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  {renterProfile.situation === 'Family' ? <Users size={16} /> : <User size={16} />}
                  {renterProfile.situation}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <span style={{ color: 'var(--color-sub)' }}>Age(s)</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{renterProfile.ages}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <span style={{ color: 'var(--color-sub)' }}>Preferred Area</span>
                <span className="font-medium flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <MapPin size={16} />
                  {renterProfile.localArea}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <span style={{ color: 'var(--color-sub)' }}>Renter Type</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{renterProfile.renterType}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <span style={{ color: 'var(--color-sub)' }}>Employment Status</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{renterProfile.employmentStatus}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span style={{ color: 'var(--color-sub)' }}>Monthly Income</span>
                <span className="font-medium flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <CreditCard size={16} />
                  £{renterProfile.monthlyIncome?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {!isRenter && landlordProfile && (
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)', borderRadius: 16 }}>
            <h3 className="mb-4 flex items-center gap-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: 'var(--color-text)' }}>
              <Home size={20} />
              Landlord Profile
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <span style={{ color: 'var(--color-sub)' }}>Property Type</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{landlordProfile.propertyType}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <span style={{ color: 'var(--color-sub)' }}>Preferred Tenants</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{landlordProfile.preferredTenantTypes.join(', ')}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <span style={{ color: 'var(--color-sub)' }}>Furnishing Preference</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{landlordProfile.furnishingPreference}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <span style={{ color: 'var(--color-sub)' }}>Pets Policy</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {landlordProfile.defaultPetsPolicy.willConsiderPets
                    ? `Will consider pets (max ${landlordProfile.defaultPetsPolicy.maxPetsAllowed})`
                    : 'No pets'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span style={{ color: 'var(--color-sub)' }}>PRS Registration</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{landlordProfile.prsRegistrationStatus}</span>
              </div>
            </div>
          </div>
        )}

        {/* Your Data Rights (GDPR) */}
        <div className="rounded-2xl p-6 border-2 border-primary-100" style={{ background: 'var(--color-card)', borderRadius: 16 }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={24} style={{ color: 'var(--color-teal)' }} />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: 'var(--color-text)' }}>Your Data Rights</h3>
          </div>
          <p className="mb-6" style={{ color: 'var(--color-sub)' }}>
            Under GDPR, you have the right to access, export, and delete your personal data at any time.
          </p>

          <div className="space-y-4">
            {/* Export Data */}
            <div className="border rounded-xl p-4" style={{ borderColor: 'var(--color-line)' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download size={20} style={{ color: 'var(--color-teal)' }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Download Your Data</h4>
                  <p className="text-sm" style={{ color: 'var(--color-sub)' }}>
                    Export all your personal data in JSON and CSV formats. Includes your profile, matches, messages, and ratings.
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-sub)' }}>
                    GDPR Article 15 (Right of Access) & Article 20 (Data Portability)
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Download size={16} />}
                onClick={handleExportData}
                disabled={isExportingData}
              >
                {isExportingData ? 'Exporting...' : 'Export My Data'}
              </Button>
            </div>

            {/* Request Deletion */}
            <div className="border border-danger-200 rounded-xl p-4 bg-danger-50">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-danger-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 size={20} className="text-danger-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Delete Your Account</h4>
                  <p className="text-sm" style={{ color: 'var(--color-sub)' }}>
                    Request permanent deletion of your account and all associated data. You'll have 30 days to cancel before deletion is final.
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-sub)' }}>
                    GDPR Article 17 (Right to Erasure / "Right to be Forgotten")
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={handleDeleteClick}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? 'Processing...' : 'Request Account Deletion'}
              </Button>
            </div>

            {/* Privacy Information */}
            <div className="border rounded-xl p-4" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-line)' }}>
              <div className="flex items-start gap-3">
                <FileText size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-sub)' }} />
                <div className="text-sm" style={{ color: 'var(--color-sub)' }}>
                  <p className="mb-2">
                    <strong>Your privacy matters.</strong> We process your data in compliance with UK GDPR and the Data Protection Act 2018.
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li>• Data Controller: PropertySwipe Ltd</li>
                    <li>• Contact: privacy@propertyswipe.co.uk</li>
                    <li>• DPO: dpo@propertyswipe.co.uk</li>
                    <li>• You can lodge a complaint with the ICO at any time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl p-6 border-2 border-danger-100" style={{ background: 'var(--color-card)', borderRadius: 16 }}>
          <h3 className="text-xl font-bold text-danger-600 mb-2">Danger Zone</h3>
          <p className="mb-4" style={{ color: 'var(--color-sub)' }}>
            Reset all your data including liked properties, matches, and preferences. This action
            cannot be undone.
          </p>
          <Button variant="danger" size="md" onClick={handleResetClick}>
            Reset All Data
          </Button>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Reset Data Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetConfirm}
        title="Reset All Data?"
        message="Are you sure you want to reset all data? This will delete all your liked properties, matches, and preferences. This action cannot be undone."
        confirmText="Reset All Data"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Account Deletion Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Request Account Deletion?"
        message={
          <div className="space-y-3">
            <p>Are you sure you want to request account deletion?</p>
            <p className="font-medium">This will:</p>
            <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--color-sub)' }}>
              <li>Start a 30-day grace period before permanent deletion</li>
              <li>Send you a verification email</li>
              <li>Allow you to cancel within 30 days</li>
              <li>Permanently delete all your data after 30 days</li>
            </ul>
            <p className="text-xs mt-2" style={{ color: 'var(--color-sub)' }}>
              This action complies with GDPR Article 17 (Right to Erasure).
            </p>
          </div>
        }
        confirmText="Request Deletion"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
