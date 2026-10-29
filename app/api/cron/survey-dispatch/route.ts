export const maxDuration = 300;
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function GET(request: Request) {
  try {
    // 1. Verify Vercel Cron authorization header
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Initialize Supabase admin client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase admin credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Calculate 48-hour post-signup window (Day 2 mark: between 48 and 72 hours ago)
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    console.log(`[Survey Dispatch Cron] Scanning profiles created between ${seventyTwoHoursAgo.toISOString()} and ${fortyEightHoursAgo.toISOString()}`);

    // 4. Query profiles created ~48 hours ago
    const { data: candidateProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, anonymous_alias, nickname, created_at, onboarding_survey_sent')
      .lte('created_at', fortyEightHoursAgo.toISOString())
      .gte('created_at', seventyTwoHoursAgo.toISOString());

    if (fetchError) {
      console.error('[Survey Dispatch Cron] Error querying profiles:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!candidateProfiles || candidateProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users at the 48-hour post-signup mark in this cycle.',
        dispatchedCount: 0
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    if (!resend) {
      console.warn('[Survey Dispatch Cron] RESEND_API_KEY not configured. Emails will not be dispatched.');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://betweenusapp.io';
    const surveyUrl = `${appUrl}/dashboard/survey`;
    let dispatchedCount = 0;

    for (const profile of candidateProfiles) {
      // Skip if already flagged as sent
      if (profile.onboarding_survey_sent === true) {
        continue;
      }

      // Idempotency check: verify in_app_messages for existing dispatch
      const { data: existingMsg } = await supabase
        .from('in_app_messages')
        .select('id')
        .eq('user_id', profile.id)
        .eq('subject', '48-Hour Experience Check-In')
        .limit(1);

      if (existingMsg && existingMsg.length > 0) {
        continue;
      }

      let recipientEmail = profile.email;
      if (!recipientEmail) {
        try {
          const { data: authUserData } = await supabase.auth.admin.getUserById(profile.id);
          recipientEmail = authUserData?.user?.email || null;
        } catch (authErr) {
          console.warn(`[Survey Dispatch Cron] Could not retrieve auth email for ${profile.id}:`, authErr);
        }
      }

      const userName = profile.nickname || profile.anonymous_alias || 'Friend';

      // Dispatch Email via Resend SDK
      if (recipientEmail && resend) {
        try {
          const emailSubject = "How has your first 48 hours been with Between Us?";
          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
                  .container { max-width: 580px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 36px 32px; }
                  .badge { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #ef4444; background-color: rgba(127, 29, 29, 0.3); border: 1px solid rgba(185, 28, 28, 0.4); padding: 4px 12px; border-radius: 9999px; margin-bottom: 20px; }
                  h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3; }
                  p { font-size: 15px; line-height: 1.6; color: #d4d4d8; margin-bottom: 20px; }
                  .button { display: inline-block; background-color: #991b1b; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 14px rgba(153, 27, 27, 0.4); margin: 16px 0; }
                  .footer { font-size: 12px; color: #71717a; text-align: center; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 20px; }
                  a.link { color: #f87171; text-decoration: underline; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="badge">🔥 48-Hour Experience Check-In</div>
                  <h1>Hello ${userName}, how is Between Us treating you?</h1>
                  <p>
                    It's been 48 hours since you created your account. We built Between Us to be a judgment-free sanctuary for exploring desires, bridging the communication gap, and deepening romantic connection.
                  </p>
                  <p>
                    We would love your honest feedback to help our core engineering team improve the experience and ensure your preferences are reflected seamlessly.
                  </p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${surveyUrl}" class="button">Take the 2-Minute Survey</a>
                  </div>
                  <p style="font-size: 13px; color: #a1a1aa; text-align: center;">
                    Direct link: <br/>
                    <a href="${surveyUrl}" class="link">${surveyUrl}</a>
                  </p>
                  <div class="footer">
                    <p style="margin: 0;">Between Us &bull; Private &bull; Anonymous &bull; Encrypted</p>
                  </div>
                </div>
              </body>
            </html>
          `;

          const { error: resendError } = await resend.emails.send({
            from: 'Between Us Support <support@betweenusapp.io>',
            to: recipientEmail,
            subject: emailSubject,
            html: emailHtml
          });

          if (resendError) {
            console.error(`[Survey Dispatch Cron] Resend error for ${recipientEmail}:`, resendError);
          } else {
            console.log(`[Survey Dispatch Cron] Dispatched 48h survey to ${recipientEmail}`);
          }
        } catch (emailErr) {
          console.error(`[Survey Dispatch Cron] Exception sending email to ${recipientEmail}:`, emailErr);
        }
      }

      // Flag profile as sent in Supabase
      try {
        await supabase
          .from('profiles')
          .update({
            onboarding_survey_sent: true,
            survey_sent_at: new Date().toISOString()
          })
          .eq('id', profile.id);
      } catch (updateErr) {
        console.warn(`[Survey Dispatch Cron] Failed to update profile survey status for ${profile.id}:`, updateErr);
      }

      // Record in-app message
      try {
        await supabase
          .from('in_app_messages')
          .insert({
            user_id: profile.id,
            subject: "48-Hour Experience Check-In",
            message: "We'd love to hear how your first 48 hours have been! Please share your thoughts in our quick onboarding survey at /dashboard/survey."
          });
      } catch (msgErr) {
        console.warn(`[Survey Dispatch Cron] Failed to record in-app message for ${profile.id}:`, msgErr);
      }

      dispatchedCount++;
    }

    return NextResponse.json({
      success: true,
      dispatchedCount,
      evaluatedUsers: candidateProfiles.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[Survey Dispatch Cron Error]:", error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
