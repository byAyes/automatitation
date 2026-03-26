/**
 * User profile types for job matching system
 * These types mirror the Prisma schema for UserProfile model
 */

/**
 * Experience level enum type
 */
export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead';

/**
 * User profile interface - matches Prisma UserProfile model
 */
export interface UserProfile {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  skills: string[];
  interests: string[];
  location: string | null;
  remoteOnly: boolean;
  experienceLevel: ExperienceLevel | null;
  minSalary: number | null;
  maxSalary: number | null;
  skillWeight: number;
  interestWeight: number;
  locationWeight: number;
  salaryWeight: number;
}

/**
 * User preferences interface - for API requests and form inputs
 */
export interface UserPreferences {
  skills: string[];
  interests: string[];
  location: string | null;
  remoteOnly: boolean;
  experienceLevel: ExperienceLevel;
  minSalary?: number;
  maxSalary?: number;
}
