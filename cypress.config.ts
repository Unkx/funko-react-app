import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Ustaw baseUrl na twój lokalny serwer React
    baseUrl: 'http://localhost:5173', // aktualny port Vite
    
    // Zwiększ timeouty
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    
    // Włącz video i screenshots dla debugowania
    video: true,
    screenshotOnRunFailure: true,
    
    // Support file
    supportFile: 'cypress/support/e2e.ts',
    
    // Spec pattern
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    setupNodeEvents(on, config) {
      // Możesz dodać event listeners tutaj
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
      
      return config;
    },
  },
});