import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
vi.mock('/src/assets/flags/poland.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-poland', ...props }) }));
vi.mock('/src/assets/flags/russia.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-russia', ...props }) }));
vi.mock('/src/assets/flags/france.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-france', ...props }) }));
vi.mock('/src/assets/flags/germany.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-germany', ...props }) }));
vi.mock('/src/assets/flags/spain.svg?react', () => ({ default: (props: any) => React.createElement('svg', { 'data-testid': 'flag-spain', ...props }) }));

import LoginRegisterSite from '../LoginRegisterSite';

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <ThemeProvider>{ui}</ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>
  );

describe('LoginRegisterSite page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('hasSeenLanguagePopup', 'true');
    localStorage.setItem('preferredTheme', 'light');
    (global as any).fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  it('renders login form and can open register form', async () => {
    renderWithProviders(<LoginRegisterSite />);
    const loginBtns = screen.getAllByRole('button', { name: /login/i });
    expect(loginBtns.length).toBeGreaterThan(0);
    const registerToggle = screen.getByText(/sign up|register now/i, { selector: 'button' });
    fireEvent.click(registerToggle);
    await screen.findByPlaceholderText(/email/i);
  });
});
