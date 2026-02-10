import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CardStack, SwipeControls, PropertyDetailsModal } from '../components';
import { ViewingTimeModal } from '../components/organisms/ViewingTimeModal';
import { ThemeToggle } from '../components/atoms/ThemeToggle';
import { useAppStore, usePropertyDeck } from '../hooks';
import { useAuthStore } from '../hooks/useAuthStore';
import { useToastStore } from '../components/organisms/toastUtils';
import type { Property, Match } from '../types';

/**
 * SwipePage — Concept C layout
 * Full viewport, 520px max-width, flex column:
 * header → card stack → action buttons → bottom nav
 * No background orbs, no stats grid, no progress bar
 */
interface SwipePageProps {
  onNavigateToProfile?: () => void;
}

export const SwipePage: React.FC<SwipePageProps> = ({ onNavigateToProfile }) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMatch, setNewMatch] = useState<Match | null>(null);
  const [showViewingModal, setShowViewingModal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const processedMatchIds = useRef<Set<string>>(new Set());

  const {
    unseenProperties,
    handleLike,
    handleDislike,
    handleSuperLike,
    handleUndo,
    canUndo,
  } = usePropertyDeck();
  const { matches, setViewingPreference } = useAppStore();
  const { currentUser } = useAuthStore();
  const { addToast } = useToastStore();

  // Stagger entrance on mount
  useEffect(() => {
    setTimeout(() => setLoaded(true), 80);
  }, []);

  // Watch for new matches
  useEffect(() => {
    if (matches.length > 0) {
      const latestMatch = matches[0];

      if (processedMatchIds.current.has(latestMatch.id)) return;

      const matchAge = Date.now() - new Date(latestMatch.timestamp).getTime();
      if (matchAge < 5000 && !latestMatch.viewingPreference) {
        processedMatchIds.current.add(latestMatch.id);

        setNewMatch(latestMatch);
        setTimeout(() => {
          setShowViewingModal(true);
        }, 800);

        addToast({
          type: 'match',
          title: "It's a match!",
          message: `You and the landlord are interested in ${latestMatch.property.address.street}!`,
          duration: 5000,
        });
      }
    }
  }, [matches, addToast]);

  const handleInfoClick = (property: Property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleStackEmpty = () => {
    console.log('No more properties.');
  };

  const handleModalLike = () => {
    if (selectedProperty) {
      handleLike(selectedProperty);
      setIsModalOpen(false);
    }
  };

  // Swipe callbacks that trigger Concept C toasts
  const onLikeWithToast = (property: Property) => {
    handleLike(property);
    addToast({ type: 'shortlist', message: '♥ SHORTLISTED', duration: 700 });
  };

  const onDislikeWithToast = (property: Property) => {
    handleDislike(property);
    addToast({ type: 'pass', message: '✕ PASSED', duration: 700 });
  };

  // Get user initial for avatar
  const userInitial = (() => {
    if (!currentUser) return 'U';
    if ('names' in currentUser && currentUser.names) return currentUser.names.charAt(0).toUpperCase();
    if ('name' in currentUser && currentUser.name) return currentUser.name.charAt(0).toUpperCase();
    if ('companyName' in currentUser && currentUser.companyName) return currentUser.companyName.charAt(0).toUpperCase();
    return 'U';
  })();

  return (
    <div
      style={{
        fontFamily: "'Bebas Neue', sans-serif",
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        height: '100vh',
        maxWidth: 520,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        paddingBottom: 68,
        transition: 'background 0.5s, color 0.5s',
      }}
    >
      {/* Header — stagger entrance: 0.05s */}
      <motion.header
        style={{
          padding: '14px 20px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={loaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 4, lineHeight: 1 }}>
            <span style={{ color: 'var(--color-teal)' }}>LET</span>RIGHT
          </h1>
          <p
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 3,
              color: 'var(--color-sub)',
              margin: '2px 0 0',
            }}
          >
            &ldquo;SWIPE RIGHT. LET RIGHT.&rdquo;
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ThemeToggle />
          <button
            onClick={onNavigateToProfile}
            aria-label="Go to profile"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--color-teal)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            {userInitial}
          </button>
        </div>
      </motion.header>

      {/* Card Stack — stagger entrance: 0.15s */}
      <motion.div
        style={{
          flex: 1,
          position: 'relative',
          padding: '10px 14px 0',
        }}
        initial={{ opacity: 0 }}
        animate={loaded ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
      >
        <CardStack
          properties={unseenProperties}
          onLike={onLikeWithToast}
          onDislike={onDislikeWithToast}
          onInfoClick={handleInfoClick}
          onStackEmpty={handleStackEmpty}
        />
      </motion.div>

      {/* Action Buttons — stagger entrance: 0.25s */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={loaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.25 }}
      >
        <SwipeControls
          onLike={() => {
            if (unseenProperties.length > 0) {
              onLikeWithToast(unseenProperties[0]);
            }
          }}
          onDislike={() => {
            if (unseenProperties.length > 0) {
              onDislikeWithToast(unseenProperties[0]);
            }
          }}
          onUndo={handleUndo}
          onSuperLike={() => {
            if (unseenProperties.length > 0) {
              handleSuperLike(unseenProperties[0]);
              addToast({ type: 'shortlist', message: '★ SUPER LIKED', duration: 700 });
            }
          }}
          canUndo={canUndo}
        />
      </motion.div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLike={handleModalLike}
      />

      {/* Viewing Time Modal */}
      {newMatch && (
        <ViewingTimeModal
          isOpen={showViewingModal}
          onClose={() => setShowViewingModal(false)}
          match={newMatch}
          onSubmit={(preference) => {
            setViewingPreference(newMatch.id, preference);
            addToast({
              type: 'success',
              title: 'Viewing Preferences Sent!',
              message: 'The landlord will respond with available times',
              duration: 4000,
            });
          }}
        />
      )}
    </div>
  );
};
