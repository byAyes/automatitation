# Phase 04: Cross-AI Peer Review

**Review Date:** 2026-03-27
**Phase:** 04-automation-scheduling
**Plans Reviewed:** 04-01-PLAN.md, 04-02-PLAN.md
**Reviewers:** Claude (Claude CLI)

---

## Reviewer: Claude (Claude CLI)

### Overall Assessment

**Critical architectural issues identified** in both plans that require resolution before implementation. Recommend addressing these issues in planning phase rather than discovering them during execution.

---

## Plan 04-01: Database Schema & Job History

### Architecture: ⚠️ CRITICAL FLAWS

**Major Issue: Database Schema Design**
- **Problem:** `emailedAt` field on Job model creates 1:1 relationship, but jobs can appear in multiple weekly digests
- **Impact:** Once a job is marked as emailed, it cannot appear in future digests even if relevant
- **Current Design:** Single flag `emailedAt` assumes each job sent exactly once
- **Real World:** Jobs often stay listed for weeks, user wants them in every digest until they expire

**Recommended Solution:**
```prisma
// Instead of: emailedAt DateTime?
// Use junction table:
model JobEmailStatus {
  id        String   @id @default(uuid())
  jobId     String
  job       Job      @relation(fields: [jobId], references: [id])
  digestId  String
  digest    EmailDigest @relation(fields: [digestId], references: [id])
  sentAt    DateTime @default(now())

  @@unique([jobId, digestId])
}
```

**Additional Architectural Concerns:**

1. **Race Conditions**
   - No mention of database locking for concurrent workflow runs
   - GitHub Actions could spawn multiple overlapping runs
   - Two workflows running simultaneously could send duplicate emails
   - **Missing:** `SELECT FOR UPDATE` or row-level locking strategy

2. **Database Indexes**
   - No indexing strategy defined for primary query paths
   - Key queries: `WHERE url = ?`, `WHERE emailedAt IS NULL`, `ORDER BY createdAt`
   - **Missing:** `@unique(url)`, `@index([emailedAt])`, `@index([createdAt])`
   - **Impact:** Performance degradation at scale

3. **Transaction Boundaries**
   - Functions (`filterNewJobs`, `markJobsAsEmailed`) are independent
   - Partial failures leave system in inconsistent state
   - **Example:** Job marked as emailed but email actually failed
   - **Missing:** Database transactions spanning multiple operations

4. **Deduplication Strategy**
   - URL-only deduplication is simplistic
   - **Problem:** Same job listed on multiple boards with different URLs
   - **Problem:** URL parameters, tracking codes create "different" URLs
   - **Recommended:** Composite key `(normalizedUrl, source, postedAt)`
   - **Missing:** URL normalization logic before deduplication

### Completeness: ⚠️ GAPS IDENTIFIED

**Critical Missing Elements:**

1. **Database Migration Strategy**
   - Assumes fresh database or `prisma db push` in production
   - **Missing:** Migration plan for existing databases from Phase 02
   - **Missing:** Backfill strategy for existing jobs without `emailedAt`
   - **Missing:** Rollback plan if migration fails

2. **Test Coverage Plan**
   - No test requirements specified
   - **Missing:** Unit tests for job-history.ts functions
   - **Missing:** Integration tests for deduplication logic
   - **Missing:** Database transaction tests
   - **Missing:** Race condition test scenarios

3. **Monitoring & Observability**
   - **Missing:** Metrics for: duplicate rate, cleanup rate, query performance
   - **Missing:** Alerting for: slow queries, deduplication failures, high duplication rates

4. **URL Normalization**
   - **Missing:** Standardization logic before deduplication
   - **Examples:**
     - `https://linkedin.com/jobs/123?utm=abc` vs `https://linkedin.com/jobs/123`
     - `https://indeed.com/viewjob?jk=123&from=serp` vs `https://indeed.com/viewjob?jk=123`
   - **Impact:** Same job counted as multiple unique jobs

5. **Idempotency**
   - Functions can be called multiple times with side effects
   - **Missing:** Idempotency keys or check-before-write patterns

