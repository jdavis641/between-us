export const maxDuration = 300;
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { enforceAnatomicalReality } from '@/lib/async-chapters';
import { getSemanticEmbedding, formatVectorForPg } from '@/lib/embeddings';
import { extractDetailedMetaTags } from '@/lib/metadata';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * TUESDAYS CADENCE: Generate a batch of 12 new erotic stories (3 per tolerance tier)
 * Tolerance Tiers: Sensory (3), Playful (3), Intense (3), Extreme (3)
 * Target: Novella-structured chapters with anatomical accuracy and rich metatagging
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = getAdminClient();
  const tiers: ('Sensory' | 'Playful' | 'Intense' | 'Extreme')[] = ['Sensory', 'Playful', 'Intense', 'Extreme'];
  const storiesPerTier = 3;

  const tierThemePresets: Record<string, string[]> = {
    Sensory: [
      "Slow-burn candlelit retreat in an isolated coastal cabin, focus on featherlight touch and breathwork",
      "Gothic library after midnight: rain on stained glass, velvet armchairs, and whispered confessions",
      "Silk blindfold and warm massage oil sensory exploration with heightened tactile anticipation"
    ],
    Playful: [
      "Masquerade ball secret rendezvous behind heavy velvet curtains with playful teasing and forbidden kisses",
      "Late-night hotel suite room service game: daring stakes and escalating strip challenges",
      "Rooftop champagne under city lights with scandalous whispers and sudden passionate surrender"
    ],
    Intense: [
      "Moonlit manor study: strict power dynamic, breathless commands, and total focused devotion",
      "Ancient vampire's ballroom: slow, electric seduction with dominant collar-touch and undeniable submission",
      "Secluded mountain chalet: intense sensory deprivation and overwhelming climactic release"
    ],
    Extreme: [
      "Total surrender behind closed chamber doors: heavy velvet restraints and breathless obedience",
      "Sensory overload ritual in a dark gothic sanctuary: electric desire and uninhibited passion",
      "Forbidden underground speakeasy: dominant authority and complete visceral ecstasy"
    ]
  };

  const results: any[] = [];
  const openaiKey = process.env.OPENROUTER_API_KEY;

  if (!openaiKey) {
    return NextResponse.json({
      success: false,
      error: "Missing OPENROUTER_API_KEY for Tuesday story generation"
    }, { status: 500 });
  }

  const openai = new OpenAI({
    apiKey: openaiKey,
    baseURL: 'https://openrouter.ai/api/v1'
  });

  for (const tier of tiers) {
    const presets = tierThemePresets[tier] || [];
    for (let i = 0; i < storiesPerTier; i++) {
      const theme = presets[i] || `${tier} Intimacy Exploration`;

      try {
        const systemPrompt = `You are a master of serialized erotic fantasy literature and romantic novellas.
NOVELLA LENGTH TARGET & MULTI-CHAPTER COMPLETENESS DIRECTIVE:
The overarching narrative is an expansive, structured novella targeting minimum 25,000 words across structured chapters from start to finish.
You are generating a complete, expansive multi-chapter story (Chapters 1, 2, and 3) in this generation run.
Maintain deep narrative breadth, intricate scene building, character interiority, granular sensory details, and uncompromising literary excellence. Never condense, summarize, or skip scenes.

ANATOMICAL REALITY FILTER & BIOLOGICAL ACCURACY DIRECTIVE (ZERO TOLERANCE):
You must strictly uphold anatomical and biological reality in all descriptions:
1. ABSOLUTELY FORBIDDEN: Anatomically impossible or biologically erroneous descriptions (e.g., strictly NEVER attribute a prostate, testicular sensation, or male genitalia to cisgender females; strictly NEVER describe female ejaculation as originating from a prostate; never misplace organs, glands, or physiological responses).
2. ACCURATE PHYSIOLOGY: When describing female anatomy, arousal, and orgasm, accurately reference the clitoris (glans, shaft, crura), labia, vaginal canal, G-spot/anterior vaginal wall, Skene's glands, cervix, pelvic floor muscles, and genuine lubrication/sensory pathways. When describing male anatomy, accurately reference the glans, shaft, perineum, prostate, testes, and urethral contractions.
3. HIGH DETAIL & GRANULAR PHYSICALITY: Ensure rich, highly detailed descriptive features for all characters and atmospheric environments.
4. NO CLINICAL STERILITY: Use vivid, visceral, uncompromising erotic language while ensuring anatomical precision.

Tolerance Tier: ${tier}
Theme: "${theme}"

JSON SCHEMA REQUIREMENT:
Return a valid JSON object matching:
{
  "title": "A captivating, evocative title",
  "chapter": 3,
  "totalChapters": 3,
  "body": "## Chapter 1: The Gathering Tension\\n\\n[Full Chapter 1 prose...]\\n\\n## Chapter 2: The Escalation\\n\\n[Full Chapter 2 prose...]\\n\\n## Chapter 3: The Climax\\n\\n[Full Chapter 3 climax prose...]",
  "text": "## Chapter 1: The Gathering Tension\\n\\n[Full Chapter 1 prose...]\\n\\n## Chapter 2: The Escalation\\n\\n[Full Chapter 2 prose...]\\n\\n## Chapter 3: The Climax\\n\\n[Full Chapter 3 climax prose...]"
}`;

        const completion = await openai.chat.completions.create({
          model: 'sao10k/l3.1-euryale-70b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Write the full 3-chapter novella experience for theme: ${theme}` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.85,
          max_tokens: 4000
        });

        const raw = completion.choices[0]?.message?.content || '{}';
        let cleaned = enforceAnatomicalReality(raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim());
        const parsed = JSON.parse(cleaned);

        if (parsed.body) parsed.body = enforceAnatomicalReality(parsed.body);
        if (parsed.text) parsed.text = enforceAnatomicalReality(parsed.text);

        const storyText = parsed.body || parsed.text || '';
        const detailedMeta = extractDetailedMetaTags({
          theme,
          targetBoundary: tier,
          playMode: 'couple',
          contentType: 'literature',
          rawText: storyText
        });

        parsed.metaTags = detailedMeta.tags;
        parsed.tolerance_tier = tier;
        parsed.play_mode = 'couple';
        parsed.theme_tags = detailedMeta.tags.join(', ');
        parsed.sexual_orientation = detailedMeta.sexual_orientation;
        parsed.kink_categories = detailedMeta.kink_categories;
        parsed.genre_topic = detailedMeta.genre_topic;
        parsed.tropes = detailedMeta.tropes;
        parsed.word_count = detailedMeta.word_count;
        parsed.status = 'completed';

        const storyId = crypto.randomUUID();
        const embedding = await getSemanticEmbedding(`${parsed.title} ${theme} ${storyText.slice(0, 3000)}`);

        const payload = {
          id: storyId,
          content_type: 'literature',
          title: parsed.title || `${tier} Novella`,
          body: JSON.stringify(parsed),
          status: 'completed',
          tolerance_tier: tier,
          play_mode: 'couple',
          theme_tags: detailedMeta.tags.join(', '),
          theme_embedding: formatVectorForPg(embedding),
          created_at: new Date().toISOString()
        };

        const { error: insertErr } = await supabase.from('generated_content').insert(payload);
        if (!insertErr) {
          results.push({
            id: storyId,
            title: payload.title,
            tier,
            word_count: detailedMeta.word_count,
            tropes: detailedMeta.tropes,
            status: 'cataloged'
          });
        } else {
          console.error(`[Tuesday Cadence] Supabase insert failed for ${payload.title}:`, insertErr);
        }
      } catch (genErr: any) {
        console.error(`[Tuesday Cadence] Error generating story for ${tier} (item ${i + 1}):`, genErr.message);
      }
    }
  }

  return NextResponse.json({
    success: true,
    cadence: 'Tuesdays - 12 Erotic Stories Batch Generation',
    total_generated: results.length,
    results
  });
}
