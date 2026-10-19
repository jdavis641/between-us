import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createClientBase } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || body.pass || body.invite_token;

    if (!token) {
      return NextResponse.json({ error: "Missing invitation token" }, { status: 400 });
    }

    const authSupabase = await createServerClient();
    let { data: { user } } = await authSupabase.auth.getUser();

    const authHeader = req.headers.get('Authorization');
    const explicitToken = authHeader?.replace('Bearer ', '')?.trim();
    if (!user && explicitToken && explicitToken !== 'undefined' && explicitToken !== 'null') {
      const tokenRes = await authSupabase.auth.getUser(explicitToken);
      user = tokenRes.data?.user || null;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to claim this pass." }, { status: 401 });
    }

    const supabaseAdmin = createClientBase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch invitation record
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('invite_token', token.trim())
      .maybeSingle();

    if (invError || !invitation) {
      return NextResponse.json({ error: "Invalid invitation token." }, { status: 404 });
    }

    if (invitation.status === 'revoked') {
      return NextResponse.json({ error: "This invitation has been revoked by the sender." }, { status: 410 });
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "This guest pass has expired." }, { status: 410 });
    }

    // 2. Resolve sender information and guest pass instructions
    const senderId = invitation.sender_id;
    let senderName = "Your Partner";
    let boundariesText = "Standard intimate boundaries";
    let kinksText = "None specified";
    let instructionsText = "No special instructions provided.";

    if (senderId) {
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('nickname, anonymous_alias, email')
        .eq('id', senderId)
        .maybeSingle();

      if (senderProfile?.nickname || senderProfile?.anonymous_alias) {
        senderName = senderProfile.nickname || senderProfile.anonymous_alias;
      }

      const { data: prefRow } = await supabaseAdmin
        .from('intimacy_preferences')
        .select('kinks_override')
        .eq('user_id', senderId)
        .eq('category_tag', 'Guest Pass Config')
        .maybeSingle();

      if (prefRow?.kinks_override) {
        try {
          const parsed = JSON.parse(prefRow.kinks_override);
          if (Array.isArray(parsed.boundaries) && parsed.boundaries.length > 0) {
            boundariesText = parsed.boundaries.join(', ');
          }
          if (Array.isArray(parsed.kinks) && parsed.kinks.length > 0) {
            kinksText = parsed.kinks.join(', ');
          } else if (typeof parsed.kinks === 'string' && parsed.kinks.trim()) {
            kinksText = parsed.kinks.trim();
          }
          if (parsed.instructions && parsed.instructions.trim()) {
            instructionsText = parsed.instructions.trim();
          }
        } catch {
          if (typeof prefRow.kinks_override === 'string') {
            instructionsText = prefRow.kinks_override;
          }
        }
      }
    }

    // 3. Update invitation status to claimed
    await supabaseAdmin
      .from('invitations')
      .update({ status: 'claimed' })
      .eq('id', invitation.id);

    // 4. Ensure recipient profile is active for guest access
    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: user.email,
      is_active: true
    }, { onConflict: 'id' });

    // 5. Physically deliver instructions & boundaries into public.in_app_messages
    const { data: existingMsg } = await supabaseAdmin
      .from('in_app_messages')
      .select('id')
      .eq('user_id', user.id)
      .ilike('subject', `%Guest Pass from ${senderName}%`)
      .maybeSingle();

    if (!existingMsg) {
      const formattedMessage = `You have accepted a Guest Pass from ${senderName}!\n\n` +
        `SHARED BOUNDARIES:\n${boundariesText}\n\n` +
        `SHARED DESIRES & KINKS:\n${kinksText}\n\n` +
        `GUEST INSTRUCTIONS & CHEAT CODES:\n"${instructionsText}"\n\n` +
        `This pass gives you access to explore curated experiences together. Head to the dashboard to begin!`;

      await supabaseAdmin.from('in_app_messages').insert({
        user_id: user.id,
        subject: `Guest Pass from ${senderName}: Instructions & Desires`,
        message: formattedMessage,
        is_read: false
      });
    }

    return NextResponse.json({
      success: true,
      message: "Guest pass claimed successfully. Instructions delivered to your inbox.",
      sender: senderName
    });
  } catch (error: any) {
    console.error("Error claiming guest pass:", error);
    return NextResponse.json({ error: error.message || "Failed to claim guest pass" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || searchParams.get('pass');
  if (!token) {
    return NextResponse.json({ error: "Missing invitation token" }, { status: 400 });
  }

  // Create simulated POST request
  const dummyReq = new Request(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({ token })
  });

  return POST(dummyReq);
}
