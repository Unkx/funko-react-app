import React from 'react';
import CollectionPage from '../../src/CollectionPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../src/ui/queryClient';

const mountCollectionPage = () =>
  cy.mount(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(BrowserRouter, null, React.createElement(CollectionPage))
    )
  );

describe('CollectionPage Component', () => {
  beforeEach(() => {
    // Avoid stale cached data bleeding between tests via the shared queryClient singleton
    queryClient.clear();

    // Mock localStorage
    cy.stub(localStorage, 'getItem').callsFake((key) => {
      const mockData = {
        preferredTheme: 'dark',
        preferredLanguage: 'EN',
        hasSeenLanguagePopup: 'true',
        token: 'mock-token',
        user: JSON.stringify({ email: 'test@example.com' })
      };
      return mockData[key] || null;
    });

    cy.stub(localStorage, 'setItem').as('setItem');

    // Mock fetch for collection data
    cy.intercept('GET', '**/api/collection', {
      statusCode: 200,
      body: [
        {
          id: '1',
          title: 'Test Funko',
          number: '001',
          condition: 'mint',
          purchase_price: 25.99,
          series: 'Test Series'
        }
      ]
    }).as('getCollection');

    // Mock React Router
    cy.stub(window.history, 'pushState').as('pushState');
  });

  it('should render with default props', () => {
    mountCollectionPage();
    cy.contains('Pop&Go!').should('be.visible');
  });

  it('should display collection title', () => {
    mountCollectionPage();
    cy.contains('Your Collection').should('be.visible');
  });

  it('should toggle dark mode', () => {
    mountCollectionPage();
    cy.get('button[aria-label="Toggle theme"]').click();
    cy.get('@setItem').should('have.been.calledWith', 'preferredTheme', 'light');
  });

  it('should display navigation links', () => {
    mountCollectionPage();
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Collection').should('be.visible');
    cy.contains('Wishlist').should('be.visible');
  });

  it('should have search form', () => {
    mountCollectionPage();
    cy.get('form input[type="text"]').should('exist');
    cy.get('form button[type="submit"]').should('exist');
  });

  it('should display language selector', () => {
    mountCollectionPage();
    cy.get('button[aria-label="Select language"]').should('be.visible');
  });

  it('should display collection items when loaded', () => {
    mountCollectionPage();

    cy.wait('@getCollection');
    cy.contains('Test Funko').should('be.visible');
    cy.contains('#001').should('be.visible');
  });

  it('should display collection statistics', () => {
    mountCollectionPage();

    cy.wait('@getCollection');
    cy.contains('1').should('be.visible'); // Total items
    cy.contains('$25.99').should('be.visible'); // Total value
  });

  it('should show filters button', () => {
    mountCollectionPage();
    cy.contains('Filters').should('be.visible');
  });

  it('should display footer', () => {
    mountCollectionPage();
    cy.contains('© 2024 Pop&Go!').should('be.visible');
  });

  it('should handle empty collection', () => {
    cy.intercept('GET', '**/api/collection', {
      statusCode: 200,
      body: []
    }).as('getEmptyCollection');

    mountCollectionPage();

    cy.wait('@getEmptyCollection');
    cy.contains('Your collection is empty').should('be.visible');
  });

  it('should show loading state initially', () => {
    cy.intercept('GET', '**/api/collection', (req) => {
      // Delay response
      setTimeout(() => req.reply({ body: [] }), 1000);
    }).as('delayedCollection');

    mountCollectionPage();

    cy.contains('Loading your collection...').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    cy.intercept('GET', '**/api/collection', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('failedCollection');

    mountCollectionPage();

    cy.wait('@failedCollection');
    // Should still render the page structure
    cy.contains('Your Collection').should('be.visible');
  });

  it('should redirect when not authenticated', () => {
    cy.stub(localStorage, 'getItem').callsFake((key) => {
      if (key === 'token') return null;
      return 'mock-value';
    });

    mountCollectionPage();

    cy.get('@pushState').should('have.been.calledWith', null, '', '/loginregistersite');
  });

  it('should handle language change', () => {
    mountCollectionPage();

    cy.get('button[aria-label="Select language"]').click();
    cy.contains('Polski').click();
    cy.get('@setItem').should('have.been.calledWith', 'preferredLanguage', 'PL');
  });

  it('should handle search form submission', () => {
    mountCollectionPage();

    cy.get('form input[type="text"]').type('test search');
    cy.get('form').submit();
    cy.get('@pushState').should('have.been.calledWith', null, '', '/searchsite?q=test%20search');
  });
  
}
);

