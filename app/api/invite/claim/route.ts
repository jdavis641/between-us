import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createClientBase } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || body.invite_token || body.pass || body.pass_token;

    if (!token) {
      return NextResponse.json({ error: "Missing invitation token" }, { status: 400 });
    }

    const supabaseAdmin = createClientBase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let user: any = null;
    try {
      const authSupabase = await createServerClient();
      user = (await authSupabase.auth.getUser()).data?.user || null;
    } catch {}

    const authHeader = req.headers.get('Authorization');
    const explicitToken = authHeader?.replace('Bearer ', '')?.trim();
    if (!user && explicitToken && explicitToken !== 'undefined' && explicitToken !== 'null') {
      try {
        const tokenRes = await supabaseAdmin.auth.getUser(explicitToken);
        user = tokenRes.data?.user || null;
      } catch {}
    }

    // Fallback user resolution from body if cookies/tokens are still hydrating
    if (!user && (body.userId || body.user_id)) {
      const targetId = body.userId || body.user_id;
      const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(targetId);
      if (adminUser?.user) {
        user = adminUser.user;
      }
    }

    if (!user && (body.userEmail || body.email)) {
      const targetEmail = String(body.userEmail || body.email).toLowerCase().trim();
      const { data: profileUser } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .ilike('email', targetEmail)
        .maybeSingle();
      if (profileUser) {
        user = { id: profileUser.id, email: profileUser.email } as any;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to claim this pass." }, { status: 401 });
    }

    // 1. Fetch invitation record from public.invitations
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('invite_token', String(token).trim())
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

    // 2. Resolve sender information and extract boundaries, kinks, and instructions
    const senderId = invitation.sender_id || (invitation as any).creator_id;
    let senderName = "Your Partner";
    let boundariesText = "Standard intimate boundaries";
    let kinksText = "None specified";
    let instructionsText = "No special instructions provided.";

    // Check if payload is directly attached to the invitation record
    const rawPayload = (invitation as any).payload || (invitation as any).metadata || (invitation as any).config;
    if (rawPayload) {
      try {
        const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
        if (Array.isArray(parsed.boundaries) && parsed.boundaries.length > 0) {
          boundariesText = parsed.boundaries.join(', ');
        } else if (typeof parsed.boundaries === 'string' && parsed.boundaries.trim()) {
          boundariesText = parsed.boundaries.trim();
        }
        if (Array.isArray(parsed.kinks) && parsed.kinks.length > 0) {
          kinksText = parsed.kinks.join(', ');
        } else if (typeof parsed.kinks === 'string' && parsed.kinks.trim()) {
          kinksText = parsed.kinks.trim();
        }
        if (parsed.instructions && parsed.instructions.trim()) {
          instructionsText = parsed.instructions.trim();
        }
      } catch (e) {}
    }

    if (senderId) {
      const { data: senderProfile } = await supabaseAdmin
        .from('profiles')
        .select('nickname, anonymous_alias, email')
        .eq('id', senderId)
        .maybeSingle();

      if (senderProfile?.nickname || senderProfile?.anonymous_alias) {
        senderName = senderProfile.nickname || senderProfile.anonymous_alias;
      }

      // Extract secure JSON payload from sender's Guest Pass Config in intimacy_preferences if not already present
      if (boundariesText === "Standard intimate boundaries" && instructionsText === "No special instructions provided.") {
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
            if (typeof prefRow.kinks_override === 'string' && prefRow.kinks_override.trim()) {
              instructionsText = prefRow.kinks_override.trim();
            }
          }
        }
      }
    }

    if (invitation.status === 'claimed') {
      return NextResponse.json({
        success: true,
        message: "Guest pass already claimed.",
        sender: senderName
      }, { status: 200 });
    }

    // 3. Mark the invitation status as 'claimed'
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

    // 5. Construct payload
    const effectivePayload = invitation.payload && typeof invitation.payload === 'object' && Object.keys(invitation.payload).length > 0
      ? invitation.payload
      : (rawPayload || {
          boundaries: boundariesText,
          kinks: kinksText,
          instructions: instructionsText,
          token: token,
          claimed_at: new Date().toISOString()
        });

    // 6. Insert an entry into public.in_app_messages for the authenticated recipient
    await supabaseAdmin.from('in_app_messages').insert({
      recipient_id: user.id,
      sender_id: invitation.sender_id || (invitation as any).creator_id || null,
      type: 'guest_pass',
      title: 'Between Us Guest Pass Received',
      body: 'Your partner has shared private instructions and boundaries for your upcoming encounter.',
      payload: effectivePayload,
      user_id: user.id,
      subject: 'Between Us Guest Pass Received',
      message: 'Your partner has shared private instructions and boundaries for your upcoming encounter.',
      is_read: false
    });

    return NextResponse.json({
      success: true,
      message: "Guest pass claimed successfully. Instructions delivered to your inbox.",
      sender: senderName
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error claiming guest pass:", error);
    return NextResponse.json({ error: error.message || "Failed to claim guest pass" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('invite_token') || searchParams.get('token') || searchParams.get('pass') || searchParams.get('pass_token');
  if (!token) {
    return NextResponse.json({ error: "Missing invitation token" }, { status: 400 });
  }

  const dummyReq = new Request(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({ invite_token: token, token })
  });

  return POST(dummyReq);
}
