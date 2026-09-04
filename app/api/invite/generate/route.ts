import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { groupId, inviteType } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const inviteToken = crypto.randomUUID();

    const { error } = await supabase.from("invitations").insert({
      group_id: groupId,
      invite_token: inviteToken,
      invite_type: inviteType || "couple"
    });

    if (error) throw error;

    return NextResponse.json({ token: inviteToken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