### Risks: HIGH

**Priority Risks:**

1. **Data Integrity Risk** (Severity: HIGH)
   - Scenario: Workflow crashes after marking jobs as emailed but before email sends
   - Impact: Jobs never sent to user, incorrectly marked as sent
   - Likelihood: Medium (network timeouts, API failures)
   - **Mitigation:** Transactional semantics, send-then-mark pattern

2. **Performance Risk** (Severity: MEDIUM-HIGH)
   - No indexes on frequently-queried columns
   - Deduplication queries full table scan
   - Impact: Workflow timeout (30 min) at scale
   - **Mitigation:** Add strategic indexes, benchmark query performance

3. **Race Condition Risk** (Severity: MEDIUM)
   - Concurrent workflows send duplicate emails
   - Impact: User receives same jobs multiple times
   - **Mitigation:** Row-level locking, workflow singleton pattern

4. **Operational Risk** (Severity: MEDIUM)
   - Hard deletes remove data permanently
   - Impact: No recovery from accidental deletion or bugs
   - **Mitigation:** Soft deletes, audit trail

### Improvement Opportunities

**High Priority:**

1. **Use Many-to-Many Junction Table**
   ```prisma
   model Job {
     id                String           @id @default(uuid())
     url               String           @unique
     title             String
     // ... other fields
     emailStatus       JobEmailStatus[]
   }

   model EmailDigest {
     id        String           @id @default(uuid())
     sentAt    DateTime         @default(now())
     jobCount  Int
     jobStatus JobEmailStatus[]
   }

   model JobEmailStatus {
     id        String      @id @default(uuid())
     jobId     String
     job       Job         @relation(fields: [jobId], references: [id])
     digestId  String
     digest    EmailDigest @relation(fields: [digestId], references: [id])
     sentAt    DateTime    @default(now())

     @@unique([jobId, digestId])
     @@index([jobId])
     @@index([digestId])
   }
   ```

2. **Implement Transaction Safety**
   ```typescript
   async function sendDigestWithDeduplication(jobs: Job[]) {
     return await prisma.$transaction(async (tx) => {
       // Lock jobs to prevent race conditions
       const newJobs = await tx.job.findMany({
         where: { /* ... */ },
         lock: { mode: 'FOR UPDATE' }
       });

       // Send emails
       await sendEmail(newJobs);

       // Mark as sent (only after successful send)
       await tx.jobEmailStatus.createMany({
         data: newJobs.map(job => ({
           jobId: job.id,
           digestId: digest.id
         }))
       });
     });
   }
   ```

3. **Add Database Indexes**
   ```prisma
   model Job {
     // ... fields
     @@index([url])
     @@index([emailedAt])
     @@index([createdAt])
   }
   ```

4. **URL Normalization**
   ```typescript
   function normalizeJobUrl(url: string): string {
     const urlObj = new URL(url);
     // Remove tracking parameters
     const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'from', 'tk', 'guce_referrer'];
     trackingParams.forEach(param => urlObj.searchParams.delete(param));
     return urlObj.toString();
   }
   ```

5. **Soft Deletes**
   ```prisma
   model Job {
     // ... fields
     deletedAt DateTime?
     @@index([deletedAt])
   }
   ```

**Medium Priority:**

6. **Metrics & Monitoring**
   - Track: deduplication rate, query latency, table size
   - Alert: on dedupe failures, high duplicate rates

7. **API Contract**
   - Define TypeScript interface for JobHistoryService
   - Implement using adapter pattern

### Clarity: ✅ GOOD

Plan 04-01 is well-structured and clear. Tasks are specific, actionable, and verifiable.

---

## Plan 04-02: GitHub Actions Workflow & Scheduler

### Architecture: ⚠️ CRITICAL FLAWS

**Critical Issue: Monolithic Pipeline Design**

The `executePipeline()` function orchestrates all steps: scraping → matching → filtering → emailing → marking → cleanup. This monolithic approach has severe operational problems:

