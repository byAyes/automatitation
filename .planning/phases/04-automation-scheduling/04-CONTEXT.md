# Phase 04: Automation & Scheduling - Context

**Gathered:** 2026-03-26  
**Status:** Ready for planning  
**Source:** Roadmap requirements + User discussion

<domain>
## Phase Boundary

This phase delivers:
1. GitHub Actions workflow for weekly automated execution
2. Job history management to avoid duplicate emails
3. Error handling with partial success support
4. Logging infrastructure for debugging

What this phase does NOT deliver:
- User interface for managing schedules (CLI/GitHub only)
- Real-time job matching (batch processing only)
- Multi-user scheduling (single user for now)
- Advanced retry logic beyond basic retry attempts

</domain>

<decisions>
## Implementation Decisions

### 1. GitHub Actions Workflow Configuration

**Schedule:**
- **Timing:** Every Thursday at 9:00 AM UTC (5:00 AM EST, good for weekly digest)
- **Timeout:** 30 minutes (sufficient for scraping 3 boards + matching + email)
- **Retry strategy:** 3 attempts with 6-minute delays between retries
- **Branch:** Run on `main` branch only

**Workflow Structure:**
```yaml
name: Weekly Job Email Automation
on:
  schedule:
    - cron: '0 9 * * 4' # Thursday 9 AM UTC
  workflow_dispatch: # Manual trigger for testing
```

### 2. Job History & Deduplication Strategy

**Storage:** Evaluate Supabase as alternative to current Prisma/PostgreSQL setup
- Current: Prisma with PostgreSQL (Phase 02)
- Option: Supabase for managed PostgreSQL with better free tier
- Decision point: Keep existing PostgreSQL or migrate to Supabase

**Deduplication:**
- **Key:** Job URL only (fastest, simplest)
- **Mechanism:** Check URL exists in database before including in digest
- **Tracking:** Mark jobs as "emailed" in database after successful send

**Retention:**
- **Policy:** 3 months (12 weeks of weekly digests)
- **Cleanup:** Remove jobs older than 3 months from history
- **Rationale:** Enough for weekly digests, prevents unbounded growth

**New Job Detection:**
- Track which jobs have been emailed via `emailedAt` timestamp
- Only include jobs where `emailedAt` is null or older than last digest
- Prevents re-sending same jobs in future weeks

### 3. Email Digest Content & Frequency

**Scope:** All matched jobs from last 7 days above 70% threshold (from Phase 02)

**Frequency:** Strictly weekly (Thursday 9 AM UTC)

**Max jobs:** No cap initially — send all matches above threshold

### 4. Error Handling & Notifications

**Failure Alerts:**
- Use GitHub Actions default email notifications
- No additional notification system needed for Phase 04

**Partial Failures:**
- Send digest with available jobs if some scrapers fail
- Log which scrapers failed for debugging
- Don't block entire digest for partial scraper failures

**Logging Level:**
- **Full debug logs** for future improvements:
  - Scraper timing and success/failure per board
  - Number of jobs scraped per source
  - Matching scores distribution
  - Email send status
- Logs stored in GitHub Actions artifacts (retained 30 days)

**Recovery Strategy:**
- **Start fresh** on failure — no stateful resume
- Re-scrape all job boards on next run
- Simplest approach, avoids complex state management

</decisions>

<specifics>
## Specific Implementation Details

### GitHub Actions Workflow File
Location: `.github/workflows/weekly-job-email.yml`

Key steps:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run scrapers (all 3 boards)
5. Run job matching
6. Send email digest
7. Upload logs as artifact

### Database Schema Additions
```prisma
model Job {
  // ... existing fields
  emailedAt DateTime?
  createdAt DateTime @default(now())
}

model EmailDigest {
  id        String   @id @default(uuid())
  sentAt    DateTime @default(now())
  jobCount  Int
  jobs      Job[]
}
```

### Supabase Evaluation Criteria
If migrating to Supabase:
- Free tier limits (500MB database, 50k rows)
- Connection pooling for GitHub Actions
- Migration complexity from current setup
- Environment variable changes required

</specifics>

<code_context>
## Code Context

**Project Status:** 3 phases complete (10/10 plans)

**Existing Assets:**
- `src/scrapers/` — Job board scrapers (LinkedIn, Indeed, Glassdoor)
- `src/matching/` — Job matching scorer with weighted algorithm
- `src/lib/email/` — Gmail API client and email template
- `src/app/api/match-jobs/` — API endpoint for matched jobs
- Prisma ORM with PostgreSQL (Phase 02)

**Integration Points:**
- Scraper output → Job matching → Email template → Gmail API
- All components built and tested individually
- Phase 04 orchestrates full pipeline

**File Structure (planned):**
```
.github/workflows/
  weekly-job-email.yml
src/
  automation/
    scheduler.ts       # Main orchestration
    job-history.ts     # Deduplication logic
    logger.ts          # Logging utilities
prisma/
  schema.prisma        # Add emailedAt, EmailDigest
```

**Environment Variables Needed:**
- `DATABASE_URL` (existing)
- `GMAIL_RECIPIENT` (existing)
- `GOOGLE_CLIENT_ID` (existing)
- `GOOGLE_CLIENT_SECRET` (existing)
- `SUPABASE_URL` (if migrating)
- `SUPABASE_KEY` (if migrating)

</code_context>

<deferred>
## Deferred Ideas

**Not in Phase 04 scope:**
- User interface for schedule management
- Real-time job matching (batch only)
- Multi-user support
- Advanced retry logic with exponential backoff
- Notification system beyond GitHub defaults
- Stateful recovery from failures
- Job analytics dashboard
- Click-through tracking

These may be added in future phases based on user feedback.

</deferred>

---

*Phase: 04-automation-scheduling*  
*Context gathered: 2026-03-26 via roadmap + user discussion*  
*Next step: Planning phase — create execution plans for GitHub Actions workflow and job history management*
