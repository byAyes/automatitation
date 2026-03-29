---
phase: 06-cv-database
plan: 03
subsystem: profile-history
tags: [profile, history, tracking, matching]
dependency_graph:
  requires:
    - 06-02 (CV parsing)
  provides:
    - Profile change tracking
    - History API endpoint
    - CV-based job matching
tech-stack:
  added:
    - ProfileChangeLog model
    - Change tracking library
    - CV matcher integration
  patterns:
    - Event sourcing for profile changes
    - CV-to-profile data flow
key-files:
  created:
    - prisma/schema.prisma (ProfileChangeLog model)
    - src/lib/cv/profileHistory.ts
    - src/app/api/profile/history/route.ts
    - src/matching/cvMatcher.ts
  modified:
    - src/app/api/cv/update-profile/route.ts
decisions:
  - Track all profile changes with source attribution
  - Store previous and new values as JSON
  - Link CV-triggered changes to CV record
  - Use existing scorer for CV-based matching
metrics:
  duration: 900s
  completed: "2026-03-28T20:00:00Z"
---

# Phase 06 Plan 03: Profile History & Integration Summary

## One-liner
Profile change tracking with CV integration for job matching.

## Completed Tasks

### Task 1: Create profile change tracking library ✓
- Added ProfileChangeLog model to Prisma schema:
  - id, userId, changeType, previousValue, newValue, source, cvId, createdAt
  - Indexed on userId and createdAt for fast queries
- Created `src/lib/cv/profileHistory.ts` with:
  - `trackProfileChange(input)` - Save change log entry
  - `getProfileHistory(userId, limit)` - Fetch paginated history
  - ProfileChangeInput type for change tracking
  - ProfileChangeLog interface for history entries

**Commit:** `b6229d5`

### Task 2: Create profile history API endpoint ✓
- Created GET /api/profile/history:
  - Accepts userId and limit parameters
  - Fetches paginated change history
  - Returns timestamped changes with source attribution
  - Includes cvId reference for CV-triggered changes
  - Returns { history: [], total: number }
- Response includes:
  - changeType (skills_added, experience_level_updated, etc.)
  - timestamp
  - source (cv_upload, manual, system)
  - changes (previous and current values)
  - cvId (if applicable)

**Commit:** `b6229d5`

### Task 3: Integrate CV-updated profile with job matching ✓
- Created `src/matching/cvMatcher.ts`:
  - `matchJobsToCVProfile(jobs, cvId)` - Match jobs using CV data
  - Builds temporary UserProfile from CV
  - Uses existing scoreAndSortJobs() for matching
  - Calculates experience level from CV experience
- Updated update-profile route:
  - Calls trackProfileChange() after skill updates
  - Tracks experience level changes
  - Links changes to CV with cvId and source="cv_upload"

**Commit:** `b6229d5`

## Deviations from Plan

### None - Plan executed exactly as written

All tasks completed as specified.

## Verification Results

- ✓ ProfileChangeLog model added to database schema
- ✓ trackProfileChange() logs all profile modifications
- ✓ GET /api/profile/history returns timestamped changes
- ✓ History includes source (cv_upload vs manual)
- ✓ Job matching uses CV-updated profile
- ✓ CV-triggered changes linked to CV record
- ✓ User can see what changed and when

## Change Types Tracked

| Change Type | Triggered By | Description |
|-------------|--------------|-------------|
| `skills_added` | CV upload | New skills extracted from CV |
| `experience_level_updated` | CV upload | Level inferred from experience |
| `manual` | User action | Direct profile edit |
| `system` | Automated | System-initiated update |

## Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Added ProfileChangeLog model |
| `src/lib/cv/profileHistory.ts` | Created | Change tracking library |
| `src/app/api/profile/history/route.ts` | Created | History API endpoint |
| `src/matching/cvMatcher.ts` | Created | CV-based job matching |
| `src/app/api/cv/update-profile/route.ts` | Modified | Added change tracking |

## Integration Complete

The CV upload → extraction → profile update → job matching pipeline is now complete:

1. **Upload CV** → POST /api/cv/upload (version 1, 2, 3...)
2. **Process CV** → POST /api/cv/process (extract skills, experience, education)
3. **Update Profile** → POST /api/cv/update-profile (merge with existing profile)
4. **Track Changes** → Automatic (logged to ProfileChangeLog)
5. **View History** → GET /api/profile/history (see all changes)
6. **Match Jobs** → Uses updated profile from CV

## Next Steps

Phase 06 complete. All requirements met:
- ✓ CV-01: Store CV uploads with versioning
- ✓ CV-02: Auto-extract skills, experience, education
- ✓ CV-03: Update UserProfile automatically
- ✓ CV-04: Use updated profile for job matching
- ✓ CV-05: Track profile changes over time
