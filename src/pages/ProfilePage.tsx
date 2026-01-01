import { useState, useEffect } from 'react';
import { User, TrendingUp, Heart, X, Home, LogOut, ShoppingBag, MapPin, CreditCard, Users, Download, Trash2, Shield, FileText } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { useAppStore } from '../hooks';
import { useAuthStore } from '../hooks/useAuthStore';
import { useToastStore } from '../components/organisms/toastUtils';
import { RatingsSummaryCard } from '../components/molecules/RatingsSummaryCard';
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

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      resetApp();
      logout();
      window.location.reload();
    }
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

  const handleRequestDeletion = async () => {
    if (!currentUser || !userType) return;

    const confirmed = confirm(
      'Are you sure you want to request account deletion?\n\n' +
      'This will:\n' +
      '• Start a 30-day grace period before permanent deletion\n' +
      '• Send you a verification email\n' +
      '• Allow you to cancel within 30 days\n' +
      '• Permanently delete all your data after 30 days\n\n' +
      'This action complies with GDPR Article 17 (Right to Erasure).'
    );

    if (!confirmed) return;

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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-4">
        <div className="text-center">
          <User size={64} className="mx-auto text-neutral-400 mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">No Profile Yet</h2>
          <p className="text-neutral-600">Please sign up to get started!</p>
        </div>
      </div>
    );
  }

  const isRenter = userType === 'renter';
  const isAgency = userType === 'estate_agent' || userType === 'management_agency';
  const renterProfile = isRenter ? (currentUser as RenterProfile) : null;
  const landlordProfile = userType === 'landlord' ? (currentUser as LandlordProfile) : null;



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Profile</h1>
            <p className="text-neutral-600 mt-1">
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
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${isRenter ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gradient-to-br from-secondary-500 to-secondary-600'}`}>
              {isRenter ? <ShoppingBag size={32} /> : <Home size={32} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {isAgency
                    ? (currentUser as AgencyProfile).companyName
                    : (currentUser as RenterProfile | LandlordProfile).names}
                </h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${isRenter ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700'}`}>
                  {isRenter ? 'Renter' : isAgency ? 'Agency' : 'Vendor'}
                </span>
              </div>
              <p className="text-sm text-neutral-500">
                Member since {new Date(currentUser.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Ratings Summary - Show for renters and landlords only */}
        {!isAgency && (
          <div>
            {isLoadingRatings ? (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
                  <div className="h-20 bg-neutral-200 rounded"></div>
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
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={24} className="text-primary-600" />
            <h3 className="text-xl font-bold text-neutral-900">Your Activity</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Home size={24} className="text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.propertiesViewed}</div>
              <div className="text-sm text-neutral-600">Viewed</div>
            </div>

            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart size={24} className="text-success-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.propertiesLiked}</div>
              <div className="text-sm text-neutral-600">Liked</div>
            </div>

            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <X size={24} className="text-danger-600" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.propertiesPassed}</div>
              <div className="text-sm text-neutral-600">Passed</div>
            </div>

            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart size={24} className="text-purple-600" fill="currentColor" />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{stats.matchesCount}</div>
              <div className="text-sm text-neutral-600">Matches</div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        {isRenter && renterProfile && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Renter Profile
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Situation</span>
                <span className="font-medium text-neutral-900 flex items-center gap-2">
                  {renterProfile.situation === 'Family' ? <Users size={16} /> : <User size={16} />}
                  {renterProfile.situation}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Age(s)</span>
                <span className="font-medium text-neutral-900">{renterProfile.ages}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Preferred Area</span>
                <span className="font-medium text-neutral-900 flex items-center gap-2">
                  <MapPin size={16} />
                  {renterProfile.localArea}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Renter Type</span>
                <span className="font-medium text-neutral-900">{renterProfile.renterType}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Employment Status</span>
                <span className="font-medium text-neutral-900">{renterProfile.employmentStatus}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-neutral-600">Monthly Income</span>
                <span className="font-medium text-neutral-900 flex items-center gap-2">
                  <CreditCard size={16} />
                  £{renterProfile.monthlyIncome?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {!isRenter && landlordProfile && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Home size={20} />
              Landlord Profile
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Property Type</span>
                <span className="font-medium text-neutral-900">{landlordProfile.propertyType}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Preferred Tenants</span>
                <span className="font-medium text-neutral-900">{landlordProfile.preferredTenantTypes.join(', ')}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Furnishing Preference</span>
                <span className="font-medium text-neutral-900">{landlordProfile.furnishingPreference}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Pets Policy</span>
                <span className="font-medium text-neutral-900">
                  {landlordProfile.defaultPetsPolicy.willConsiderPets
                    ? `Will consider pets (max ${landlordProfile.defaultPetsPolicy.maxPetsAllowed})`
                    : 'No pets'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-neutral-600">PRS Registration</span>
                <span className="font-medium text-neutral-900">{landlordProfile.prsRegistrationStatus}</span>
              </div>
            </div>
          </div>
        )}

        {/* Your Data Rights (GDPR) */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-primary-100">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={24} className="text-primary-600" />
            <h3 className="text-xl font-bold text-neutral-900">Your Data Rights</h3>
          </div>
          <p className="text-neutral-600 mb-6">
            Under GDPR, you have the right to access, export, and delete your personal data at any time.
          </p>

          <div className="space-y-4">
            {/* Export Data */}
            <div className="border border-neutral-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download size={20} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-900 mb-1">Download Your Data</h4>
                  <p className="text-sm text-neutral-600">
                    Export all your personal data in JSON and CSV formats. Includes your profile, matches, messages, and ratings.
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
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
                  <h4 className="font-semibold text-neutral-900 mb-1">Delete Your Account</h4>
                  <p className="text-sm text-neutral-600">
                    Request permanent deletion of your account and all associated data. You'll have 30 days to cancel before deletion is final.
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    GDPR Article 17 (Right to Erasure / "Right to be Forgotten")
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={handleRequestDeletion}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? 'Processing...' : 'Request Account Deletion'}
              </Button>
            </div>

            {/* Privacy Information */}
            <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-neutral-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-neutral-600">
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
        <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-danger-100">
          <h3 className="text-xl font-bold text-danger-600 mb-2">Danger Zone</h3>
          <p className="text-neutral-600 mb-4">
            Reset all your data including liked properties, matches, and preferences. This action
            cannot be undone.
          </p>
          <Button variant="danger" size="md" onClick={handleReset}>
            Reset All Data
          </Button>
        </div>
      </main>
    </div>
  );
};
