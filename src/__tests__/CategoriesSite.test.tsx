import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi } from 'vitest';
import CategoriesSite from '../CategoriesSite';
import { MemoryRouter } from 'react-router-dom';

// Mock SVG assets used by the component
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

describe('CategoriesSite', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('preferredTheme', 'light');
  });

  it('renders header and categories grid, opens category view on click', () => {
    render(
      <MemoryRouter>
        <CategoriesSite />
      </MemoryRouter>
    );

    // Header
    expect(screen.getByText('Pop&Go!')).toBeInTheDocument();

    // There should be category tiles
    expect(screen.getByText(/Funko Categories|Funko Categories/i)).toBeInTheDocument();

    // Find a 'View Category' button (some include counts)
    const viewButtons = screen.getAllByRole('button', { name: /View Category|Coming Soon/i });
    expect(viewButtons.length).toBeGreaterThan(0);

    // Click the first enabled view category button (if disabled, find another)
    const enabled = viewButtons.find(b => !b.hasAttribute('disabled')) || viewButtons[0];
    fireEvent.click(enabled);

    // After clicking, expect a 'Back' button to be visible in category view
    expect(screen.getByText(/Back|←/i)).toBeInTheDocument();
  });
});
