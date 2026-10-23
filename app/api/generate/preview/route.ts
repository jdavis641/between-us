export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/utils/supabase/server";
import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import OpenAI from 'openai';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  return createAdminSupabase(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function resolveUser(req: Request) {
  const admin = getAdminClient();
  let user: any = null;

  // 1. Try Authorization header Bearer token first
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && token !== 'undefined' && token !== 'null') {
      try {
        const { data: jwtData, error: jwtError } = await admin.auth.getUser(token);
        if (jwtData?.user && !jwtError) {
          user = jwtData.user;
        }
      } catch (e) {
        console.warn('[Preview Auth] admin.auth.getUser(token) failed:', e);
      }
    }
  }

  // 2. Try cookie-based session via createServerSupabase()
  if (!user) {
    try {
      const supabase = await createServerSupabase();
      const { data: cookieUserData, error: cookieAuthError } = await supabase.auth.getUser();
      if (cookieUserData?.user && !cookieAuthError) {
        user = cookieUserData.user;
      }
    } catch (e) {
      console.warn('[Preview Auth] Cookie-based getUser() failed:', e);
    }
  }

  return user;
}

function getCuratedPreviews(theme?: string) {
  return [
    {
      id: "1",
      title: theme ? `${theme}: Forced Proximity` : "Midnight Strangers",
      trope: "Forced Proximity",
      premise: "Trapped together when a late-night storm cuts off the mountain pass, old barriers melt into raw, irresistible attraction."
    },
    {
      id: "2",
      title: theme ? `${theme}: Enemies to Lovers` : "Tension & Surrender",
      trope: "Enemies to Lovers",
      premise: "Fierce rivals competing for the same coveted prize find that their sharpest banter barely masks an overwhelming mutual craving."
    },
    {
      id: "3",
      title: theme ? `${theme}: Second Chance` : "Echoes of Desire",
      trope: "Second Chance",
      premise: "Reunited after years apart under the sultry glow of a masquerade ball, past unspoken desires demand an unforgettable reckoning."
    }
  ];
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      pacing = "Medium Burn",
      storyLength = "Short Story",
      targetBoundary,
      theme
    } = body;
    const playMode = body.playMode?.toLowerCase() === "group" ? "group" : "couple";

    const user = await resolveUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Auth Rejected: Session missing or expired. Please refresh your browser.' }, 
        { status: 401 }
      );
    }

    const admin = getAdminClient();

    // Fetch Preferences using service-role authority
    const { data: preferences } = await admin
      .from('intimacy_preferences')
      .select('category_tag, preference_level, kinks_override')
      .eq('user_id', user.id);

    const baseTolerance = targetBoundary || (preferences?.find(p => p.category_tag === 'Base Tolerance' || p.category_tag === 'Primary Directive')?.preference_level || 'Moderate');

    const mandatoryThemes = preferences
      ?.filter(p => p.preference_level === 'Definitely' || p.preference_level === 'Curious')
      .map(p => p.category_tag)
      .filter(tag => tag && tag !== 'Base' && tag !== 'Guest Pass Config')
      .join(', ') || 'None specified';

    const excludedVariables = preferences
      ?.filter(p => p.preference_level === 'Off-Limits')
      .map(p => p.category_tag)
      .filter(tag => tag && tag !== 'Base' && tag !== 'Guest Pass Config')
      .join(', ') || 'None specified';

    let primaryDirective = null;
    let savedKinks: string[] = [];
    const kinkRow = preferences?.find(p => p.kinks_override && p.category_tag !== 'Guest Pass Config');
    if (kinkRow?.kinks_override) {
      try {
        const parsed = JSON.parse(kinkRow.kinks_override);
        if (Array.isArray(parsed)) {
          primaryDirective = parsed.map((k: any) => k.text || k).join('\n');
          savedKinks = parsed.map((k: any) => typeof k === 'string' ? k : (k?.text || '')).filter(Boolean);
        } else {
          primaryDirective = kinkRow.kinks_override;
          savedKinks = [kinkRow.kinks_override];
        }
      } catch (e) {
        primaryDirective = kinkRow.kinks_override;
        savedKinks = [kinkRow.kinks_override];
      }
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("[Preview] OPENROUTER_API_KEY not set, serving curated previews.");
      return NextResponse.json({ previews: getCuratedPreviews(theme) });
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const systemPrompt = `You are a master romantic fiction and serialized erotic literature architect.
Generate exactly 3 distinct, compelling story preview concepts/tropes tailored to the user's boundaries and chosen pacing.

USER PREFERENCES & CONSTRAINTS:
- Selected Pacing: ${pacing}
- Target Boundary Intensity: ${baseTolerance}
- Mandatory Included Themes: ${mandatoryThemes}
- Strictly Excluded Variables (ABSOLUTELY FORBIDDEN): ${excludedVariables}
- Play Mode / Perspective: ${playMode}
${primaryDirective ? `- Primary Directive Override: ${primaryDirective}` : ''}
${theme ? `- Custom Theme / Idea: ${theme}` : ''}
${savedKinks.length > 0 ? `USER SAVED KINK PREFERENCES (METATAGS):
<metatags>
${savedKinks.map(k => `<kink>${k}</kink>`).join('\n')}
</metatags>
Subtly incorporate and reflect these user preference metatags across the generated preview concepts where appropriate.` : ''}

PACING GUIDELINES:
- Slow Burn: Heavy on emotional friction, intense yearning, lingering eye contact, forbidden anticipation, and delayed physical gratification.
- Medium Burn: Balanced romantic momentum, witty tension, escalating physical closeness, and steady buildup to intimacy.
- Quick Burn: Immediate electric attraction, high-voltage chemistry, irresistible temptation, and rapid escalation.

OUTPUT FORMAT REQUIREMENTS:
You MUST return a valid JSON object matching this schema exactly:
{
  "previews": [
    {
      "id": "1",
      "title": "Evocative Title 1",
      "trope": "Core Trope Name (e.g. Forced Proximity, Enemies to Lovers, Fake Marriage, Secret Identity, Second Chance, Rivals, Guardian & Ward, etc.)",
      "premise": "A gripping 2-3 sentence hook outlining the characters, central friction, and sensual tension."
    },
    {
      "id": "2",
      "title": "Evocative Title 2",
      "trope": "Core Trope Name",
      "premise": "A gripping 2-3 sentence hook outlining the characters, central friction, and sensual tension."
    },
    {
      "id": "3",
      "title": "Evocative Title 3",
      "trope": "Core Trope Name",
      "premise": "A gripping 2-3 sentence hook outlining the characters, central friction, and sensual tension."
    }
  ]
}
NEVER include markdown backticks outside of JSON. Output strictly valid JSON.`;

    const userPrompt = `Generate 3 diverse story preview concepts. Pacing: ${pacing}. Length planned: ${storyLength}.${theme ? ` Incorporate theme: "${theme}".` : ''}`;

    let previews: any[] = [];

    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 20000);

      const completion = await openai.chat.completions.create({
        model: "sao10k/l3.1-euryale-70b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
        extra_body: {
          models: [
            "sao10k/l3.1-euryale-70b",
            "cognitivecomputations/dolphin-mistral-24b-venice-edition",
            "neversleep/llama-3.1-lumimaid-70b"
          ]
        }
      } as any, { signal: abortController.signal });

      clearTimeout(timeoutId);

      const rawResponse = completion.choices[0]?.message?.content || "";

      try {
        const cleaned = rawResponse.trim()
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed)) {
          previews = parsed;
        } else if (Array.isArray(parsed.previews)) {
          previews = parsed.previews;
        } else if (Array.isArray(parsed.tropes)) {
          previews = parsed.tropes;
        } else if (Array.isArray(parsed.concepts)) {
          previews = parsed.concepts;
        }
      } catch (parseErr) {
        console.warn("Error parsing preview JSON:", parseErr, rawResponse);
      }
    } catch (llmErr) {
      console.warn("[Preview] OpenRouter call failed or timed out, using curated previews:", llmErr);
    }

    // Fallback if model did not return 3 items
    if (!previews || previews.length < 3) {
      previews = getCuratedPreviews(theme);
    }

    // Ensure IDs and fields exist
    previews = previews.slice(0, 3).map((item, idx) => ({
      id: item.id || String(idx + 1),
      title: item.title || `Concept ${idx + 1}`,
      trope: item.trope || "Romantic Tension",
      premise: item.premise || item.description || "A passionate encounter built on irresistible desire."
    }));

    return NextResponse.json({ previews });
  } catch (error: any) {
    console.error("Preview Generation Error:", error);
    // Never fail hard - return curated previews as ultimate safety net
    return NextResponse.json({ previews: getCuratedPreviews() });
  }
}
