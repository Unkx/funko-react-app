// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login programmatically
       * @example cy.login('username', 'password')
       */
      login(username: string, password: string): Chainable<void>;
      
      /**
       * Custom command to mock successful login API response
       * @example cy.mockLoginSuccess()
       */
      mockLoginSuccess(userData?: any): Chainable<void>;
      
      /**
       * Custom command to mock failed login API response
       * @example cy.mockLoginFailure()
       */
      mockLoginFailure(errorMessage?: string): Chainable<void>;
      
      /**
       * Custom command to clear all storage (simple version)
       * @example cy.clearStorage()
       */
      clearStorage(): Chainable<void>;
      
      /**
       * Custom command to clear ALL browser storage including cookies, localStorage, sessionStorage, Cache API, and IndexedDB
       * @example cy.clearAllStorage()
       */
      clearAllStorage(): Chainable<void>;
      
      /**
       * Custom command to set theme
       * @example cy.setTheme('dark')
       */
      setTheme(theme: 'dark' | 'light'): Chainable<void>;
      
      /**
       * Custom command to set language
       * @example cy.setLanguage('EN')
       */
      setLanguage(language: string): Chainable<void>;

      /**
       * Custom command for keyboard tab navigation
       * @example cy.tab()
       */
      tab(): Chainable<void>;
    }
  }
}

// Custom command to login
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="text"]').first().type(username);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Custom command to mock successful login
Cypress.Commands.add('mockLoginSuccess', (userData = {}) => {
  const defaultUser = {
    id: 1,
    login: 'testuser',
    email: 'test@example.com',
    role: 'user',
    ...userData
  };

  cy.intercept('POST', '**/api/login', {
    statusCode: 200,
    body: {
      user: defaultUser,
      token: 'mock-jwt-token-' + Date.now()
    }
  }).as('loginSuccess');
});

// Custom command to mock failed login
Cypress.Commands.add('mockLoginFailure', (errorMessage = 'Invalid credentials') => {
  cy.intercept('POST', '**/api/login', {
    statusCode: 401,
    body: {
      error: errorMessage
    }
  }).as('loginFailure');
});

// Custom command to clear all storage
Cypress.Commands.add('clearStorage', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});

// Custom command to set theme
Cypress.Commands.add('setTheme', (theme: 'dark' | 'light') => {
  cy.window().then((win) => {
    win.localStorage.setItem('preferredTheme', theme);
    if (theme === 'dark') {
      win.document.documentElement.classList.add('dark');
    } else {
      win.document.documentElement.classList.remove('dark');
    }
  });
});

// Custom command to set language
Cypress.Commands.add('setLanguage', (language: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem('preferredLanguage', language);
  });
});

// Custom command for tab navigation
Cypress.Commands.add('tab', () => {
  cy.focused().trigger('keydown', { keyCode: 9, which: 9, key: 'Tab' });
});

// Custom Cypress command to clear all browser storage used by the app
Cypress.Commands.add('clearAllStorage', () => {
  cy.clearCookies();
  cy.clearLocalStorage();

  return cy.window().then((win) => {
    try { win.sessionStorage?.clear(); } catch (e) { /* ignore */ }

    if (win.caches && typeof win.caches.keys === 'function') {
      win.caches.keys().then((keys: string[]) => Promise.all(keys.map(k => win.caches.delete(k))));
    }

    if (win.indexedDB) {
      const idb = win.indexedDB as any;
      if (typeof idb.databases === 'function') {
        return idb.databases().then((dbs: any[]) => {
          const deletes = dbs.map((db: any) => idb.deleteDatabase(db.name));
          return Promise.all(deletes);
        });
      }
    }

    return Promise.resolve();
  });
});

// Prevent TypeScript errors
export {};