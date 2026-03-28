# Phase 5: PDF Job Detection

**Goal:** Enable users to upload PDF documents containing job postings, automatically extract job information, and integrate with existing matching and email systems

**Plans:** 3 plans

**Requirements:**
- PDF-01: PDF upload and parsing functionality
- PDF-02: Job posting extraction from parsed text
- PDF-03: Integration with existing job matching system
- PDF-04: Integration with email notification workflow
- PDF-05: Duplicate detection (PDF vs scraped jobs)

**Success Criteria:**
1. User can upload PDF via API endpoint
2. System extracts structured job data from PDFs (title, company, description, requirements)
3. Extracted jobs are scored against user profile using existing matching algorithm
4. Matched jobs from PDFs included in weekly email digests
5. Duplicate detection prevents same job appearing twice

---

## Plans:

- [ ] 05-01-PLAN.md — PDF parsing and job extraction foundation (types, parser, extractor)
- [ ] 05-02-PLAN.md — PDF upload API endpoint and duplicate detection
- [ ] 05-03-PLAN.md — Integration with matching system and email workflow
