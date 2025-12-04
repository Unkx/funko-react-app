export class LoginPage {
  // Selectors
  private selectors = {
    // The app's login form doesn't include data-testids.
    // Use structural selectors that target the login form inputs and submit button.
    usernameInput: 'form input[type="text"]',
    passwordInput: 'form input[type="password"]',
    loginButton: 'form button[type="submit"]',
    errorMessage: 'form .text-red-500'
  };

  // Actions
  visit() {
    cy.visit('/loginregistersite');
    return this;
  }

  login(username: string, password: string) {
    // Use force in case animations or decorative SVGs overlap inputs in the UI during tests
    cy.get(this.selectors.usernameInput).clear({ force: true }).type(username, { force: true });
    cy.get(this.selectors.passwordInput).clear({ force: true }).type(password, { force: true });
    cy.get(this.selectors.loginButton).click({ force: true });
    return this;
  }

  getErrorMessage() {
    return cy.get(this.selectors.errorMessage);
  }
}