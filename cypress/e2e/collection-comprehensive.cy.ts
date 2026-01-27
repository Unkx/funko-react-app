describe('CollectionPage - Comprehensive Cypress Tests', () => {
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

  beforeEach(() => {
    // Clear all storage and set default values
    cy.window().then((win) => {
      win.localStorage.clear();
      win.localStorage.setItem('preferredTheme', 'dark');
      win.localStorage.setItem('preferredLanguage', 'EN');
      win.localStorage.setItem('hasSeenLanguagePopup', 'true');
    });
  });

  describe('Authentication and Page Access', () => {
    it('should redirect to login when not authenticated', () => {
      // Clear any existing auth
      cy.window().then((win) => {
        win.localStorage.removeItem('token');
        win.localStorage.removeItem('user');
      });

      cy.visit('/collection', { failOnStatusCode: false });
      // The component should redirect to login, but let's check if it navigates
      cy.url({ timeout: 15000 }).should('include', '/loginregistersite');
    });

    it('should stay on collection page when authenticated', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'valid-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
        win.localStorage.setItem('preferredTheme', 'dark');
        win.localStorage.setItem('preferredLanguage', 'EN');
        win.localStorage.setItem('hasSeenLanguagePopup', 'true');
      });

      cy.intercept('GET', '**/api/collection', { body: [] }).as('getCollection');
      cy.visit('/collection');
      cy.wait('@getCollection');
      cy.url().should('include', '/collection');
      cy.contains('Your Collection').should('be.visible');
    });
  });

  describe('Page Layout and Navigation', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
        win.localStorage.setItem('preferredTheme', 'dark');
        win.localStorage.setItem('preferredLanguage', 'EN');
        win.localStorage.setItem('hasSeenLanguagePopup', 'true');
      });

      cy.intercept('GET', '**/api/collection', { body: mockCollection }).as('getCollection');
      cy.visit('/collection');
      cy.wait('@getCollection');
    });

    it('should display header with logo and navigation', () => {
      cy.contains('Pop&Go!').should('be.visible');
      cy.contains('Dashboard').should('be.visible');
      cy.contains('Collection').should('be.visible');
      cy.contains('Wishlist').should('be.visible');
    });

    it('should have search form in header', () => {
      cy.get('form input[type="text"]').should('have.attr', 'placeholder').and('include', 'Search');
      cy.get('form button[type="submit"]').should('be.visible');
    });

    it('should display theme toggle button', () => {
      cy.get('button[aria-label="Toggle theme"]').should('be.visible');
    });

    it('should display language selector', () => {
      cy.get('button[aria-label="Select language"]').should('be.visible');
      cy.contains('EN').should('be.visible');
    });

    it('should display collection title', () => {
      cy.contains('Your Collection').should('be.visible');
    });

    it('should display footer with copyright', () => {
      cy.contains('© 2024 Pop&Go!').should('be.visible');
    });
  });

  describe('Theme Functionality', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: [] }).as('getCollection');
      cy.visit('/collection');
    });

    it('should toggle between dark and light themes', () => {
      // Start with dark theme
      cy.get('html').should('have.class', 'dark');

      // Toggle to light
      cy.get('button[aria-label="Toggle theme"]').click();
      cy.get('html').should('not.have.class', 'dark');

      // Toggle back to dark
      cy.get('button[aria-label="Toggle theme"]').click();
      cy.get('html').should('have.class', 'dark');
    });

    it('should persist theme preference', () => {
      cy.get('button[aria-label="Toggle theme"]').click();
      cy.reload();
      cy.get('html').should('not.have.class', 'dark');
    });
  });

  describe('Language Functionality', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: [] }).as('getCollection');
      cy.visit('/collection');
    });

    it('should display language dropdown', () => {
      cy.get('button[aria-label="Select language"]').click();
      cy.get('.lang-item').should('have.length.greaterThan', 1);
    });

    it('should change language and persist preference', () => {
      cy.get('button[aria-label="Select language"]').click();
      cy.contains('Polski').click();
      cy.contains('Twoja Kolekcja').should('be.visible');

      cy.reload();
      cy.contains('Twoja Kolekcja').should('be.visible');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: mockCollection }).as('getCollection');
      cy.visit('/collection');
      cy.wait('@getCollection');
    });

    it('should navigate to search page with query', () => {
      cy.get('form input[type="text"]').type('test search');
      cy.get('form button[type="submit"]').click();
      cy.url().should('include', '/searchsite?q=test%20search');
    });

    it('should navigate to search page without query', () => {
      cy.get('form button[type="submit"]').click();
      cy.url().should('include', '/searchsite');
    });
  });

  describe('Collection Display and Statistics', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: mockCollection }).as('getCollection');
      cy.visit('/collection');
      cy.wait('@getCollection');
    });

    it('should display all collection items', () => {
      cy.contains('Harry Potter').should('be.visible');
      cy.contains('Batman').should('be.visible');
      cy.contains('Superman').should('be.visible');
      cy.contains('#001').should('be.visible');
      cy.contains('#002').should('be.visible');
      cy.contains('#003').should('be.visible');
    });

    it('should display collection statistics', () => {
      cy.contains('3').should('be.visible'); // Total items
      cy.contains('3').should('be.visible'); // Filtered items
      cy.contains('$65.48').should('be.visible'); // Total value
      cy.contains('2').should('be.visible'); // Unique series
    });

    it('should display item details correctly', () => {
      // Check Harry Potter item details
      cy.contains('Harry Potter').parent().within(() => {
        cy.contains('#001').should('be.visible');
        cy.contains('Series: Harry Potter').should('be.visible');
        cy.contains('Condition: Mint').should('be.visible');
        cy.contains('Price: $29.99').should('be.visible');
        cy.contains('Purchased: 1/15/2024').should('be.visible');
        cy.contains('First edition').should('be.visible');
      });
    });
  });

  describe('Filtering and Sorting', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: mockCollection }).as('getCollection');
      cy.visit('/collection');
      cy.wait('@getCollection');
    });

    it('should show filters when filters button is clicked', () => {
      cy.contains('Filters').click();
      cy.get('input[placeholder*="Search by title"]').should('be.visible');
      cy.get('select').should('have.length', 4); // condition, sort by, order
    });

    it('should filter by search query', () => {
      cy.contains('Filters').click();
      cy.get('input[placeholder*="Search by title"]').type('Harry');
      cy.contains('Harry Potter').should('be.visible');
      cy.contains('Batman').should('not.exist');
      cy.contains('Superman').should('not.exist');
    });

    it('should filter by condition', () => {
      cy.contains('Filters').click();
      cy.get('select').first().select('mint');
      cy.contains('Harry Potter').should('be.visible');
      cy.contains('Batman').should('not.exist');
      cy.contains('Superman').should('not.exist');
    });

    it('should sort by title ascending', () => {
      cy.contains('Filters').click();
      cy.get('select').eq(1).select('title');
      cy.get('select').eq(2).select('asc');

      // Check order - Batman should come before Harry Potter
      cy.get('.rounded-lg').first().contains('Batman').should('be.visible');
    });

    it('should sort by price descending', () => {
      cy.contains('Filters').click();
      cy.get('select').eq(1).select('purchase_price');
      cy.get('select').eq(2).select('desc');

      // Harry Potter ($29.99) should come first
      cy.get('.rounded-lg').first().contains('Harry Potter').should('be.visible');
    });
  });

  describe('Edit Item Functionality', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: mockCollection }).as('getCollection');
      cy.visit('/collection');
      cy.wait('@getCollection');
    });

    it('should enter edit mode when edit button is clicked', () => {
      cy.contains('Harry Potter').parent().parent().within(() => {
        cy.contains('Edit').click();
      });

      cy.get('input[name="title"]').should('be.visible');
      cy.get('input[name="number"]').should('be.visible');
      cy.get('select[name="condition"]').should('be.visible');
      cy.get('input[name="purchase_price"]').should('be.visible');
      cy.get('textarea[name="notes"]').should('be.visible');
    });

    it('should save edited item', () => {
      cy.intercept('PUT', '**/api/collection/1', {
        statusCode: 200,
        body: { ...mockCollection[0], title: 'Harry Potter - Updated' }
      }).as('updateItem');

      cy.contains('Harry Potter').parent().parent().within(() => {
        cy.contains('Edit').click();
      });

      cy.get('input[name="title"]').clear().type('Harry Potter - Updated');
      cy.contains('Save').click();

      cy.wait('@updateItem');
      cy.contains('Harry Potter - Updated').should('be.visible');
    });

    it('should cancel edit mode', () => {
      cy.contains('Harry Potter').parent().parent().within(() => {
        cy.contains('Edit').click();
      });

      cy.get('input[name="title"]').clear().type('Changed Title');
      cy.contains('Cancel').click();

      cy.contains('Harry Potter').should('be.visible');
      cy.contains('Changed Title').should('not.exist');
    });
  });

  describe('Delete Item Functionality', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: mockCollection }).as('getCollection');
      cy.visit('/collection');
      cy.wait('@getCollection');
    });

    it('should delete item after confirmation', () => {
      cy.intercept('DELETE', '**/api/collection/1', { statusCode: 200 }).as('deleteItem');

      cy.on('window:confirm', () => true);

      cy.contains('Harry Potter').parent().parent().within(() => {
        cy.contains('Remove').click();
      });

      cy.wait('@deleteItem');
      cy.contains('Harry Potter').should('not.exist');
    });

    it('should not delete item when cancelled', () => {
      cy.on('window:confirm', () => false);

      cy.contains('Harry Potter').parent().parent().within(() => {
        cy.contains('Remove').click();
      });

      cy.contains('Harry Potter').should('be.visible');
    });
  });

  describe('Empty Collection State', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: [] }).as('getEmptyCollection');
      cy.visit('/collection');
      cy.wait('@getEmptyCollection');
    });

    it('should display empty collection message', () => {
      cy.contains('Your collection is empty').should('be.visible');
      cy.contains('Start Adding Items').should('be.visible');
    });

    it('should navigate to search page when clicking start adding items', () => {
      cy.contains('Start Adding Items').click();
      cy.url().should('include', '/searchsite');
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching collection', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      // Delay the API response
      cy.intercept('GET', '**/api/collection', (req) => {
        req.reply((res) => {
          setTimeout(() => res.send({ body: mockCollection }), 2000);
        });
      }).as('delayedCollection');

      cy.visit('/collection');
      cy.contains('Loading your collection...').should('be.visible');
      cy.wait('@delayedCollection');
      cy.contains('Harry Potter').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: mockCollection.slice(0, 1) }).as('getCollection');
      cy.visit('/collection');
      cy.wait('@getCollection');
    });

    it('should work on mobile viewport', () => {
      cy.viewport('iphone-6');
      cy.contains('Pop&Go!').should('be.visible');
      cy.contains('Your Collection').should('be.visible');
      cy.get('button[aria-label="Select language"]').should('be.visible');
    });

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.contains('Pop&Go!').should('be.visible');
      cy.contains('Your Collection').should('be.visible');
      cy.get('button[aria-label="Select language"]').should('be.visible');
    });

    it('should work on desktop viewport', () => {
      cy.viewport(1920, 1080);
      cy.contains('Pop&Go!').should('be.visible');
      cy.contains('Your Collection').should('be.visible');
      cy.get('button[aria-label="Select language"]').should('be.visible');
    });
  });

  describe('Auto-logout Functionality', () => {
    it('should redirect to login after 10 minutes of inactivity', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: [] }).as('getCollection');
      cy.visit('/collection');

      // Fast-forward time by 10 minutes and 1 second
      cy.clock();
      cy.tick(10 * 60 * 1000 + 1000);

      cy.url({ timeout: 10000 }).should('include', '/loginregistersite');
    });

    it('should reset timer on user activity', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { body: [] }).as('getCollection');
      cy.visit('/collection');

      cy.clock();

      // Advance 9 minutes
      cy.tick(9 * 60 * 1000);

      // Simulate user activity
      cy.get('body').click();

      // Advance another 9 minutes (should not logout)
      cy.tick(9 * 60 * 1000);

      cy.url().should('include', '/collection');

      // Advance another 2 minutes (should logout now)
      cy.tick(2 * 60 * 1000);

      cy.url({ timeout: 10000 }).should('include', '/loginregistersite');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { statusCode: 500 }).as('failedCollection');
      cy.visit('/collection');
      cy.wait('@failedCollection');

      // Should still display the page structure
      cy.contains('Your Collection').should('be.visible');
      // Collection should be empty
      cy.get('.rounded-lg').should('have.length', 0);
    });

    it('should handle network errors', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'test-token');
        win.localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      });

      cy.intercept('GET', '**/api/collection', { forceNetworkError: true }).as('networkError');
      cy.visit('/collection');
      cy.wait('@networkError');

      // Should still display the page
      cy.contains('Your Collection').should('be.visible');
    });
  });
});
