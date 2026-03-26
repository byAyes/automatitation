# Phase 02: AI Job Matching - Research

**Gathered:** 2026-03-26  
**Research Focus:** User profile schema design and AI-powered job matching algorithms

---

## Standard Stack Recommendations

### For User Profile Schema (JOB-04)

**Recommended Approach:** Use Prisma schema (already in use from Phase 01)

```prisma
model UserProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Core profile fields
  skills      String[]  // Array of skill strings
  interests   String[]  // Array of interest categories
  location    String?   // Preferred location (can be null for remote)
  remoteOnly  Boolean  @default(false)
  
  // Preferences
  minSalary   Int?      // Minimum salary expectation
  maxSalary   Int?      // Maximum salary expectation
  experienceLevel String? // junior, mid, senior, lead
  
  // Matching weights (optional customization)
  skillWeight     Float  @default(0.4)
  interestWeight  Float  @default(0.3)
  locationWeight  Float  @default(0.2)
  salaryWeight    Float  @default(0.1)
}
```

**Why Prisma:**
- Already used in project (Phase 01)
- Type-safe with TypeScript
- Easy migrations
- Works with any database (SQLite for local, PostgreSQL for production)

### For AI Job Matching (JOB-05)

**Recommended Approach: Hybrid Scoring System** (not pure ML)

