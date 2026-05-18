/// <reference types="cypress" />

describe('Settings Page', () => {
  beforeEach(() => {
    cy.seedProfile()
    cy.seedApiKeys()
    cy.navigateTo('/settings')
  })

  it('should display the page title', () => {
    cy.contains(/settings|configuration/i, { timeout: 10000 }).should('be.visible')
  })

  it('should load profile form with existing data', () => {
    cy.contains('Senior Frontend Developer', { timeout: 10000 }).should('be.visible')
    cy.contains('TypeScript').should('be.visible')
    cy.contains('React').should('be.visible')
  })

  it('should display API keys section', () => {
    cy.contains(/api.key|configuration|keys/i, { timeout: 10000 }).should('be.visible')
  })

  it('should toggle API key visibility', () => {
    cy.get('input[type="password"]', { timeout: 10000 }).should('exist')
    cy.contains(/show|reveal|toggle|eye/i, { timeout: 10000 }).click()
    cy.get('input[type="text"]', { timeout: 10000 }).should('exist')
    cy.contains(/hide|toggle|eye/i, { timeout: 10000 }).click()
    cy.get('input[type="password"]', { timeout: 10000 }).should('exist')
  })

  it('should display email configuration form', () => {
    cy.contains(/email|smtp|provider/i, { timeout: 10000 }).should('be.visible')
  })

  it('should change theme via selector', () => {
    cy.contains(/theme|appearance/i, { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="theme-toggle"]', { timeout: 10000 }).click().should('exist')
  })

  it('should display language selector', () => {
    cy.contains(/language|idioma/i, { timeout: 10000 }).should('be.visible')
  })

  it('should switch language to Spanish', () => {
    // Click Spanish language option
    cy.contains(/spanish|español/i, { timeout: 10000 }).click()
    // Verify the page text actually changed: "Language" (EN) should disappear,
    // "Idioma" (ES) should appear
    cy.contains('Language', { timeout: 5000 }).should('not.exist')
    cy.contains('Idioma', { timeout: 10000 }).should('be.visible')
  })

  it('should save profile and show toast', () => {
    // Mock save endpoint
    cy.intercept('PUT', '/api/profile/*', {
      statusCode: 200,
      body: { success: true },
    }).as('saveProfile')

    cy.intercept('POST', '/api/cv/update-profile', {
      statusCode: 200,
      body: { success: true },
    }).as('updateProfile')

    cy.contains('button', /save|guardar/i, { timeout: 10000 }).click()
    cy.checkToast(/saved|saved|success|guardado/i)
  })

  it('should save API keys and show toast', () => {
    cy.intercept('POST', '/api/config/keys', {
      statusCode: 200,
      body: { success: true },
    }).as('saveKeys')

    cy.contains(/save|guardar/i, { timeout: 10000 }).click()
    cy.checkToast(/saved|success|guardado|updated/i)
  })
})
