# Roadmap: Job Offer Email Automation

**Created:** 2026-03-25  
**Status:** Ready for planning

## Overview

- **Total Phases:** 4
- **Total Requirements:** 6
- **All v1 requirements covered:** ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Job Board Scraper | Scrape job listings from major boards | JOB-01, JOB-02, JOB-03 | 3 |
| 2 | AI Job Matching | Filter and match jobs to user profile | JOB-04, JOB-05 | 2 |
| 3 | Email Notifications | Send weekly digests via Gmail API | JOB-06, JOB-07 | 2 |
| 4 | Automation & Scheduling | Run on GitHub Actions weekly | JOB-08, JOB-09 | 2 |

---

## Phase Details

### Phase 1: Job Board Scraper

**Goal:** Scrape job listings from major job boards (LinkedIn, Indeed, Glassdoor)

**Requirements:**
- JOB-01: Scrape LinkedIn job listings
- JOB-02: Scrape Indeed job listings  
- JOB-03: Scrape Glassdoor job listings

**Success Criteria:**
1. Successfully retrieves job data from 3+ job boards
2. Handles anti-scraping measures (rate limiting, user agents)
3. Extracts job title, company, location, description, link

---

### Phase 2: AI Job Matching

**Goal:** Filter and match jobs to user profile using AI

**Requirements:**
- JOB-04: Create user profile schema (skills, interests, location)
- JOB-05: Implement AI-powered job matching algorithm

**Success Criteria:**
1. User can define skills and preferences
2. Jobs are scored by relevance (>70% accuracy)

---

### Phase 3: Email Notifications

**Goal:** Send weekly email digests via Gmail API

**Requirements:**
- JOB-06: Integrate Gmail API for sending emails
- JOB-07: Format job digest as simple text email

**Success Criteria:**
1. Emails sent successfully via Gmail API
2. Email contains job list with links in simple format

---

### Phase 4: Automation & Scheduling

**Goal:** Run on GitHub Actions weekly schedule

**Requirements:**
- JOB-08: Create GitHub Actions workflow for weekly execution
- JOB-09: Store and manage job history to avoid duplicates

**Success Criteria:**
1. Workflow runs automatically every week
2. Only new jobs are included in each digest

---

## Requirement Traceability

| ID | Description | Phase | Status |
|----|-------------|-------|--------|
| JOB-01 | Scrape LinkedIn | 1 | Pending |
| JOB-02 | Scrape Indeed | 1 | Pending |
| JOB-03 | Scrape Glassdoor | 1 | Pending |
| JOB-04 | User profile schema | 2 | Pending |
| JOB-05 | AI job matching | 2 | Pending |
| JOB-06 | Gmail API integration | 3 | Pending |
| JOB-07 | Email formatting | 3 | Pending |
| JOB-08 | GitHub Actions workflow | 4 | Pending |
| JOB-09 | Job history management | 4 | Pending |

---
*Last updated: 2026-03-25 after roadmap creation*
