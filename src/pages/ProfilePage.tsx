import { User, Settings, TrendingUp, Heart, X, Home } from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { useAppStore } from '../hooks';
import { formatDate } from '../utils/formatters';

export const ProfilePage: React.FC = () => {
  const { user, getStats, resetApp } = useAppStore();
  const stats = getStats();

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      resetApp();
      window.location.reload();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-4">
        <div className="text-center">
          <User size={64} className="mx-auto text-neutral-400 mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">No Profile Yet</h2>
          <p className="text-neutral-600">Start swiping to create your profile!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900">Profile</h1>
          <p className="text-neutral-600 mt-1">Manage your account and preferences</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-success-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neutral-900">{user.name}</h2>
              <p className="text-neutral-600">{user.email}</p>
              <p className="text-sm text-neutral-500 mt-2">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings size={18} />}
              onClick={() => console.log('Edit profile')}
            >
              Edit
            </Button>
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

        {/* Preferences Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">Search Preferences</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Price Range</span>
              <span className="font-medium text-neutral-900">
                £{(user.preferences.priceRange.min / 1000).toFixed(0)}k - £
                {(user.preferences.priceRange.max / 1000).toFixed(0)}k
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Bedrooms</span>
              <span className="font-medium text-neutral-900">
                {user.preferences.bedrooms.min} - {user.preferences.bedrooms.max}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Locations</span>
              <span className="font-medium text-neutral-900">
                {user.preferences.locations.length > 0
                  ? user.preferences.locations.join(', ')
                  : 'All locations'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600">Property Types</span>
              <span className="font-medium text-neutral-900">
                {user.preferences.propertyTypes.length > 0
                  ? user.preferences.propertyTypes.join(', ')
                  : 'All types'}
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            className="mt-4"
            icon={<Settings size={18} />}
            onClick={() => console.log('Edit preferences')}
          >
            Edit Preferences
          </Button>
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
