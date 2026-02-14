// cypress/support/pages/dashboard-page.ts
export class DashboardPage {
  // Selectors based on actual markup
  private selectors = {
    languageButton: 'button[aria-label="Select language"]',
    languageCode: 'span.hidden.sm\\:inline',
    languageDropdown: '.lang-dropdown',
    languageItem: '.lang-item',
    themeToggle: 'button[aria-label*="mode"]',
    logoutButton: 'button:contains("Logout")'
  };

  openLanguageSelector() {
    cy.get(this.selectors.languageButton).click();
    cy.get(this.selectors.languageDropdown).should('be.visible');
    return this;
  }

  getLanguageCode() {
    return cy.get(this.selectors.languageButton)
      .find(this.selectors.languageCode);
  }

  selectLanguage(languageName: string) {
    this.openLanguageSelector();
    cy.get(this.selectors.languageDropdown)
      .contains(this.selectors.languageItem, languageName)
      .click();
    cy.wait(1000); // Wait for language change
    return this;
  }

  verifyLanguageCode(expectedCode: string) {
    this.getLanguageCode().should('have.text', expectedCode);
    return this;
  }

  verifyLocalStorageLanguage(expectedCode: string) {
    cy.window().then((win) => {
      expect(win.localStorage.getItem('preferredLanguage')).to.equal(expectedCode);
    });
    return this;
  }

  verifyHtmlLangAttribute(expectedLang: string) {
    cy.get('html').should('have.attr', 'lang', expectedLang);
    return this;
  }

  toggleTheme() {
    cy.get(this.selectors.themeToggle).click();
    return this;
  }
}