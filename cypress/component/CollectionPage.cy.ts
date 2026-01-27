import React from 'react';
import CollectionPage from '../../src/CollectionPage';
import { BrowserRouter } from 'react-router-dom';

describe('CollectionPage Component', () => {
  beforeEach(() => {
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
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );
    cy.contains('Pop&Go!').should('be.visible');
  });

  it('should display collection title', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );
    cy.contains('Your Collection').should('be.visible');
  });

  it('should toggle dark mode', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );
    cy.get('button[aria-label="Toggle theme"]').click();
    cy.get('@setItem').should('have.been.calledWith', 'preferredTheme', 'light');
  });

  it('should display navigation links', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Collection').should('be.visible');
    cy.contains('Wishlist').should('be.visible');
  });

  it('should have search form', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );
    cy.get('form input[type="text"]').should('exist');
    cy.get('form button[type="submit"]').should('exist');
  });

  it('should display language selector', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );
    cy.get('button[aria-label="Select language"]').should('be.visible');
  });

  it('should display collection items when loaded', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );

    cy.wait('@getCollection');
    cy.contains('Test Funko').should('be.visible');
    cy.contains('#001').should('be.visible');
  });

  it('should display collection statistics', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );

    cy.wait('@getCollection');
    cy.contains('1').should('be.visible'); // Total items
    cy.contains('$25.99').should('be.visible'); // Total value
  });

  it('should show filters button', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );
    cy.contains('Filters').should('be.visible');
  });

  it('should display footer', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );
    cy.contains('© 2024 Pop&Go!').should('be.visible');
  });

  it('should handle empty collection', () => {
    cy.intercept('GET', '**/api/collection', {
      statusCode: 200,
      body: []
    }).as('getEmptyCollection');

    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );

    cy.wait('@getEmptyCollection');
    cy.contains('Your collection is empty').should('be.visible');
  });

  it('should show loading state initially', () => {
    cy.intercept('GET', '**/api/collection', (req) => {
      // Delay response
      setTimeout(() => req.reply({ body: [] }), 1000);
    }).as('delayedCollection');

    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );

    cy.contains('Loading your collection...').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    cy.intercept('GET', '**/api/collection', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('failedCollection');

    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );

    cy.wait('@failedCollection');
    // Should still render the page structure
    cy.contains('Your Collection').should('be.visible');
  });

  it('should redirect when not authenticated', () => {
    cy.stub(localStorage, 'getItem').callsFake((key) => {
      if (key === 'token') return null;
      return 'mock-value';
    });

    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );

    cy.get('@pushState').should('have.been.calledWith', null, '', '/loginregistersite');
  });

  it('should handle language change', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );

    cy.get('button[aria-label="Select language"]').click();
    cy.contains('Polski').click();
    cy.get('@setItem').should('have.been.calledWith', 'preferredLanguage', 'PL');
  });

  it('should handle search form submission', () => {
    cy.mount(
      React.createElement(BrowserRouter, null,
        React.createElement(CollectionPage)
      )
    );

    cy.get('form input[type="text"]').type('test search');
    cy.get('form').submit();
    cy.get('@pushState').should('have.been.calledWith', null, '', '/searchsite?q=test%20search');
  });
  
}
);

