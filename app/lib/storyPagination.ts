/**
 * Multi-Page Book Pagination Engine
 * Slices long story prose or markdown into distinct, readable pages (~500–700 words per page view)
 * or by chapter boundaries.
 */

export function splitStoryIntoPages(rawStory: string): string[] {
  if (!rawStory || typeof rawStory !== 'string' || !rawStory.trim()) return [];
  const clean = rawStory
    .replace(/⚠️?\s*Stream interrupted\.?\s*(Click Continue Story to resume)?/gi, '')
    .trim();

  // 1. Check for Chapter markers: ## Chapter \d+ or # Chapter \d+
  const chapterRegex = /(?=(?:^|\n)#{1,3}\s*Chapter\s*\d+)/gi;
  let chapterSplits = clean.split(chapterRegex).map(s => s.trim()).filter(Boolean);

  if (chapterSplits.length > 1) {
    if (!/^#{1,3}\s*Chapter\s*\d+/i.test(chapterSplits[0]) && chapterSplits[0].length < 150) {
      chapterSplits[1] = `${chapterSplits[0]}\n\n${chapterSplits[1]}`;
      chapterSplits.shift();
    }
    return chapterSplits;
  }

  // 2. Check for alternative Chapter headings like "Chapter 1:" on its own line
  const altChapterRegex = /(?=(?:^|\n)Chapter\s*\d+[:\s])/gi;
  let altSplits = clean.split(altChapterRegex).map(s => s.trim()).filter(Boolean);
  if (altSplits.length > 1) {
    if (!/^Chapter\s*\d+/i.test(altSplits[0]) && altSplits[0].length < 150) {
      altSplits[1] = `${altSplits[0]}\n\n${altSplits[1]}`;
      altSplits.shift();
    }
    return altSplits;
  }

  // 3. Fallback: Split on horizontal rules
  const hrSplits = clean.split(/\n\s*[-*_]{3,}\s*\n/).map(s => s.trim()).filter(Boolean);
  if (hrSplits.length > 1) {
    return hrSplits;
  }

  // 4. Fallback for long unstructured prose: split into ~500–700 word chunks on paragraph boundaries
  const paragraphs = clean.split(/\n\n+/);
  if (paragraphs.length > 2) {
    const pages: string[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;

    for (const para of paragraphs) {
      const words = para.trim().split(/\s+/).length;
      if (currentWordCount + words > 600 && currentChunk.length > 0) {
        pages.push(currentChunk.join('\n\n'));
        currentChunk = [para];
        currentWordCount = words;
      } else {
        currentChunk.push(para);
        currentWordCount += words;
      }
    }
    if (currentChunk.length > 0) {
      pages.push(currentChunk.join('\n\n'));
    }
    if (pages.length > 1) {
      return pages;
    }
  }

  return [clean];
}
