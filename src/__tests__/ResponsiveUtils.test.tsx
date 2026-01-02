import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, beforeEach } from "vitest";
import { ResponsiveUtils } from "../ResponsiveUtils";

// A small test component that uses the ResponsiveUtils hook-like function
const TestComponent: React.FC<{ query: string }> = ({ query }) => {
  const matches = ResponsiveUtils(query);
  return <div data-testid="matches">{String(matches)}</div>;
};

describe("ResponsiveUtils", () => {
  let listeners: Array<(e: any) => void> = [];

  beforeEach(() => {
    listeners = [];

    // Mock window.matchMedia
    // Each call returns a fresh object with its own listeners array
    // Provide addEventListener/removeEventListener so the hook can attach
    // and we can trigger changes by calling saved listeners.
    // matchMedia is mocked to respect the query string so we can test both states.
    // Note: Vitest runs in jsdom so we can safely set window.matchMedia.
    (window as any).matchMedia = (query: string) => {
      let m = {
        matches: query === "(min-width: 600px)" ? false : false,
        media: query,
        addEventListener: (ev: string, cb: any) => {
          listeners.push(cb);
        },
        removeEventListener: (ev: string, cb: any) => {
          listeners = listeners.filter((l) => l !== cb);
        },
      } as any;
      return m;
    };

    localStorage.clear();
  });

  it("initializes with matchMedia.matches value and updates on change", () => {
    render(<TestComponent query="(min-width: 600px)" />);

    // initial value from mock is false
    expect(screen.getByTestId("matches")).toHaveTextContent("false");

    // simulate a media query change to matches=true
    act(() => {
      listeners.forEach((l) => l({ matches: true }));
    });

    expect(screen.getByTestId("matches")).toHaveTextContent("true");
  });
});
