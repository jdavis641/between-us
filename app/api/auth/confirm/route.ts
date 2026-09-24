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
      // Intercept Guest Pass Access Logic
      const pass_token = searchParams.get('pass_token')
      if (pass_token && process.env.RESEND_API_KEY) {
        // Find the invitation and the sender
        const supabaseAdmin = await createClient() // With service role ideally for admin ops, or use RLS bypass if needed
        const { data: invitation } = await supabaseAdmin
          .from('invitations')
          .select('id, group_id')
          .eq('invite_token', pass_token)
          .single()
          
        if (invitation && invitation.group_id) {
          // Find sender (assuming group_members has user_id of creator or just fetch from group)
          const { data: member } = await supabaseAdmin
            .from('group_members')
            .select('profiles(email)')
            .eq('group_id', invitation.group_id)
            .limit(1)
            .single()
            
          // @ts-ignore
          const senderEmail = member?.profiles?.email
          
          if (senderEmail) {
            const revokeLink = `${origin}/api/invite/revoke?token=${pass_token}`
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'Between Us <alerts@betweenus.app>',
                to: senderEmail,
                subject: 'Guest Pass Accessed',
                html: `<p>Your Guest Pass has just been accessed by your invitee!</p><p>If you wish to terminate their access immediately, <a href="${revokeLink}">click here to Cancel Pass</a>.</p>`
              })
            }).catch(console.error)
          }
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active, nickname')
        .eq('id', session.user.id)
        .single()

      if (profile?.is_active) {
        if (!profile.nickname) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
        return NextResponse.redirect(`${origin}/dashboard`)
      } else {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  }

  // If there's an error or no token, redirect back to onboarding with an error flag
  return NextResponse.redirect(`${origin}/onboarding?error=auth-failed`)
}