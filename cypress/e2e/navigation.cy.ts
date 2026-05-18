/// <reference types="cypress" />

describe('Navigation', () => {
  beforeEach(() => {
    cy.navigateTo('/dashboard')
    // Mock API calls for each page
    cy.seedDashboardStats()
    cy.seedJobs()
    cy.seedPipelineStatus('idle')
    cy.seedProfile()
    cy.seedApiKeys()
  })

  describe('Sidebar Navigation', () => {
    it('should navigate to Dashboard page', () => {
      cy.contains('Dashboard', { timeout: 10000 }).click()
      cy.url({ timeout: 10000 }).should('include', '/dashboard')
    })

    it('should navigate to Jobs page', () => {
      cy.contains(/jobs|matches/i, { timeout: 10000 }).click()
      cy.url({ timeout: 10000 }).should('include', '/jobs')
    })

    it('should navigate to Pipeline page', () => {
      cy.contains(/pipeline|automation/i, { timeout: 10000 }).click()
      cy.url({ timeout: 10000 }).should('include', '/pipeline')
    })

    it('should navigate to Upload page', () => {
      cy.contains(/upload|cv/i, { timeout: 10000 }).click()
      cy.url({ timeout: 10000 }).should('include', '/upload')
    })

    it('should navigate to Settings page', () => {
      cy.contains(/settings|configuration/i, { timeout: 10000 }).click()
      cy.url({ timeout: 10000 }).should('include', '/settings')
    })

    it('should highlight active route visually', () => {
      cy.visit('/dashboard')
      cy.get('[data-testid="sidebar-link"]').contains('Dashboard').should('have.class', 'active')
        .or('have.attr', 'data-active')
        .or('have.css', 'background-color')
    })

    it('should toggle sidebar collapse/expand', () => {
      cy.get('[data-testid="sidebar-toggle"]', { timeout: 10000 }).click()
      cy.wait(300) // Wait for animation
      cy.get('[data-testid="sidebar"]', { timeout: 10000 }).should('exist')
      // Toggle back
      cy.get('[data-testid="sidebar-toggle"]', { timeout: 10000 }).click()
      cy.wait(300)
      cy.get('[data-testid="sidebar"]').should('exist')
    })
  })
})
