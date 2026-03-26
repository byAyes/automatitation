import { Job } from '../../types/job';

/**
 * Job with match score for email digest
 */
interface JobWithScore extends Job {
  matchScore: number;
  matchedSkills: string[];
}

/**
 * Format a job digest email body
 * @param jobs Array of jobs with match scores
 * @param date Date string for email header
 * @returns Formatted plain text email body
 */
export function formatJobDigest(
  jobs: Array<{ job: Job; score: number; matchedSkills: string[] }>,
  date: string = new Date().toISOString()
): string {
  if (!jobs || jobs.length === 0) {
    return `Weekly Job Digest - ${date}

No new jobs found for this week.

Best regards,
Job Email Automation`;
  }

  // Sort by match score (highest first)
  const sortedJobs = [...jobs].sort((a, b) => b.score - a.score);

  const lines: string[] = [
    `Weekly Job Digest - ${date}`,
    '',
    'Hi,',
    '',
    `Here are your matched jobs for this week (${jobs.length} found):`,
    '',
  ];

  sortedJobs.forEach((jobItem, index) => {
    const job = jobItem.job;
    const score = Math.round(jobItem.score);
    const skills = jobItem.matchedSkills.join(', ');

    lines.push(`${index + 1}. ${job.title} at ${job.company} - ${job.location || 'Remote'}`);
    lines.push(`   Link: ${job.url}`);
    lines.push(`   Match Score: ${score}%`);
    lines.push(`   Skills: ${skills}`);
    lines.push('');
  });

  lines.push('Best regards,', 'Job Email Automation');

  return lines.join('\n');
}

/**
 * Format a single job entry for the email
 * @param job Job to format
 * @param score Match score (0-100)
 * @param matchedSkills Array of matched skills
 * @returns Formatted job string
 */
export function formatJobEntry(
  job: Job,
  score: number,
  matchedSkills: string[]
): string {
  return `${job.title} at ${job.company} - ${job.location || 'Remote'}
   Link: ${job.url}
   Match Score: ${Math.round(score)}%
   Skills: ${matchedSkills.join(', ')}`;
}
