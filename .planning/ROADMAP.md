# Roadmap: Job Offer Email Automation (Seahorse)

**Created:** 2026-03-25 · **Last updated:** 2026-05-15
**Repository:** [byAyes/SeaHorse](https://github.com/byAyes/SeaHorse)

---

## Overview

| # | Phase | Goal | Status | Issues |
|---|-------|------|--------|--------|
| 1 | Job Board Scraper | Scrape jobs from LinkedIn, Indeed, Glassdoor, Computrabajo, JSearch | ✅ **Complete** | — |
| 2 | AI Job Matching | Score jobs against user profile with weighted algorithm | ✅ **Complete** | — |
| 3 | Email Notifications | Send weekly digests with HTML template + emojis | ✅ **Complete** | — |
| 4 | Automation & Scheduling | GitHub Actions weekly pipeline | ✅ **Complete** | — |
| 5 | PDF Profile Extraction | Extract job profile from CV/PDF with Gemini AI | ✅ **Complete** | #7 ✅ |
| 6 | CV Database & Auto-Update | Persist CVs, profiles, job history in Supabase | 🔜 **Blocked** | #9 |
| 7 | Frontend UI Dashboard | React SPA for pipeline management | 🔜 **Planned** | #8 |

---

## Phase 1: Job Board Scraper ✅

**Goal:** Scrape job listings from multiple sources — web scrapers + API.

**Sources:**

| Scraper | Type | Status | Notes |
|---------|------|--------|-------|
| JSearch API | REST API | ✅ **Working** | ~10 jobs per run, free tier |
| Computrabajo | Python (Scrapling) | ✅ **Working** | ~10 jobs per run |
| Indeed | Python (Scrapling) | ⚠️ **Intermittent** | 403/blocking, fallback graceful |
| LinkedIn | Python (Scrapling) | ⚠️ **Intermittent** | Login wall/rate limits |
| Glassdoor | Python (Scrapling) | ⚠️ **Intermittent** | Anti-bot measures |

**Features:**
- ✅ Rate limiter with configurable delays
- ✅ Python subprocess bridge (`pythonBridge.ts`)
- ✅ HTTP fallback scraper for basic sites
- ✅ Configurable via `scrapers.yaml`
- ✅ Graceful degradation — failed scrapers don't crash the pipeline

---

## Phase 2: AI Job Matching ✅

**Goal:** Score jobs against user profile for relevance.

**Algorithm — Weighted scoring:**

| Factor | Weight | Source |
|--------|--------|--------|
| Skills match | **40%** | CV extracted skills vs job description |
| Interests match | **30%** | Job titles/industry vs user interests |
| Location match | **20%** | Job location vs preferred locations + remote |
| Salary match | **10%** | Job salary vs min/max range |

**Features:**
- ✅ `calculateMatchScore()` in `src/matching/scorer.ts`
- ✅ Individual matchers: skill, interest, location, salary
- ✅ Scores are **honest** — no more fake `score: 100`
- ✅ `matchJobs()` in `src/matching/cvMatcher.ts`
- ✅ Profile built from CV extraction (skills, titles, locations, level)
- ✅ API endpoint at `/api/match-jobs`

---

## Phase 3: Email Notifications ✅

**Goal:** Send weekly job digest emails with rich HTML formatting.

**Email Providers:**

| Provider | Method | Status | Notes |
|----------|--------|--------|-------|
| **SMTP (Gmail)** | App Password | ✅ **Default** | HTML + CC support fixed |
| Resend | API | ✅ Available | Free tier (100/day) |
| Gmail API | OAuth2 | ✅ Available | Tokens refresh required |

**Features:**
- ✅ **Premium HTML template** with SVG icons and gradients
- ✅ **Emojis** throughout: 📬 header, 📊 stats, 🎯 scores, 🚀 CTA, 🐴💨 footer
- ✅ **Real match scores** displayed per job — no more fake 100%
- ✅ **Profile section**: skills, roles, location, languages
- ✅ **Stats cards**: Jobs Found, Avg Match, Best Match
- ✅ **Empty state**: friendly message with 😔🍀
- ✅ **CC support** via `EMAIL_CC` env var
- ✅ Provider routing via `EMAIL_PROVIDER` env var (lazy init)

---

## Phase 4: Automation & Scheduling ✅

**Goal:** Run the full pipeline on a schedule without manual intervention.

**Infrastructure:**

| Component | Detail | Status |
|-----------|--------|--------|
| GitHub Actions | `.github/workflows/main.yml` | ✅ **Running** |
| Trigger | Push to `main` + weekly cron (Thu 9 AM UTC) | ✅ |
| Email provider | SMTP (Gmail App Password) via secrets | ✅ Configurado |
| Python deps | `scrapers/requirements.txt` | ✅ |
| Browser | Chrome/Chromium install step | ✅ |
| Paths filter | `.github/workflows/**` included | ✅ Fixed |

**Pipeline flow:**
```
Trigger → Install deps → Run scraper → Match jobs → Send email → Cleanup
```

**Recent fixes:**
- ✅ SMTP provider now sends HTML (was plain text only)
- ✅ CI switched from Resend to SMTP (more reliable)
- ✅ Workflow path filter added (changes to `.github/workflows` now trigger runs)
- ✅ Secrets mapped: SMTP_HOST/PORT/USER/PASSWORD/FROM

---

## Phase 5: PDF Profile Extraction ✅ *(formerly "PDF Job Detection")*

**Goal:** Extract user profile from uploaded CV/PDF to drive intelligent job scraping.

**Feature:** `AI PDF profile extraction for intelligent job scraping` — **Closed** ✅

| Component | File | Status |
|-----------|------|--------|
| Gemini AI extraction | `src/lib/ai/pdfProfileExtractor.ts` | ✅ Gemini Flash |
| Keyword fallback | `src/lib/ai/pdfProfileExtractor.ts` | ✅ When AI unavailable |
| Scrape strategy builder | `src/lib/ai/scrapeStrategy.ts` | ✅ Queries from profile |
| PDF parsing | `src/lib/pdf/pdfParser.ts` | ✅ |
| Pipeline integration | `src/automation/orchestrator.ts` | ✅ |
| Pipeline entry script | `scripts/run-profile-pipeline.ts` | ✅ |

**Extracted profile fields:**
- ✅ Job titles (career targets)
- ✅ Skills (technical + soft)
- ✅ Preferred locations
- ✅ Experience level (junior/mid/senior)
- ✅ Languages
- ✅ Scrape queries built from profile

**Last pipeline run:** 20 jobs scraped, scored with real scores, sent via SMTP ✅

---

## Phase 6: CV Database & Auto-Update 🔜

**Goal:** Persist all data in Supabase (PostgreSQL) for history, dedup, and dashboard.

**Status:** ⏸️ **Deferred** — Blocked by Supabase connectivity from Windows (IPv6 hostname issue).

**Issue:** [#9 — Integración Supabase](https://github.com/byAyes/SeaHorse/issues/9)

| Requirement | Status | Depends on |
|-------------|--------|------------|
| CV-01: Store CVs with versioning | 🔜 Planned | #9 |
| CV-02: Auto-extract skills from CV | ✅ **Done in #7** | — |
| CV-03: Update profile from CV | ✅ **Done in #7** | — |
| CV-04: Use profile for matching | ✅ **Done in #7** | — |
| CV-05: Track profile changes | 🔜 Planned | #9 |

**Current workaround:** Mock Prisma client via JavaScript Proxy that returns empty/safe defaults:
- `findMany → []` · `findFirst → null` · `create → { id: 'mock-id' }`
- Pipeline runs without DB — data lost between executions

**To unblock:**
1. Research Supabase IPv6 connectivity from Windows
2. Configure `DATABASE_URL` with `sslmode=require`
3. Run `npx prisma migrate dev`
4. Swap mock client for real `PrismaClient`
5. Add `DATABASE_URL` as GitHub secret

**Schema ready (4 models + 1 changelog):**
- `UserProfile` — profile with scoring weights
- `Job` — scraped jobs (unique by URL)
- `EmailDigest` — sent digest records
- `CV` — versioned CV uploads
- `ProfileChangeLog` — audit trail

---

## Phase 7: Frontend UI Dashboard 🔜

**Goal:** React SPA to manage the pipeline visually — no more CLI/`.env` config.

**Issue:** [#8 — Frontend UI Dashboard](https://github.com/byAyes/SeaHorse/issues/8)

**Blocked by:** #9 (Supabase) — dashboard needs real data

**Planned features:**
- 📄 PDF drag & drop upload zone
- 📧 Email configuration form (SMTP, destination, CC)
- 📊 Dashboard with job stats, scores, history
- ⚡ Manual pipeline trigger with progress bar
- 💼 Job table with filters and scores
- ⚙️ Settings (API keys, profile management)
- 🌙 Dark/light mode
- 🎬 Animations with Framer Motion

**Tech stack:**
- Vite + React 19 · Tailwind v4 · Zustand · TanStack Query · Recharts
- Design skills: `UI-UIX PRO MAX` · `SUPERPOWERS` · `FRONTEND-DESING`

---

## Issues Overview

| # | Title | State | Phase |
|---|-------|-------|-------|
| **9** | [BACKEND] Integración Supabase | 🟢 **Open** | Phase 6 |
| **8** | [FEATURE] Frontend UI Dashboard | 🟢 **Open** | Phase 7 |
| **7** | [FEATURE] AI PDF profile extraction | 🔵 **Closed** ✅ | Phase 5 |
| **6** | [DEFERRED] process-cv pipeline | 🔵 **Closed** — absorbed | Phase 6 |

---

## Requirement Traceability

| ID | Description | Phase | Status |
|----|-------------|-------|--------|
| JOB-01 | Scrape LinkedIn | 1 | ✅ Complete |
| JOB-02 | Scrape Indeed | 1 | ✅ Complete |
| JOB-03 | Scrape Glassdoor | 1 | ✅ Complete |
| JOB-04 | User profile schema | 2 | ✅ Complete |
| JOB-05 | AI job matching | 2 | ✅ Complete |
| JOB-06 | Email integration (SMTP/Resend/Gmail) | 3 | ✅ Complete |
| JOB-07 | Email formatting (HTML + emojis + scores) | 3 | ✅ Complete |
| JOB-08 | GitHub Actions workflow | 4 | ✅ Complete |
| JOB-09 | Job history management | 4 | 🔜 Blocked by #9 |
| PDF-01 | PDF upload and parsing | 5 | ✅ Complete |
| PDF-02 | Profile extraction from text | 5 | ✅ Complete |
| PDF-03 | Integration with matching | 5 | ✅ Complete |
| PDF-04 | Integration with email | 5 | ✅ Complete |
| PDF-05 | Duplicate detection | 5 | ✅ Complete |
| CV-01 | Store CVs with versioning | 6 | 🔜 Planned (#9) |
| CV-02 | Auto-extract skills from CV | 6 | ✅ Complete (in #7) |
| CV-03 | Update profile from CV data | 6 | ✅ Complete (in #7) |
| CV-04 | Use profile for job matching | 6 | ✅ Complete (in #7) |
| CV-05 | Track profile changes | 6 | 🔜 Planned (#9) |
| UI-01 | React frontend dashboard | 7 | 🔜 Planned (#8) |

---

## Tech Stack Summary

| Layer | Technology | Status |
|-------|-----------|--------|
| Runtime | TypeScript (CommonJS) + tsx | ✅ |
| Scrapers | Python (Scrapling) + JSearch API | ✅ |
| AI | Gemini Flash + keyword fallback | ✅ |
| Scoring | Weighted (40/30/20/10) | ✅ |
| Email | SMTP · Resend · Gmail API | ✅ |
| CI/CD | GitHub Actions (weekly + push) | ✅ |
| Database | Supabase/PostgreSQL (Prisma) | 🔜 #9 |
| Frontend | React 19 · Vite · Tailwind v4 | 🔜 #8 |

---

*Maintained by AI assistant — last updated 2026-05-15*
