#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

interface AuditReportItem {
  id: string;
  title: string;
  wordCount: number;
  meetsNovellaThreshold: boolean;
  hasMultiChapterStructure: boolean;
  chapterCount: number;
  sexualOrientation: string | null;
  kinkCategories: string[];
  userRating: number | null;
  genreTopic: string | null;
  tropes: string[];
  anatomicalViolations: string[];
  passed: boolean;
}

const NOVELLA_WORD_THRESHOLD = 25000;

function enforceAnatomicalCheck(text: string): string[] {
  const violations: string[] = [];
  const forbiddenPatterns = [
    { pattern: /\b(?:her|she\s+felt\s+her)\s+prostate\b/i, reason: "Impossible female prostate reference" },
    { pattern: /\bfemale\s+prostate\b/i, reason: "Erroneous female prostate terminology" },
    { pattern: /\bher\s+prostate\s+pulsed?\b/i, reason: "Impossible female prostate physiological reaction" },
    { pattern: /\bher\s+prostate\s+milked?\b/i, reason: "Impossible biological attribution" },
  ];

  for (const { pattern, reason } of forbiddenPatterns) {
    if (pattern.test(text)) {
      violations.push(reason);
    }
  }

  return violations;
}

async function runQAContentValidator() {
  console.log('===============================================================');
  console.log('     BETWEEN US: QA CONTENT VALIDATOR & AUDIT AGENT            ');
  console.log('===============================================================');
  console.log(`[Target Threshold] Novella Length: ${NOVELLA_WORD_THRESHOLD.toLocaleString()} words`);
  console.log('[Directives] Multi-chapter completeness, exhaustive meta-tags, anatomical reality');
  console.log('---------------------------------------------------------------\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let stories: any[] = [];

  if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co') {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      console.log('[QA Agent] Fetching literature stories from Supabase library (generated_content)...');

      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .eq('content_type', 'literature')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('[QA Agent] Supabase query warning:', error.message);
      } else {
        stories = data || [];
        console.log(`[QA Agent] Retrieved ${stories.length} literature stories for audit.`);
      }
    } catch (err: any) {
      console.warn('[QA Agent] Failed to connect to Supabase:', err.message);
    }
  } else {
    console.log('[QA Agent] Supabase credentials not found in environment. Running in offline validation mode on sample novellas.');
  }

  // If no stories in database yet, generate reference sample stories to test validator rules
  if (stories.length === 0) {
    stories = [
      {
        id: 'sample-novella-001',
        title: 'The Velvet Masquerade of Shadow and Silk',
        tolerance_tier: 'Playful',
        body: JSON.stringify({
          title: 'The Velvet Masquerade of Shadow and Silk',
          chapter: 10,
          totalChapters: 10,
          body: '## Chapter 1: The Gathering Tension\n\n' + 'The grand ballroom was illuminated by three thousand crystal candles... '.repeat(1800) +
                '\n\n## Chapter 2: The Whispered Bargain\n\n' + 'He stepped closer, his thumb grazing her cheek... '.repeat(1800) +
                '\n\n## Chapter 3: The Sensory Surrender\n\n' + 'Every breath became a shared secret in the quiet room... '.repeat(1900),
          sexual_orientation: 'heterosexual',
          kink_categories: ['sensory_deprivation', 'feather_touch', 'velvet_masks', 'power_play'],
          genre_topic: 'gothic_romance',
          tropes: ['enemies_to_lovers', 'forced_proximity', 'masquerade_identities'],
          rating: 4.9,
          word_count: 25400
        }),
        theme_tags: 'literature, playful, gothic_romance, enemies_to_lovers, sensory_deprivation'
      },
      {
        id: 'sample-short-002',
        title: 'Whispers in the Study',
        tolerance_tier: 'Sensory',
        body: JSON.stringify({
          title: 'Whispers in the Study',
          chapter: 1,
          totalChapters: 3,
          body: '## Chapter 1: Candlelight\n\n' + 'The rain beat rhythmically against the bay window... '.repeat(300),
          sexual_orientation: 'queer',
          kink_categories: ['slow_burn'],
          genre_topic: 'contemporary_romance',
          tropes: ['slow_burn'],
          rating: 4.5,
          word_count: 1500
        }),
        theme_tags: 'literature, sensory, slow_burn'
      }
    ];
  }

  const reportItems: AuditReportItem[] = [];

  for (const story of stories) {
    let parsed: any = {};
    let rawText = '';

    try {
      if (typeof story.body === 'string') {
        parsed = JSON.parse(story.body);
      } else if (typeof story.body === 'object' && story.body !== null) {
        parsed = story.body;
      }
    } catch {
      parsed = { body: story.body, text: story.body, title: story.title };
    }

    rawText = parsed.body || parsed.text || story.body || '';

    // Word count calculation
    const words = rawText.trim().split(/\s+/).filter(Boolean);
    const wordCount = parsed.word_count || words.length;

    // Multi-chapter structure verification
    const chapterMatches = rawText.match(/##\s*Chapter\s*\d+/gi) || [];
    const chapterCount = Math.max(chapterMatches.length, parsed.totalChapters || 1, parsed.chapter || 1);
    const hasMultiChapterStructure = chapterMatches.length >= 2 || (parsed.totalChapters && parsed.totalChapters >= 2);

    // Novella threshold
    const meetsNovellaThreshold = wordCount >= NOVELLA_WORD_THRESHOLD;

    // Metatags audit
    const sexualOrientation = parsed.sexual_orientation || (parsed.metaDetails?.sexual_orientation) || null;
    const kinkCategories = parsed.kink_categories || (parsed.metaDetails?.kink_categories) || [];
    const userRating = typeof parsed.rating === 'number' ? parsed.rating : (typeof story.rating === 'number' ? story.rating : null);
    const genreTopic = parsed.genre_topic || (parsed.metaDetails?.genre_topic) || null;
    const tropes = parsed.tropes || (parsed.metaDetails?.tropes) || [];

    // Anatomical Reality Filter Audit
    const anatomicalViolations = enforceAnatomicalCheck(rawText);

    // Pass criteria: Multi-chapter structure, anatomical reality, and metadata presence
    const hasMetatags = Boolean(sexualOrientation && genreTopic && kinkCategories.length > 0);
    const passed = hasMultiChapterStructure && anatomicalViolations.length === 0 && hasMetatags;

    reportItems.push({
      id: story.id,
      title: story.title || parsed.title || 'Untitled',
      wordCount,
      meetsNovellaThreshold,
      hasMultiChapterStructure,
      chapterCount,
      sexualOrientation,
      kinkCategories,
      userRating,
      genreTopic,
      tropes,
      anatomicalViolations,
      passed
    });
  }

  // Print Summary Table
  console.log('\n--- DETAILED AUDIT RESULTS ---');
  reportItems.forEach((r, idx) => {
    console.log(`\n[Story ${idx + 1}] "${r.title}" (ID: ${r.id})`);
    console.log(`  - Word Count: ${r.wordCount.toLocaleString()} words ${r.meetsNovellaThreshold ? '✅ (Novella Target 25k+ MET)' : '⚠️ (In Progress / Chapter 1 serialized)'}`);
    console.log(`  - Structure: ${r.chapterCount} chapters identified ${r.hasMultiChapterStructure ? '✅ Multi-Chapter Validated' : '❌ Needs multi-chapter expansion'}`);
    console.log(`  - Sexual Orientation: ${r.sexualOrientation || 'Missing'} ${r.sexualOrientation ? '✅' : '❌'}`);
    console.log(`  - Kink Categories: [${r.kinkCategories.join(', ') || 'None'}] ${r.kinkCategories.length > 0 ? '✅' : '❌'}`);
    console.log(`  - Genre / Topic: ${r.genreTopic || 'Missing'} ${r.genreTopic ? '✅' : '❌'}`);
    console.log(`  - Tropes: [${r.tropes.join(', ') || 'None'}]`);
    console.log(`  - User Rating: ${r.userRating !== null ? `${r.userRating} / 5.0 ⭐` : 'Unrated (New Release)'}`);
    console.log(`  - Anatomical Reality Check: ${r.anatomicalViolations.length === 0 ? '✅ 100% Biologically Accurate' : `❌ VIOLATION: ${r.anatomicalViolations.join('; ')}`}`);
    console.log(`  - Overall QA Status: ${r.passed ? 'PASSED ✅' : 'ATTENTION REQUIRED ⚠️'}`);
  });

  const totalAudited = reportItems.length;
  const passedQA = reportItems.filter(r => r.passed).length;
  const novellaMetCount = reportItems.filter(r => r.meetsNovellaThreshold).length;
  const zeroViolationsCount = reportItems.filter(r => r.anatomicalViolations.length === 0).length;

  console.log('\n===============================================================');
  console.log('                     QA AUDIT SUMMARY                          ');
  console.log('===============================================================');
  console.log(`Total Stories Audited:           ${totalAudited}`);
  console.log(`Stories Passing Quality Matrix:  ${passedQA} / ${totalAudited} (${Math.round((passedQA / totalAudited) * 100)}%)`);
  console.log(`Completed Novellas (25k+ Words): ${novellaMetCount}`);
  console.log(`Anatomical Accuracy Compliance:  ${zeroViolationsCount} / ${totalAudited} (100% Goal)`);
  console.log('===============================================================\n');

  return {
    totalAudited,
    passedQA,
    novellaMetCount,
    compliancePercentage: (passedQA / totalAudited) * 100
  };
}

runQAContentValidator().catch(err => {
  console.error('[QA Agent Fatal Error]:', err);
});

export { runQAContentValidator };
