export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient as createServerSupabase } from "@/utils/supabase/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { answers, email: clientEmail } = body;
    if (!answers) {
      return NextResponse.json({ error: 'Missing survey answers' }, { status: 400 });
    }

    // Retrieve active user's registered email from Supabase session
    let userEmail = clientEmail || 'anonymous@betweenusapp.io';
    let userId: string | null = null;

    try {
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        if (user.email) {
          userEmail = user.email;
        }
      }
    } catch (authErr) {
      console.warn('[Survey Submit] Session resolution note:', authErr);
    }

    const {
      overallDesign,
      valueForExperience,
      suggestions,
      enteredPreferences,
      preferencesGenerated,
      usedWithPartner,
      partnerPreferencesGenerated,
      finalNotes,
      willingToReviewGoogle
    } = answers;

    // Format all survey answers and user email into a clean HTML payload
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; color: #18181b; padding: 24px; margin: 0; }
            .card { max-width: 640px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
            h2 { margin-top: 0; color: #991b1b; font-size: 20px; border-bottom: 2px solid #fee2e2; padding-bottom: 12px; }
            .meta { background-color: #fafafa; border: 1px solid #f4f4f5; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #52525b; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #f4f4f5; font-size: 14px; vertical-align: top; }
            th { color: #52525b; width: 45%; font-weight: 600; background-color: #fafafa; }
            td { color: #18181b; }
            .badge-yes { color: #15803d; font-weight: 700; background-color: #dcfce7; padding: 2px 10px; border-radius: 6px; display: inline-block; font-size: 12px; }
            .badge-no { color: #b91c1c; font-weight: 700; background-color: #fee2e2; padding: 2px 10px; border-radius: 6px; display: inline-block; font-size: 12px; }
            .rating-star { color: #ea580c; font-weight: 700; font-size: 16px; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>📋 48-Hour Onboarding Survey Response</h2>
            <div class="meta">
              <strong>User Email:</strong> ${userEmail}<br/>
              <strong>User ID:</strong> ${userId || 'N/A'}<br/>
              <strong>Submitted At:</strong> ${new Date().toUTCString()}
            </div>

            <table>
              <tbody>
                <tr>
                  <th>Rate the app on a scale of 1-5 (overall design)</th>
                  <td><span class="rating-star">${'★'.repeat(Number(overallDesign) || 0)}</span> (${overallDesign}/5)</td>
                </tr>
                <tr>
                  <th>How would you rate the value for the experience?</th>
                  <td><span class="rating-star">${'★'.repeat(Number(valueForExperience) || 0)}</span> (${valueForExperience}/5)</td>
                </tr>
                <tr>
                  <th>If you were on the development team, what suggestions would you have to improve the app?</th>
                  <td>${suggestions ? `<span style="white-space: pre-wrap;">${suggestions}</span>` : '<em style="color: #a1a1aa;">None provided</em>'}</td>
                </tr>
                <tr>
                  <th>Have you entered preferences/kinks in the settings menu?</th>
                  <td><span class="${enteredPreferences === 'Yes' ? 'badge-yes' : 'badge-no'}">${enteredPreferences}</span></td>
                </tr>
                <tr>
                  <th>Did the app generate your preferences in the stories, roleplay, games?</th>
                  <td><span class="${preferencesGenerated === 'Yes' ? 'badge-yes' : 'badge-no'}">${preferencesGenerated}</span></td>
                </tr>
                <tr>
                  <th>Have you used the app with a partner?</th>
                  <td><span class="${usedWithPartner === 'Yes' ? 'badge-yes' : 'badge-no'}">${usedWithPartner}</span></td>
                </tr>
                ${usedWithPartner === 'Yes' ? `
                <tr>
                  <th>If yes, did your partner's preferences show up in the stories, roleplay and games?</th>
                  <td><span class="${partnerPreferencesGenerated === 'Yes' ? 'badge-yes' : 'badge-no'}">${partnerPreferencesGenerated || 'Not answered'}</span></td>
                </tr>` : ''}
                <tr>
                  <th>Any final notes for the development team?</th>
                  <td>${finalNotes ? `<span style="white-space: pre-wrap;">${finalNotes}</span>` : '<em style="color: #a1a1aa;">None provided</em>'}</td>
                </tr>
                <tr>
                  <th>Would you be willing to review us on Google?</th>
                  <td><span class="${willingToReviewGoogle === 'Yes' ? 'badge-yes' : 'badge-no'}">${willingToReviewGoogle}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    // Dispatch strictly to support@betweenusapp.io using Resend SDK
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const { error: resendError } = await resend.emails.send({
          from: 'Between Us Feedback <support@betweenusapp.io>',
          to: 'support@betweenusapp.io',
          replyTo: userEmail,
          subject: `48-Hour Onboarding Survey: ${userEmail} (${overallDesign}/5 Design, ${valueForExperience}/5 Value)`,
          html: emailHtml
        });

        if (resendError) {
          console.error('[Survey Submit] Resend SDK returned error:', resendError);
          // Fallback via HTTP fetch
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Between Us Feedback <support@betweenusapp.io>',
              to: 'support@betweenusapp.io',
              reply_to: userEmail,
              subject: `48-Hour Onboarding Survey: ${userEmail} (${overallDesign}/5 Design, ${valueForExperience}/5 Value)`,
              html: emailHtml
            })
          });
        } else {
          console.log(`[Survey Submit] Successfully forwarded survey response from ${userEmail} to support@betweenusapp.io`);
        }
      } catch (sendErr) {
        console.error('[Survey Submit] Exception dispatching email via Resend:', sendErr);
      }
    } else {
      console.warn('[Survey Submit] RESEND_API_KEY is not configured in environment. Skipping email dispatch.');
    }

    // Also persist response to database for redundancy
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
      );

      await supabaseAdmin.from('app_improvements').insert({
        user_id: userId || null,
        feedback_text: JSON.stringify({
          source: '48_hour_onboarding_survey',
          userEmail,
          answers
        })
      });
    } catch (dbErr) {
      console.warn('[Survey Submit] Database persistence warning:', dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Survey Submit Error]:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
