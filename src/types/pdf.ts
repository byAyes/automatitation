/**
 * PDF processing types for job extraction
 * Used for parsing uploaded PDF documents and extracting job postings
 */

/**
 * Result of parsing a PDF document
 */
export interface PDFUploadResult {
  success: boolean;
  text: string;
  pageCount: number;
  error?: string;
}

/**
 * Extracted job posting from PDF text
 * Represents a structured job posting with key fields
 */
export interface ExtractedJob {
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location?: string;
  url?: string;
}

/**
 * Options for PDF processing and job extraction
 */
export interface PDFProcessingOptions {
  /**
   * Minimum confidence threshold for job detection
   * Jobs below this threshold will be filtered out
   * @default 0.5
   */
  minConfidence?: number;
  /**
   * Whether to extract and parse requirements separately
   * @default true
   */
  extractRequirements: boolean;
}
