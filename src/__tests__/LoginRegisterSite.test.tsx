import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock SVG assets (inline factories so hoisting works)
vi.mock('/src/assets/moon.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'moon', ...props }) }));
vi.mock('/src/assets/sun.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'sun', ...props }) }));
vi.mock('/src/assets/search.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'search', ...props }) }));
vi.mock('/src/assets/globe.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'globe', ...props }) }));
vi.mock('/src/assets/chevron-down.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'chevron-down', ...props }) }));
vi.mock('/src/assets/flags/uk.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-uk', ...props }) }));
vi.mock('/src/assets/flags/poland.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-poland', ...props }) }));
vi.mock('/src/assets/flags/russia.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-russia', ...props }) }));
vi.mock('/src/assets/flags/france.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-france', ...props }) }));
vi.mock('/src/assets/flags/germany.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-germany', ...props }) }));
vi.mock('/src/assets/flags/spain.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-spain', ...props }) }));

import LoginRegisterSite from '../LoginRegisterSite';

describe('LoginRegisterSite page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hasSeenLanguagePopup', 'true');
    localStorage.setItem('preferredTheme', 'light');

    // prevent any network calls from running
    (global as any).fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  it('renders login form and can open register form', async () => {
    render(
      <MemoryRouter>
        <LoginRegisterSite />
      </MemoryRouter>
    );

    // There should be a login submit button
    const loginBtn = screen.getByRole('button', { name: /login/i });
    expect(loginBtn).toBeInTheDocument();

    // Click the "register now" button (present in the login form)
    const registerToggle = screen.getByText(/register now/i, { selector: 'button' });
    fireEvent.click(registerToggle);

    // Register form should now show an Email input placeholder
    await screen.findByPlaceholderText('Email');
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });
});
