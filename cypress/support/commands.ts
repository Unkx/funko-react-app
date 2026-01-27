// Rozszerz istniejące komendy Cypress
Cypress.Commands.add('setLocalStorage', (key: string, value: string) => {
  cy.window().then((window) => {
    window.localStorage.setItem(key, value);
  });
});

// Poprawiona komenda clearLocalStorage
Cypress.Commands.overwrite('clearLocalStorage', (originalFn, keys?: string | string[]) => {
  if (keys) {
    return cy.window().then((window) => {
      if (Array.isArray(keys)) {
        keys.forEach(key => window.localStorage.removeItem(key));
      } else if (typeof keys === 'string') {
        window.localStorage.removeItem(keys);
      }
      // Dla regex lub innych typów, użyj oryginalnej funkcji
    });
  }
  return originalFn();
});

// Komenda do logowania
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.intercept('POST', '**/api/login', {
    statusCode: 200,
    body: { 
      token: 'mock-jwt-token', 
      user: { 
        id: '123',
        email: email,
        name: 'Test User'
      } 
    }
  }).as('loginRequest');

  cy.visit('/loginregistersite');
  
  cy.get('input[name="email"], input[type="email"]').first().type(email);
  cy.get('input[name="password"], input[type="password"]').first().type(password);
  
  cy.get('button[type="submit"]').first().click();
  
  cy.wait('@loginRequest');
  cy.url().should('include', '/dashboardSite');
  
  cy.window().then((window) => {
    window.localStorage.setItem('token', 'mock-jwt-token');
    window.localStorage.setItem('user', JSON.stringify({ email }));
  });
});

// Komenda do mockowania zalogowanego użytkownika
Cypress.Commands.add('mockAuthenticatedUser', (userData = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    token: 'mock-jwt-token-12345',
    id: 'test-user-123'
  };
  
  const user = { ...defaultUser, ...userData };
  
  cy.window().then((window) => {
    window.localStorage.setItem('user', JSON.stringify({ 
      email: user.email,
      id: user.id 
    }));
    window.localStorage.setItem('token', user.token);
    window.localStorage.setItem('preferredTheme', 'dark');
    window.localStorage.setItem('preferredLanguage', 'EN');
    window.localStorage.setItem('hasSeenLanguagePopup', 'true');
  });
});

// Komenda do sprawdzania czy element ma dany test-id
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Debugowanie requestów - POPRAWIONA
Cypress.Commands.add('debugRequests', () => {
  // Ta komenda tylko loguje, nie modyfikuje requestów
  cy.on('window:before:load', (win) => {
    const originalFetch = win.fetch;
    win.fetch = function(...args) {
      console.log('[FETCH]', args[0], args[1]);
      return originalFetch.apply(this, args);
    };
  });
});

// Czekanie na załadowanie aplikacji
Cypress.Commands.add('waitForAppLoad', () => {
  cy.get('body', { timeout: 30000 }).should('be.visible');
});

// Komenda do mockowania collection API z danymi
Cypress.Commands.add('mockCollectionData', (data = []) => {
  // Użyj wildcard dla URL, bo nie wiemy dokładnie jaki jest
  cy.intercept('GET', '**/api/collection', {
    statusCode: 200,
    body: data
  }).as('getCollection');
});

// Komenda do debugowania localStorage
Cypress.Commands.add('debugLocalStorage', () => {
  cy.window().then((win) => {
    console.log('=== LocalStorage Debug ===');
    for (let i = 0; i < win.localStorage.length; i++) {
      const key = win.localStorage.key(i);
      const value = win.localStorage.getItem(key!);
      console.log(`${key}: ${value}`);
    }
    console.log('=========================');
  });
});

// Komenda do bezpiecznego czekania na element
Cypress.Commands.add('waitForElement', (selector: string, timeout = 10000) => {
  return cy.get(selector, { timeout }).should('be.visible');
});

// PROSTA komenda do clearLocalStorage z stringiem
Cypress.Commands.add('clearLocalStorageKeys', (keys: string | string[]) => {
  cy.window().then((win) => {
    if (Array.isArray(keys)) {
      keys.forEach(key => win.localStorage.removeItem(key));
    } else {
      win.localStorage.removeItem(keys);
    }
  });
});

// Typy dla TypeScript - tylko JEDNA deklaracja
declare global {
  namespace Cypress {
    interface Chainable {
      // Basic commands
      setLocalStorage(key: string, value: string): Chainable<void>;
      mockAuthenticatedUser(userData?: object): Chainable<void>;
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      clearLocalStorageKeys(keys: string | string[]): Chainable<void>;
      
      // Auth commands
      login(email: string, password: string): Chainable<void>;
      
      // Mock commands
      mockCollectionData(data?: any[]): Chainable<void>;
      
      // Debug commands
      debugRequests(): Chainable<void>;
      debugLocalStorage(): Chainable<void>;
      waitForAppLoad(): Chainable<void>;
      waitForElement(selector: string, timeout?: number): Chainable<JQuery<HTMLElement>>;
    }
  }
}