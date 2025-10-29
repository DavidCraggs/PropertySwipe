import { useMemo } from 'react';
import { useAppStore } from './useAppStore';
import type { Property } from '../types';

/**
 * Custom hook for managing the property deck
 * Handles card filtering, preloading, and state
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

  // Get properties that haven't been swiped yet
  const unseenProperties = useMemo(() => {
    return availableProperties.filter(
      (property) =>
        !likedProperties.includes(property.id) && !passedProperties.includes(property.id)
    );
  }, [availableProperties, likedProperties, passedProperties]);

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
