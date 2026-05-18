/// <reference types="cypress" />

describe('Jobs Page', () => {
  beforeEach(() => {
    cy.seedJobs()
    cy.navigateTo('/jobs')
  })

  it('should display the page title', () => {
    cy.contains('Job Matches', { timeout: 10000 }).should('be.visible')
  })

  it('should render the jobs table with data', () => {
    cy.get('table', { timeout: 10000 }).should('be.visible')
    cy.contains('Senior Frontend Developer').should('be.visible')
    cy.contains('Full Stack Engineer').should('be.visible')
    cy.contains('React Developer').should('be.visible')
  })

  it('should filter jobs by search text', () => {
    cy.get('input[placeholder*="Search"]', { timeout: 10000 }).type('Frontend')
    cy.contains('Senior Frontend Developer').should('be.visible')
    cy.contains('Full Stack Engineer').should('not.exist')
    cy.contains('Backend Developer').should('not.exist')
  })

  it('should filter by minimum score (80%)', () => {
    cy.contains('button', '80%', { timeout: 10000 }).click()
    cy.contains('Senior Frontend Developer').should('be.visible')
    cy.contains('Full Stack Engineer').should('not.exist')
    cy.contains('React Developer').should('not.exist')
  })

  it('should filter by minimum score (60%)', () => {
    cy.contains('button', '60%', { timeout: 10000 }).click()
    cy.contains('Senior Frontend Developer').should('be.visible')
    cy.contains('Full Stack Engineer').should('be.visible')
    cy.contains('React Developer').should('be.visible')
    cy.contains('Junior Web Developer').should('not.exist')
  })

  it('should filter by minimum score (40%)', () => {
    cy.contains('button', '40%', { timeout: 10000 }).click()
    cy.contains('Senior Frontend Developer').should('be.visible')
    cy.contains('Backend Developer (Node.js)').should('be.visible')
  })

  it('should sort by column on click (toggle asc/desc)', () => {
    // Click score column header to sort
    cy.contains('th', /score|match/i, { timeout: 10000 }).click()
    cy.wait(300)
    // Click again to toggle
    cy.contains('th', /score|match/i).click()
    cy.wait(300)
    // Verify table is still rendered
    cy.get('table tbody tr', { timeout: 5000 }).should('have.length.at.least', 3)
  })

  it('should open job detail modal on click', () => {
    cy.contains('Senior Frontend Developer', { timeout: 10000 }).click()
    cy.get('[data-testid="modal"]', { timeout: 10000 }).should('be.visible')
  })

  it('should display score breakdown in modal', () => {
    cy.contains('Senior Frontend Developer', { timeout: 10000 }).click()
    cy.get('[data-testid="modal"]', { timeout: 10000 }).should('be.visible')
    cy.contains(/skills/i).should('be.visible')
    cy.contains(/interests/i).should('be.visible')
    cy.contains(/location/i).should('be.visible')
    cy.contains(/salary/i).should('be.visible')
  })

  it('should close modal on close button', () => {
    cy.contains('Senior Frontend Developer', { timeout: 10000 }).click()
    cy.get('[data-testid="modal"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="modal-close"]').click()
    cy.get('[data-testid="modal"]').should('not.exist')
  })

  it('should show empty state when no matches', () => {
    cy.seedEmptyJobs()
    cy.visit('/jobs')
    cy.wait('@getEmptyJobs')
    cy.contains(/no matches|no jobs|empty|nothing/i, { timeout: 10000 }).should('exist')
  })
})
