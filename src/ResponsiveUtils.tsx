// src/ResponsiveUtils.tsx
import { useState, useEffect } from 'react';

// Renamed and exported as ResponsiveUtils as per your import in Admin.tsx
export const ResponsiveUtils = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is defined (for SSR compatibility, though usually not an issue in CRA/Vite)
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia(query);
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
    }
  }, [query]); // Re-run effect if query changes

  return matches;
};