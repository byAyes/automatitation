/**
 * PDF Parser Module
 * Extracts text content from PDF documents using pdf-parse library
 */

// @ts-ignore - pdf-parse doesn't have types
import pdfParse from 'pdf-parse';
import { PDFUploadResult } from '../../types/pdf.js';

/**
 * Parse a PDF buffer and extract text content
 * @param buffer - PDF file as Buffer
 * @returns Promise resolving to PDFUploadResult with extracted text and metadata
 */
export async function parsePDF(buffer: Buffer): Promise<PDFUploadResult> {
  try {
    // Parse PDF using pdf-parse
    const data = await pdfParse(buffer);

    // Extract text from all pages
    const text = data.text;
    const pageCount = data.numpages;

    // Clean extracted text: normalize whitespace and line breaks
    const cleanedText = cleanText(text);

    return {
      success: true,
      text: cleanedText,
      pageCount: pageCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing PDF';
    return {
      success: false,
      text: '',
      pageCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Clean extracted text by normalizing whitespace and line breaks
 * @param text - Raw text extracted from PDF
 * @returns Cleaned text with normalized whitespace
 */
function cleanText(text: string): string {
  return text
    // Replace multiple newlines with double newline
    .replace(/\n\s*\n/g, '\n\n')
    // Replace multiple spaces with single space
    .replace(/ +/g, ' ')
    // Remove spaces around newlines
    .replace(/\n +/g, '\n')
    .replace(/ +\n/g, '\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final trim
    .trim();
}
