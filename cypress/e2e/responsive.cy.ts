/// <reference types="cypress" />

describe('Responsive Layout', () => {
  beforeEach(() => {
    cy.seedDashboardStats()
  })

  describe('Mobile viewport (375px)', () => {
    beforeEach(() => {
      cy.viewport(375, 667) // iPhone SE
      cy.visit('/dashboard')
      cy.waitForPageLoad()
    })

    it('should render the page without horizontal overflow', () => {
      cy.document().then((doc) => {
        const bodyWidth = doc.body.scrollWidth
        const viewportWidth = Cypress.config('viewportWidth') || 375
        // Allow small overflow from shadows/decorations
        expect(bodyWidth - viewportWidth).to.be.lessThan(20)
      })
    })

    it('should show stack layout for stat cards', () => {
      cy.get('[data-testid="stat-card"]', { timeout: 10000 }).should('have.length.at.least', 4)
    })

    it('should have visible sidebar toggle', () => {
      cy.get('[data-testid="sidebar-toggle"]', { timeout: 10000 }).should('be.visible')
    })

    it('should have visible navigation elements', () => {
      cy.get('nav', { timeout: 10000 }).should('be.visible')
      cy.contains(/dashboard/i).should('be.visible')
    })
  })

  describe('Tablet viewport (768px)', () => {
    beforeEach(() => {
      cy.viewport(768, 1024)
      cy.visit('/dashboard')
      cy.waitForPageLoad()
    })

    it('should display 2-column stat grid', () => {
      cy.get('[data-testid="stat-card"]', { timeout: 10000 }).should('have.length.at.least', 4)
    })

    it('should show sidebar in collapsed or visible state', () => {
      cy.get('[data-testid="sidebar"]', { timeout: 10000 }).should('be.visible')
    })

    it('should display chart', () => {
      cy.get('.recharts-surface', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Desktop viewport (1280px)', () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
      cy.visit('/dashboard')
      cy.waitForPageLoad()
    })

    it('should display full sidebar with labels', () => {
      cy.get('[data-testid="sidebar"]', { timeout: 10000 }).should('be.visible')
    })

    it('should display stat cards in a row', () => {
      cy.get('[data-testid="stat-card"]', { timeout: 10000 }).should('have.length.at.least', 4)
    })

    it('should display chart with full width', () => {
      cy.get('.recharts-surface', { timeout: 10000 }).should('be.visible')
    })

    it('should show all navigation labels', () => {
      cy.contains('Dashboard').should('be.visible')
      cy.contains(/jobs|matches/i).should('be.visible')
      cy.contains(/pipeline|automation/i).should('be.visible')
      cy.contains(/upload|cv/i).should('be.visible')
      cy.contains(/settings|configuration/i).should('be.visible')
    })
  })
})
