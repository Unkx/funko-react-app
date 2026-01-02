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
          const deletes = dbs.map(db => idb.deleteDatabase(db.name));
          return Promise.all(deletes);
        });
      }
    }

    return Promise.resolve();
  });
});

// TypeScript augmentation so `cy.clearAllStorage()` is recognized
declare global {
  namespace Cypress {
    interface Chainable {
      clearAllStorage(): Chainable<void>;
    }
  }
}

export {};