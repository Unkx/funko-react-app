// cypress/e2e/pages/Loginpage.ts
export class LoginPage {
  // Wait for page to be fully loaded and close any popups
  waitForPageLoad() {
    // Wait for animations to complete
    cy.wait(2000);
    
    // Check if language popup is visible and close it
    cy.get('body').then(($body) => {
      const hasLanguagePopup = $body.find('[data-testid="language-popup"]').length > 0;
      if (hasLanguagePopup) {
        cy.get('[data-testid="language-popup"] button').first().click({ force: true });
        cy.wait(500);
      }
    });
    
    // Check for the logo
    cy.contains('Pop&Go!', { timeout: 15000 }).should('be.visible');
    return this;
  }

  /**
   * Visit the login page
   */
  visit() {
    cy.visit('/loginRegisterSite');
    this.waitForPageLoad();
    return this;
  }

  /**
   * Fill and submit login form
   */
  login(username: string, password: string) {
    // Close any popups first
    this.closeLanguagePopup();
    
    // Get all text inputs and use the first one for username with force
    cy.get('input[type="text"]').first()
      .clear({ force: true })
      .type(username, { force: true });
    
    // Get all password inputs and use the first one for password with force
    cy.get('input[type="password"]').first()
      .clear({ force: true })
      .type(password, { force: true });
    
    // Submit the form with force
    cy.get('button[type="submit"]').click({ force: true });
    return this;
  }

  /**
   * Navigate to registration form
   */
  goToRegister() {
    // Close any popups first
    this.closeLanguagePopup();
    
    // Look for the register now button in the login form
    cy.get('form').within(() => {
      cy.contains('button', /register now/i).click({ force: true });
    });
    cy.wait(1000); // Wait for animation
    return this;
  }

  /**
   * Navigate back to login form from register
   */
  goToLogin() {
    cy.contains('button', /back/i).click({ force: true });
    cy.wait(1000); // Wait for animation
    return this;
  }

  /**
   * Toggle theme (dark/light mode)
   */
  toggleTheme() {
    // Close any popups first
    this.closeLanguagePopup();
    
    // Find theme toggle button (last button with SVG in header)
    cy.get('header').within(() => {
      cy.get('button').filter(':has(svg)').last().click({ force: true });
    });
    cy.wait(500); // Wait for theme transition
    return this;
  }

  /**
   * Open language selector
   */
  openLanguageSelector() {
    // Close any popups first
    this.closeLanguagePopup();
    
    // Find language button (first button with SVG in header)
    cy.get('header').within(() => {
      cy.get('button').filter(':has(svg)').first().click({ force: true });
    });
    cy.wait(300);
    return this;
  }

  /**
   * Select a specific language
   */
  selectLanguage(language: 'EN' | 'PL' | 'RU' | 'FR' | 'DE' | 'ES') {
    this.openLanguageSelector();
    cy.get('.lang-item').contains(language).click({ force: true });
    cy.wait(1000); // Wait for language change
    return this;
  }

  /**
   * Close language popup if present
   */
  closeLanguagePopup() {
    cy.get('body').then(($body) => {
      const popup = $body.find('[data-testid="language-popup"]');
      if (popup.length > 0) {
        // Try to find and click the close/confirm button
        cy.get('[data-testid="language-popup"] button').first().click({ force: true });
        cy.wait(500);
      }
    });
    return this;
  }

  /**
   * Hide SVG maps that might be covering elements
   */
  hideCoveringElements() {
    // Hide SVG elements that might be covering inputs
    cy.get('svg').then(($svgs) => {
      if ($svgs.length > 0) {
        // Hide specific problematic SVGs
        cy.get('svg').invoke('attr', 'style', 'display: none !important');
      }
    });
    return this;
  }

  // Assertions / Getters

  /**
   * Get error message element
   */
  getErrorMessage() {
    return cy.get('p.text-red-500');
  }

