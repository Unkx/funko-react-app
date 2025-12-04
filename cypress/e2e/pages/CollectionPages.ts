export class CollectionPage {
  // Selectors adapted to real DashboardSite markup (labels/placeholders/text)
  private selectors = {
    // The filters toggle button shows text like "Filters" or translation
    filterToggleText: 'Filters',
    searchPlaceholder: 'Search by title', // partial match
  };

  // Actions
  toggleFilterPanel() {
    // Click the Filters button on the page (force in case of overlays)
    // Scope to <main> to avoid toggling a dashboard-mini 'Filters' button
    cy.get('main').contains('button', /Filters|Filtry|Filtres|Filter/i).click({ force: true });
    // Wait for filter panel to appear (label text is 'Condition')
    cy.contains('label', /Condition|Warunek|Condition|Zustand|Condición/i).should('be.visible');
    return this;
  }

  getFilterPanel() {
    // Locate the filter panel by the presence of the "Condition" label
    return cy.contains('label', 'Condition').closest('div');
  }

  getSearchInput() {
    return cy.get('input[placeholder*="Search by title"]');
  }

  selectConditionFilter(condition: string) {
    cy.contains('label', 'Condition').parent().find('select').select(condition);
    // Wait for filtering to apply
    cy.wait(500);
    return this;
  }

  selectSortBy(criteria: string) {
    cy.contains('label', 'Sort By').parent().find('select').select(criteria);
    // Wait for sorting to apply
    cy.wait(500);
    return this;
  }

  selectSortOrder(order: 'asc' | 'desc') {
    cy.contains('label', 'Order').parent().find('select').select(order);
    // Wait for sorting to apply
    cy.wait(500);
    return this;
  }

  getCollectionItems() {
    // Find the collection section header and then the grid inside that container
    // This avoids matching other `.grid` elements on the page (random/most-visited grids)
    return cy.contains('h2', /your collection|yourCollection|collection|twoja kolekcja|kolekcja/i)
      .closest('div')
      .find('.grid')
      .first()
      .children();
  }

  getAnimatedContainer() {
    // Use the main grid as an indication that collection view finished animating
    return cy.get('main .grid');
  }

  getLoadingSpinner() {
    return cy.contains(/loading/i);
  }
}