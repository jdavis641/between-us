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
      // Evaluate user's profile status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active, nickname')
        .eq('id', session.user.id)
        .single()
        
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