1. **Single Point of Failure**
   - Any step failure requires full restart from beginning
   - Wastes completed work (e.g., re-scrapes on email failure)
   - Retry at pipeline level, not at step level
   - **Impact:** 3 retries × 100% work each time = 4x total work on failure

2. **No Transaction Safety**
   - Current: Filter → Send → Mark
   - Problem: Job marked as emailed if `markJobsAsEmailed()` succeeds
   - What if email actually failed? Jobs lost forever
   - **Correct Order:** Send → Confirm → Mark

3. **No Circuit Breaker Pattern**
   - Single scraper failure aborts entire digest
   - **Current plan:** "continues if one scraper fails" - but no details
   - **Missing:** Step-level retry, fallback strategies

4. **No Checkpointing**
   - Each run starts from zero
   - No state preservation between retries
   - **Example:** If 2 of 3 scrapers succeed, retry runs all 3 again

**Recommended Solution: Checkpoint-Based Architecture**

**Checkpoints for each phase:**
```typescript
// State stored in database per workflow run
interface WorkflowRun {
  id: string;              // Unique per execution
  startedAt: DateTime;     // When workflow started
  phase: 'scraping' | 'matching' | 'emailing' | 'cleanup';
  phaseCompleted: boolean;  // Has this phase completed?
  payload: Record<string, any>;  // Phase-specific data
}

async function executePipeline() {
  const runId = process.env.GITHUB_RUN_ID!;

  // Checkpoint 1: Scraping
  if (!await isPhaseCompleted(runId, 'scraping')) {
    const scrapedJobs = await runScrapers();
    await saveCheckpoint(runId, 'scraping', { jobs: scrapedJobs });
  }

  // Checkpoint 2: Matching
  if (!await isPhaseCompleted(runId, 'matching')) {
    const checkpoint1 = await loadCheckpoint(runId, 'scraping');
    const matchedJobs = await runMatching(checkpoint1.jobs);
    await saveCheckpoint(runId, 'matching', { jobs: matchedJobs });
  }

  // ... continue for each phase
}
```

**Benefits:**
- Resume from last successful checkpoint
- Each phase has independent retry logic
- Partial progress preserved
- Wastes less work on failures

### Completeness: ⚠️ GAPS IDENTIFIED

**Critical Missing Elements:**

1. **Secret Management Documentation**
   - Mentions "GitHub Secrets" but no specifics
   - **Missing:** Complete list of required secrets
   - **Missing:** How to obtain each secret (e.g., Google OAuth flow)
   - **Missing:** Secret rotation procedure
   - **Missing:** Local development secret management

2. **Local Testing Strategy**
   - No way to test full workflow locally
   - **Missing:** `npm run automate` assumes local env matches GitHub
   - **Missing:** Docker-based test environment
   - **Missing:** Workflow validation script

3. **Monitoring & Observability**
   - Mentions "logs uploaded as artifacts"
   - **Missing:** Metrics: workflow success rate, duration, job counts
   - **Missing:** Alerting: workflow failures, duration anomalies
   - **Missing:** Dashboard: weekly trends

4. **Log Sanitization**
   - **Missing:** Redaction of sensitive data from logs
   - **Examples:** Email addresses, API keys, job URLs with tokens
   - **Impact:** Security risk in artifact storage

5. **Health Checks**
   - **Missing:** Pre-flight checks before starting pipeline
   - Should verify: database connectivity, Gmail API auth, disk space
   - **Impact:** Fail fast instead of mid-pipeline

6. **Email Size Limits**
   - No handling for large job counts
   - **Missing:** Digest splitting logic
   - Gmail limit: ~25MB per email
   - **Impact:** Email fails if too many jobs match

### Risks: HIGH

**Priority Risks:**

1. **Operational Risk** (Severity: HIGH)
   - Monolithic pipeline wastes work on retries
   - Worst case: 3 retries × 6 scrapers = 18 scraping operations
   - **Impact:** Rate limit violations from job boards
   - **Mitigation:** Checkpoint-based retry

2. **Data Loss Risk** (Severity: HIGH)
   - Jobs marked as emailed before email confirmation
   - Email API timeouts mark jobs as sent but user never receives
   - **Mitigation:** Mark only after confirmed delivery

