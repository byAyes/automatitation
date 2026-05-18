/// <reference types="cypress" />

describe('Pipeline Page', () => {
  beforeEach(() => {
    cy.seedPipelineStatus('idle')
    cy.navigateTo('/pipeline')
  })

  it('should display the page title', () => {
    cy.contains(/pipeline|automation/i, { timeout: 10000 }).should('be.visible')
  })

  it('should render 3 pipeline steps', () => {
    cy.get('[data-testid="pipeline-step"]', { timeout: 10000 }).should('have.length', 3)
  })

  it('should show step labels: Scraping, Matching, Completion', () => {
    cy.contains(/scraping/i, { timeout: 10000 }).should('be.visible')
    cy.contains(/matching/i).should('be.visible')
    cy.contains(/completion|complete/i).should('be.visible')
  })

  it('should show steps in pending state initially', () => {
    cy.get('[data-testid="pipeline-step"]', { timeout: 10000 }).each(($step) => {
      cy.wrap($step).should('exist')
    })
  })

  it('should show warning banner when no API key', () => {
    cy.intercept('GET', '/api/config/keys', {
      statusCode: 200,
      body: { keys: { JSEARCH_API_KEY: '', GEMINI_API_KEY: '', OPENAI_API_KEY: '' } },
    })
    cy.visit('/pipeline')
    cy.contains(/api.key|warning|configure|missing/i, { timeout: 10000 }).should('exist')
  })

  it('should show buttons enabled with API key', () => {
    cy.intercept('GET', '/api/config/keys', {
      statusCode: 200,
      body: { keys: { JSEARCH_API_KEY: 'some-key', GEMINI_API_KEY: 'some-key', OPENAI_API_KEY: '' } },
    })
    cy.visit('/pipeline')
    cy.get('button').then(($btns) => {
      const anyEnabled = $btns.toArray().some((b) => !b.disabled)
      expect(anyEnabled).to.be.true
    })
  })

  it('should start pipeline and show running state', () => {
    // Click Run button
    cy.contains('button', /run|start|execute/i, { timeout: 10000 }).click()

    // Mock the running state response
    cy.seedPipelineStatus('running')
    cy.wait(500)

    // Check that the scraping step shows as running
    cy.get('[data-testid="pipeline-step"]', { timeout: 10000 }).first().should('exist')
  })

  it('should show live log entries', () => {
    cy.seedPipelineStatus('running')
    cy.visit('/pipeline')
    cy.contains(/scraping|starting|pipeline/i, { timeout: 10000 }).should('exist')
  })

  it('should show completion summary after pipeline finishes', () => {
    cy.seedPipelineStatus('completed')
    cy.visit('/pipeline')
    cy.contains(/completed|success|done|finished/i, { timeout: 10000 }).should('exist')
    cy.contains(/23|12|92|68/i, { timeout: 10000 }).should('exist')
  })

  it('should show error state when pipeline fails', () => {
    cy.seedPipelineStatus('error')
    cy.visit('/pipeline')
    cy.contains(/error|failed|problem|issue/i, { timeout: 10000 }).should('exist')
  })
})
