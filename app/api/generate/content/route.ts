import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import OpenAI from 'openai';

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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine Group ID
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
      
    const groupId = groupMember?.group_id;

    // Fetch Preferences
    const { data: preferences } = await supabase
      .from('intimacy_preferences')
      .select('category_tag, preference_level, kinks_override')
      .eq('user_id', user.id);

    const kinksOverrideRaw = preferences?.find(p => p.kinks_override)?.kinks_override;
    let kinksOverride = kinksOverrideRaw;
    if (kinksOverrideRaw) {
      try {
        const parsed = JSON.parse(kinksOverrideRaw);
        if (Array.isArray(parsed)) kinksOverride = parsed.map((k: any) => k.text).join('\n\n');
      } catch (e) {}
    }

    const offLimits = preferences?.filter(p => p.preference_level === 'Off-Limits').map(p => p.category_tag) || [];
    const definitely = preferences?.filter(p => p.preference_level === 'Definitely').map(p => p.category_tag) || [];

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
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Build Prompt
    let prompt = `You are an expert intimacy and relationship guide. Generate a highly personalized ${contentType} for ${playMode} play.
    
IMPORTANT BOUNDARIES:
- DO NOT INCLUDE ANY OF THESE THEMES (Off-Limits): ${offLimits.join(", ") || "None specified"}.
- Try to incorporate these themes if appropriate (Definitely): ${definitely.join(", ") || "None specified"}.

${kinksOverride ? `CRITICAL KINK OVERRIDE (Must strictly supersede all other boundary choices and AI-generated user-rated content. You MUST focus the content tightly around these explicit user desires):\n${kinksOverride}\n` : ''}
MEMORY CONTEXT:
- To avoid repetition, DO NOT generate anything too similar to these recent activities: ${historyTitles.join(", ") || "None"}.
`;

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

    const result = await openai.chat.completions.create({
      model: "cognitivecomputations/dolphin-mixtral-8x7b",
      messages: [{ role: "system", content: "You are an expert intimacy and relationship guide." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

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
