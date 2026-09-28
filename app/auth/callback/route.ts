import { NextResponse } from 'next/server'
import { createClient } from '../../../src/utils/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/onboarding'
  
  if (code) {
    const supabase = await createClient()
    
    // Exchange the auth code for a session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth-exchange-failed`)
    }
    
    if (session) {
      const adminEmails = [
        'jdcdjd664411@proton.me',
        'jdavis641+ember@gmail.com',
        'crystalbrndt3+spark@gmail.com'
      ];

      if (session.user.email && adminEmails.includes(session.user.email)) {
        // Admin Bypass Logic: instantly set is_active = true
        await supabase.from('profiles').update({ is_active: true }).eq('id', session.user.id);

        // Connection Group Auto-Activation
        const { data: memberData } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();

        if (memberData?.group_id) {
          await supabase.from('connection_groups')
            .update({ status: 'active' })
            .eq('id', memberData.group_id);
        }

        return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
      }

      // Evaluate user's profile status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active, nickname')
        .eq('id', session.user.id)
        .maybeSingle()
        
      if (profile?.is_active) {
        if (!profile.nickname) {
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
        }
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      } else {
        // Drop unpaid users into signup to pay
        return NextResponse.redirect(`${requestUrl.origin}/signup`)
      }
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth-failed`)
}

