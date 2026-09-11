import { NextResponse } from 'next/server'
import { createClient } from '../../../../src/utils/supabase/server'
import Stripe from 'stripe'

// Initialize Stripe (assuming the secret is in env, but fallback for dev if needed)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No active Stripe customer found.' }, { status: 400 })
    }

    const requestUrl = new URL(req.url)

    // Generate the portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      configuration: 'bpc_1UEVTyFe6PjEbyHK5fGUomD5',
      return_url: `${requestUrl.origin}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Stripe Portal Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
