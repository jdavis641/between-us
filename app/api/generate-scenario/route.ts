import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Supabase and Gemini
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { groupId, soloMode, pronouns, toys, intensity, isMidWeek } = body;

    // 1. Fetch group boundaries (Definitely, Curious, Off-Limits)
    const { data: preferences, error: prefError } = await supabase
      .from('intimacy_preferences')
      .select('category_tag, preference_level')
      .eq('group_id', groupId);

    if (prefError) throw prefError;

    const definitely = preferences.filter(p => p.preference_level === 'Definitely').map(p => p.category_tag);
    const curious = preferences.filter(p => p.preference_level === 'Curious').map(p => p.category_tag);
    const offLimits = preferences.filter(p => p.preference_level === 'Off-Limits').map(p => p.category_tag);

    // 2. Construct the boundary-safe prompt
    const timingContext = isMidWeek 
      ? "Write a mid-week serialized fantasy narrative to build anticipation for the weekend."
      : "Write a weekend roleplay script including actionable pre-experience tasks and dialogue.";

    const prompt = `
      You are an expert intimacy guide creating a customized romantic fantasy script.
      Context: ${timingContext}
      Solo Mode: ${soloMode}
      Pronouns: ${pronouns.join(', ')}
      Intensity Level: ${intensity} out of 3
      Include these novelties: ${toys.join(', ')}
      
      Themes to focus on: ${definitely.join(', ')} and optionally ${curious.join(', ')}.
      STRICT EXCLUSIONS: You must completely exclude any mention of these topics: ${offLimits.join(', ')}.
      
      Keep the tone romantic, emotionally engaging, and focused on intimacy.
    `;

    // 3. Generate content with Gemini Pro
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const scenarioText = result.response.text();

    // 4. Save to Supabase
    const { data: insertedData, error: insertError } = await supabase
      .from('scenarios')
      .insert({
        group_id: groupId,
        content: scenarioText,
        is_mid_week: isMidWeek,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to save scenario:', insertError);
      throw insertError;
    }

    return NextResponse.json({ success: true, scenario: scenarioText, scenarioId: insertedData.id });

  } catch (error) {
    console.error('Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate scenario' }, { status: 500 });
  }
}
