
import { useState, useEffect } from 'react';

// Centralized breakpoint media queries
export const BREAKPOINTS = {
  xs: '(max-width: 639px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

export type Breakpoint = keyof typeof BREAKPOINTS;

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: Breakpoint | null;
  width: number;
  height: number;
  devicePixelRatio: number;
  isPortrait: boolean;
}

const useBreakpoints = (): BreakpointState => {
  const [breakpointState, setBreakpointState] = useState<BreakpointState>(() => {
    // Initialize with current window dimensions if available
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      return {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isSmallMobile: width < 640,
        isLargeDesktop: width >= 1280,
        currentBreakpoint: width >= 1536 ? '2xl' : width >= 1280 ? 'xl' : width >= 1024 ? 'lg' : width >= 768 ? 'md' : width >= 640 ? 'sm' : 'xs',
        width,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        isPortrait: window.matchMedia('(orientation: portrait)').matches,
      };
    }
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isSmallMobile: false,
      isLargeDesktop: false,
      currentBreakpoint: 'lg',
      width: 1024,
      height: 768,
      devicePixelRatio: 1,
      isPortrait: false,
    };
  });

  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;

      // Determine current breakpoint
      let currentBreakpoint: Breakpoint | null = null;
      if (width >= 1536) currentBreakpoint = '2xl';
      else if (width >= 1280) currentBreakpoint = 'xl';
      else if (width >= 1024) currentBreakpoint = 'lg';
      else if (width >= 768) currentBreakpoint = 'md';
      else if (width >= 640) currentBreakpoint = 'sm';
      else currentBreakpoint = 'xs';

      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const isSmallMobile = width < 640;
      const isLargeDesktop = width >= 1280;
      const devicePixelRatio = window.devicePixelRatio || 1;

      setBreakpointState({
        isMobile,
        isTablet,
        isDesktop,
        isSmallMobile,
        isLargeDesktop,
        currentBreakpoint,
        width,
        height,
        devicePixelRatio,
        isPortrait,
      });
    };

    // Immediate update
    updateBreakpoints();

    // Debounce resize events for better performance
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateBreakpoints, 150);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', updateBreakpoints);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', updateBreakpoints);
    };
  }, []);

  return breakpointState;
};

export default useBreakpoints;
