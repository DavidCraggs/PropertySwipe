import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from './useAppStore';
import { useAuthStore } from './useAuthStore';
import type { Property, RenterProfile } from '../types';

interface SwipeHistoryEntry {
  property: Property;
  action: 'like' | 'dislike' | 'super-like';
}

/**
 * Custom hook for managing the rental property deck
 * Handles card filtering, preloading, swipe state, undo, and super-like
 */
export const usePropertyDeck = () => {
  const {
    availableProperties,
    likedProperties,
    passedProperties,
    likeProperty,
    dislikeProperty,
    loadNextProperties,
  } = useAppStore();

  const { currentUser, userType } = useAuthStore();
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryEntry[]>([]);
  const [superLikedProperties, setSuperLikedProperties] = useState<string[]>([]);

  // Get properties that haven't been swiped yet
  const unseenProperties = useMemo(() => {
    const currentPropertyId =
      userType === 'renter' && (currentUser as RenterProfile)?.status === 'current'
        ? (currentUser as RenterProfile).currentPropertyId
        : undefined;

    return availableProperties.filter(
      (property) =>
        !likedProperties.includes(property.id) &&
        !passedProperties.includes(property.id) &&
        property.id !== currentPropertyId
    );
  }, [availableProperties, likedProperties, passedProperties, currentUser, userType]);

  const currentProperty = unseenProperties[0] || null;
  const visibleProperties = unseenProperties.slice(0, 3);
  const isEmpty = unseenProperties.length === 0;
  const isRunningLow = unseenProperties.length <= 5;

  const progress = {
    viewed: likedProperties.length + passedProperties.length,
    remaining: unseenProperties.length,
    total: availableProperties.length,
    percentage: availableProperties.length > 0
      ? Math.round(((likedProperties.length + passedProperties.length) / availableProperties.length) * 100)
      : 0,
  };

  const handleLike = useCallback((property: Property) => {
    setSwipeHistory((prev) => [...prev, { property, action: 'like' }]);
    likeProperty(property.id);
  }, [likeProperty]);

  const handleDislike = useCallback((property: Property) => {
    setSwipeHistory((prev) => [...prev, { property, action: 'dislike' }]);
    dislikeProperty(property.id);
  }, [dislikeProperty]);

  const handleSuperLike = useCallback((property: Property) => {
    setSwipeHistory((prev) => [...prev, { property, action: 'super-like' }]);
    setSuperLikedProperties((prev) => [...prev, property.id]);
    likeProperty(property.id);
  }, [likeProperty]);

  const handleUndo = useCallback(() => {
    if (swipeHistory.length === 0) return null;

    const lastEntry = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));

    // Remove from the appropriate store array
    const store = useAppStore.getState();
    if (lastEntry.action === 'like' || lastEntry.action === 'super-like') {
      useAppStore.setState({
        likedProperties: store.likedProperties.filter((id) => id !== lastEntry.property.id),
        currentPropertyIndex: Math.max(0, store.currentPropertyIndex - 1),
      });
      if (lastEntry.action === 'super-like') {
        setSuperLikedProperties((prev) => prev.filter((id) => id !== lastEntry.property.id));
      }
    } else {
      useAppStore.setState({
        passedProperties: store.passedProperties.filter((id) => id !== lastEntry.property.id),
        currentPropertyIndex: Math.max(0, store.currentPropertyIndex - 1),
      });
    }

    return lastEntry.property;
  }, [swipeHistory]);

  const canUndo = swipeHistory.length > 0;

  // Preload next batch if running low
  if (isRunningLow && !isEmpty) {
    loadNextProperties();
  }

  return {
    currentProperty,
    visibleProperties,
    unseenProperties,
    isEmpty,
    isRunningLow,
    progress,
    handleLike,
    handleDislike,
    handleSuperLike,
    handleUndo,
    canUndo,
    superLikedProperties,
  };
};
