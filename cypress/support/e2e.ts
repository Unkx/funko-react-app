// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Prevent Cypress from failing tests on uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // useful for third-party script errors or React errors that don't affect functionality
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
  if (err.message.includes('Script error')) {
    return false;
  }
  return true;
});

// Add custom Cypress configuration
beforeEach(() => {
  // Set viewport to desktop size
  cy.viewport(1280, 720);
  
  // Clear all cookies and local storage before each test
  cy.clearCookies();
  cy.clearLocalStorage();
});

// Global before hook
before(() => {
  // You can add any global setup here
  cy.log('Starting test suite');
});

// Global after hook
after(() => {
  // You can add any global cleanup here
  cy.log('Test suite completed');
});