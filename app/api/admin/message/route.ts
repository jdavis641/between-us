import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { user_id, subject, message } = await req.json();

    if (!user_id || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden. Admin only." }, { status: 403 });
    }

    const { error: insertError } = await supabase
      .from('in_app_messages')
      .insert({
        user_id,
        subject,
        message
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Admin Message API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
