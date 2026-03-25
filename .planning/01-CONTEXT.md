# Phase 1 Context: Job Board Scraper

**Phase:** 1  
**Gathered:** 2026-03-25  
**Status:** Ready for planning

<domain>
## Phase Goal

Scrape job listings from major job boards (LinkedIn, Indeed, Glassdoor)

## Requirements

- JOB-01: Scrape LinkedIn job listings
- JOB-02: Scrape Indeed job listings
- JOB-03: Scrape Glassdoor job listings

## Success Criteria

1. Successfully retrieves job data from 3+ job boards
2. Handles anti-scraping measures (rate limiting, user agents)
3. Extracts job title, company, location, description, link

</domain>

<decisions>
## Implementation Decisions

### Rate Limiting & Politeness

- **Approach:** Conservative (Recommended)
  - 1 request per 5-10 seconds between requests
  - Random delays with jitter to appear human-like
  - Respect robots.txt directives
  - Rotate user-agents from common browser strings
- **On 429 errors:** Skip and continue, log failure, retry on next run
- **Rationale:** Long-term reliability over speed, avoid permanent blocks

### Data Structure

- **Core fields (Standard):**
  - title
  - company
  - location (normalized)
  - link (URL to job posting)
  - date posted
  - description (full text)
  - salary (if available)
- **Storage:** JSON files for intermediate storage
  - Easy to debug and inspect
  - File-based approach for Phase 1
- **Location normalization:** Yes
  - Standardize formats (e.g., "New York, NY" canonical form)
  - Important for AI matching in Phase 2
- **Output format:** Standardized JSON schema
  - Consistent structure across all job boards
  - Ready for AI matching phase

### Scraping Strategy (Inferred from decisions)

- Node.js with TypeScript (from project decisions)
- Likely need Puppeteer for LinkedIn (heavy JavaScript)
- Direct HTTP scraping may work for Indeed/Glassdoor
- Each board needs custom scraper logic

</decisions>

<specifics>
## Specific Ideas

### Technical Considerations

- **LinkedIn:** Requires Puppeteer or similar (heavy SPA)
- **Indeed:** May work with simple HTTP + Cheerio
- **Glassdoor:** Likely needs headless browser
- **Storage path:** `.data/jobs/raw/` for raw scrapes, `.data/jobs/normalized/` for processed
- **Logging:** Track which jobs were scraped, when, and any failures

### Anti-Scraping Measures

- Use `puppeteer-extra-plugin-stealth` or similar
- Rotate user-agents from pool of 10-20 common browsers
- Add random delay (5-10s base + 0-5s jitter)
- Consider using residential proxies if blocks persist (deferred - start without)

</specifics>

<canonical_refs>
## External References

- **puppeteer:** Headless Chrome for LinkedIn/Glassdoor scraping
- **axios + cheerio:** For simpler HTTP scraping (Indeed)
- **node-cron:** For scheduling (or rely on GitHub Actions)
- **robots.txt:** Each board's scraping policy must be respected

</canonical_refs>

<code_context>
## Code Context

**Project Status:** Greenfield (no existing code)

**Technology Stack:**
- Node.js with TypeScript (from PROJECT.md)
- No dependencies installed yet

**Integration Points:**
- Phase 2 (AI matching) expects standardized JSON input
- Phase 4 (Automation) will schedule this scraper via GitHub Actions
- Data flow: Scraper → JSON files → AI Matcher → Gmail

**File Structure (planned):**
```
/src
  /scrapers
    - linkedin.ts
    - indeed.ts
    - glassdoor.ts
  /types
    - job.ts
/data
  /jobs/raw
  /jobs/normalized
```

</code_context>

---
*Context gathered: 2026-03-25*  
*Next step: Planning phase*
