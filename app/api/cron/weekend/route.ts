import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
          .select('category_tag, preference_level')
          .eq('group_id', group.id);

        const offLimits = preferences?.filter(p => p.preference_level === 'Off-Limits').map(p => p.category_tag) || [];
        const definitely = preferences?.filter(p => p.preference_level === 'Definitely').map(p => p.category_tag) || [];

        // Fetch mid-week narrative to reference
        const { data: midWeekData } = await supabase
          .from('scenarios')
          .select('content')
          .eq('group_id', group.id)
          .eq('is_mid_week', true)
          .order('created_at', { ascending: false })
          .limit(1);
          
        const midWeekNarrative = midWeekData?.[0]?.content ? JSON.parse(midWeekData[0].content).title : "A romantic build-up from earlier this week.";

        const prompt = `You are an expert intimacy and romantic fantasy writer. Generate a "live-action" sexual role playing conclusion for the weekend.
This must reference and conclude their Wednesday narrative: "${midWeekNarrative}".

IMPORTANT BOUNDARIES:
- DO NOT INCLUDE ANY OF THESE THEMES (Off-Limits): ${offLimits.join(", ") || "None specified"}.
- Try to incorporate these themes (Definitely): ${definitely.join(", ") || "None specified"}.

JSON SCHEMA REQUIREMENT:
{
  "title": "A catchy title for the weekend roleplay conclusion",
  "overview": "Story boards and setting for the live-action conclusion",
  "preExperienceTasks": ["Task for Partner A", "Task for Partner B"],
  "partnerAPerspective": "Inner monologue and setup for Partner A.",
  "partnerBPerspective": "Inner monologue and setup for Partner B.",
  "fullScript": "A back-and-forth dialogue script for them to follow."
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
          is_mid_week: false
        });
        
        if (insertError) console.error(`Failed to insert scenario for group ${group.id}:`, insertError);

        // Record in Activity History
        await supabase.from('activity_history').insert({
          group_id: group.id,
          content_type: 'roleplay',
          category: 'Weekend Live-Action',
          content_title: generatedContent.title,
          tags: ['weekend', 'scripted']
        });

        // Trigger transactional email
        console.log(`[Email Dispatch] Triggering 'Weekend Mission' email for group ${group.id}...`);

      } catch (err) {
        console.error(`Group ${group.id} failed:`, err);
      }
    });

    await Promise.allSettled(promises);

    return NextResponse.json({ success: true, count: groups.length });
  } catch (error) {
    console.error('Weekend Cron Error:', error);
    return NextResponse.json({ error: 'Failed to run cron' }, { status: 500 });
  }
}
