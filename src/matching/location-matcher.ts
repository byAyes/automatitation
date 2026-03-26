/**
 * Location matching utilities for job matching system
 * Matches user location preferences against job location
 */

/**
 * Calculate location match between user preference and job location
 * @param userLocation - User's preferred location (null if no preference)
 * @param jobLocation - Job's location
 * @param remoteOnly - Whether user only wants remote jobs
 * @returns Score from 0-100
 */
export function calculateLocationMatch(
  userLocation: string | null,
  jobLocation: string,
  remoteOnly: boolean
): number {
  // If user wants remote only
  if (remoteOnly) {
    // Check if job is remote (case-insensitive check)
    const isRemote = jobLocation.toLowerCase().includes('remote');
    return isRemote ? 100 : 0;
  }
  
  // If user has no location preference
  if (!userLocation) {
    return 100; // Neutral
  }
  
  // Exact location match (case-insensitive)
  if (userLocation.toLowerCase() === jobLocation.toLowerCase()) {
    return 100;
  }
  
  // No match
  return 0;
}
