import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../LanguageContext';
import { ThemeProvider } from '../ThemeContext';

vi.mock('/src/assets/moon.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'moon', ...props }) }));
vi.mock('/src/assets/sun.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'sun', ...props }) }));
vi.mock('/src/assets/search.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'search', ...props }) }));
vi.mock('/src/assets/globe.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'globe', ...props }) }));
vi.mock('/src/assets/chevron-down.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'chevron-down', ...props }) }));
vi.mock('/src/assets/flags/uk.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-uk', ...props }) }));
vi.mock('/src/assets/flags/usa.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-usa', ...props }) }));
vi.mock('/src/assets/flags/poland.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-poland', ...props }) }));
vi.mock('/src/assets/flags/russia.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-russia', ...props }) }));
vi.mock('/src/assets/flags/france.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-france', ...props }) }));
vi.mock('/src/assets/flags/germany.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-germany', ...props }) }));
vi.mock('/src/assets/flags/spain.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-spain', ...props }) }));
vi.mock('/src/assets/flags/canada.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-canada', ...props }) }));
vi.mock('../Maps/WorldMap', () => ({ default: () => <div data-testid="mock-worldmap" /> }));

import WelcomeSite from '../WelcomeSite';

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <ThemeProvider>{ui}</ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>
  );

describe('WelcomeSite page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hasSeenLanguagePopup', 'true');
    localStorage.setItem('preferredTheme', 'light');
    (global as any).fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    );
  });

  it('renders header and search input', async () => {
    renderWithProviders(<WelcomeSite />);
    expect(screen.getByText('Pop')).toBeInTheDocument();
    expect(screen.getByText('Go!')).toBeInTheDocument();
    const searchInputs = screen.getAllByLabelText('Search');
    expect(searchInputs.length).toBeGreaterThan(0);
    await waitFor(() => expect((global as any).fetch).toHaveBeenCalled());
  });

  it('toggles theme and persists to localStorage', async () => {
    renderWithProviders(<WelcomeSite />);
    expect(localStorage.getItem('preferredTheme')).toBe('light');
    const toggle = screen.getByLabelText(/switch to dark mode/i);
    fireEvent.click(toggle);
    await waitFor(() => expect(localStorage.getItem('preferredTheme')).toBe('dark'));
  });
});
