import { useState } from 'react';
import { CardStack, SwipeControls, PropertyDetailsModal } from '../components';
import { useAppStore, usePropertyDeck } from '../hooks';
import type { Property } from '../types';

export const SwipePage: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { unseenProperties, handleLike, handleDislike, progress } = usePropertyDeck();
  const { getStats, matches } = useAppStore();
  const stats = getStats();

  const handleInfoClick = (property: Property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleStackEmpty = () => {
    console.log('No more properties! You viewed all available properties.');
  };

  const handleModalLike = () => {
    if (selectedProperty) {
      handleLike(selectedProperty);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24">
      {/* Header */}
      <header className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary-600 to-success-600 bg-clip-text text-transparent mb-2">
          PropertySwipe
        </h1>
        <p className="text-center text-neutral-600">Swipe right to like, left to pass</p>
        {matches.length > 0 && (
          <div className="mt-2 text-center">
            <span className="inline-flex items-center gap-2 bg-success-100 text-success-700 px-3 py-1 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              {matches.length} New {matches.length === 1 ? 'Match' : 'Matches'}!
            </span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4">
        {/* Card Stack Container */}
        <div className="relative w-full aspect-[3/4] mb-8">
          <CardStack
            properties={unseenProperties}
            onLike={handleLike}
            onDislike={handleDislike}
            onInfoClick={handleInfoClick}
            onStackEmpty={handleStackEmpty}
          />
        </div>

        {/* Swipe Controls */}
        <SwipeControls
          onLike={() => {
            console.log('Like button clicked');
          }}
          onDislike={() => {
            console.log('Dislike button clicked');
          }}
          className="mb-6"
        />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 text-sm text-neutral-600 mb-6">
          <div className="text-center p-3 bg-white rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-success-600">{stats.propertiesLiked}</div>
            <div className="text-xs mt-1">Liked</div>
          </div>
          <div className="text-center p-3 bg-white rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-danger-600">{stats.propertiesPassed}</div>
            <div className="text-xs mt-1">Passed</div>
          </div>
          <div className="text-center p-3 bg-white rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-primary-600">{progress.remaining}</div>
            <div className="text-xs mt-1">Remaining</div>
          </div>
          <div className="text-center p-3 bg-white rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{matches.length}</div>
            <div className="text-xs mt-1">Matches</div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress.percentage > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-neutral-600">Progress</span>
              <span className="text-xs font-medium text-neutral-900">{progress.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-success-500 transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLike={handleModalLike}
      />
    </div>
  );
};
