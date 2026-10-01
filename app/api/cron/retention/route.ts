import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    // 1. Initialize Supabase admin client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase admin credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Retention Schedule Configuration
    const retentionSchedule = [
      {
        day: 10,
        subject: "Your First Quick Win",
        message: "Jump back in! Spotlight a highly rated 15-minute card game or a short roleplay to bridge the communication gap this week."
      },
      {
        day: 25,
        subject: "Month One: The Intimacy Gap",
        message: "Congratulations on closing the intimacy communication gap. Here are the top user tropes and roleplay scenarios for the month. We encourage you to explore the library and discover new themes for your next experience."
      },
      {
        day: 55,
        subject: "Thank you for being part of our community",
        message: "Our goal is to help millions of singles and couples reimagine what intimacy can become and positively transform relationships and connections. Try generating a Between Us Guest Pass to share the experience."
      },
      {
        day: 90,
        subject: "A Safe Space to Explore",
        message: "We are glad that you are apart of a judgment-free community, allowing you to explore your deepest desires in a safe, consensual setting."
      },
      {
        day: 180,
        subject: "The Half-Year Mark",
        message: "Here are the YTD top 20 tropes and role play scenarios. We encourage you to explore. We are always listening—use the App Improvement link in your dashboard for anonymous suggestions."
      },
      {
        day: 360,
        subject: "Happy Anniversary!",
        message: "Congratulations on one year of unfiltered connection. Here are the top 50 user-rated tropes and scenarios over the past year."
      }
    ];

    const today = new Date();
    let totalMessagesSent = 0;

    for (const schedule of retentionSchedule) {
      // Calculate the specific date for the target day
      const targetDate = new Date(today);
      targetDate.setUTCDate(targetDate.getUTCDate() - schedule.day);
      
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // Query active profiles whose account_created_at matches the exact day
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)
        .gte('account_created_at', startOfDay.toISOString())
        .lte('account_created_at', endOfDay.toISOString());

      if (fetchError) {
        console.error(`Error fetching profiles for day ${schedule.day}:`, fetchError);
        continue;
      }

      if (profiles && profiles.length > 0) {
        // Construct message payloads
        const payloads = profiles.map(profile => ({
          user_id: profile.id,
          subject: schedule.subject,
          message: schedule.message
        }));

        // Batch insert messages
        const { error: insertError } = await supabase
          .from('in_app_messages')
          .insert(payloads);

        if (insertError) {
          console.error(`Error inserting messages for day ${schedule.day}:`, insertError);
        } else {
          totalMessagesSent += payloads.length;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      messagesSent: totalMessagesSent 
    });

  } catch (error: any) {
    console.error("Retention Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
