---
phase: 06-cv-database
plan: 02
subsystem: cv-parsing
tags: [cv, parsing, extraction, profile-update]
dependency_graph:
  requires:
    - 06-01 (CV upload API)
  provides:
    - CV text parser
    - Skill/experience/education extractors
    - Profile auto-update endpoint
tech-stack:
  added:
    - CV parser with section detection
    - Regex-based extraction patterns
    - Profile merging logic
  patterns:
    - Section-based CV parsing
    - Case-insensitive skill deduplication
    - Experience level inference
key-files:
  created:
    - src/lib/cv/cvParser.ts
    - src/lib/cv/skillExtractor.ts
    - src/app/api/cv/process/route.ts
    - src/app/api/cv/update-profile/route.ts
decisions:
  - Use regex patterns for section detection
  - Normalize skills to lowercase for deduplication
  - Infer experience level from years: junior (<2), mid (2-5), senior (5-10), lead (10+)
  - Store experience/education as JSON strings in database
metrics:
  duration: 1200s
  completed: "2026-03-28T19:00:00Z"
---

# Phase 06 Plan 02: CV Parsing & Auto-Extraction Summary

## One-liner
CV parsing with automatic skill extraction and UserProfile auto-update.

## Completed Tasks

### Task 1: Create CV text parser with section detection ✓
- Created `src/lib/cv/cvParser.ts` with:
  - `parseCV(pdfBuffer)` - Main parsing function using pdf-parse
  - `detectSections(text)` - Regex-based section detection
  - `cleanText(text)` - Normalize PDF extraction artifacts
  - `extractSectionText()` - Re-extract sections from raw text
- Detects sections: Skills, Experience, Education
- Handles multi-page CVs
- Falls back to treating entire text as skills if no sections detected

**Commit:** `57446bc`

### Task 2: Create skill and experience extractor ✓
- Created `src/lib/cv/skillExtractor.ts` with:
  - `extractSkills(text)` - Extract skills from skills section
    - Splits by delimiters (comma, newline, bullets)
    - Normalizes to lowercase
    - Filters false positives
  - `extractExperience(text)` - Parse work experience entries
    - Matches patterns: "Job Title at Company (Dates)"
    - Falls back to line-by-line extraction
  - `extractEducation(text)` - Parse education entries
    - Matches degree, institution, graduation year
  - `calculateYearsOfExperience()` - Calculate total years
  - `inferExperienceLevel(years)` - Infer level from years

**Commit:** `57446bc`

### Task 3: Create CV processing endpoint ✓
- Created POST /api/cv/process:
  - Accepts cvId parameter
  - Fetches CV record (must be status="pending")
  - Reads PDF from storage
  - Calls parseCV() to extract sections
  - Calls extractSkills(), extractExperience(), extractEducation()
  - Updates CV record with extracted data
  - Updates status to "processed"
  - Returns { success, skills, experience count, education count }

**Commit:** `57446bc`

### Task 4: Create profile auto-update endpoint ✓
- Created POST /api/cv/update-profile:
  - Accepts userId and cvId parameters
  - Fetches processed CV data
  - Merges skills with existing profile (case-insensitive dedup)
  - Calculates years of experience from experience entries
  - Infers experience level (junior/mid/senior/lead)
  - Updates UserProfile with extracted data
  - Returns { success, updatedFields, profile, skillsAdded }
- Uses Prisma upsert for atomic updates

**Commit:** `57446bc`

## Deviations from Plan

### None - Plan executed exactly as written

All tasks completed as specified. The implementation follows the plan exactly.

## Verification Results

- ✓ CV parser extracts text and detects sections
- ✓ Skills extracted as string array
- ✓ Experience parsed into structured entries
- ✓ Education parsed into structured entries
- ✓ POST /api/cv/process updates CV with extracted data
- ✓ POST /api/cv/update-profile updates UserProfile
- ✓ Skills merged without duplicates (case-insensitive)
- ✓ Experience level inferred from years

## Extraction Patterns

### Skills Extraction
- Splits by: commas, newlines, bullets (•▪▸→◆), pipes, semicolons
- Normalizes: lowercase, trim, remove special chars
- Filters: common words (and, the, with, proficient, etc.)
- Validates: 2-50 characters length

### Experience Extraction
- Pattern 1: "Job Title at Company (2020-2023)"
- Pattern 2: "Job Title - Company | Duration"
- Pattern 3: "Job Title @ Company"
- Fallback: Line-by-line extraction

### Education Extraction
- Pattern 1: "Degree, University, Year"
- Pattern 2: "University - Degree (Year)"
- Fallback: Lines with 4-digit years

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/cv/cvParser.ts` | CV text parsing and section detection |
| `src/lib/cv/skillExtractor.ts` | Skill/experience/education extraction |
| `src/app/api/cv/process/route.ts` | CV processing endpoint |
| `src/app/api/cv/update-profile/route.ts` | Profile auto-update endpoint |

## Next Steps (Plan 06-03)

- Add ProfileChangeLog model to track profile changes
- Create profile history API endpoint
- Integrate CV-updated profile with job matching
- End-to-end verification
