# Phase 3 Context: Email Notifications

**Phase:** 3
**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Goal

Send weekly email digests via Gmail API with matched job listings

## Requirements

- JOB-06: Integrate Gmail API for sending emails
- JOB-07: Format job digest as simple text email

## Success Criteria

1. Emails sent successfully via Gmail API
2. Email contains job list with links in simple format

</domain>

<decisions>
## Implementation Decisions (Inherited from Project)

### Technology Stack

- **Email Service:** Gmail API (required by roadmap)
- **Runtime:** Node.js with TypeScript (project standard)
- **Framework:** Next.js App Router (established in Phase 2)

### Email Content Strategy

- **Format:** Simple text email (per JOB-07)
- **Content:** Job title, company, location, link
- **Frequency:** Weekly digest (per roadmap)
- **Recipient:** Single user (job seeker)

### Integration Points

- **Input:** Matched jobs from Phase 2 (Prisma database)
- **Output:** Email sent via Gmail API
- **Trigger:** Manual for now (Phase 4 adds automation)

</decisions>

<specifics>
## Specific Ideas

### Gmail API Setup

- Need OAuth 2.0 credentials from Google Cloud Console
- Use `googleapis` npm package for Gmail integration
- Store credentials securely (environment variables)
- Required scopes: `gmail.send`

### Email Template

```
Subject: Weekly Job Digest - {date}

Hi,

Here are your matched jobs for this week:

1. {Job Title} at {Company} - {Location}
   {Link}

2. {Job Title} at {Company} - {Location}
   {Link}

...

Best regards,
Job Email Automation
```

### Data Flow

1. Query matched jobs from Prisma (Phase 2 database)
2. Filter by date range (last 7 days)
3. Format as email content
4. Send via Gmail API
5. Log send status

</specifics>

<canonical_refs>
## External References

- **googleapis:** Official Google API client for Node.js
- **Nodemailer:** Alternative (but Gmail API preferred for OAuth2)
- **Gmail API:** https://developers.google.com/gmail/api
- **OAuth 2.0:** Required for Gmail API authentication

</canonical_refs>

<code_context>
## Code Context

**Existing Infrastructure:**
- Prisma ORM with PostgreSQL (Phase 2)
- Next.js App Router API endpoints (Phase 2)
- TypeScript project structure

**Database Schema (from Phase 2):**
- UserProfile: skills, interests, location preferences
- Job: scraped job data
- MatchScore: computed relevance scores

**Integration Points:**
- Read from existing Prisma schema
- Use Next.js API routes for email sending
- Reuse project's TypeScript configuration

**File Structure (planned):**
```
/src
  /app
    /api
      /email
        /send
          route.ts
  /lib
    email
      gmail.ts
      template.ts
```

</code_context>

---
*Context gathered: 2026-03-26*
*Next step: Planning phase*
