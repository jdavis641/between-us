import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({ 
      email, 
      token: code, 
      type: 'email' 
    });

    if (error) {
      return NextResponse.json({ error: 'Invalid code: ' + error.message }, { status: 401 });
    }

    if (!data?.user) {
      return NextResponse.json({ error: 'Verification failed, no user returned.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active, nickname')
      .eq('id', data.user.id)
      .maybeSingle();

    let destination = '/dashboard';
    if (!profile?.is_active || !profile?.nickname) {
      destination = '/onboarding';
    }

    return NextResponse.json({ destination });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}
