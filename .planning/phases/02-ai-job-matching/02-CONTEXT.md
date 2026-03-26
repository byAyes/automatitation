# Phase 02: AI Job Matching - Context

**Gathered:** 2026-03-26  
**Status:** Ready for planning  
**Source:** Roadmap requirements + Research findings

<domain>
## Phase Boundary

This phase delivers:
1. User profile schema to store skills, interests, location preferences, and matching weights
2. AI-powered job matching algorithm that scores jobs based on user profile
3. API endpoint to retrieve matched jobs sorted by relevance score

What this phase does NOT deliver (deferred to Phase 03+):
- Email notifications (Phase 03)
- User interface for profile management (deferred)
- Machine learning model training (deferred - start with weighted scoring)
- Advanced semantic matching with embeddings (deferred)

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions (from Roadmap Requirements)

**User Profile Schema (JOB-04):**
- MUST store user skills (array of strings)
- MUST store user interests (array of strings)
- MUST store location preference (string, nullable for remote-only)
- MUST store experience level preference (enum: junior, mid, senior, lead)
- MUST support remote-only flag (boolean)
- Schema should use Prisma (existing project standard from Phase 01)

**AI Job Matching Algorithm (JOB-05):**
- MUST calculate match score (0-100) for each job
- MUST support skill-based matching with fuzzy matching for variations
- MUST support location filtering (remote vs onsite, location radius)
- MUST sort jobs by match score (descending)
- MUST filter by minimum threshold (default 70%)
- Jobs scored on: Skills (40%), Interests (30%), Location (20%), Salary (10%)

### the agent's Discretion

**Technical choices (agent decides):**
- Database: Use existing Prisma + SQLite (Phase 01 standard)
- Matching logic: Start with weighted scoring (not ML initially)
- Fuzzy matching: Use string normalization + synonym mapping
- Performance: Pre-compute scores, cache results
- API design: RESTful endpoint returning scored jobs
- Testing: Unit tests for scoring logic, integration tests for API

**Architecture decisions:**
- File structure: Separate matching logic into modular components
- Type safety: TypeScript interfaces for all data structures
- Validation: Zod schemas for runtime validation
- Error handling: Return empty matches on error, log to console

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Patterns (Phase 01)
- `src/types/job.ts` — Job interface definition (8 core fields)
- `src/scraper/BaseScraper.ts` — Abstract scraper class pattern
- `prisma/schema.prisma` — Database schema structure
- `src/utils/rate-limiter.ts` — Utility pattern for rate limiting

### Phase 02 Specific
- No external specs — requirements fully captured in decisions above

</canonical_refs>

<specifics>
## Specific Ideas

**User Profile Fields:**
```typescript
interface UserProfile {
  id: string;
  userId: string;  // Link to user (for multi-user support)
  skills: string[];  // e.g., ["JavaScript", "React", "Node.js"]
  interests: string[];  // e.g., ["Frontend", "Web3", "AI"]
  location: string | null;  // e.g., "New York" or null for remote-only
  remoteOnly: boolean;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
  minSalary?: number;
  maxSalary?: number;
  skillWeight: number;  // Default 0.4
  interestWeight: number;  // Default 0.3
  locationWeight: number;  // Default 0.2
  salaryWeight: number;  // Default 0.1
}
```

**Match Score Structure:**
```typescript
interface MatchScore {
  overall: number;      // 0-100
  skillMatch: number;   // 0-100
  interestMatch: number; // 0-100
  locationMatch: number; // 0-100
  salaryMatch: number;  // 0-100
  matchedSkills: string[];  // Skills that matched
  explanation?: string;  // Human-readable explanation
}
```

**API Response:**
```typescript
// GET /api/match-jobs?userId=xxx&threshold=70
{
  matches: Array<{
    job: Job;
    score: MatchScore;
  }>;
  total: number;
  threshold: number;
}
```

</specifics>

<deferred>
## Deferred Ideas

**Not in Phase 02 scope:**
- Machine learning model training (no training data yet)
- Embedding-based semantic matching (Transformers.js, sentence-transformers)
- User interface for profile management
- Real-time job matching (batch processing only)
- Click-through tracking for future ML
- Advanced synonym databases
- Multi-user profile management (single user for now)
- Profile photo, bio, or other non-matching fields

These may be added in Phase 2.5 or Phase 03 based on user feedback.

</deferred>

---

*Phase: 02-ai-job-matching*  
*Context gathered: 2026-03-26 via roadmap + research synthesis*
