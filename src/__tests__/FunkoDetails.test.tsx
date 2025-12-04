import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock SVG assets
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

// Mock axios to reject DB lookup
vi.mock('axios', () => ({
  default: {
    create: () => ({
      interceptors: { request: { use: () => {} } },
      get: vi.fn(() => Promise.reject({ response: { status: 404 } })),
      post: vi.fn(() => Promise.resolve({ data: {} })),
    })
  }
}));

import FunkoDetails from '../FunkoDetails';

// Helper to compute the expected id similar to component's generateId
const generateId = (title: string, number: string) =>
  `${title?.trim() || ''}-${number?.trim() || ''}`
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

describe('FunkoDetails', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('preferredTheme', 'light');
  });

  it('loads item from external JSON when DB lookup fails and renders title', async () => {
    const title = 'Test Hero';
    const number = '01';
    const id = generateId(title, number);

    // Mock global.fetch to return an array with the item
    (global as any).fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([{ title, number, category: 'Funko Movies', series: ['Sample'], exclusive: false, imageName: '' }]) }));

    render(
      <MemoryRouter initialEntries={[`/funko/${id}`]}>
        <Routes>
          <Route path="/funko/:id" element={<FunkoDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the title to appear in the component
    await waitFor(() => expect(screen.getByText(title)).toBeInTheDocument());
  });
});
