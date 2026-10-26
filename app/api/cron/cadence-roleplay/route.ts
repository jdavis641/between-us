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
 * WEDNESDAYS CADENCE: Generate and catalog fresh roleplay scenarios
 * Across all tolerance tiers: Sensory, Playful, Intense, Extreme
 * Complete with Storyboard, Pre-Experience Tasks, Partner Perspectives, and Dialogue Scripts.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = getAdminClient();
  const tiers: ('Sensory' | 'Playful' | 'Intense' | 'Extreme')[] = ['Sensory', 'Playful', 'Intense', 'Extreme'];

  const roleplayThemesByTier: Record<string, string[]> = {
    Sensory: [
      "The Spa Sanctuary: Warm oils, soft candlelight, quiet whispered breathing, and complete tension release",
      "The Artist & The Muse: Delicate charcoal sketch session escalating into slow, reverence-filled touch"
    ],
    Playful: [
      "The Room Service Imposter: Late night hotel room knock, champagne on ice, and playful boundary negotiation",
      "The Speakeasy Strangers: Meeting across a crowded 1920s jazz lounge pretending not to know each other"
    ],
    Intense: [
      "Master & Governess of Ravenloft: A strict Victorian dynamic, velvet blindfolds, and demanding obedience",
      "The CEO's Closed Door Meeting: Power dynamic in an empty high-rise boardroom after hours"
    ],
    Extreme: [
      "The Dungeon Sovereign: Heavy leather restraints, complete psychological surrender, and strict command",
      "Total Submission Chamber: Sensory overload ritual under candlelight with zero inhibition"
    ]
  };

  const results: any[] = [];
  const openaiKey = process.env.OPENROUTER_API_KEY;

  if (!openaiKey) {
    return NextResponse.json({
      success: false,
      error: "Missing OPENROUTER_API_KEY for Wednesday roleplay generation"
    }, { status: 500 });
  }

  const openai = new OpenAI({
    apiKey: openaiKey,
    baseURL: 'https://openrouter.ai/api/v1'
  });

  for (const tier of tiers) {
    const scenarios = roleplayThemesByTier[tier] || [];
    for (const theme of scenarios) {
      try {
        const prompt = `You are an expert intimacy and roleplay script architect.
Generate a fresh, immersive roleplay scenario.
Tolerance Tier: ${tier}
Theme: "${theme}"

ANATOMICAL REALITY FILTER:
Strictly adhere to biological and anatomical accuracy. Never reference impossible anatomy (e.g. female prostate).

JSON SCHEMA REQUIREMENT:
Return a valid JSON object matching:
{
  "title": "A catchy title for the scenario",
  "overview": "The Storyboard. Atmospheric, setting-the-scene context with rich sensory details.",
  "preExperienceTasks": [
    "Pre-Experience Task for Partner A (lighting, attire, mental prep)",
    "Pre-Experience Task for Partner B (setting the mood, physical prep)"
  ],
  "partnerAPerspective": "Internal motivation, sensory cues, and emotional focus for Partner A.",
  "partnerBPerspective": "Internal motivation, sensory cues, and emotional focus for Partner B.",
  "fullScript": "Back-and-forth dialogue script and stage directions for both partners to follow."
}`;

        const completion = await openai.chat.completions.create({
          model: 'sao10k/l3.1-euryale-70b',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.85
        });

        const raw = completion.choices[0]?.message?.content || '{}';
        let cleaned = enforceAnatomicalReality(raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim());
        const parsed = JSON.parse(cleaned);

        if (parsed.overview) parsed.overview = enforceAnatomicalReality(parsed.overview);
        if (parsed.fullScript) parsed.fullScript = enforceAnatomicalReality(parsed.fullScript);

        const fullText = `${parsed.overview || ''} ${parsed.fullScript || ''}`;
        const detailedMeta = extractDetailedMetaTags({
          theme,
          targetBoundary: tier,
          playMode: 'couple',
          contentType: 'roleplay',
          rawText: fullText
        });

        parsed.metaTags = detailedMeta.tags;
        parsed.tolerance_tier = tier;
        parsed.play_mode = 'couple';
        parsed.theme_tags = detailedMeta.tags.join(', ');
        parsed.sexual_orientation = detailedMeta.sexual_orientation;
        parsed.kink_categories = detailedMeta.kink_categories;
        parsed.genre_topic = detailedMeta.genre_topic;
        parsed.tropes = detailedMeta.tropes;

        const roleplayId = crypto.randomUUID();
        const embedding = await getSemanticEmbedding(`${parsed.title} ${theme} ${fullText.slice(0, 3000)}`);

        const payload = {
          id: roleplayId,
          content_type: 'roleplay',
          title: parsed.title || `${tier} Roleplay`,
          body: JSON.stringify(parsed),
          pre_experience_tasks: parsed.preExperienceTasks || null,
          status: 'active',
          tolerance_tier: tier,
          play_mode: 'couple',
          theme_tags: detailedMeta.tags.join(', '),
          theme_embedding: formatVectorForPg(embedding),
          created_at: new Date().toISOString()
        };

        const { error: insertErr } = await supabase.from('generated_content').insert(payload);
        if (!insertErr) {
          results.push({
            id: roleplayId,
            title: payload.title,
            tier,
            theme,
            status: 'cataloged'
          });
        }
      } catch (err: any) {
        console.error(`[Wednesday Cadence] Error generating roleplay for ${tier}:`, err.message);
      }
    }
  }

  return NextResponse.json({
    success: true,
    cadence: 'Wednesdays - Fresh Roleplay Scenarios Cataloging',
    total_generated: results.length,
    results
  });
}
