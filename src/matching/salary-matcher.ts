/**
 * Salary matching utilities for job matching system
 * Matches user salary expectations against job salary
 */

/**
 * Calculate salary match between user expectations and job salary
 * @param userMin - User's minimum salary expectation (null if no preference)
 * @param userMax - User's maximum salary expectation (null if no preference)
 * @param jobSalary - Job's salary (null if not disclosed)
 * @returns Score from 0-100
 */
export function calculateSalaryMatch(
  userMin: number | null,
  userMax: number | null,
  jobSalary: number | null
): number {
  // If user has no salary preferences, return neutral score
  if (!userMin && !userMax) {
    return 100;
  }
  
  // If job salary is not disclosed, return neutral score
  if (!jobSalary) {
    return 100;
  }
  
  // If user has both min and max expectations
  if (userMin && userMax) {
    // Job salary is within range
    if (jobSalary >= userMin && jobSalary <= userMax) {
      return 100;
    }
    
    // Job salary is below minimum - calculate proportional score
    if (jobSalary < userMin) {
      const gap = userMin - jobSalary;
      const gapPercent = (gap / userMin) * 100;
      return Math.max(0, 100 - gapPercent);
    }
    
    // Job salary is above maximum - still good, but maybe overqualified
    if (jobSalary > userMax) {
      return 100; // Better than expected is still good
    }
  }
  
  // If user only has minimum expectation
  if (userMin && !userMax) {
    if (jobSalary >= userMin) {
      return 100;
    }
    const gap = userMin - jobSalary;
    const gapPercent = (gap / userMin) * 100;
    return Math.max(0, 100 - gapPercent);
  }
  
  // If user only has maximum expectation
  if (!userMin && userMax) {
    return jobSalary <= userMax ? 100 : 100; // Over budget is still acceptable
  }
  
  return 100;
}
