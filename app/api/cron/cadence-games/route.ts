export const maxDuration = 300;
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { enforceAnatomicalReality } from '@/lib/async-chapters';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * MONDAYS CADENCE: Refresh and update variations of all intimacy games across every tolerance tier
 * Tiers: Sensory, Playful, Intense, Extreme
 * Categories: card, movie, drinking, date_night
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = getAdminClient();
  const tiers = ['Sensory', 'Playful', 'Intense', 'Extreme'];
  const categories = ['card', 'movie', 'drinking', 'date_night'];

  const results: any[] = [];
  const openaiKey = process.env.OPENROUTER_API_KEY;

  for (const tier of tiers) {
    for (const category of categories) {
      try {
        let gameData: any = null;

        if (openaiKey) {
          const openai = new OpenAI({
            apiKey: openaiKey,
            baseURL: 'https://openrouter.ai/api/v1'
          });

          const prompt = `You are a master relationship intimacy designer.
Generate a fresh, original intimacy game for couples/partners.
Category: ${category}
Intensity/Tolerance Tier: ${tier}

CRITICAL RULES:
1. Enforce strict biological and anatomical reality (no anatomically impossible tropes).
2. For category "card": 5 escalating question/action cards.
3. For category "movie": 5 sensory cues to watch for during a film to trigger intimate micro-actions.
4. For category "drinking": 5 playful consent-first drink or sensory dare prompts.
5. For category "date_night": 5 romantic tension-building activities.

Return valid JSON matching:
{
  "title": "A captivating title for the game",
  "description": "2-3 sentences explaining the premise and mood",
  "category": "${category}",
  "intensity": "${tier}",
  "rules": [
    "Rule / Step 1",
    "Rule / Step 2",
    "Rule / Step 3",
    "Rule / Step 4",
    "Rule / Step 5"
  ]
}`;

          const completion = await openai.chat.completions.create({
            model: 'sao10k/l3.1-euryale-70b',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.8
          });

          const raw = completion.choices[0]?.message?.content || '{}';
          const cleaned = enforceAnatomicalReality(raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim());
          gameData = JSON.parse(cleaned);
        } else {
          // Fallback template generation when offline
          gameData = {
            title: `${tier} ${category.replace('_', ' ')} Challenge`,
            description: `A curated ${tier.toLowerCase()} round designed to heighten mutual connection and playful tension.`,
            category,
            intensity: tier,
            rules: [
              "Set aside uninterrupted time in a comfortable, distraction-free environment.",
              "Take turns drawing or initiating each prompt at your shared comfort level.",
              "Check in with each other to adapt intensity as the round progresses."
            ]
          };
        }

        const gameId = crypto.randomUUID();
        const payload = {
          id: gameId,
          title: gameData.title,
          description: gameData.description,
          category: gameData.category || category,
          intensity: gameData.intensity || tier,
          content: {
            rules: gameData.rules || [],
            category: gameData.category || category,
            intensity: gameData.intensity || tier,
            updated_cadence: 'Monday_Refresh'
          },
          updated_at: new Date().toISOString()
        };

        // Upsert into intimacy_games table
        const { error: dbErr } = await supabase.from('intimacy_games').upsert(payload);
        if (!dbErr) {
          results.push({ id: gameId, title: payload.title, tier, category, status: 'synced' });
        } else {
          // Fallback to generated_content catalog
          await supabase.from('generated_content').insert({
            id: gameId,
            content_type: 'game',
            title: payload.title,
            body: JSON.stringify(payload),
            tolerance_tier: tier,
            play_mode: 'couple',
            status: 'active'
          });
          results.push({ id: gameId, title: payload.title, tier, category, status: 'cataloged' });
        }
      } catch (err: any) {
        console.warn(`[Monday Cadence] Error refreshing ${tier} ${category}:`, err.message);
      }
    }
  }

  return NextResponse.json({
    success: true,
    cadence: 'Mondays - Intimacy Games Refresh',
    refreshed_count: results.length,
    results
  });
}
