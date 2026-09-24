import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse('Missing pass token', { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Revoke the pass immediately by setting status to revoked and deleting the token
    const { error } = await supabaseAdmin
      .from('invitations')
      .update({ 
        status: 'revoked', 
        expires_at: new Date().toISOString() 
      })
      .eq('invite_token', token);

    if (error) throw error;

    return new NextResponse('Pass successfully revoked. Your guest no longer has access.', { status: 200 });
  } catch (err: any) {
    console.error('Failed to revoke pass:', err);
    return new NextResponse('Failed to revoke pass.', { status: 500 });
  }
}
