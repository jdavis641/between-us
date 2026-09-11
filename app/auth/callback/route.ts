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
      return NextResponse.redirect(`${requestUrl.origin}/onboarding?error=auth-exchange-failed`)
    }
    
    if (session) {
      // Evaluate user's is_active profile status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', session.user.id)
        .single()
        
      if (profile?.is_active) {
        // If they haven't finished the survey (e.g. no nickname), send them there
        if (!profile.nickname) {
          return NextResponse.redirect(`${requestUrl.origin}/onboarding/survey`)
        }
        // Otherwise route active/paid users directly to the dashboard
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      } else {
        // Drop unpaid or new users into the setup flow precisely where they left off
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${requestUrl.origin}/onboarding?error=auth-failed`)
}