**Why NOT pure ML initially:**
- Requires training data (don't have yet)
- Overkill for initial implementation
- Hard to explain scores to users
- Complex to maintain

**Recommended: Weighted Multi-Factor Scoring**

```typescript
interface MatchScore {
  overall: number;      // 0-100
  skillMatch: number;   // % of user skills in job requirements
  interestMatch: number; // % of user interests matching job category
  locationMatch: number; // 0 or 100 (or % for radius-based)
  salaryMatch: number;  // 0-100 based on range overlap
}
```

**Scoring Algorithm:**

```typescript
function calculateMatchScore(user: UserProfile, job: Job): MatchScore {
  // 1. Skill matching (40% weight)
  const skillMatch = calculateSkillOverlap(user.skills, job.requiredSkills);
  
  // 2. Interest matching (30% weight)
  const interestMatch = calculateInterestMatch(user.interests, job.category);
  
  // 3. Location matching (20% weight)
  const locationMatch = calculateLocationMatch(user.location, job.location, user.remoteOnly);
  
  // 4. Salary matching (10% weight)
  const salaryMatch = calculateSalaryMatch(user.minSalary, user.maxSalary, job.salary);
  
  // Weighted average
  const overall = 
    skillMatch * 0.4 +
    interestMatch * 0.3 +
    locationMatch * 0.2 +
    salaryMatch * 0.1;
    
  return { overall, skillMatch, interestMatch, locationMatch, salaryMatch };
}
```

**Libraries to Use:**
- `natural` or `compromise` - for text processing (skill/interest tokenization)
- `distance` or `fast-levenshtein` - for fuzzy string matching (skill variations)
- Built-in TypeScript/JavaScript for scoring logic

**Alternative: Embedding-Based (Advanced)**
- Use sentence-transformers via Transformers.js
- Embed user profile and job descriptions
- Calculate cosine similarity
- More accurate but heavier (requires model downloads ~100MB)

**Recommendation:** Start with weighted scoring, add embeddings as Phase 2 enhancement.

---

## Architecture Patterns

### Data Flow

```
Job Scraper (Phase 01)
       ↓
  Job[] (raw listings)
       ↓
┌──────────────────────┐
│  Job Matching Engine │
│  - Fetch user profile │
│  - Score each job    │
│  - Sort by score     │
│  - Filter threshold  │
└──────────────────────┘
       ↓
  MatchedJob[] (scored)
       ↓
Email Formatter (Phase 03)
```

### File Structure Recommendation

```
src/
├── types/
│   ├── user-profile.ts      # UserProfile, UserPreferences interfaces
│   └── job-match.ts         # MatchScore, MatchedJob interfaces
├── matching/
│   ├── scorer.ts            # Main scoring logic
│   ├── skill-matcher.ts     # Skill overlap calculation
│   ├── interest-matcher.ts  # Interest category matching
│   ├── location-matcher.ts  # Location/re remote matching
│   └── salary-matcher.ts    # Salary range overlap
├── api/
│   └── match-jobs/          # API route for matching
│       └── route.ts
└── utils/
    └── text-processing.ts   # String normalization, tokenization
```

---

## Common Pitfalls

### 1. Skill Matching Pitfalls

**Problem:** "JavaScript" vs "JS" vs "Javascript" counted as different skills

**Solution:** Normalize skill strings:
```typescript
function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/\.js$/, 'javascript')
    .replace(/reactjs/, 'react')
    .replace(/nodejs/, 'node.js');
}
```

**Advanced:** Use synonym mapping or embeddings for semantic matching.

### 2. Threshold Tuning

**Problem:** What score is "good enough" to show users?

**Recommendation:**
- Default threshold: 70% (0.7)
- Show top N matches even if below threshold (e.g., top 10)
- Let users adjust threshold in profile

### 3. Cold Start Problem

**Problem:** New users with empty profiles get 0% matches

**Solutions:**
- Require minimum profile completion (at least 3 skills)
- Use job description keywords to infer skills from user's past jobs
- Default weights: if no user data, fall back to job popularity/recency

### 4. Performance at Scale

**Problem:** Scoring 1000 jobs × 100 users = 100,000 calculations

**Solutions:**
- Pre-compute scores nightly (batch processing)
- Cache scores in database
- Incremental updates (only score new jobs)
- Use database filtering before scoring (filter by location, basic keywords)

---

## Validation Architecture

### Test Cases for Matching Algorithm

```typescript
// Skill matching tests
test('exact skill match returns 100%', () => {
  expect(calculateSkillOverlap(['javascript', 'react'], ['javascript', 'react']))
    .toBe(1.0);
});

test('partial skill match returns proportional score', () => {
  expect(calculateSkillOverlap(['javascript', 'react'], ['javascript']))
    .toBe(0.5);
});

test('fuzzy match handles variations', () => {
  expect(calculateSkillOverlap(['javascript'], ['js']))
    .toBeGreaterThan(0.8);
});

// Location matching tests
test('remote job matches remote-only user', () => {
  expect(calculateLocationMatch(null, 'Remote', true))
    .toBe(1.0);
});

test('onsite job does not match remote-only user', () => {
  expect(calculateLocationMatch('New York', 'San Francisco', true))
    .toBe(0.0);
});
```

### Success Metrics

- **Precision:** Of jobs shown as "90% match", how many are actually relevant?
- **Recall:** Of all relevant jobs, what % are shown to user?
- **User satisfaction:** Do users apply to matched jobs? (track click-through)

---

## Dependencies

### External Services

None required for initial implementation. All matching happens locally.

### Optional Enhancements (Future)

- **OpenAI API / Anthropic API:** For semantic understanding of job descriptions
- **ElasticSearch:** For production-scale job search + matching
- **Redis:** For caching match scores

---

## Phase 02 Specific Requirements

### JOB-04: User Profile Schema

**Must have:**
- Skills (array of strings)
- Interests (array of strings)
- Location preference (string, nullable)
- Remote-only flag (boolean)
- Experience level (enum: junior, mid, senior, lead)

**Nice to have:**
- Salary range (min/max)
- Custom weights for each factor
- Blacklist (companies/roles to exclude)

### JOB-05: AI Matching Algorithm

**Must have:**
- Calculate match score (0-100) for each job
- Support skill-based matching (exact + fuzzy)
- Support location filtering
- Sort jobs by match score
- Filter by minimum threshold (default 70%)

**Nice to have:**
- Explain why each job matched (highlight matched skills)
- Allow users to adjust weights
- Track which matches user clicked (for future ML)

---

## Key Links (Critical Connections)

1. **UserProfile → Job matching:** User profile fields must align with job fields for scoring
2. **Scraper output → Matcher input:** Job schema from Phase 01 must include all fields needed for matching
3. **Matcher → Email formatter:** Output format must be consumable by Phase 03 email system

---

## Research Summary

**For planning Phase 02, the key insights are:**

1. **Use Prisma schema** - Consistent with Phase 01, type-safe, easy migrations
2. **Start with weighted scoring** - Not ML initially (no training data, overkill)
3. **Four matching factors:** Skills (40%), Interests (30%), Location (20%), Salary (10%)
4. **Fuzzy matching needed** - "JavaScript" vs "JS" vs "Javascript"
5. **Threshold tuning critical** - Default 70%, allow user adjustment
6. **Performance matters** - Pre-compute scores, cache results
7. **No external dependencies required** - All matching can be done locally with TypeScript
8. **Test coverage essential** - Validate scoring logic with unit tests

**Risks:**
- Skill normalization complexity (synonyms, variations)
- Cold start for new users
- Performance at scale (1000s of jobs)

**Mitigation:**
- Start simple, add complexity iteratively
- Require minimum profile data
- Batch processing + caching

---

*Research completed: 2026-03-26*  
*Next: Create CONTEXT.md with user decisions, then create PLAN.md files*
