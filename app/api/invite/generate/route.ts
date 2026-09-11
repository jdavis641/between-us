import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { groupId, inviteType, durationHours = 24, preferences = "" } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const inviteToken = crypto.randomUUID();
    
    // Calculate expiration timestamp
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (durationHours === 12 ? 12 : 24));

    const { error } = await supabase.from("invitations").insert({
      group_id: groupId,
      invite_token: inviteToken,
      invite_type: inviteType || "couple",
      expires_at: expiresAt.toISOString(),
      preferences: preferences
    });

    if (error) throw error;

    return NextResponse.json({ token: inviteToken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