3. **Monitoring Blind Spot** (Severity: MEDIUM-HIGH)
   - No metrics on workflow health
   - Silent failures possible
   - **Mitigation:** Add metrics, alerts, dashboard

4. **Security Risk** (Severity: MEDIUM)
   - Logs contain sensitive data
   - Artifacts accessible to all repo viewers
   - **Mitigation:** Log redaction, audit log access

5. **Scalability Risk** (Severity: MEDIUM)
   - Email size limits not addressed
   - Too many jobs = failed email
   - **Mitigation:** Digest splitting, pagination

### Improvement Opportunities

**High Priority:**

1. **Implement Checkpoints**
   ```typescript
   // Database model
   model WorkflowCheckpoint {
     id          String   @id @default(uuid())
     runId       String   // GITHUB_RUN_ID
     phase       String   // 'scraping', 'matching', 'emailing', 'cleanup'
     completed   Boolean  @default(false)
     payload     Json?    // Store phase results
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     @@unique([runId, phase])
     @@index([runId])
   }
   ```

2. **Transaction-Safe Email Sending**
   ```typescript
   async function sendEmailSafely(jobs: Job[]) {
     // 1. Send email (idempotent operation)
     const result = await gmail.sendEmail(jobs);

     // 2. ONLY mark after confirmed success
     if (result.status === 'success') {
       await markJobsAsEmailed(jobs.map(j => j.id));
     } else {
       throw new Error(`Email failed: ${result.error}`);
     }

     return result;
   }
   ```

3. **Step-Level Retry Logic**
   ```yaml
   # Instead of retrying entire workflow, retry each step
   - name: Run scraping
     uses: nick-fields/retry@v3
     with:
       timeout_minutes: 10
       max_attempts: 3
       command: npm run scrape

   - name: Run matching
     uses: nick-fields/retry@v3
     with:
       timeout_minutes: 5
       max_attempts: 3
     command: npm run match
   ```

4. **Health Checks**
   ```typescript
   async function preFlightCheck() {
     // Database connectivity
     await prisma.$connect();

     // Gmail auth valid
     const auth = await getGmailAuth();
     const info = await auth.getTokenInfo();
     if (info.expiry_date < Date.now()) {
       throw new Error('Gmail auth expired');
     }

     // Disk space
     const stats = await fs.stat('/tmp');
     if (stats.available < 100 * 1024 * 1024) {
       throw new Error('Low disk space');
     }
   }
   ```

5. **Email Splitting Logic**
   ```typescript
   function splitJobsIntoDigests(jobs: Job[]): Job[][] {
     if (jobs.length <= 50) return [jobs];

     // Gmail limit ~25MB, conservative estimate
     const DIGEST_SIZE_LIMIT = 50;
     const digests = [];

     for (let i = 0; i < jobs.length; i += DIGEST_SIZE_LIMIT) {
       digests.push(jobs.slice(i, i + DIGEST_SIZE_LIMIT));
     }

     return digests;
   }
   ```

6. **Log Redaction**
   ```typescript
   function sanitizeLogData(data: any): any {
     if (typeof data === 'string') {
       // Hide email addresses
       return data.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL_REDACTED]');
     }

     if (Array.isArray(data)) {
       return data.map(sanitizeLogData);
     }

     if (typeof data === 'object' && data !== null) {
       const sanitized = { ...data };
       if (sanitized.email) sanitized.email = '[REDACTED]';
       if (sanitized.accessToken) sanitized.accessToken = '[REDACTED]';
       return sanitized;
     }

     return data;
   }
   ```

**Medium Priority:**

7. **Secret Documentation**
   Create `docs/secrets.md` with:
   - Complete list: DATABASE_URL, GMAIL_RECIPIENT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
   - How to obtain each (link to Google Cloud Console, OAuth flow)
   - Rotation procedure
   - Local development setup

