/// <reference types="cypress" />

describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.seedDashboardStats()
    cy.navigateTo('/dashboard')
  })

  it('should display the page title', () => {
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible')
  })

  it('should render 4 stat cards', () => {
    cy.get('[data-testid="stat-card"]', { timeout: 10000 }).should('have.length.at.least', 4)
  })

  it('should display total jobs stat', () => {
    cy.contains('47', { timeout: 10000 }).should('be.visible')
  })

  it('should display today jobs count', () => {
    cy.contains('5', { timeout: 10000 }).should('be.visible')
  })

  it('should display matches count', () => {
    cy.contains('12', { timeout: 10000 }).should('be.visible')
  })

  it('should display the trend chart', () => {
    // Recharts renders as SVG with .recharts-surface
    cy.get('.recharts-surface', { timeout: 10000 }).should('be.visible')
  })

  it('should show recent matches list', () => {
    cy.contains('Senior Frontend Developer', { timeout: 10000 }).should('be.visible')
    cy.contains('Full Stack Engineer').should('be.visible')
    cy.contains('React Developer').should('be.visible')
  })

  it('should show match score badges', () => {
    cy.contains('92%').should('be.visible')
    cy.contains('78%').should('be.visible')
    cy.contains('65%').should('be.visible')
  })

  it('should navigate to jobs page via quick action', () => {
    cy.contains('View All', { timeout: 10000 }).click()
    cy.url({ timeout: 10000 }).should('include', '/jobs')
  })

  it('should navigate to upload page via quick action', () => {
    cy.contains('Upload CV', { timeout: 10000 }).click()
    cy.url({ timeout: 10000 }).should('include', '/upload')
  })

  it('should navigate to pipeline page via quick action', () => {
    cy.contains('Run Pipeline', { timeout: 10000 }).click()
    cy.url({ timeout: 10000 }).should('include', '/pipeline')
  })

  it('should show top skills section', () => {
    cy.contains('TypeScript', { timeout: 10000 }).should('be.visible')
    cy.contains('React').should('be.visible')
    cy.contains('Node.js').should('be.visible')
  })

  it('should show empty state when no stats data', () => {
    cy.intercept('GET', '/api/stats', {
      statusCode: 200,
      body: { totalJobs: 0, todayJobs: 0, matches: 0, matchRate: 0, trend: [], topSkills: [], recentMatches: [] },
    }).as('getEmptyStats')
    cy.visit('/dashboard')
    cy.wait('@getEmptyStats')
    cy.contains(/no data|no stats|empty|0 jobs/i, { timeout: 10000 }).should('exist')
  })
})
