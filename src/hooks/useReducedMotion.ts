import { useState, useEffect } from 'react';

/**
 * Hook to detect user's preference for reduced motion
 * Respects the prefers-reduced-motion media query
 *
 * @returns true if user prefers reduced motion, false otherwise
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 *
 * // Use in animation props
 * const animationProps = prefersReducedMotion
 *   ? {}
 *   : { initial: { opacity: 0 }, animate: { opacity: 1 } };
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check if window is defined (for SSR safety)
    if (typeof window === 'undefined') return false;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation props only if user doesn't prefer reduced motion
 * Provides a convenient way to conditionally apply animations
 *
 * @param animationProps - The animation props to conditionally return
 * @returns The animation props or an empty object
 *
 * @example
 * <motion.div {...useAnimationProps({
 *   initial: { opacity: 0, y: 20 },
 *   animate: { opacity: 1, y: 0 }
 * })}>
 */
export function useAnimationProps<T extends object>(animationProps: T): T | Record<string, never> {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? {} : animationProps;
}
