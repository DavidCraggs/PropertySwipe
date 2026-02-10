/**
 * Concept C animation presets for Framer Motion
 * Typography-driven, intentional animations — no decorative loops
 */

import type { Transition, Variants } from 'framer-motion';

// ============================================
// TRANSITION CONFIGS
// ============================================

/** Spring config for snappy, interactive elements */
export const springConfig: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

/** Gentler spring for larger movements */
export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
};

/** Bouncy spring for playful interactions */
export const bouncySpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 15,
};

/** Smooth ease for subtle transitions */
export const smoothEase: Transition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1],
};

/** Fast ease for micro-interactions */
export const fastEase: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

/** Concept C spring-back ease */
export const conceptCSpringBack: Transition = {
  duration: 0.5,
  ease: [0.34, 1.56, 0.64, 1],
};

// ============================================
// CONCEPT C ENTRANCE ANIMATIONS
// ============================================

/** Concept C standard entry: opacity 0→1, y 14→0, 0.5s ease */
export const conceptCEntry = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

/** Concept C stagger delays for page sections */
export const conceptCStagger = {
  header: 0.05,
  content: 0.15,
  actions: 0.25,
  footer: 0.35,
} as const;

/** Concept C staggered entry factory */
export function conceptCStaggeredEntry(delay: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.4, ease: 'easeOut' as const },
  };
}

// ============================================
// ENTRANCE ANIMATIONS
// ============================================

/** Fade in from below */
export const fadeInUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

/** Fade in from above */
export const fadeInDown = {
  initial: { opacity: 0, y: -14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

/** Scale in — for modals and popups */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: smoothEase,
};

/** Slide in from right */
export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
  transition: smoothEase,
};

/** Slide in from left */
export const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: smoothEase,
};

// ============================================
// STAGGER ANIMATIONS
// ============================================

/** Container variant for staggered children */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Item variant for staggered lists */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/** Faster stagger for quick reveals */
export const staggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// ============================================
// INTERACTION ANIMATIONS
// ============================================

/** Button hover/tap states */
export const buttonInteraction = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: fastEase,
};

/** Card hover — subtle lift, no glow */
export const cardHover = {
  whileHover: { y: -4 },
  transition: { duration: 0.2, ease: 'easeOut' as const },
};

/** Icon button interaction */
export const iconButtonInteraction = {
  whileHover: { scale: 1.1 },
  whileTap: { scale: 0.9 },
  transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] as number[] },
};

/** Shake animation for errors */
export const shakeAnimation = {
  x: [-8, 8, -8, 8, 0],
  transition: { duration: 0.4 },
};

// ============================================
// TOAST ANIMATION (Concept C)
// ============================================

/** Swipe toast: 0.65s pop-in / hold / fade */
export const toastAnimation = {
  initial: { opacity: 0, scale: 0.92, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: -4 },
  transition: { duration: 0.65, ease: 'easeOut' as const },
};

// ============================================
// PAGE TRANSITIONS
// ============================================

/** Page entrance — Concept C standard */
export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: {
    duration: 0.5,
    ease: 'easeOut',
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Creates a staggered delay for list items
 */
export function staggerDelay(
  index: number,
  baseDelay = 0.1,
  staggerAmount = 0.08
): number {
  return baseDelay + index * staggerAmount;
}

/**
 * Creates entrance animation props with staggered delay
 */
export function staggeredEntrance(index: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay: staggerDelay(index),
      duration: 0.4,
      ease: 'easeOut',
    },
  };
}
