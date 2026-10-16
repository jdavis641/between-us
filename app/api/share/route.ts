export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { storyId, storyTitle, recipient } = body;

    if (!storyId || !recipient || typeof recipient !== 'string' || recipient.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing storyId or recipient' },
        { status: 400 }
      );
    }

    const cleanRecipient = recipient.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanRecipient);
    const digitsOnly = cleanRecipient.replace(/[^\d+]/g, '');
    const isPhone = digitsOnly.length >= 10;

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { error: 'Please enter a valid email address or 10-digit mobile number.' },
        { status: 400 }
      );
    }

    // Auth verification (optional check for authenticated user)
    const supabase = await createClient();
    let authHeader = req.headers.get('Authorization');
    let explicitToken = authHeader?.replace('Bearer ', '')?.trim();

    let user = (await supabase.auth.getUser()).data?.user;
    if (!user && explicitToken && explicitToken !== 'undefined' && explicitToken !== 'null') {
      const res = await supabase.auth.getUser(explicitToken);
      user = res.data?.user || null;
    }

    // Record shared access in DB
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        await supabaseAdmin
          .from('generated_content')
          .update({ is_shared: true })
          .eq('id', storyId);

        await supabaseAdmin
          .from('shared_content_access')
          .upsert(
            { content_id: storyId, shared_by: user?.id || null },
            { onConflict: 'content_id' }
          );
      }
    } catch (shareDbErr) {
      console.warn('Could not record shared access in DB:', shareDbErr);
    }

    // Determine story title if not provided
    let title = storyTitle || 'Intimate Experience';
    if (!storyTitle) {
      const { data: storyData } = await supabase
        .from('generated_content')
        .select('title')
        .eq('id', storyId)
        .maybeSingle();

      if (storyData?.title) {
        title = storyData.title;
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://betweenus.app';
    const storyLink = `${baseUrl}/dashboard/experience/${storyId}?share_id=${storyId}`;

    if (isEmail) {
      // Dispatch via Resend
      if (process.env.RESEND_API_KEY) {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Between Us <invites@betweenus.app>',
            to: cleanRecipient,
            subject: `Shared Experience: "${title}" on Between Us`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 32px; border-radius: 16px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
                <div style="margin-bottom: 24px;">
                  <span style="font-size: 28px;">🔥</span>
                  <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 600;">Between Us</h1>
                  <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Private Intimate Experience Sharing</p>
                </div>
                <div style="background-color: #18181b; padding: 20px; border-radius: 12px; border: 1px solid #27272a; margin-bottom: 24px;">
                  <p style="font-size: 15px; color: #d4d4d8; margin: 0 0 12px 0;">An intimate story has been shared with you:</p>
                  <h2 style="font-size: 20px; font-weight: bold; color: #ffffff; margin: 0;">"${title}"</h2>
                </div>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${storyLink}" style="display: inline-block; background-color: #7f1d1d; color: #ffffff; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(127, 29, 29, 0.4);">
                    View Story & Script
                  </a>
                </div>
                <p style="font-size: 12px; color: #71717a; text-align: center; margin: 24px 0 0 0;">
                  If the button does not work, visit: <a href="${storyLink}" style="color: #ef4444; text-decoration: underline;">${storyLink}</a>
                </p>
              </div>
            `
          })
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          console.error("Resend share dispatch failed:", errText);
        } else {
          console.log(`Resend story share successfully dispatched to ${cleanRecipient}`);
        }
      } else {
        console.warn("RESEND_API_KEY not configured. Email share simulated.");
      }
    } else {
      // Dispatch via Twilio SMS
      const formattedPhone = cleanRecipient.startsWith('+')
        ? cleanRecipient
        : (digitsOnly.length === 10 ? `+1${digitsOnly}` : `+${digitsOnly}`);

      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const formData = new URLSearchParams();
        formData.append('To', formattedPhone);
        formData.append('From', process.env.TWILIO_PHONE_NUMBER || '');
        formData.append('Body', `An intimate experience has been shared with you on Between Us: "${title}". Read the full story here: ${storyLink}`);

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        });

        if (!twilioRes.ok) {
          const errText = await twilioRes.text();
          console.error("Twilio SMS share dispatch failed:", errText);
        } else {
          console.log(`Twilio SMS share successfully dispatched to ${formattedPhone}`);
        }
      } else {
        console.warn("Twilio credentials not configured. SMS share simulated.");
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Story shared successfully'
    });
  } catch (error: any) {
    console.error("Share dispatch error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch share' },
      { status: 500 }
    );
  }
}
