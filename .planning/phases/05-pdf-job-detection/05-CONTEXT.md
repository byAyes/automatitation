# Context: PDF Job Detection Feature

## User Request
"agrega una funcionalidad para que yo suba un pdf tu detectes todos los trabajos posibles con eso y despues usas la funcionalidad que tenemos para el scraping y envio de correos"

Translation: Add functionality to upload a PDF, detect all possible jobs from it, then use existing scraping and email sending functionality.

## Feature Overview
This feature enables users to upload PDF documents containing job postings, automatically parse and extract job information, then integrate with the existing job matching and email notification system.

## Use Cases
1. **PDF Upload**: User uploads a PDF with job postings (e.g., from job fairs, company websites, recruitment agencies)
2. **Job Extraction**: System parses PDF text and extracts job postings with structured data
3. **Integration**: Extracted jobs flow into existing matching algorithm and email workflow

## Technical Requirements
- PDF parsing library (pdf-parse, pdfjs-dist, or similar)
- Text extraction and cleaning
- Job posting detection and structuring
- Integration with existing UserProfile and Job models
- Connection to existing email sending pipeline

## Existing Infrastructure to Leverage
- **Job Model**: Already defined in Prisma schema
- **Matching System**: Phase 2 scoring system can match extracted jobs
- **Email System**: Phase 3 Gmail API integration for notifications
- **Scheduler**: Phase 4 automation for processing uploaded PDFs

## Success Criteria
1. User can upload PDF via API endpoint
2. System extracts job postings with title, company, description, requirements
3. Extracted jobs are scored against user profile
4. Matched jobs included in weekly email digest
5. No duplicate jobs from PDF vs scraping sources

---
*Created: 2026-03-28*
