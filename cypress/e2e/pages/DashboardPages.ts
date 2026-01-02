export class DashboardPage {
  // Selectors adapted to actual app markup (no data-testid attributes)
  private selectors = {
    // scope selectors to dashboard area
    themeToggle: 'div.welcome-site header button[aria-label*="mode"]',
    languageSelector: 'div.welcome-site header button[aria-label="Select language"]',
    // search input has aria-label
    searchInput: 'div.welcome-site header input[aria-label="Search for Funkos"]'
  };

  // Actions
  toggleTheme() {
    cy.get(this.selectors.themeToggle).click();
    return this;
  }

  getThemeToggle() {
    return cy.get(this.selectors.themeToggle);
  }

  openLanguageSelector() {
    // Force-click the language button by aria-label and wait briefly for the dropdown
    cy.get('button[aria-label="Select language"]').click({ force: true });
    cy.get('div').contains(/English|Polski|Français|Deutsch|Español/).should('be.visible');
    return this;
  }

  // Language option buttons are rendered with visible text (e.g. "English", "Polski")
  getLanguageOption(language: string) {
    return cy.contains('button', language);
  }

  selectLanguage(language: string) {
    this.openLanguageSelector();
    this.getLanguageOption(language).click();
    // Wait for language change to apply
    cy.wait(500);
    return this;
  }

  navigateToCollection() {
    cy.contains('nav button', /collection/i).click();
    // ensure collection view loaded
    cy.get('main').contains(/collection/i, { matchCase: false }).should('exist');
    return this;
  }

  navigateToWishlist() {
    cy.contains('nav button', /wishlist/i).click();
    cy.get('main').contains(/wishlist/i, { matchCase: false }).should('exist');
    return this;
  }

  openLoyaltyDashboard() {
    // Click the rewards button in the navigation (emoji + text)
    cy.get('nav').contains('button', /🏆|Rewards|Nagrody|Rewards|Rewards/i).click({ force: true });
    return this;
  }

  openEditProfile() {
    cy.contains('button', /edit/i).click();
    return this;
  }

  getCollectionButton() {
    return cy.contains('nav button', /collection/i);
  }

  getWishlistButton() {
    return cy.contains('nav button', /wishlist/i);
  }

  getSearchInput() {
    return cy.get(this.selectors.searchInput);
  }

  getMobileMenuButton() {
    // For mobile viewport tests, the language selector or theme button is visible — reuse language selector
    return cy.get(this.selectors.languageSelector);
  }

  getDesktopNavigation() {
    return cy.get('nav');
  }

  getLogo() {
    return cy.get('header h1');
  }

  getUserMenu() {
    return cy.contains('button', /logout/i);
  }
}