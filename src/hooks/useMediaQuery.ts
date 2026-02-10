import { useState, useEffect } from 'react';

/**
 * Hook that wraps window.matchMedia and re-evaluates on change.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handleChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/** Returns true when viewport is below the Tailwind `sm` breakpoint (640px). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}
