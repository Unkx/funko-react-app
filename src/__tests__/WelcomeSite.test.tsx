import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock SVG assets used by the component (import specifiers include absolute "/src" path)
vi.mock('/src/assets/moon.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'moon', ...props }) }));
vi.mock('/src/assets/sun.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'sun', ...props }) }));
vi.mock('/src/assets/search.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'search', ...props }) }));
vi.mock('/src/assets/globe.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'globe', ...props }) }));
vi.mock('/src/assets/chevron-down.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'chevron-down', ...props }) }));

// Flags
vi.mock('/src/assets/flags/uk.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-uk', ...props }) }));
vi.mock('/src/assets/flags/usa.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-usa', ...props }) }));
vi.mock('/src/assets/flags/poland.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-poland', ...props }) }));
vi.mock('/src/assets/flags/russia.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-russia', ...props }) }));
vi.mock('/src/assets/flags/france.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-france', ...props }) }));
vi.mock('/src/assets/flags/germany.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-germany', ...props }) }));
vi.mock('/src/assets/flags/spain.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-spain', ...props }) }));
vi.mock('/src/assets/flags/canada.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-canada', ...props }) }));

// Mock the heavy WorldMap component
vi.mock('../Maps/WorldMap', () => ({ default: () => <div data-testid="mock-worldmap" /> }));

import WelcomeSite from '../WelcomeSite';

describe('WelcomeSite page', () => {
  beforeEach(() => {
    // Ensure no popup and predictable theme
    localStorage.clear();
    localStorage.setItem('hasSeenLanguagePopup', 'true');
    localStorage.setItem('preferredTheme', 'light');

    // Mock fetch used by the component to return empty data quickly
    (global as any).fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    );
  });

  it('renders header and search input', async () => {
    render(
      <MemoryRouter>
        <WelcomeSite />
      </MemoryRouter>
    );

    // Header
    expect(screen.getByText('Pop&Go!')).toBeInTheDocument();

    // Search input by aria-label
    expect(screen.getByLabelText('Search for Funkos')).toBeInTheDocument();

    // Wait for fetch effect to finish
    await waitFor(() => expect((global as any).fetch).toHaveBeenCalled());
  });

  it('toggles theme and persists to localStorage', async () => {
    render(
      <MemoryRouter>
        <WelcomeSite />
      </MemoryRouter>
    );

    // Initially saved as 'light'
    expect(localStorage.getItem('preferredTheme')).toBe('light');

    // Find the theme toggle button by its aria-label (shows "Switch to dark mode" when light)
    const toggle = screen.getByLabelText(/switch to dark mode/i);
    fireEvent.click(toggle);

    // Theme should have updated in localStorage
    await waitFor(() => expect(localStorage.getItem('preferredTheme')).toBe('dark'));
  });
});
