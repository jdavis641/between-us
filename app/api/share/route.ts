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
 * Dispatches a shared experience link to a partner, email address, username, or mobile SMS text message.
 * Updates generated_content.shared_with so RLS grants SELECT permissions.
 * Populates recipient dashboard inbox (in_app_messages) and dispatches email via Resend.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      storyId,
      contentId: explicitContentId,
      storyTitle,
      title: explicitTitle,
      recipient,
      lens,
      isPartnerDispatch,
      contentType: explicitContentType
    } = body;

    const contentId = (storyId || explicitContentId || '').trim();

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId / storyId' },
        { status: 400 }
      );
    }

    // Auth verification
    const admin = getAdminClient();

    let authHeader = req.headers.get('Authorization');
    let explicitToken = authHeader?.replace('Bearer ', '')?.trim();

    let user: any = null;
    try {
      const supabase = await createClient();
      user = (await supabase.auth.getUser()).data?.user || null;
    } catch {
      // Cookies may not be available or request scope missing
    }

    if (!user && explicitToken && explicitToken !== 'undefined' && explicitToken !== 'null') {
      try {
        const res = await admin.auth.getUser(explicitToken);
        user = res.data?.user || null;
      } catch (authErr) {
        console.warn("Explicit token auth verification failed:", authErr);
      }
    }

    // Fetch existing content row to determine metadata and current shared_with
    const { data: contentRow } = await admin
      .from('generated_content')
      .select('id, title, content_type, shared_with, user_id')
      .eq('id', contentId)
      .maybeSingle();

    const title = explicitTitle || storyTitle || contentRow?.title || 'Shared Experience';
    const contentType = explicitContentType || contentRow?.content_type || 'story';
    const isRoleplay = contentType === 'roleplay' || contentType === 'weekend_scenario';
    const targetLens = lens || (isRoleplay ? 'b' : '');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://betweenusapp.io';
    const storyLink = targetLens
      ? `${baseUrl}/dashboard/experience/${contentId}?lens=${targetLens}`
      : `${baseUrl}/dashboard/experience/${contentId}`;
    const directExperienceUrl = `/dashboard/experience/${contentId}${targetLens ? `?lens=${targetLens}` : ''}`;

    // Sender display name
    let senderName = 'Your Partner';
    if (user?.id) {
      const { data: myProfile } = await admin
        .from('profiles')
        .select('nickname, anonymous_alias, email')
        .eq('id', user.id)
        .maybeSingle();
      senderName = myProfile?.nickname || myProfile?.anonymous_alias || user.email?.split('@')[0] || 'Your Partner';
    }

    // Helper: Grant SELECT permissions under RLS by appending recipient UUID to generated_content.shared_with
    const grantRecipientAccess = async (recipientUserId: string) => {
      if (!recipientUserId) return;
      try {
        const currentShared: string[] = Array.isArray(contentRow?.shared_with) ? contentRow.shared_with : [];
        if (!currentShared.includes(recipientUserId)) {
          const updatedShared = Array.from(new Set([...currentShared, recipientUserId]));
          await admin
            .from('generated_content')
            .update({ shared_with: updatedShared })
            .eq('id', contentId);
          if (contentRow) {
            contentRow.shared_with = updatedShared;
          }
        }
      } catch (err) {
        console.warn("Failed to append recipient to shared_with:", err);
      }
    };

    // Helper: Insert message into in_app_messages for recipient inbox
    const deliverInAppMessage = async (recipientUserId: string) => {
      if (!recipientUserId) return;
      try {
        await admin.from('in_app_messages').insert({
          recipient_id: recipientUserId,
          sender_id: user?.id || null,
          type: 'share',
          title: `Shared ${contentType}: ${title}`,
          body: `You were invited to view "${title}". Tap below to experience it.`,
          payload: { contentId: contentId, url: directExperienceUrl },
          user_id: recipientUserId,
          subject: `Shared ${contentType}: "${title}"`,
          message: `${senderName} has invited you to view "${title}".\n\nTap below to experience it:\n${storyLink}`,
          is_read: false
        });
      } catch (err) {
        console.warn("Failed to insert into in_app_messages:", err);
      }
    };

    // Helper: Dispatch Email notification via Resend
    const dispatchEmail = async (targetEmail: string, recipientDisplayName?: string) => {
      if (!targetEmail || !process.env.RESEND_API_KEY) return;
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Between Us <invites@betweenusapp.io>',
            to: targetEmail,
            subject: `Shared ${isRoleplay ? 'Roleplay' : 'Story'}: "${title}" on Between Us`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 32px; border-radius: 16px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
                <div style="margin-bottom: 24px;">
                  <span style="font-size: 28px;">🔥</span>
                  <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 600;">Between Us</h1>
                  <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Private Shared ${isRoleplay ? 'Roleplay Scenario' : 'Story'}</p>
                </div>
                <div style="background-color: #18181b; padding: 20px; border-radius: 12px; border: 1px solid #27272a; margin-bottom: 24px;">
                  <p style="font-size: 15px; color: #d4d4d8; margin: 0 0 12px 0;">${senderName} has shared a private ${isRoleplay ? 'roleplay scenario' : 'story'} with you:</p>
                  <h2 style="font-size: 20px; font-weight: bold; color: #ffffff; margin: 0;">"${title}"</h2>
                </div>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${storyLink}" style="display: inline-block; background-color: #7f1d1d; color: #ffffff; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(127, 29, 29, 0.4);">
                    View ${isRoleplay ? 'Roleplay (Lens B)' : 'Story'}
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
        console.warn("Failed to dispatch Resend email:", mailErr);
      }
    };

    // Helper: Dispatch SMS via Twilio
    const dispatchSms = async (targetPhone: string) => {
      if (!targetPhone || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return;
      try {
        const digitsOnly = targetPhone.replace(/[^\d+]/g, '');
        const formattedPhone = targetPhone.startsWith('+') ? targetPhone : (digitsOnly.length === 10 ? `+1${digitsOnly}` : `+${digitsOnly}`);
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const formData = new URLSearchParams();
        formData.append('To', formattedPhone);
        formData.append('From', process.env.TWILIO_PHONE_NUMBER || '');
        formData.append('Body', `${senderName} shared an intimate ${isRoleplay ? 'roleplay scenario' : 'story'} on Between Us: "${title}". Tap here: ${storyLink}`);

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
    };

    // 1. PARTNER PASS DISPATCH: Send directly to linked Between Us Pass partner
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

      // Fetch partner profile
      const { data: partnerProfile } = await admin
        .from('profiles')
        .select('id, nickname, anonymous_alias, email, mobile_number')
        .eq('id', partnerUserId)
        .maybeSingle();

      const partnerName = partnerProfile?.nickname || partnerProfile?.anonymous_alias || 'Partner';
      const partnerEmail = partnerProfile?.email;
      const partnerPhone = partnerProfile?.mobile_number;

      // 1. Grant RLS access by appending partnerUserId to shared_with
      await grantRecipientAccess(partnerUserId);

      // 2. Insert notification into in_app_messages
      await deliverInAppMessage(partnerUserId);

      // 3. Dispatch Email & SMS
      if (partnerEmail) {
        await dispatchEmail(partnerEmail, partnerName);
      }
      if (partnerPhone) {
        await dispatchSms(partnerPhone);
      }

      return NextResponse.json({
        success: true,
        message: `${isRoleplay ? 'Roleplay scenario' : 'Story'} dispatched directly to ${partnerName}!`,
        storyLink
      });
    }

    // 2. DIRECT DISPATCH: Recipient Email, Username / Alias, or Mobile Number
    if (!recipient || typeof recipient !== 'string' || recipient.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing recipient' },
        { status: 400 }
      );
    }

    const cleanRecipient = recipient.trim();
    const cleanAlias = cleanRecipient.startsWith('@') ? cleanRecipient.slice(1).trim() : cleanRecipient;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanRecipient);
    const digitsOnly = cleanRecipient.replace(/[^\d+]/g, '');
    const isPhone = digitsOnly.length >= 10;

    // Lookup recipient's ID in public.profiles using recipient email or alias
    let recipientProfile: any = null;

    if (isEmail) {
      const { data: profileByEmail } = await admin
        .from('profiles')
        .select('id, nickname, anonymous_alias, email, mobile_number')
        .ilike('email', cleanRecipient)
        .maybeSingle();
      if (profileByEmail) recipientProfile = profileByEmail;
    }

    if (!recipientProfile) {
      const { data: profileByAlias } = await admin
        .from('profiles')
        .select('id, nickname, anonymous_alias, email, mobile_number')
        .or(`nickname.ilike.${cleanAlias},anonymous_alias.ilike.${cleanAlias}`)
        .maybeSingle();
      if (profileByAlias) recipientProfile = profileByAlias;
    }

    if (!recipientProfile && isPhone) {
      const phoneDigits = digitsOnly.replace(/^\+1/, '');
      const { data: profileByPhone } = await admin
        .from('profiles')
        .select('id, nickname, anonymous_alias, email, mobile_number')
        .ilike('mobile_number', `%${phoneDigits}%`)
        .maybeSingle();
      if (profileByPhone) recipientProfile = profileByPhone;
    }

    // If profile matched in database: grant RLS permission and populate in-app inbox
    if (recipientProfile) {
      // 1. Grant SELECT permissions in RLS by appending recipient's UUID to shared_with
      await grantRecipientAccess(recipientProfile.id);

      // 2. Deliver in-app message into recipient's inbox
      await deliverInAppMessage(recipientProfile.id);

      // 3. Dispatch Email notification via Resend
      const destEmail = recipientProfile.email || (isEmail ? cleanRecipient : null);
      if (destEmail) {
        await dispatchEmail(destEmail, recipientProfile.nickname || cleanAlias);
      }

      // 4. Dispatch SMS notification via Twilio if applicable
      const destPhone = recipientProfile.mobile_number || (isPhone ? cleanRecipient : null);
      if (destPhone) {
        await dispatchSms(destPhone);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully shared with ${recipientProfile.nickname || recipientProfile.anonymous_alias || cleanRecipient}!`,
        storyLink
      });
    }

    // If no existing profile found:
    // Allow external dispatch via Email or SMS if a valid contact method was supplied
    if (isEmail) {
      await dispatchEmail(cleanRecipient);
      return NextResponse.json({
        success: true,
        message: `Direct link successfully emailed to ${cleanRecipient}!`,
        storyLink
      });
    }

    if (isPhone) {
      await dispatchSms(cleanRecipient);
      return NextResponse.json({
        success: true,
        message: `Direct link successfully texted to ${cleanRecipient}!`,
        storyLink
      });
    }

    // If input is neither a valid email/phone nor a matched username
    return NextResponse.json(
      { error: `User "${cleanRecipient}" not found. Please verify the username or enter a valid email address.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Share dispatch error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch share' },
      { status: 500 }
    );
  }
}
