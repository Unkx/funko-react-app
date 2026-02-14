// cypress/e2e/debug.cy.ts
describe('Debug Login Page', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should show me the page structure', () => {
    // Take a screenshot first
    cy.screenshot('debug-login-page');
    
    // Log the entire HTML body (truncated)
    cy.get('body').invoke('html').then((html) => {
      console.log('Body HTML (first 1000 chars):', html.substring(0, 1000));
    });
    
    // Log all elements with their types
    cy.get('*').then(($elements) => {
      console.log('Total elements on page:', $elements.length);
      
      // Log specific elements
      const elementTypes = {};
      $elements.each((index, el) => {
        const tagName = el.tagName.toLowerCase();
        elementTypes[tagName] = (elementTypes[tagName] || 0) + 1;
      });
      console.log('Element counts:', elementTypes);
    });
    
    // Check for forms
    cy.get('form').then(($forms) => {
      console.log('Number of forms:', $forms.length);
      if ($forms.length > 0) {
        cy.get('form').each(($form, index) => {
          console.log(`Form ${index}:`, $form.html().substring(0, 500));
        });
      }
    });
    
    // Check for inputs
    cy.get('input').then(($inputs) => {
      console.log('Number of inputs:', $inputs.length);
      $inputs.each((index, input) => {
        console.log(`Input ${index}:`, {
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          id: input.id,
          className: input.className
        });
      });
    });
    
    // Check for buttons
    cy.get('button').then(($buttons) => {
      console.log('Number of buttons:', $buttons.length);
      $buttons.each((index, button) => {
        console.log(`Button ${index}:`, {
          text: button.textContent?.trim(),
          type: button.type,
          className: button.className
        });
      });
    });
  });
});