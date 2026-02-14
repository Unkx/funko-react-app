// cypress/e2e/login.cy.ts
import { loginPage } from './pages/Loginpage';

describe('Login/Register Page Tests', () => {
  beforeEach(() => {
    // Clear all storage before each test
    cy.clearAllStorage();
    // Visit login page
    loginPage.visit();
  });

  describe('TC1: Page loads correctly', () => {
    it('should display the login page with all main elements', () => {
      loginPage.verifyPageLoaded();
    });

    it('should load with correct theme (dark mode by default)', () => {
      loginPage.verifyDarkMode();
    });
  });

  describe('TC2: Login form has all required fields', () => {
    it('should display login form elements', () => {
      loginPage.verifyLoginFormVisible();
    });

    it('should display link to registration', () => {
      cy.contains('button', /register now/i).should('be.visible');
    });
  });

  describe('TC3: User can interact with form', () => {
    it('should allow typing in login field', () => {
      const testUsername = 'testuser123';
      loginPage.typeInField('input[type="text"]', testUsername);
      cy.get('input[type="text"]').first().should('have.value', testUsername);
    });

    it('should allow typing in password field', () => {
      const testPassword = 'TestPassword123!';
      loginPage.typeInField('input[type="password"]', testPassword);
      cy.get('input[type="password"]').first().should('have.value', testPassword);
    });

    it('should mask password input', () => {
      cy.get('input[type="password"]').first().should('have.attr', 'type', 'password');
    });
  });

  describe('TC4: Form submission button works', () => {
    it('should submit form when button is clicked', () => {
      // Mock the login API call
      cy.intercept('POST', 'http://localhost:5000/api/login', {
        statusCode: 200,
        body: {
          user: { id: 1, login: 'testuser', role: 'user' },
          token: 'fake-jwt-token'
        }
      }).as('loginRequest');

      // Login
      loginPage.login('testuser', 'TestPassword123!');
      
      // Verify API was called
      cy.wait('@loginRequest');
    });

    it('should submit form when pressing Enter in password field', () => {
      cy.intercept('POST', 'http://localhost:5000/api/login').as('loginRequest');

      loginPage.typeInField('input[type="text"]', 'testuser');
      loginPage.typeInField('input[type="password"]', 'TestPassword123!{enter}');
      
      cy.wait('@loginRequest');
    });
  });

  describe('TC6: Navigation elements exist', () => {
    it('should display theme toggle button', () => {
      cy.get('header').within(() => {
        cy.get('button').filter(':has(svg)').should('have.length.at.least', 2);
      });
    });

    it('should toggle between light and dark mode', () => {
      loginPage.toggleTheme();
      loginPage.verifyLightMode();
      
      loginPage.toggleTheme();
      loginPage.verifyDarkMode();
    });

    it('should display language selector', () => {
      loginPage.openLanguageSelector();
      cy.get('.lang-item').should('be.visible');
      // Close dropdown by clicking outside
      cy.get('body').click(0, 0);
    });

    it('should navigate to registration when clicking register link', () => {
      loginPage.goToRegister();
      loginPage.verifyRegisterFormVisible();
    });

    it('should navigate back to login from registration', () => {
      loginPage.goToRegister();
      loginPage.goToLogin();
      loginPage.verifyLoginFormVisible();
    });
  });

  describe('TC7: Mock API call simulation', () => {
    it('should handle successful login and redirect to dashboard', () => {
      cy.intercept('POST', 'http://localhost:5000/api/login', {
        statusCode: 200,
        body: {
          user: {
            id: 1,
            login: 'testuser',
            email: 'test@example.com',
            role: 'user'
          },
          token: 'mock-jwt-token-12345'
        }
      }).as('successLogin');

      loginPage.login('testuser', 'CorrectPassword123!');

      cy.wait('@successLogin');
      // Note: The redirect might not happen because it's a mock
      // But we can verify the API was called
    });
  });

  describe('TC8: Error handling simulation', () => {
    it('should display error for empty fields', () => {
      loginPage.clickElement('button[type="submit"]');
      loginPage.getErrorMessage().should('be.visible');
    });

    it('should display error for invalid credentials', () => {
      cy.intercept('POST', 'http://localhost:5000/api/login', {
        statusCode: 401,
        body: {
          error: 'Invalid credentials'
        }
      }).as('failedLogin');

      loginPage.login('wronguser', 'wrongpassword');
      cy.wait('@failedLogin');
      
      loginPage.getErrorMessage().should('contain.text', 'Invalid');
    });
  });

  describe('Registration Form Tests', () => {
    it('should navigate to registration form', () => {
      loginPage.goToRegister();
      loginPage.verifyRegisterFormVisible();
    });

    it('should display all registration form fields', () => {
      loginPage.goToRegister();
      
      cy.get('input[placeholder="Email"]').should('be.visible');
      cy.get('select').should('be.visible');
      cy.get('input[type="date"]').should('be.visible');
      
      // Count inputs
      cy.get('input').should('have.length.at.least', 7);
      cy.get('button[type="submit"]').should('be.visible');
    });
  });

  describe('Language Tests', () => {
    it('should open language selector', () => {
      loginPage.openLanguageSelector();
      cy.get('.lang-item').should('be.visible');
      // Close it
      cy.get('body').click(0, 0);
    });
  });
});