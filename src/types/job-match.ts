import { Job } from './job';

/**
 * Match score interface - represents the result of matching a job against a user profile
 */
export interface MatchScore {
  overall: number; // 0-100
  skillMatch: number; // 0-100
  interestMatch: number; // 0-100
  locationMatch: number; // 0-100
  salaryMatch: number; // 0-100
  matchedSkills: string[]; // Skills that matched
  explanation?: string; // Human-readable explanation
}

/**
 * Matched job interface - combines a job with its match score
 */
export interface MatchedJob {
  job: Job;
  score: MatchScore;
}

/**
 * Match options for configuring matching behavior
 */
export interface MatchOptions {
  threshold?: number; // Minimum score (default 70)
  limit?: number; // Max results (default 100)
  includeExplanation?: boolean; // Include explanation string
}
