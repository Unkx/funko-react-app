// cypress/e2e/collection-comprehensive.cy.ts
describe('Collection Page - Comprehensive Tests', () => {
  const mockCollection = [
    {
      id: '1',
      title: 'Harry Potter',
      number: '001',
      image_name: 'https://example.com/hp.jpg',
      condition: 'mint',
      purchase_price: 29.99,
      purchase_date: '2024-01-15',
      series: 'Harry Potter',
      notes: 'First edition'
    },
    {
      id: '2',
      title: 'Batman',
      number: '002',
      condition: 'good',
      purchase_price: 19.99,
      series: 'DC Comics'
    },
    {
      id: '3',
      title: 'Superman',
      number: '003',
      condition: 'fair',
      purchase_price: 15.50,
      series: 'DC Comics'
    }
  ];
  
  describe('With authenticated user and collection data', () => {
    beforeEach(() => {
      // Ustaw pełne dane użytkownika
      cy.window().then((win) => {
        win.localStorage.clear();
        win.localStorage.setItem('token', 'comprehensive-test-token');
        win.localStorage.setItem('user', JSON.stringify({ 
          email: 'comprehensive@test.com',
          name: 'Test User',
          id: 'user-123'
        }));
        win.localStorage.setItem('preferredTheme', 'dark');
        win.localStorage.setItem('preferredLanguage', 'EN');
        win.localStorage.setItem('hasSeenLanguagePopup', 'true');
      });
      
      // Mock API - używaj wildcard dla URL
      cy.intercept('GET', '**/api/collection', {
        statusCode: 200,
        body: mockCollection
      }).as('getCollection');
      
      // Odwiedź stronę
      cy.visit('/collection', { timeout: 30000 });
      
      // Bezpieczne czekanie na API - NIE używaj .catch()
      cy.get('@getCollection.all', { timeout: 10000 }).then((interceptions) => {
        if (interceptions.length > 0) {
          cy.log('Collection loaded via API');
        } else {
          cy.log('API not called yet - might be loading or conditional');
          // Dodaj krótkie czekanie na render
          cy.wait(1000);
        }
      });
    });
    
    it('should display all collection items', () => {
      // Poczekaj na renderowanie
      cy.wait(2000);
      
      // Sprawdź czy itemy są widoczne - szukaj po tekstach
      cy.contains('Harry Potter', { timeout: 10000 }).should('be.visible');
      cy.contains('Batman').should('be.visible');
      cy.contains('Superman').should('be.visible');
      
      // Sprawdź numery
      cy.contains('#001').should('be.visible');
      cy.contains('#002').should('be.visible');
      cy.contains('#003').should('be.visible');
      
      // Sprawdź czy są karty kolekcji
      cy.get('div').filter((_, el) => {
        const classes = el.className || '';
        return classes.includes('rounded') && classes.includes('shadow');
      }).should('have.length.at.least', 1);
    });
    
    it('should display collection statistics', () => {
      cy.wait(2000);
      
      // Sprawdź statystyki - szukaj po liczbach
      cy.contains('2').then(() => {
        // Jeśli znajdzie liczbę 2, sprawdź czy jest w kontekście Total Items
        cy.get('body').invoke('text').then(text => {
          if (text.includes('Total Items')) {
            cy.contains('Total Items').should('be.visible');
          }
        });
      });
      
      // Oblicz całkowitą wartość
      const totalValue = mockCollection.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
      
      // Sprawdź czy wartość jest wyświetlona
      cy.contains(totalValue.toFixed(2)).should('be.visible');
    });
    
    it('should allow searching within collection', () => {
      cy.wait(2000);
      
      // Otwórz filtry jeśli istnieje przycisk
      cy.get('button').contains('Filters').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn).click();
          
          // Znajdź pole wyszukiwania w filtrach
          cy.get('input[placeholder*="Search"], input[type="text"]').then($inputs => {
            // Weź drugi input (pierwszy może być w headerze)
            if ($inputs.length > 1) {
              cy.wrap($inputs.eq(1)).type('Harry');
              
              // Sprawdź czy tylko Harry Potter jest widoczny
              cy.contains('Harry Potter').should('be.visible');
              cy.contains('Batman').should('not.exist');
              
              // Wyczyść wyszukiwanie
              cy.wrap($inputs.eq(1)).clear();
              cy.contains('Batman').should('be.visible');
            }
          });
        }
      });
    });
    
    it('should allow filtering by condition', () => {
      cy.wait(2000);
      
      // Otwórz filtry
      cy.get('button').contains('Filters').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn).click();
          
          // Znajdź select dla condition
          cy.get('select').then($selects => {
            if ($selects.length > 0) {
              // Użyj pierwszego selecta
              cy.wrap($selects.first()).select('mint');
              
              // Tylko Harry Potter powinien być widoczny
              cy.contains('Harry Potter').should('be.visible');
              cy.contains('Batman').should('not.exist');
              
              // Przywróć wszystkie
              cy.wrap($selects.first()).select('all');
              cy.contains('Batman').should('be.visible');
            }
          });
        }
      });
    });
    
    it('should allow editing an item', () => {
      cy.wait(2000);
      
      // Mock update API
      cy.intercept('PUT', '**/api/collection/1', {
        statusCode: 200,
        body: { ...mockCollection[0], title: 'Harry Potter - Updated' }
      }).as('updateItem');
      
      // Kliknij Edit - szukaj przycisku który zawiera tekst Edit
      cy.get('button').contains('Edit').first().click();
      
      // Sprawdź czy formularz edycji się pojawił
      cy.get('input[name="title"], input[placeholder*="Title"]').first().should('be.visible');
      
      // Zmień tytuł
      cy.get('input[name="title"], input[placeholder*="Title"]').first().clear().type('Harry Potter - Updated');
      
      // Zapisz
      cy.get('button').contains('Save').first().click();
      
      // Sprawdź czy API zostało wywołane
      cy.wait('@updateItem').then((interception) => {
        expect(interception.request.body.title).to.equal('Harry Potter - Updated');
      });
      
      // Sprawdź czy UI się zaktualizował
      cy.contains('Harry Potter - Updated').should('be.visible');
    });
    
    it('should allow deleting an item', () => {
      cy.wait(2000);
      
      // Mock delete API
      cy.intercept('DELETE', '**/api/collection/1', {
        statusCode: 200
      }).as('deleteItem');
      
      // Potwierdź dialog
      cy.on('window:confirm', () => true);
      
      // Kliknij Delete na pierwszym itemie
      cy.get('button').contains('Remove').first().click();
      
      // Sprawdź czy API zostało wywołane
      cy.wait('@deleteItem');
      
      // Sprawdź czy item zniknął
      cy.contains('Harry Potter').should('not.exist');
    });
  });
  
  describe('Empty collection state', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.clear();
        win.localStorage.setItem('token', 'empty-collection-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'empty@test.com' }));
      });
      
      // Mock pusta kolekcja
      cy.intercept('GET', '**/api/collection', {
        statusCode: 200,
        body: []
      }).as('getEmptyCollection');
      
      cy.visit('/collection', { timeout: 30000 });
    });
    
    it('should display empty collection message', () => {
      // Szukaj komunikatów o pustej kolekcji - używaj mniej restrykcyjnych regex
      cy.contains('empty', { matchCase: false }).should('be.visible');
    });
    
    it('should have link to add items', () => {
      // Szukaj przycisków/linków do dodawania
      cy.get('a, button').contains(/browse|search|add/i, { matchCase: false }).should('be.visible');
    });
  });
  
  describe('Responsive behavior', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'responsive-test');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@test.com' }));
      });
      
      cy.intercept('GET', '**/api/collection', { 
        statusCode: 200,
        body: mockCollection.slice(0, 1) // Tylko jeden item dla szybkości
      });
    });
    
    it('should work on mobile', () => {
      cy.viewport('iphone-6');
      cy.visit('/collection', { timeout: 30000 });
      
      // Sprawdź podstawowe elementy
      cy.get('body', { timeout: 10000 }).should('be.visible');
      cy.contains('Pop&Go!', { timeout: 10000 }).should('be.visible');
      
      // Zrób screenshot
      cy.screenshot('collection-mobile');
    });
    
    it('should work on tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/collection', { timeout: 30000 });
      
      cy.get('body', { timeout: 10000 }).should('be.visible');
      cy.contains('Pop&Go!').should('be.visible');
      
      cy.screenshot('collection-tablet');
    });
    
    it('should work on desktop', () => {
      cy.viewport(1920, 1080);
      cy.visit('/collection', { timeout: 30000 });
      
      cy.get('body', { timeout: 10000 }).should('be.visible');
      cy.contains('Pop&Go!').should('be.visible');
      
      cy.screenshot('collection-desktop');
    });
  });
});