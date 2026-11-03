import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createClientBase } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  return createClientBase(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * POST /api/invite/partner
 * Dispatches a Between Us Pass invitation email and establishes partner connection.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      partnerId,
      partnerEmail,
      email,
      searchTerm,
      selectedBoundaries,
      boundaries,
      selectedKinks,
      kinks
    } = body;

    const authSupabase = await createServerClient();
    let user = (await authSupabase.auth.getUser()).data?.user;

    const admin = getAdminClient();

    let authHeader = req.headers.get('Authorization');
    let explicitToken = authHeader?.replace('Bearer ', '')?.trim();
    if (!user && explicitToken && explicitToken !== 'undefined' && explicitToken !== 'null') {
      const res = await admin.auth.getUser(explicitToken);
      user = res.data?.user || null;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to send a Between Us Pass." },
        { status: 401 }
      );
    }

    // 1. Resolve sender profile details
    const { data: myProfile } = await admin
      .from('profiles')
      .select('nickname, anonymous_alias, email')
      .eq('id', user.id)
      .maybeSingle();

    const senderName = myProfile?.nickname || myProfile?.anonymous_alias || user.email?.split('@')[0] || 'Your Partner';

    // 2. Resolve recipient partner
    let partnerUser: any = null;
    const rawTarget = (partnerEmail || email || searchTerm || '').trim();

    if (partnerId) {
      const { data: byId } = await admin
        .from('profiles')
        .select('id, nickname, anonymous_alias, email, mobile_number')
        .eq('id', partnerId)
        .maybeSingle();
      if (byId) partnerUser = byId;
    }

    if (!partnerUser && rawTarget) {
      const isTargetEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawTarget);
      if (isTargetEmail) {
        const { data: byEmail } = await admin
          .from('profiles')
          .select('id, nickname, anonymous_alias, email, mobile_number')
          .ilike('email', rawTarget)
          .maybeSingle();
        if (byEmail) partnerUser = byEmail;
      }

      if (!partnerUser) {
        const cleanAlias = rawTarget.startsWith('@') ? rawTarget.slice(1).trim() : rawTarget;
        const { data: byAlias } = await admin
          .from('profiles')
          .select('id, nickname, anonymous_alias, email, mobile_number')
          .or(`nickname.ilike.${cleanAlias},anonymous_alias.ilike.${cleanAlias}`)
          .maybeSingle();
        if (byAlias) partnerUser = byAlias;
      }
    }

    // Target email sanitation
    const destinationEmail = (partnerUser?.email || partnerEmail || email || (rawTarget.includes('@') ? rawTarget : null))?.toLowerCase()?.trim();

    if (!destinationEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinationEmail)) {
      return NextResponse.json(
        { error: "A valid partner email address is required to dispatch the Between Us Pass." },
        { status: 400 }
      );
    }

    const partnerName = partnerUser?.nickname || partnerUser?.anonymous_alias || destinationEmail.split('@')[0] || 'Partner';
    const effectiveBoundaries = selectedBoundaries || boundaries || [];
    const effectiveKinks = selectedKinks || kinks || [];

    // 3. Establish connection group if partner profile exists
    if (partnerUser?.id) {
      // Find existing group or create a new one
      const { data: existingGroup } = await admin
        .from('connection_groups')
        .insert({ group_type: 'couple' })
        .select()
        .maybeSingle();

      if (existingGroup?.id) {
        await admin.from('group_members').insert([
          {
            group_id: existingGroup.id,
            user_id: user.id,
            role: 'member',
            preferences_shared: JSON.stringify({ boundaries: effectiveBoundaries, kinks: effectiveKinks })
          },
          {
            group_id: existingGroup.id,
            user_id: partnerUser.id,
            role: 'member',
            preferences_shared: JSON.stringify({})
          }
        ]);
      }
    }

    // 4. Create record in public.invitations
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiration for Between Us Pass

    const passPayload = {
      type: 'between_us_pass',
      boundaries: effectiveBoundaries,
      kinks: effectiveKinks,
      senderName,
      senderEmail: user.email
    };

    try {
      await admin.from('intimacy_preferences').upsert({
        user_id: user.id,
        category_tag: 'Guest Pass Config',
        kinks_override: JSON.stringify({
          boundaries: effectiveBoundaries,
          kinks: effectiveKinks,
          instructions: `Between Us Pass from ${senderName}`
        })
      }, { onConflict: 'user_id, category_tag' });
    } catch (prefErr) {
      console.warn("Could not persist intimacy preferences for partner pass:", prefErr);
    }

    const { error: invErr } = await admin.from('invitations').insert({
      sender_id: user.id,
      recipient_identifier: destinationEmail,
      invite_token: inviteToken,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      payload: passPayload
    });

    if (invErr) {
      console.warn("Could not insert invitation with payload, retrying basic fields:", invErr);
      await admin.from('invitations').insert({
        sender_id: user.id,
        recipient_identifier: destinationEmail,
        invite_token: inviteToken,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://betweenusapp.io';
    const joinLink = `${baseUrl}/signin?pass=${inviteToken}`;

    // 5. Insert in-app message if partner user already exists
    if (partnerUser?.id) {
      const subjectTitle = `Between Us Pass from ${senderName}`;
      const msgBody = `${senderName} has sent you a Between Us Pass to link your profiles, share intimate boundaries, and curate personalized scenarios together.`;
      
      await admin.from('in_app_messages').insert({
        recipient_id: partnerUser.id,
        user_id: partnerUser.id,
        sender_id: user.id,
        type: 'between_us_pass',
        title: subjectTitle,
        subject: subjectTitle,
        body: msgBody,
        message: msgBody,
        payload: { pass_token: inviteToken, url: joinLink }
      });
    }

    // 6. Dispatch Email Notification via Resend
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured.");
      return NextResponse.json(
        { error: "Email delivery service not configured on server (missing RESEND_API_KEY)." },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailSubject = `Between Us Pass: ${senderName} invited you to connect`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 32px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #27272a;">
        <div style="margin-bottom: 24px; text-align: center;">
          <span style="font-size: 32px;">💑</span>
          <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 4px 0; font-weight: 600;">Between Us Pass</h1>
          <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Private & Discreet Intimacy Connection</p>
        </div>
        <div style="background-color: #18181b; padding: 24px; border-radius: 12px; border: 1px solid #27272a; margin-bottom: 24px;">
          <p style="font-size: 15px; color: #d4d4d8; line-height: 1.6; margin: 0 0 16px 0;">
            <strong>${senderName}</strong> has sent you a Between Us Pass.
          </p>
          <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0 0 16px 0;">
            Between Us is a private, discreet platform designed to facilitate open and judgment-free intimacy conversations. Merging your accounts allows you to securely share desires, boundaries, and curiosities while keeping sensitive topics safe.
          </p>
          <p style="font-size: 13px; color: #71717a; margin: 0;">
            This single-use pass link will link your profiles so you can explore custom date night roleplays and games together.
          </p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${joinLink}" style="background-color: #7f1d1d; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(127, 29, 29, 0.4);">
            Accept Pass & Connect
          </a>
        </div>
        <p style="font-size: 12px; color: #71717a; text-align: center; margin: 24px 0 0 0;">
          Direct link: <a href="${joinLink}" style="color: #ef4444; text-decoration: underline;">${joinLink}</a>
        </p>
      </div>
    `;
    const emailText = `${senderName} has sent you a Between Us Pass!\n\nAccept your pass and link profiles here: ${joinLink}`;

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: 'Between Us <invites@betweenusapp.io>',
      to: destinationEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    if (resendError) {
      console.error("Resend partner invite dispatch failed:", resendError);
      return NextResponse.json(
        { error: resendError.message || "Failed to deliver Between Us Pass email" },
        { status: 500 }
      );
    }

    console.log(`[Between Us Pass] Email successfully dispatched to ${destinationEmail} (id: ${resendData?.id})`);

    return NextResponse.json({
      success: true,
      message: `Between Us Pass sent to ${partnerName}!`,
      token: inviteToken,
      joinLink
    });
  } catch (error: any) {
    console.error("Partner pass dispatch error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch Between Us Pass" },
      { status: 500 }
    );
  }
}
