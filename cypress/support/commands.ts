/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

// Type augmentation for custom commands
declare global {
	namespace Cypress {
		interface Chainable {
			tab(): Chainable<JQuery<HTMLElement>>;
		}
	}
}

// Focus-based `tab` command: moves focus to the next focusable element in document order
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
	return cy.document().then((doc) => {
		const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
		const focusables = Array.from(doc.querySelectorAll(focusableSelector)).filter((el: Element) => {
			const htmlEl = el as HTMLElement;
			return htmlEl.offsetParent !== null; // visible
		}) as HTMLElement[];

		const active = doc.activeElement as HTMLElement | null;
		let idx = active ? focusables.indexOf(active) : -1;
		const next = focusables[(idx + 1) % Math.max(1, focusables.length)];
		if (next) next.focus();
		return cy.wrap(next || null);
	});
});