/**
 * Job interface - represents a job posting
 * Matches the Prisma Job model
 */
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  url: string;
  salary: number | null;
  postedAt: Date | null;
  scrapedAt: Date;
  skills: string[];
  category: string | null;
}
