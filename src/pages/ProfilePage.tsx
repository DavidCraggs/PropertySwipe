import { User, TrendingUp, Heart, X, Home, LogOut, ShoppingBag, MapPin, CreditCard, Users } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { useAppStore } from '../hooks';
import { useAuthStore } from '../hooks/useAuthStore';
import { useToastStore } from '../components/organisms/Toast';
import type { BuyerProfile, VendorProfile } from '../types';

export const ProfilePage: React.FC = () => {
  const { getStats, resetApp } = useAppStore();
  const { currentUser, userType, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const stats = getStats();

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      resetApp();
      addToast({
        type: 'info',
        message: 'You have been logged out successfully',
      });
      window.location.reload();
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      resetApp();
      logout();
      window.location.reload();
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

  const isBuyer = userType === 'buyer';
  const buyerProfile = isBuyer ? (currentUser as BuyerProfile) : null;
  const vendorProfile = !isBuyer ? (currentUser as VendorProfile) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Profile</h1>
            <p className="text-neutral-600 mt-1">
              {isBuyer ? 'Your buyer account' : 'Your vendor account'}
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
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${isBuyer ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gradient-to-br from-secondary-500 to-secondary-600'}`}>
              {isBuyer ? <ShoppingBag size={32} /> : <Home size={32} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-neutral-900">{currentUser.names}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${isBuyer ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700'}`}>
                  {isBuyer ? 'Buyer' : 'Vendor'}
                </span>
              </div>
              <p className="text-sm text-neutral-500">
                Member since {new Date(currentUser.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

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
        {isBuyer && buyerProfile && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Buyer Profile
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Situation</span>
                <span className="font-medium text-neutral-900 flex items-center gap-2">
                  {buyerProfile.situation === 'Family' ? <Users size={16} /> : <User size={16} />}
                  {buyerProfile.situation}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Age(s)</span>
                <span className="font-medium text-neutral-900">{buyerProfile.ages}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Preferred Area</span>
                <span className="font-medium text-neutral-900 flex items-center gap-2">
                  <MapPin size={16} />
                  {buyerProfile.localArea}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Buyer Type</span>
                <span className="font-medium text-neutral-900">{buyerProfile.buyerType}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-neutral-600">Purchase Type</span>
                <span className="font-medium text-neutral-900 flex items-center gap-2">
                  <CreditCard size={16} />
                  {buyerProfile.purchaseType}
                </span>
              </div>
            </div>
          </div>
        )}

        {!isBuyer && vendorProfile && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Home size={20} />
              Vendor Profile
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Property Type</span>
                <span className="font-medium text-neutral-900">{vendorProfile.propertyType}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Looking For</span>
                <span className="font-medium text-neutral-900">{vendorProfile.lookingFor}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Preferred Purchase</span>
                <span className="font-medium text-neutral-900 flex items-center gap-2">
                  <CreditCard size={16} />
                  {vendorProfile.preferredPurchaseType}
                </span>
              </div>

              {vendorProfile.estateAgentLink && (
                <div className="flex justify-between items-start py-2">
                  <span className="text-neutral-600">Property Listing</span>
                  <a
                    href={vendorProfile.estateAgentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-600 hover:text-primary-700 underline text-sm break-all max-w-xs text-right"
                  >
                    View Listing →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

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
