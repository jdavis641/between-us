import { NextResponse } from 'next/server'
import { createClient } from '../../../src/utils/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/onboarding'
  
  if (code) {
    const supabase = await createClient()
    
    // Exchange the auth code for a session
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)
    
    if (session) {
      // Evaluate user's is_active profile status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', session.user.id)
        .single()
        
      if (profile?.is_active) {
        // Route active/paid users directly to the next path
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      } else {
        // Intercept unpaid or new users and strictly redirect them to Stripe checkout
        const stripePaymentLink = `https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00?client_reference_id=${session.user.id}`
        return NextResponse.redirect(stripePaymentLink)
      }
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${requestUrl.origin}/onboarding?error=auth-failed`)
}