  /**
   * Verify page loaded correctly
   */
  verifyPageLoaded() {
    // First close any popups
    this.closeLanguagePopup();
    
    cy.contains('h1', 'Pop&Go!').should('be.visible');
    cy.get('form').should('be.visible');
    cy.get('input[type="text"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    return this;
  }

  /**
   * Verify user is on login form (not register)
   */
  verifyLoginFormVisible() {
    // Close any popups first
    this.closeLanguagePopup();
    
    // Login form has username and password, but no email field
    cy.get('input[type="text"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('input[placeholder="Email"]').should('not.exist');
    cy.contains('button', /register now/i).should('be.visible');
    return this;
  }

  /**
   * Verify user is on register form (not login)
   */
  verifyRegisterFormVisible() {
    // Close any popups first
    this.closeLanguagePopup();
    
    cy.get('input[placeholder="Email"]').should('be.visible');
    cy.get('select').should('be.visible');
    cy.get('input[type="date"]').should('be.visible');
    cy.contains('button', /back/i).should('be.visible');
    return this;
  }

  /**
   * Verify error message is displayed
   */
  verifyErrorDisplayed(errorText?: string) {
    if (errorText) {
      this.getErrorMessage().should('contain.text', errorText);
    } else {
      this.getErrorMessage().should('be.visible');
    }
    return this;
  }

  /**
   * Verify no error message is displayed
   */
  verifyNoError() {
    this.getErrorMessage().should('not.exist');
    return this;
  }

  /**
   * Verify redirect to dashboard
   */
  verifyRedirectToDashboard() {
    cy.url().should('include', '/dashboardSite');
    return this;
  }

  /**
   * Verify redirect to admin panel
   */
  verifyRedirectToAdmin() {
    cy.url().should('include', '/AdminSite');
    return this;
  }

  /**
   * Verify theme is dark mode
   */
  verifyDarkMode() {
    cy.get('html').should('have.class', 'dark');
    return this;
  }

  /**
   * Verify theme is light mode
   */
  verifyLightMode() {
    cy.get('html').should('not.have.class', 'dark');
    return this;
  }

  /**
   * Fill registration form
   */
  fillRegistrationForm(data: {
    email: string;
    username: string;
    name: string;
    surname: string;
    password: string;
    confirmPassword: string;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    dateOfBirth: string;
    nationality?: string;
    inviteToken?: string;
  }) {
    // Close any popups first
    this.closeLanguagePopup();
    
    // Make sure we're on register form
    cy.get('input[placeholder="Email"]').should('be.visible');

    // Fill form in order of appearance with force option
    cy.get('input[placeholder*="username" i], input[type="text"]').first()
      .clear({ force: true }).type(data.username, { force: true });
    
    cy.get('input[placeholder="Email"]')
      .clear({ force: true }).type(data.email, { force: true });
    
    cy.get('input[placeholder*="name" i]').first()
      .clear({ force: true }).type(data.name, { force: true });
    
    cy.get('input[placeholder*="surname" i]').first()
      .clear({ force: true }).type(data.surname, { force: true });
    
    cy.get('input[type="password"]').first()
      .clear({ force: true }).type(data.password, { force: true });
    
    cy.get('input[type="password"]').last()
      .clear({ force: true }).type(data.confirmPassword, { force: true });
    
    if (data.inviteToken) {
      cy.get('input[placeholder*="invite" i]')
        .clear({ force: true }).type(data.inviteToken, { force: true });
    }
    
    if (data.nationality) {
      cy.get('input[placeholder*="nationality" i]')
        .clear({ force: true }).type(data.nationality, { force: true });
    }
    
    cy.get('select').select(data.gender, { force: true });
    cy.get('input[type="date"]').clear({ force: true }).type(data.dateOfBirth, { force: true });

    return this;
  }

  /**
   * Submit registration form
   */
  submitRegistration() {
    cy.get('button[type="submit"]').click({ force: true });
    return this;
  }

  /**
   * Simple type in field helper with force option
   */
  typeInField(selector: string, text: string) {
    cy.get(selector).first().clear({ force: true }).type(text, { force: true });
    return this;
  }

  /**
   * Simple click helper with force option
   */
  clickElement(selector: string) {
    cy.get(selector).click({ force: true });
    return this;
  }
}

// Export singleton instance for easy import
export const loginPage = new LoginPage();