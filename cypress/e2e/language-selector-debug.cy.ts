// cypress/e2e/language-selector.cy.ts

describe('Language Selector Tests - WelcomeSite Version', () => {
  beforeEach(() => {
    // Wyczyść wszystko
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/');
    cy.wait(3000);
  });

  describe('Essential Functionality', () => {
    it('displays language selector button', () => {
      cy.get('button[aria-label*="language"], button[aria-label*="Language"], button:has(svg.globe)')
        .should('exist')
        .and('be.visible');
    });

    it('has globe icon', () => {
      cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
        .find('svg')
        .should('exist');
    });

    it('opens dropdown on click', () => {
      cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
        .click();
      
      cy.get('[role="menu"], .lang-dropdown, .language-dropdown, .dropdown-menu')
        .should('be.visible');
    });

    it('shows multiple language options', () => {
      cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
        .click();
      
      cy.get('[role="menu"], .lang-dropdown')
        .should('be.visible')
        .within(() => {
          cy.contains('English').should('be.visible');
          cy.contains('Polski').should('be.visible');
          cy.contains('Français').should('be.visible');
          cy.contains('Deutsch').should('be.visible');
          cy.contains('Español').should('be.visible');
        });
    });

    const languages = [
      { name: 'Polish', option: 'Polski', code: 'PL' },
      { name: 'English', option: 'English', code: 'EN' },
      { name: 'French', option: 'Français', code: 'FR' },
      { name: 'German', option: 'Deutsch', code: 'DE' },
      { name: 'Spanish', option: 'Español', code: 'ES' }
    ];

    languages.forEach(({ name, option, code }) => {
      it(`changes to ${name}`, () => {
        cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
          .click();
        
        cy.contains(option).click();
        
        // Check localStorage
        cy.window().then(win => {
          expect(win.localStorage.getItem('preferredLanguage')).to.equal(code);
        });
        
        // Verify button shows selected language
        cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
          .invoke('text')
          .should(text => {
            expect(text).to.match(new RegExp(`${code}|${option}`, 'i'));
          });
      });
    });

    it('persists after reload', () => {
      // Set language to Polish
      cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
        .click();
      
      cy.contains('Polski').click();
      
      // Reload page
      cy.reload();
      cy.wait(2000);
      
      // Verify persistence
      cy.window().then(win => {
        expect(win.localStorage.getItem('preferredLanguage')).to.equal('PL');
      });
      
      // Verify UI shows Polish
      cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
        .invoke('text')
        .should('include', 'PL');
    });

    it('closes on outside click', () => {
      cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
        .click();
      
      cy.get('[role="menu"], .lang-dropdown')
        .should('be.visible');
      
      // Click outside
      cy.get('body').click(10, 10);
      
      cy.get('[role="menu"], .lang-dropdown')
        .should('not.exist');
    });
  });

  describe('Interaction Tests', () => {
    it('handles multiple language changes', () => {
      const testLanguages = ['Polski', 'English', 'Français'];
      
      testLanguages.forEach(lang => {
        cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
          .click();
        
        cy.contains(lang).click();
        cy.wait(1000);
        
        // Verify each change
        cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
          .invoke('text')
          .should('include', lang.substring(0, 2));
      });
    });

    it('opens and closes multiple times', () => {
      for (let i = 0; i < 3; i++) {
        cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
          .click();
        
        cy.get('[role="menu"], .lang-dropdown')
          .should('be.visible');
        
        // Close by clicking button again
        cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
          .click();
        
        cy.get('[role="menu"], .lang-dropdown')
          .should('not.exist');
      }
    });

    it('works with theme toggle', () => {
      // Find and test theme toggle
      cy.get('button[aria-label*="theme"], button[aria-label*="Theme"], .theme-toggle')
        .first()
        .click();
      
      cy.wait(1000);
      
      // Now test language selector
      cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
        .click();
      
      cy.get('[role="menu"], .lang-dropdown')
        .should('be.visible');
      
      cy.contains('Polski').click();
      
      // Switch theme back
      cy.get('button[aria-label*="theme"], button[aria-label*="Theme"], .theme-toggle')
        .first()
        .click();
      
      // Verify language persists
      cy.window().then(win => {
        expect(win.localStorage.getItem('preferredLanguage')).to.equal('PL');
      });
    });
  });

  describe('Keyboard Support', () => {
    it('opens with Enter key', () => {
      cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
        .focus()
        .type('{enter}');
      
      cy.get('[role="menu"], .lang-dropdown')
        .should('be.visible');
    });

    it('closes with Escape key', () => {
      cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
        .click();
      
      cy.get('[role="menu"], .lang-dropdown')
        .should('be.visible')
        .type('{esc}');
      
      cy.get('[role="menu"], .lang-dropdown')
        .should('not.exist');
    });

    it('navigates with arrow keys and selects with Enter', () => {
      cy.get('button[aria-label*="language"], button[aria-label*="Language"]')
        .focus()
        .type('{enter}');
      
      // Navigate with arrow keys
      cy.get('[role="menu"], .lang-dropdown')
        .should('be.visible')
        .type('{downArrow}{downArrow}{enter}');
      
      // Should select a language (probably the third one)
      cy.wait(1000);
      
      // Verify something was selected
      cy.window().then(win => {
        const lang = win.localStorage.getItem('preferredLanguage');
        expect(lang).to.be.oneOf(['EN', 'PL', 'FR', 'DE', 'ES']);
      });
    });
  });

  // Debug tests for troubleshooting
  describe('Debug & Utility Tests', () => {
    it('debug - show site structure', () => {
      cy.log('=== DEBUG WELCOMESITE ===');
      
      cy.url().then(url => cy.log(`URL: ${url}`));
      cy.title().then(title => cy.log(`Title: ${title}`));
      
      // Check for language button
      cy.get('button').each(($btn, index) => {
        if ($btn.attr('aria-label')?.includes('language') || 
            $btn.find('svg').length > 0) {
          cy.log(`Language button ${index}:`, $btn.prop('outerHTML'));
        }
      });
      
      cy.screenshot('language-selector-structure');
    });

    it('tests all languages via localStorage', () => {
      const languages = [
        { code: 'EN', expectedLang: 'en' },
        { code: 'PL', expectedLang: 'pl' },
        { code: 'FR', expectedLang: 'fr' },
        { code: 'DE', expectedLang: 'de' },
        { code: 'ES', expectedLang: 'es' },
        { code: 'RU', expectedLang: 'ru' }
      ];
      
      languages.forEach(({ code, expectedLang }) => {
        cy.log(`Testing language: ${code}`);
        
        cy.window().then(win => {
          win.localStorage.setItem('preferredLanguage', code);
        });
        
        cy.reload();
        cy.wait(1500);
        
        cy.window().then(win => {
          expect(win.localStorage.getItem('preferredLanguage')).to.equal(code);
        });
      });
    });
  });
});

// Dashboard tests (if applicable)
describe('Dashboard Language Tests', () => {
  it('tries to access Dashboard and test language', () => {
    cy.visit('/');
    
    // Try to find login
    cy.get('a[href*="login"], button:contains("Login")').first().click();
    
    cy.url().should('include', 'login');
    
    // If login form exists
    cy.get('body').then($body => {
      if ($body.find('input[type="email"]').length > 0) {
        // Test login - modify with actual credentials
        cy.get('input[type="email"]').type('test@example.com');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();
        
        cy.wait(5000);
        
        // If logged in, test language
        cy.url().then(url => {
          if (url.includes('dashboard')) {
            cy.get('button[aria-label*="language"]').should('exist').click();
            cy.contains('Polski').click();
            
            cy.window().then(win => {
              expect(win.localStorage.getItem('preferredLanguage')).to.equal('PL');
            });
          }
        });
      }
    });
  });
});