// src/ResponsiveUtils.tsx
import { useState, useEffect } from 'react';
import useBreakpoints from './useBreakpoints';

// ResponsiveUtils: legacy-compatible hook-like function.
// - If `query` equals 'mobile'|'tablet'|'desktop' it returns the corresponding boolean
//   from the centralized `useBreakpoints` hook.
// - Otherwise it treats `query` as a raw CSS media query string and uses matchMedia.
export const ResponsiveUtils = (query: string): boolean => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Shortcut for named breakpoints
    if (query === 'mobile') {
      setMatches(isMobile);
      return;
    }
    if (query === 'tablet') {
      setMatches(isTablet);
      return;
    }
    if (query === 'desktop') {
      setMatches(isDesktop);
      return;
    }

    // Otherwise, treat `query` as a media query string
    if (globalThis.window === undefined) return;

    const mediaQueryList = globalThis.window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial state
    setMatches(mediaQueryList.matches);

    // Add listener for changes
    mediaQueryList.addEventListener('change', listener);

    // Clean up listener
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, isMobile, isTablet, isDesktop]); // Re-run effect if query or breakpoint flags change

  return matches;
};
