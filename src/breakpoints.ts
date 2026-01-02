// Centralized breakpoint media queries for components and hooks
export const BREAKPOINTS = {
  // Mobile: up to 767px (use max-width for mobile-only queries)
  mobile: '(max-width: 767px)',
  // Tablet: 768px - 1023px
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  // Desktop: 1024px and above
  desktop: '(min-width: 1024px)'
};

// helper to build a min-width query
export const minWidth = (px: number) => `(min-width: ${px}px)`;
// helper to build a max-width query
export const maxWidth = (px: number) => `(max-width: ${px}px)`;

export default BREAKPOINTS;
