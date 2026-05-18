/// <reference types="cypress" />

describe('Upload Page', () => {
  beforeEach(() => {
    cy.navigateTo('/upload')
  })

  it('should display the page title', () => {
    cy.contains(/upload|cv|resume/i, { timeout: 10000 }).should('be.visible')
  })

  it('should render the dropzone', () => {
    cy.get('[data-testid="dropzone"]', { timeout: 10000 }).should('be.visible')
  })

  it('should show dropzone instructions', () => {
    cy.contains(/drag|drop|file|cv|pdf/i, { timeout: 10000 }).should('be.visible')
  })

  it('should show active drag visual state', () => {
    cy.get('[data-testid="dropzone"]', { timeout: 10000 }).trigger('dragover')
    cy.get('[data-testid="dropzone"][data-dragging="true"]', { timeout: 5000 }).should('exist')
    cy.get('[data-testid="dropzone"]').trigger('dragleave')
    cy.get('[data-testid="dropzone"][data-dragging="false"]', { timeout: 5000 }).should('exist')
  })

  it('should show processing state when file is selected', () => {
    // Mock the file upload response
    cy.intercept('POST', '/api/cv/upload', {
      statusCode: 200,
      body: { id: 'cv-123', filename: 'resume.pdf', status: 'processing' },
    }).as('uploadFile')

    // Upload a file via the dropzone
    cy.get('[data-testid="dropzone"]', { timeout: 10000 }).selectFile(
      {
        contents: Cypress.Buffer.from('fake PDF content'),
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
      },
      { action: 'drag-drop' }
    )
    cy.wait('@uploadFile')
    cy.contains(/processing|uploading|extracting/i, { timeout: 10000 }).should('be.visible')
  })

  it('should show extracted profile preview after processing', () => {
    // Mock the full upload + process flow
    cy.intercept('POST', '/api/cv/upload', {
      statusCode: 200,
      body: { id: 'cv-123', filename: 'resume.pdf', status: 'done' },
    }).as('uploadFile')

    cy.intercept('POST', '/api/cv/process', {
      statusCode: 200,
      body: {
        profile: {
          title: 'Senior Frontend Developer',
          skills: ['TypeScript', 'React', 'Node.js'],
          experience: '5+ years',
          location: 'Remote',
          interests: ['Web Development', 'SaaS'],
        },
      },
    }).as('processCv')

    cy.get('[data-testid="dropzone"]', { timeout: 10000 }).selectFile(
      {
        contents: Cypress.Buffer.from('fake PDF content'),
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
      },
      { action: 'drag-drop' }
    )
    cy.wait('@uploadFile')

    // Should show profile preview
    cy.contains(/senior frontend developer|typescript|react/i, { timeout: 10000 }).should('be.visible')
  })

  it('should show error if file exceeds max size', () => {
    cy.intercept('POST', '/api/cv/upload', {
      statusCode: 413,
      body: { error: 'File too large. Maximum size is 10MB.' },
    }).as('uploadError')

    cy.get('[data-testid="dropzone"]', { timeout: 10000 }).selectFile(
      {
        contents: Cypress.Buffer.from('x'.repeat(11 * 1024 * 1024)), // 11MB
        fileName: 'large-resume.pdf',
        mimeType: 'application/pdf',
      },
      { action: 'drag-drop' }
    )
    cy.wait('@uploadError')
    cy.contains(/too large|maximum|size|error/i, { timeout: 10000 }).should('be.visible')
  })

  it('should show confirm and re-upload buttons after processing', () => {
    cy.intercept('POST', '/api/cv/upload', {
      statusCode: 200,
      body: { id: 'cv-123', filename: 'resume.pdf', status: 'done' },
    }).as('uploadFile')

    cy.intercept('POST', '/api/cv/process', {
      statusCode: 200,
      body: {
        profile: {
          title: 'Senior Frontend Developer',
          skills: ['TypeScript', 'React', 'Node.js'],
          experience: '5+ years',
        },
      },
    }).as('processCv')

    cy.get('[data-testid="dropzone"]', { timeout: 10000 }).selectFile(
      {
        contents: Cypress.Buffer.from('fake PDF content'),
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
      },
      { action: 'drag-drop' }
    )
    cy.wait('@uploadFile')

    cy.contains(/confirm|re.submit|upload again|re-upload/i, { timeout: 10000 }).should('be.visible')
  })
})
