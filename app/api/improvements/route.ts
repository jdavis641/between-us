import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { feedback_text } = await req.json();

    if (!feedback_text) {
      return NextResponse.json({ error: "Feedback text is required." }, { status: 400 });
    }

    // Bulletproof Auth Check
    let authHeader = req.headers.get('Authorization'); 
    let explicitToken = authHeader?.replace('Bearer ', '')?.trim();
    if (explicitToken === 'undefined' || explicitToken === 'null') explicitToken = undefined;

    const supabase = await createClient();
    let { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if ((authError || !user) && explicitToken) {
      const res = await supabase.auth.getUser(explicitToken);
      user = res.data?.user || null;
      authError = res.error;
    }

    if (authError || !user) {
      console.error("Supabase Auth Failed:", authError);
      return NextResponse.json({ error: "Auth Rejected: Session expired or missing." }, { status: 401 });
    }

    // Insert into Supabase
    const { error: insertError } = await supabase
      .from('app_improvements')
      .insert({
        user_id: user.id,
        feedback_text: feedback_text
      });

    if (insertError) {
      console.error("Failed to insert feedback:", insertError);
      // Even if the table doesn't exist yet, we'll log it and try to send the email.
    }

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: "Between Us Support <support@betweenusapp.io>", // Replace with verified sender if needed
          to: "support@betweenusapp.io",
          subject: "New App Improvement Suggestion",
          html: `<p><strong>User ID:</strong> ${user.id}</p><p><strong>Feedback:</strong></p><p>${feedback_text}</p>`
        })
      });
    } else {
      console.warn("RESEND_API_KEY not configured. Email not sent.");
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Improvements API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
