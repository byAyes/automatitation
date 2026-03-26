/**
 * Interest matching utilities for job matching system
 * Matches user interests against job categories
 */

/**
 * Calculate interest match between user interests and job category
 * @param userInterests - Array of user's interests
 * @param jobCategory - Job's category
 * @returns Score from 0-100
 */
export function calculateInterestMatch(
  userInterests: string[],
  jobCategory: string
): number {
  if (!jobCategory || userInterests.length === 0) {
    return 100; // No preference = neutral
  }
  
  const normalizedCategory = jobCategory.toLowerCase().trim();
  
  for (const interest of userInterests) {
    const normalizedInterest = interest.toLowerCase().trim();
    
    // Exact match
    if (normalizedInterest === normalizedCategory) {
      return 100;
    }
    
    // Partial match (e.g., "Frontend" matches "Frontend Development")
    if (normalizedInterest.includes(normalizedCategory) || 
        normalizedCategory.includes(normalizedInterest)) {
      return 100;
    }
  }
  
  return 0;
}
