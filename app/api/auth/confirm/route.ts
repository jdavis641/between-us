import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  // Depending on what Supabase auth helper is used, it might be an OtpType or just string
  const type = searchParams.get('type') as any
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()

    const { data: { session }, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      return NextResponse.redirect(`${origin}/onboarding?error=auth-exchange-failed`)
    }

    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active, nickname')
        .eq('id', session.user.id)
        .single()

      if (profile?.is_active) {
        if (!profile.nickname) {
          return NextResponse.redirect(`${origin}/onboarding/survey`)
        }
        return NextResponse.redirect(`${origin}/dashboard`)
      } else {
        const stripePaymentLink = `https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00?client_reference_id=${session.user.id}`
        return NextResponse.redirect(stripePaymentLink)
      }
    }
  }

  // If there's an error or no token, redirect back to onboarding with an error flag
  return NextResponse.redirect(`${origin}/onboarding?error=auth-failed`)
}