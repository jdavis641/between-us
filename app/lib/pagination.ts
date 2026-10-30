/**
 * Paragraph-Snapping Pagination Utility
 * Slices long story prose or markdown into distinct pages (~600 words per page),
 * snapping strictly to paragraph boundaries (\n\n).
 */

export function paginateContent(fullText: string, wordsPerPage: number = 600): string[] {
  if (!fullText || typeof fullText !== 'string' || !fullText.trim()) {
    return [];
  }

  // Remove stream interruption warning artifacts if present
  const clean = fullText
    .replace(/⚠️?\s*Stream interrupted\.?\s*(Click Continue Story to resume)?/gi, '')
    .replace(/Click continue story to expand\.?/gi, '')
    .trim();

  if (!clean) return [];

  // Split fullText by paragraph breaks (\n\s*\n+)
  const paragraphs = clean.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return [];

  const pages: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean).length;

    // Group paragraphs sequentially until the accumulated word count reaches or exceeds wordsPerPage
    if (currentWordCount >= wordsPerPage && currentChunk.length > 0) {
      pages.push(currentChunk.join('\n\n'));
      currentChunk = [para];
      currentWordCount = words;
    } else {
      currentChunk.push(para);
      currentWordCount += words;
    }
  }

  // Retain any trailing paragraphs on the final page
  if (currentChunk.length > 0) {
    pages.push(currentChunk.join('\n\n'));
  }

  return pages;
}

export const splitStoryIntoPages = paginateContent;
