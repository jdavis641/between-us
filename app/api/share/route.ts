export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * GET /api/share?id=[id]&lens=[a|b]
 * Grants read access to shared experience content without requiring administrative edits.
 * If lens === 'b', suppresses Partner A perspective from the payload to prevent spoilers on network inspection.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const lens = searchParams.get('lens')?.toLowerCase();

    if (!id) {
      return NextResponse.json({ error: 'Missing storyId / experience id' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: experience, error } = await admin
      .from('generated_content')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Defensive fetch of shared experience encountered error:", error);
      return NextResponse.json({ error: 'Failed to retrieve shared experience' }, { status: 500 });
    }

    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
    }

    // Try parsing body as JSON if stored as JSON string
    let parsedData: any = null;
    if (experience.body) {
      try {
        const cleaned = experience.body.replace(/```json|```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      } catch {
        parsedData = null;
      }
    }

    // Dynamic Perspective Gating on Payload:
    // When recipient accesses via lens=b, sanitize Partner A details from parsedData to prevent spoilers
    if (lens === 'b' && parsedData && typeof parsedData === 'object') {
      const sanitized = { ...parsedData };
      delete sanitized.partnerA;
      delete sanitized.partnerAPerspective;
      delete sanitized.partner_a_perspective;
      delete sanitized.partner_a;
      experience.parsedData = sanitized;
    } else if (parsedData) {
      experience.parsedData = parsedData;
    }

    return NextResponse.json({
      success: true,
      experience
    });
  } catch (err: any) {
    console.error("Error retrieving shared experience:", err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error retrieving shared experience' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/share
 * Dispatches a shared experience link to a partner, email address, or mobile SMS text message.
 * Generates recipient link format: https://betweenusapp.io/dashboard/experience/[id]?lens=b
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { storyId, storyTitle, recipient, lens, isPartnerDispatch } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: 'Missing storyId' },
        { status: 400 }
      );
    }

    const targetLens = lens || 'b';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://betweenusapp.io';
    const storyLink = `${baseUrl}/dashboard/experience/${storyId}?lens=${targetLens}`;

    // Auth verification
    const supabase = await createClient();
    const admin = getAdminClient();

    let authHeader = req.headers.get('Authorization');
    let explicitToken = authHeader?.replace('Bearer ', '')?.trim();

    let user = (await supabase.auth.getUser()).data?.user;
    if (!user && explicitToken && explicitToken !== 'undefined' && explicitToken !== 'null') {
      const res = await admin.auth.getUser(explicitToken);
      user = res.data?.user || null;
    }

    // Determine story title if not provided
    let title = storyTitle || 'Intimate Experience';
    if (!storyTitle) {
      try {
        const { data: storyData } = await admin
          .from('generated_content')
          .select('title')
          .eq('id', storyId)
          .maybeSingle();

        if (storyData?.title) {
          title = storyData.title;
        }
      } catch (e) {
        // Fallback to default
      }
    }

    // 1. PARTNER DISPATCH: Send directly to linked Between Us Pass partner
    if (isPartnerDispatch || recipient === 'partner') {
      if (!user) {
        return NextResponse.json(
          { error: 'You must be signed in to dispatch directly to your partner.' },
          { status: 401 }
        );
      }

      // Find user's connection group
      const { data: myGroupMember } = await admin
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      let partnerUserId: string | null = null;
      if (myGroupMember?.group_id) {
        const { data: partnerMember } = await admin
          .from('group_members')
          .select('user_id')
          .eq('group_id', myGroupMember.group_id)
          .neq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (partnerMember?.user_id) {
          partnerUserId = partnerMember.user_id;
        }
      }

      // Fallback: check invitations table for linked partner
      if (!partnerUserId) {
        const { data: invite } = await admin
          .from('invitations')
          .select('recipient_id, sender_id')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .limit(1)
          .maybeSingle();

        if (invite) {
          partnerUserId = invite.sender_id === user.id ? invite.recipient_id : invite.sender_id;
        }
      }

      if (!partnerUserId) {
        return NextResponse.json({
          error: 'No linked partner found. Please share using the recipient link or invite your partner first.'
        }, { status: 404 });
      }

      // Fetch sender details
      const { data: myProfile } = await admin
        .from('profiles')
        .select('nickname, anonymous_alias, email')
        .eq('id', user.id)
        .maybeSingle();
      const senderName = myProfile?.nickname || myProfile?.anonymous_alias || 'Your Partner';

      // Fetch partner profile
      const { data: partnerProfile } = await admin
        .from('profiles')
        .select('nickname, anonymous_alias, email, mobile_number, phone_number')
        .eq('id', partnerUserId)
        .maybeSingle();

      const partnerName = partnerProfile?.nickname || partnerProfile?.anonymous_alias || 'Partner';
      const partnerEmail = partnerProfile?.email;
      const partnerPhone = partnerProfile?.mobile_number || partnerProfile?.phone_number;

      // Deliver internal in-app message
      const subject = `Shared Roleplay: "${title}" (Lens B)`;
      const message = `${senderName} has shared a private roleplay scenario with you: "${title}".\n\nYour assigned perspective (Partner B Lens) and the Weekend Script are ready:\n${storyLink}`;

      await admin.from('in_app_messages').insert({
        user_id: partnerUserId,
        subject,
        message,
        is_read: false
      });

      // Dispatch via Email if available
      if (partnerEmail && process.env.RESEND_API_KEY) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Between Us <invites@betweenusapp.io>',
              to: partnerEmail,
              subject: `Shared Roleplay: "${title}" (Your Role: Partner B)`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 32px; border-radius: 16px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
                  <div style="margin-bottom: 24px;">
                    <span style="font-size: 28px;">🔥</span>
                    <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 600;">Between Us</h1>
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Roleplay Scenario: Your Role (Partner B)</p>
                  </div>
                  <div style="background-color: #18181b; padding: 20px; border-radius: 12px; border: 1px solid #27272a; margin-bottom: 24px;">
                    <p style="font-size: 15px; color: #d4d4d8; margin: 0 0 12px 0;">${senderName} has shared a private roleplay scenario with you:</p>
                    <h2 style="font-size: 20px; font-weight: bold; color: #ffffff; margin: 0;">"${title}"</h2>
                  </div>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${storyLink}" style="display: inline-block; background-color: #7f1d1d; color: #ffffff; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(127, 29, 29, 0.4);">
                      View Roleplay (Lens B)
                    </a>
                  </div>
                  <p style="font-size: 12px; color: #71717a; text-align: center; margin: 24px 0 0 0;">
                    Direct Link: <a href="${storyLink}" style="color: #ef4444; text-decoration: underline;">${storyLink}</a>
                  </p>
                </div>
              `
            })
          });
        } catch (mailErr) {
          console.warn("Failed to dispatch partner email:", mailErr);
        }
      }

      // Dispatch via SMS if available
      if (partnerPhone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
          const digitsOnly = partnerPhone.replace(/[^\d+]/g, '');
          const formattedPhone = partnerPhone.startsWith('+') ? partnerPhone : (digitsOnly.length === 10 ? `+1${digitsOnly}` : `+${digitsOnly}`);
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
          const formData = new URLSearchParams();
          formData.append('To', formattedPhone);
          formData.append('From', process.env.TWILIO_PHONE_NUMBER || '');
          formData.append('Body', `${senderName} shared a roleplay scenario on Between Us: "${title}". Read your Partner B Lens here: ${storyLink}`);

          await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
          });
        } catch (smsErr) {
          console.warn("Failed to dispatch partner SMS:", smsErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Roleplay scenario dispatched directly to ${partnerName}!`,
        storyLink
      });
    }

    // 2. EMAIL OR SMS DISPATCH
    if (!recipient || typeof recipient !== 'string' || recipient.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing recipient' },
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
            from: 'Between Us <invites@betweenusapp.io>',
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
                    View Story & Script (Lens B)
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
      message: 'Story shared successfully',
      storyLink
    });
  } catch (error: any) {
    console.error("Share dispatch error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch share' },
      { status: 500 }
    );
  }
}
