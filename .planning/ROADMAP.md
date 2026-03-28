# Roadmap: Job Offer Email Automation

**Created:** 2026-03-25  
**Status:** Ready for planning

## Overview

- **Total Phases:** 6
- **Total Requirements:** 16
- **All v1 requirements covered:** ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Job Board Scraper | Scrape job listings from major boards | JOB-01, JOB-02, JOB-03 | 3 |
| 2 | AI Job Matching | Filter and match jobs to user profile | JOB-04, JOB-05 | 2 |
| 3 | Email Notifications | Send weekly digests via Gmail API | JOB-06, JOB-07 | 2 |
| 4 | Automation & Scheduling | Run on GitHub Actions weekly | JOB-08, JOB-09 | 2 |
| 5 | PDF Job Detection | Extract job postings from uploaded PDFs | PDF-01, PDF-02, PDF-03, PDF-04, PDF-05 | 5 |
| 6 | CV Database & Auto-Update | Auto-extract skills from CVs and update profile | CV-01, CV-02, CV-03, CV-04, CV-05 | 5 |

---

## Phase Details

### Phase 1: Job Board Scraper

**Goal:** Scrape job listings from major job boards (LinkedIn, Indeed, Glassdoor)

**Plans:** 5 plans

**Requirements:**
- JOB-01: Scrape LinkedIn job listings
- JOB-02: Scrape Indeed job listings
- JOB-03: Scrape Glassdoor job listings

**Success Criteria:**
1. Successfully retrieves job data from 3+ job boards
2. Handles anti-scraping measures (rate limiting, user agents)
3. Extracts job title, company, location, description, link

Plans:
- [x] 01-01-PLAN.md — Foundation: types, base scraper, rate limiter (2026-03-25)
- [x] 01-02-PLAN.md — Indeed scraper: HTTP+Cheerio strategy
- [x] 01-03-PLAN.md — LinkedIn scraper: Puppeteer+Stealth strategy
- [x] 01-04-PLAN.md — Glassdoor scraper + runner orchestration
- [x] 01-05-PLAN.md — Gap closure: Fix Puppeteer scraper data flow

---

### Phase 2: AI Job Matching

**Goal:** Filter and match jobs to user profile using AI

**Plans:** 3 plans

**Requirements:**
- JOB-04: Create user profile schema (skills, interests, location)
- JOB-05: Implement AI-powered job matching algorithm

**Success Criteria:**
1. User can define skills and preferences
2. Jobs are scored by relevance (>70% accuracy)

Plans:
- [x] 02-01-PLAN.md — UserProfile schema + TypeScript types (2026-03-26)
- [x] 02-02-PLAN.md — AI matching algorithm with weighted scoring (2026-03-26)
- [x] 02-03-PLAN.md — API endpoint for matched jobs (2026-03-26)

---

### Phase 3: Email Notifications

**Goal:** Send weekly email digests via Gmail API

**Requirements:**
- JOB-06: Integrate Gmail API for sending emails
- JOB-07: Format job digest as simple text email

**Success Criteria:**
1. Emails sent successfully via Gmail API
2. Email contains job list with links in simple format

**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md — Gmail API integration with OAuth2 authentication (2026-03-26)
- [x] 03-02-PLAN.md — Email template and job digest formatting (2026-03-26)

---

### Phase 4: Automation & Scheduling

**Goal:** Run on GitHub Actions weekly schedule

**Requirements:**
- JOB-08: Create GitHub Actions workflow for weekly execution
- JOB-09: Store and manage job history to avoid duplicates

**Success Criteria:**
1. Workflow runs automatically every week
2. Only new jobs are included in each digest

**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md — GitHub Actions workflow setup
- [ ] 04-02-PLAN.md — Job history management

---

### Phase 5: PDF Job Detection

**Goal:** Extract job postings from uploaded PDFs

**Plans:** 3 plans

**Requirements:**
- PDF-01: PDF upload and parsing
- PDF-02: Job extraction from text
- PDF-03: Integration with matching
- PDF-04: Integration with email
- PDF-05: Duplicate detection

**Success Criteria:**
1. User can upload PDF via API
2. System extracts job postings with title, company, description
3. Extracted jobs scored against user profile
4. PDF jobs included in email digests
5. No duplicate jobs from PDF vs scraping

Plans:
- [x] 05-01-PLAN.md — PDF parsing foundation (2026-03-28)
- [x] 05-02-PLAN.md — Upload API & duplicate detection (2026-03-28)
- [x] 05-03-PLAN.md — Integration with matching & email (2026-03-28)

---

### Phase 6: CV Database & Auto-Update Profile

**Goal:** Auto-extract skills from CV uploads and update user profile

**Plans:** 3 plans

**Requirements:**
- CV-01: Store CV uploads in database with versioning
- CV-02: Auto-extract skills, experience, education from CV PDFs
- CV-03: Update user profile automatically from CV data
- CV-04: Use updated profile for job scraping/matching
- CV-05: Track profile changes over time

**Success Criteria:**
1. User uploads CV PDF → system extracts skills/experience
2. UserProfile is automatically updated with extracted data
3. Job scraping uses updated profile for better matching
4. CV versions are stored with timestamps
5. User can view profile change history

Plans:
- [ ] 06-01-PLAN.md — CV upload API with versioning
- [ ] 06-02-PLAN.md — CV parsing & auto-extraction
- [ ] 06-03-PLAN.md — Profile history & integration

---

## Requirement Traceability

| ID | Description | Phase | Status |
|----|-------------|-------|--------|
| JOB-01 | Scrape LinkedIn | 1 | Complete |
| JOB-02 | Scrape Indeed | 1 | Complete |
| JOB-03 | Scrape Glassdoor | 1 | Complete |
| JOB-04 | User profile schema | 2 | Complete |
| JOB-05 | AI job matching | 2 | Complete |
| JOB-06 | Gmail API integration | 3 | Pending |
| JOB-07 | Email formatting | 3 | Pending |
| JOB-08 | GitHub Actions workflow | 4 | Pending |
| JOB-09 | Job history management | 4 | Pending |
| PDF-01 | PDF upload and parsing | 5 | Complete |
| PDF-02 | Job extraction from text | 5 | Complete |
| PDF-03 | Integration with matching | 5 | Complete |
| PDF-04 | Integration with email | 5 | Complete |
| PDF-05 | Duplicate detection | 5 | Complete |
| CV-01 | Store CV uploads with versioning | 6 | Planned |
| CV-02 | Auto-extract skills from CV | 6 | Planned |
| CV-03 | Update profile from CV data | 6 | Planned |
| CV-04 | Use profile for job matching | 6 | Planned |
| CV-05 | Track profile changes | 6 | Planned |

---
*Last updated: 2026-03-28*
