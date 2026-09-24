import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use service role for cron jobs to bypass RLS and query all active groups
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Fetch active groups
    const { data: groups, error } = await supabase
      .from('connection_groups')
      .select('id, group_type')
      .in('status', ['trial', 'active']);

    if (error) throw error;
    if (!groups || groups.length === 0) return NextResponse.json({ success: true, count: 0 });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // 2. Iterate and trigger generation
    const promises = groups.map(async (group) => {
      try {
        // Fetch group preferences
        const { data: preferences } = await supabase
          .from('intimacy_preferences')
          .select('category_tag, preference_level, kinks_override')
          .eq('group_id', group.id);

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

        // Fetch user history to avoid repetition
        const { data: historyData } = await supabase
          .from('activity_history')
          .select('content_title')
          .eq('group_id', group.id)
          .order('completed_at', { ascending: false })
          .limit(10);
        
        const historyTitles = historyData?.map(h => h.content_title) || [];

        const isSolo = group.group_type === 'guest_pass' ? false : false; // Mocking solo flag dynamically if needed
        const pronouns = ['they/them']; // Mocking diverse pronouns

        const prompt = `You are an expert intimacy and romantic fantasy writer. Generate a customized, serialized erotic fantasy literature chapter for a ${isSolo ? 'solo' : 'couple'} audience.
This is the Mid-Week Chapter that builds anticipation for the weekend.
Pronouns to adapt: ${pronouns.join(', ')}.

IMPORTANT BOUNDARIES:
- DO NOT INCLUDE ANY OF THESE THEMES (Off-Limits): ${offLimits.join(", ") || "None specified"}.
- Try to incorporate these themes (Definitely): ${definitely.join(", ") || "None specified"}.

${kinksOverride ? `CRITICAL KINK OVERRIDE (Must strictly supersede all other boundary choices and AI-generated user-rated content. You MUST focus the content tightly around these explicit user desires):\n${kinksOverride}\n` : ''}
MEMORY CONTEXT (Do not repeat these plots):
- ${historyTitles.join(", ") || "None"}.

JSON SCHEMA REQUIREMENT:
{
  "title": "A catchy title for the mid-week chapter",
  "overview": "Context and setting",
  "preExperienceTasks": ["Task for Partner A", "Task for Partner B"],
  "partnerAPerspective": "Parallel storyline / perspective for Partner A.",
  "partnerBPerspective": "Parallel storyline / perspective for Partner B.",
  "fullScript": null
}
Ensure the output is valid JSON.`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        });

        const generatedContent = JSON.parse(result.response.text());

        // Insert into Scenarios
        const { error: insertError } = await supabase.from('scenarios').insert({
          group_id: group.id,
          content: JSON.stringify(generatedContent),
          is_mid_week: true
        });
        
        if (insertError) console.error(`Failed to insert scenario for group ${group.id}:`, insertError);

        // Record in Activity History
        await supabase.from('activity_history').insert({
          group_id: group.id,
          content_type: 'literature',
          category: 'Mid-Week Serialized',
          content_title: generatedContent.title,
          tags: ['mid-week']
        });

        // Trigger transactional email
        console.log(`[Email Dispatch] Triggering Mid-Week Chapter email for group ${group.id}...`);

      } catch (err) {
        console.error(`Group ${group.id} failed:`, err);
      }
    });

    await Promise.allSettled(promises);

    return NextResponse.json({ success: true, count: groups.length });
  } catch (error) {
    console.error('Mid-week Cron Error:', error);
    return NextResponse.json({ error: 'Failed to run cron' }, { status: 500 });
  }
}