8. **Monitoring & Metrics**
   ```typescript
   // Track key metrics
   logger.info('workflow_metrics', {
     run_id: process.env.GITHUB_RUN_ID,
     scraped_count: scrapedJobs.length,
     matched_count: matchedJobs.length,
     email_count: jobsToEmail.length,
     duration_seconds: (Date.now() - startTime) / 1000
   });
   ```

9. **Local Testing Environment**
   ```yaml
   # .github/workflows/test-workflow.yml
   name: Test Weekly Workflow
   on:
     workflow_dispatch:
       inputs:
         dry_run:
           description: 'Dry run (no emails sent)'
           required: true
           default: 'true'
   ```

### Clarity: ✅ GOOD

Plan 04-02 is clear and well-structured. Tasks are specific with good detail on cron syntax, retry logic, and workflow steps.

---

## Cross-Plan Integration Concerns

### API Contract Gap ⚠️

**Problem:** Plan 04-01 creates deduplication interface that 04-02 consumes, but no explicit API contract is defined.

**Current State:**
- Plan 04-01 creates: `filterNewJobs()`, `markJobsAsEmailed()`
- Plan 04-02 uses: "filterNewJobs() from job-history.ts"
- **Risk:** Interface mismatch, TypeScript compilation errors

**Recommended:**

Define shared interface before implementation:
```typescript
// src/lib/automation/job-history-interface.ts
export interface JobHistoryService {
  /**
   * Filter jobs to only those not previously emailed
   * @param jobs Array of jobs to filter
   * @returns Promise resolving to filtered jobs
   */
  filterNewJobs(jobs: Job[]): Promise<Job[]>;

  /**
   * Mark jobs as emailed after successful send
   * @param jobIds Array of job IDs to mark
   * @param digestId ID of the digest they were sent in
   * @returns Promise resolving to count of marked jobs
   */
  markJobsAsEmailed(jobIds: string[], digestId: string): Promise<number>;

  /**
   * Clean up old jobs beyond retention period
   * @param retentionMonths Number of months to retain (default: 3)
   * @returns Promise resolving to count of deleted jobs
   */
  cleanupOldJobs(retentionMonths?: number): Promise<number>;
}
```

### Testing Strategy Integration

**Missing:** Integration tests that verify:
1. Scrapers → JobHistoryService → Email flow
2. Concurrent workflow runs don't create duplicates
3. Failed email doesn't mark jobs as sent
4. Checkpoints correctly resume from last state

---

## Summary & Recommendations

### Critical Blockers (Must Fix)

1. **Plan 04-01:** Replace `emailedAt` with junction table for many-to-many relationship
2. **Plan 04-02:** Implement checkpoint-based architecture instead of monolithic pipeline
3. **Both:** Define shared TypeScript interfaces before implementation
4. **Plan 04-02:** Add transaction safety - mark jobs as emailed only after confirmed delivery

### High Priority Improvements

1. **Plan 04-01:** Add database indexes, URL normalization, soft deletes
2. **Plan 04-02:** Add secret documentation, log redaction, email splitting
3. **Both:** Add monitoring, metrics, alerting
4. **Plan 04-02:** Add health checks for fail-fast behavior

### Implementation Order

**Recommended:**
1. Revise Plan 04-01 with architectural improvements
2. Define shared interfaces between plans
3. Revise Plan 04-02 with checkpoint architecture
4. Get stakeholder review and approval
5. Implement Plan 04-01 (with proper migrations)
6. Implement Plan 04-02
7. Integration testing
8. Production deployment

### Next Steps

Before proceeding with implementation:

1. Schedule design review session to discuss:
   - Junction table vs `emailedAt` field (Phase 04-01)
   - Checkpoint architecture (Phase 04-02)
   - Database migration approach
   - Monitoring strategy

2. Update plans with:
   - Database schema changes (many-to-many)
   - Checkpoint implementation details
   - API contracts between modules
   - Test coverage requirements
   - Secret management documentation

3. Create:
   - Database migration specification
   - Integration test plan
   - Rollback procedures
   - Runbook for operations

---

*Generated by Claude CLI via gsd:review*
*Review ID: claude-cli-20260327*
