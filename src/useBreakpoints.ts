import { useState, useEffect } from 'react';
import BREAKPOINTS from './breakpoints';

export const useBreakpoints = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const mqMobile = globalThis.window.matchMedia(BREAKPOINTS.mobile);
    const mqTablet = globalThis.window.matchMedia(BREAKPOINTS.tablet);
    const mqDesktop = globalThis.window.matchMedia(BREAKPOINTS.desktop);

    const update = () => {
      setIsMobile(mqMobile.matches);
      setIsTablet(mqTablet.matches);
      setIsDesktop(mqDesktop.matches);
    };

    // initial
    update();

    // listen
    mqMobile.addEventListener('change', update);
    mqTablet.addEventListener('change', update);
    mqDesktop.addEventListener('change', update);

    return () => {
      mqMobile.removeEventListener('change', update);
      mqTablet.removeEventListener('change', update);
      mqDesktop.removeEventListener('change', update);
    };
  }, []);

  return { isMobile, isTablet, isDesktop };
};

export default useBreakpoints;
