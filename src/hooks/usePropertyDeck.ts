import { useMemo } from 'react';
import { useAppStore } from './useAppStore';
import { useAuthStore } from './useAuthStore';
import type { Property, RenterProfile } from '../types';

/**
 * Custom hook for managing the rental property deck
 * Handles card filtering, preloading, and swipe state
 * Compatible with rental platform (renters swiping on rental properties)
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

  // Get properties that haven't been swiped yet
  const unseenProperties = useMemo(() => {
    // Get renter's current property ID if they have an active tenancy
    const currentPropertyId =
      userType === 'renter' && (currentUser as RenterProfile)?.status === 'current'
        ? (currentUser as RenterProfile).currentPropertyId
        : undefined;

    console.log('[usePropertyDeck] userType:', userType);
    console.log('[usePropertyDeck] currentUser:', currentUser);
    console.log('[usePropertyDeck] currentPropertyId:', currentPropertyId);
    console.log('[usePropertyDeck] Available properties:', availableProperties.length);

    const filtered = availableProperties.filter(
      (property) =>
        !likedProperties.includes(property.id) &&
        !passedProperties.includes(property.id) &&
        property.id !== currentPropertyId // Exclude renter's current property
    );

    console.log('[usePropertyDeck] Unseen properties after filtering:', filtered.length);

    return filtered;
  }, [availableProperties, likedProperties, passedProperties, currentUser, userType]);

  // Get current property
  const currentProperty = unseenProperties[0] || null;

  // Get visible properties for the stack (current + next 2)
  const visibleProperties = unseenProperties.slice(0, 3);

  // Check if deck is empty
  const isEmpty = unseenProperties.length === 0;

  // Check if we're running low on properties
  const isRunningLow = unseenProperties.length <= 5;

  // Get progress
  const progress = {
    viewed: likedProperties.length + passedProperties.length,
    remaining: unseenProperties.length,
    total: availableProperties.length,
    percentage: Math.round(
      ((likedProperties.length + passedProperties.length) / availableProperties.length) * 100
    ),
  };

  // Handle like
  const handleLike = (property: Property) => {
    likeProperty(property.id);
  };

  // Handle dislike
  const handleDislike = (property: Property) => {
    dislikeProperty(property.id);
  };

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
  };
};
