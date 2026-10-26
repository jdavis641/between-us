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
 * WEEKLY DEMAND CROSS-REFERENCING (Sundays Cadence)
 * Aggregates user search queries, tags, and suggested ideas, cross-references
 * against existing library inventory to find gaps, and generates custom stories for next week.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = getAdminClient();
  const openaiKey = process.env.OPENROUTER_API_KEY;

  try {
    // 1. Fetch recent user activity and search tags (past 30 days)
    const { data: recentActivity } = await supabase
      .from('activity_history')
      .select('content_title, category, tags, completed_at')
      .order('completed_at', { ascending: false })
      .limit(100);

    // 2. Fetch user suggested scenarios & requested themes
    const { data: suggestions } = await supabase
      .from('scenario_suggestions')
      .select('title, suggestion_text, category, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    // 3. Extract demand clusters and themes
    const demandItems: { topic: string; category?: string; source: string }[] = [];

    (recentActivity || []).forEach(act => {
      if (act.content_title && act.content_title.length > 3) {
        demandItems.push({ topic: act.content_title, category: act.category, source: 'activity_search' });
      }
      if (Array.isArray(act.tags)) {
        act.tags.forEach((tag: string) => {
          if (tag && !['couple', 'group', 'library_retrieval', 'scripted'].includes(tag.toLowerCase())) {
            demandItems.push({ topic: tag.replace(/_/g, ' '), category: act.category, source: 'activity_tag' });
          }
        });
      }
    });

    (suggestions || []).forEach(sug => {
      if (sug.title) {
        demandItems.push({ topic: sug.title, category: sug.category, source: 'user_suggestion' });
      }
    });

    // Fallback baseline demand clusters if user activity is sparse
    if (demandItems.length < 5) {
      demandItems.push(
        { topic: "Gothic Masquerade and Whispered Identities", category: "literature", source: "curated_trend" },
        { topic: "Enemies to Lovers Boardroom Power Play", category: "literature", source: "curated_trend" },
        { topic: "Stranded Stormy Cabin Feather Touch and Sensory Pacing", category: "literature", source: "curated_trend" },
        { topic: "Late Night Velvet Blindfold Sensory Exploration", category: "literature", source: "curated_trend" }
      );
    }

    // 4. Cross-reference against existing library inventory
    const { data: existingLibrary } = await supabase
      .from('generated_content')
      .select('id, title, theme_tags, tolerance_tier')
      .eq('content_type', 'literature')
      .in('status', ['active', 'completed', 'chapter_1_ready'])
      .limit(200);

    const unmetGaps: { topic: string; category: string }[] = [];

    for (const item of demandItems) {
      const topicLower = item.topic.toLowerCase();
      const hasMatch = (existingLibrary || []).some(lib => {
        const titleMatch = lib.title && lib.title.toLowerCase().includes(topicLower);
        const tagMatch = lib.theme_tags && lib.theme_tags.toLowerCase().includes(topicLower);
        return titleMatch || tagMatch;
      });

      if (!hasMatch && !unmetGaps.some(g => g.topic.toLowerCase() === topicLower)) {
        unmetGaps.push({ topic: item.topic, category: item.category || 'literature' });
      }
    }

    // 5. Select top unmet demand gaps to dynamically generate (up to 4 custom stories)
    const topGapsToGenerate = unmetGaps.slice(0, 4);
    const generatedStories: any[] = [];

    if (openaiKey && topGapsToGenerate.length > 0) {
      const openai = new OpenAI({
        apiKey: openaiKey,
        baseURL: 'https://openrouter.ai/api/v1'
      });

      for (const gap of topGapsToGenerate) {
        try {
          const systemPrompt = `You are an expert serialized romantic fantasy and novella novelist.
NOVELLA LENGTH TARGET & MULTI-CHAPTER COMPLETENESS DIRECTIVE:
You are generating a complete, expansive 3-chapter novella targeting deep emotional and sensual progression.
Maintain rich character interiority, atmospheric detail, and uncompromising literary excellence from start to finish.

ANATOMICAL REALITY FILTER & BIOLOGICAL ACCURACY DIRECTIVE (ZERO TOLERANCE):
Strictly adhere to anatomical and biological reality. Never reference impossible anatomy (e.g. female prostate).

Demand-Driven Custom Topic: "${gap.topic}"
Tolerance Tier: Moderate / Playful

JSON SCHEMA REQUIREMENT:
Return a valid JSON object matching:
{
  "title": "An evocative title reflecting the theme",
  "chapter": 3,
  "totalChapters": 3,
  "body": "## Chapter 1: The Inciting Spark\\n\\n[Full Chapter 1 prose...]\\n\\n## Chapter 2: The Deepening Heat\\n\\n[Full Chapter 2 prose...]\\n\\n## Chapter 3: The Climax\\n\\n[Full Chapter 3 climax prose...]",
  "text": "## Chapter 1: The Inciting Spark\\n\\n[Full Chapter 1 prose...]\\n\\n## Chapter 2: The Deepening Heat\\n\\n[Full Chapter 2 prose...]\\n\\n## Chapter 3: The Climax\\n\\n[Full Chapter 3 climax prose...]"
}`;

          const completion = await openai.chat.completions.create({
            model: 'sao10k/l3.1-euryale-70b',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Write the story for unmet demand: ${gap.topic}` }],
            response_format: { type: 'json_object' },
            temperature: 0.85
          });

          const raw = completion.choices[0]?.message?.content || '{}';
          let cleaned = enforceAnatomicalReality(raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim());
          const parsed = JSON.parse(cleaned);

          if (parsed.body) parsed.body = enforceAnatomicalReality(parsed.body);
          if (parsed.text) parsed.text = enforceAnatomicalReality(parsed.text);

          const storyText = parsed.body || parsed.text || '';
          const detailedMeta = extractDetailedMetaTags({
            theme: gap.topic,
            targetBoundary: 'Playful',
            playMode: 'couple',
            contentType: 'literature',
            rawText: storyText
          });

          parsed.metaTags = detailedMeta.tags;
          parsed.tolerance_tier = 'Playful';
          parsed.play_mode = 'couple';
          parsed.theme_tags = detailedMeta.tags.join(', ');
          parsed.sexual_orientation = detailedMeta.sexual_orientation;
          parsed.kink_categories = detailedMeta.kink_categories;
          parsed.genre_topic = detailedMeta.genre_topic;
          parsed.tropes = detailedMeta.tropes;
          parsed.word_count = detailedMeta.word_count;
          parsed.source = 'demand_driven_weekly_planning';
          parsed.status = 'completed';

          const storyId = crypto.randomUUID();
          const embedding = await getSemanticEmbedding(`${parsed.title} ${gap.topic} ${storyText.slice(0, 3000)}`);

          const payload = {
            id: storyId,
            content_type: 'literature',
            title: parsed.title || gap.topic,
            body: JSON.stringify(parsed),
            status: 'completed',
            tolerance_tier: 'Playful',
            play_mode: 'couple',
            theme_tags: detailedMeta.tags.join(', '),
            theme_embedding: formatVectorForPg(embedding),
            created_at: new Date().toISOString()
          };

          const { error: insertErr } = await supabase.from('generated_content').insert(payload);
          if (!insertErr) {
            generatedStories.push({
              id: storyId,
              title: payload.title,
              demand_topic: gap.topic,
              word_count: detailedMeta.word_count,
              status: 'cataloged'
            });
          }
        } catch (storyErr: any) {
          console.error(`[Weekly Planning] Failed to generate gap story for "${gap.topic}":`, storyErr.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      cadence: 'Weekly Demand Cross-Referencing & Planning',
      demands_analyzed: demandItems.length,
      existing_library_count: existingLibrary?.length || 0,
      unmet_gaps_identified: unmetGaps.length,
      gaps_queued: topGapsToGenerate.map(g => g.topic),
      stories_generated: generatedStories
    });
  } catch (err: any) {
    console.error("[Weekly Planning Cadence Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
