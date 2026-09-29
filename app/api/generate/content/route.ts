export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import OpenAI from 'openai';

function buildSystemInstruction(preferences: any[], playMode: string) {
  const baseTolerance = preferences?.find(p => p.category_tag === 'Base Tolerance')?.preference_level || 'Moderate';

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
  const kinkRow = preferences?.find(p => p.kinks_override && p.category_tag !== 'Guest Pass Config');
  if (kinkRow?.kinks_override) {
    try {
      const parsed = JSON.parse(kinkRow.kinks_override);
      if (Array.isArray(parsed)) {
        primaryDirective = parsed.map((k: any) => k.text).join('\n');
      } else {
        primaryDirective = kinkRow.kinks_override;
      }
    } catch(e) {
      primaryDirective = kinkRow.kinks_override;
    }
  }

  let modeInstructions = '';
  if (playMode === 'solo') {
    modeInstructions = 'Write a highly descriptive, first-person romantic fantasy focusing entirely on the reader\'s internal monologue and solo exploration.';
  } else if (playMode === 'group') {
    modeInstructions = 'Write an interconnected narrative featuring exactly 4 distinct character storylines navigating shifting alliances and group dynamics.';
  } else {
    modeInstructions = 'Write a dual-perspective, parallel storyline focusing strictly on 2 main character storylines, revealing distinct inner desires and complementary pre-experience tasks.';
  }

  let sys = `You are an expert intimacy and relationship guide.\n\n`;
  
  sys += `Writing Style: Master the build-intensity dynamic. You must utilize a slow, tension-building pacing that relies heavily on anticipation, psychological buildup, and emotional friction before any physical escalation. Vocabulary: Use hyper-descriptive, visceral, and evocative vocabulary. Focus heavily on granular sensory details (touch, breath, temperature, micro-expressions). Strictly avoid clinical medicalized terminology, euphemisms, or generic romance tropes.\n\n`;
  
  sys += `Play Mode / Perspective: ${modeInstructions}\n\n`;
  sys += `Overarching Intensity Parameter (Base Tolerance): ${baseTolerance}\n\n`;
  sys += `Mandatory Included Themes:\n- ${mandatoryThemes}\n\n`;
  sys += `Strictly Excluded Variables:\n- ${excludedVariables}\n\n`;
  sys += `Boundary Enforcement: Items in the Strictly Excluded Variables array must never appear or be referenced under any circumstances, while the Primary Directive Override (if present) and Mandatory Included Themes must serve as the primary narrative focus.\n\n`;

  if (primaryDirective) {
    sys += `Primary Directive Override:\nPrioritize these text parameters above all other matrix selections:\n${primaryDirective}\n\n`;
  }

  return sys;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contentType = body.contentType;
    const category = body.category;
    const hasScripts = body.hasScripts;
    const validModes = ["solo", "couple", "group"];
    const playMode = validModes.includes(body.playMode) ? body.playMode : "couple";
    
    // Auth Check
    const supabase = await createClient();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '')?.trim();
    
    if (!token || token === 'undefined' || token === 'null') {
      return NextResponse.json({ error: 'Auth Rejected: Token is missing or undefined' }, { status: 401 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Supabase Auth Failed:", authError);
      return NextResponse.json(
        { error: `Auth Rejected: ${authError?.message || 'No user found'}` }, 
        { status: 401 }
      );
    }

    // Determine Group ID
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
      
    const groupId = groupMember?.group_id;

    // Fetch Preferences
    const { data: preferences } = await supabase
      .from('intimacy_preferences')
      .select('category_tag, preference_level, kinks_override')
      .eq('user_id', user.id);

    // Fetch History
    const historyQuery = supabase.from('activity_history').select('content_title').eq('content_type', contentType);
    if (groupId) {
      historyQuery.eq('group_id', groupId);
    } else {
      historyQuery.eq('user_id', user.id);
    }
    
    const { data: historyData } = await historyQuery.order('completed_at', { ascending: false }).limit(20);
    const historyTitles = historyData?.map(h => h.content_title) || [];

    // Initialize OpenAI
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("Missing OPENROUTER_API_KEY in environment variables");
    }
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const systemInstruction = buildSystemInstruction(preferences || [], playMode);

    // Build Prompt
    let prompt = `Generate a highly personalized ${contentType} for ${playMode} play.\n\n`;
    prompt += `MEMORY CONTEXT:\n- To avoid repetition, DO NOT generate anything too similar to these recent activities: ${historyTitles.join(", ") || "None"}.\n`;

    if (contentType === "roleplay" || contentType === "literature") {
      prompt += `
JSON SCHEMA REQUIREMENT:
You must return a valid JSON object matching this schema exactly:
{
  "title": "A catchy title for the scenario",
  "overview": "A rich, setting-the-scene context",
  "preExperienceTasks": ["Task for Partner A", "Task for Partner B"],
  "partnerAPerspective": "Internal monologue, motivation, or secret instructions for Partner A. Make it emotionally engaging and focused on intimacy without being explicitly sexually graphic.",
  "partnerBPerspective": "Internal monologue, motivation, or secret instructions for Partner B. Make it emotionally engaging and focused on intimacy without being explicitly sexually graphic.",
  "fullScript": ${hasScripts ? `"A back-and-forth dialogue script for them to follow."` : "null"}
}
Make the tone emotionally engaging, suspenseful, and romantic fantasy. NEVER break the JSON structure.`;
    } else if (contentType === "game") {
      prompt += `
Category: ${category}
JSON SCHEMA REQUIREMENT:
You must return a valid JSON object matching this schema exactly:
{
  "title": "Name of the game round",
  "overview": "Brief instructions on how to play",
  "prompts": ["Prompt 1", "Prompt 2", "Prompt 3", "Prompt 4", "Prompt 5"]
}
Make the game prompts highly specific to the selected intimacy category. NEVER break the JSON structure.`;
    }

    let result;
    try {
      result = await openai.chat.completions.create({
        model: "cognitivecomputations/dolphin-mixtral-8x7b",
        messages: [{ role: "system", content: systemInstruction }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
    } catch (apiError: any) {
      console.error("OpenRouter API Fetch Error:", apiError);
      return NextResponse.json({ error: apiError.message || "OpenRouter failed" }, { status: 500 });
    }

    const responseText = result.choices[0].message.content || "{}";
    const generatedContent = JSON.parse(responseText);

    // Record to Activity History using service role because normal users might not have insert rights if RLS is broken 
    // or just use authenticated client since we added an insert policy.
    await supabase.from('activity_history').insert({
      user_id: user.id,
      group_id: groupId || null,
      content_type: contentType,
      category: category || playMode,
      content_title: generatedContent.title,
      tags: [playMode, ...(hasScripts ? ['scripted'] : [])]
    });

    return NextResponse.json(generatedContent);
  } catch (error: any) {
    console.error("OpenAI Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

