import '@testing-library/jest-dom'

// jsdom does not implement ResizeObserver, but Radix UI primitives (e.g.
// @radix-ui/react-tooltip's Popper/Content positioning) use it internally.
// Polyfill it so components that rely on it can mount and update in tests.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverPolyfill as unknown as typeof ResizeObserver
}
