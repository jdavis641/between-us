import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createClientBase } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { checkRateLimit, resetRateLimit } from '@/utils/rate-limiter';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, code, share_id, pass_token, pass } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
    }

    // Rate Limiting Protection against OTP Brute-Force Attacks
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || 'unknown-client');
    const cleanEmail = email.toLowerCase().trim();
    const rateLimitKey = `otp_verify:${cleanEmail}:${clientIp}`;

    const { allowed, remaining, retryAfterSec } = checkRateLimit({
      key: rateLimitKey,
      maxAttempts: 5,
      windowMs: 5 * 60 * 1000 // 5 minutes
    });

    if (!allowed) {
      return NextResponse.json(
        { error: `Too many verification attempts. Please wait ${retryAfterSec} seconds before trying again.` },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(retryAfterSec)
          }
        }
      );
    }

    const cookieStore = await cookies();
    const cookiesToSetBuffer: { name: string; value: string; options: any }[] = [];
    const persistedShareId = share_id || cookieStore.get('share_id')?.value || null;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch (err) {
                // Ignore if in restricted context
              }
              cookiesToSetBuffer.push({ name, value, options });
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.verifyOtp({ 
      email: cleanEmail, 
      token: code.trim(), 
      type: 'email' 
    });

    if (error) {
      return NextResponse.json(
        { error: 'Invalid code: ' + error.message, remainingAttempts: remaining }, 
        { 
          status: 401,
          headers: {
            'X-RateLimit-Remaining': String(remaining)
          }
        }
      );
    }

    // Reset rate limiter on successful verification
    resetRateLimit(rateLimitKey);

    if (!data?.user) {
      return NextResponse.json({ error: 'Verification failed, no user returned.' }, { status: 401 });
    }

    const supabaseAdmin = createClientBase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Admin bypass list
    const adminEmails = [
      'jdcdjd664411@proton.me',
      'jdavis641+ember@gmail.com',
      'crystalbrndt3+spark@gmail.com'
    ];

    const isAdmin = Boolean(cleanEmail && adminEmails.includes(cleanEmail));
    if (isAdmin) {
      await supabaseAdmin.from('profiles').upsert({ id: data.user.id, is_active: true, email: cleanEmail }, { onConflict: 'id' });
    }

    // Process Guest Pass Claim & Automated Inbox Delivery if present
    const rawPassToken = pass_token || pass || cookieStore.get('pass_token')?.value || cookieStore.get('pass')?.value || null;
    const effectivePassToken = rawPassToken ? String(rawPassToken).trim() : null;

    if (effectivePassToken) {
      try {
        const { data: invitation } = await supabaseAdmin
          .from('invitations')
          .select('*')
          .eq('invite_token', effectivePassToken)
          .maybeSingle();

        if (invitation && invitation.status !== 'revoked' && (!invitation.expires_at || new Date(invitation.expires_at) > new Date())) {
          // 1. Mark invitation claimed
          await supabaseAdmin
            .from('invitations')
            .update({ status: 'claimed' })
            .eq('id', invitation.id);

          // 2. Fetch sender details & Guest Pass Config
          const senderId = invitation.sender_id;
          let senderName = "Your Partner";
          let boundariesText = "Standard intimate boundaries";
          let kinksText = "None specified";
          let instructionsText = "No special instructions provided.";

          if (senderId) {
            const { data: senderProfile } = await supabaseAdmin
              .from('profiles')
              .select('nickname, anonymous_alias, email')
              .eq('id', senderId)
              .maybeSingle();

            if (senderProfile?.nickname || senderProfile?.anonymous_alias) {
              senderName = senderProfile.nickname || senderProfile.anonymous_alias;
            }

            const { data: prefRow } = await supabaseAdmin
              .from('intimacy_preferences')
              .select('kinks_override')
              .eq('user_id', senderId)
              .eq('category_tag', 'Guest Pass Config')
              .maybeSingle();

            if (prefRow?.kinks_override) {
              try {
                const parsed = JSON.parse(prefRow.kinks_override);
                if (Array.isArray(parsed.boundaries) && parsed.boundaries.length > 0) {
                  boundariesText = parsed.boundaries.join(', ');
                }
                if (Array.isArray(parsed.kinks) && parsed.kinks.length > 0) {
                  kinksText = parsed.kinks.join(', ');
                } else if (typeof parsed.kinks === 'string' && parsed.kinks.trim()) {
                  kinksText = parsed.kinks.trim();
                }
                if (parsed.instructions && parsed.instructions.trim()) {
                  instructionsText = parsed.instructions.trim();
                }
              } catch {
                if (typeof prefRow.kinks_override === 'string') {
                  instructionsText = prefRow.kinks_override;
                }
              }
            }
          }

          // 3. Ensure recipient profile is marked active for the duration of the pass
          await supabaseAdmin.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            is_active: true
          }, { onConflict: 'id' });

          // 4. Physically deliver sender instructions & boundaries to recipient's inbox
          const { data: existingMsg } = await supabaseAdmin
            .from('in_app_messages')
            .select('id')
            .eq('user_id', data.user.id)
            .ilike('subject', `%Guest Pass from ${senderName}%`)
            .maybeSingle();

          if (!existingMsg) {
            const formattedMessage = `You have accepted a Guest Pass from ${senderName}!\n\n` +
              `SHARED BOUNDARIES:\n${boundariesText}\n\n` +
              `SHARED DESIRES & KINKS:\n${kinksText}\n\n` +
              `GUEST INSTRUCTIONS & CHEAT CODES:\n"${instructionsText}"\n\n` +
              `This pass gives you access to explore curated experiences together. Head to the dashboard to begin!`;

            await supabaseAdmin.from('in_app_messages').insert({
              user_id: data.user.id,
              subject: `Guest Pass from ${senderName}: Instructions & Desires`,
              message: formattedMessage,
              is_read: false
            });
          }

          // Clear pass token cookie
          cookiesToSetBuffer.push({
            name: 'pass_token',
            value: '',
            options: { path: '/', maxAge: 0 }
          });
          cookiesToSetBuffer.push({
            name: 'pass',
            value: '',
            options: { path: '/', maxAge: 0 }
          });
        }
      } catch (passErr) {
        console.warn("Guest pass processing warning:", passErr);
      }
    }

    // Query ground-truth profile via supabaseAdmin to bypass RLS restrictions
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    const isUserActive = Boolean(profile?.is_active === true || isAdmin);

    // Enforce Stripe Tollbooth for unrecognized or non-paying users
    if (!isUserActive) {
      const stripeBase = `https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00?client_reference_id=${data.user.id}&prefilled_email=${encodeURIComponent(cleanEmail)}`;
      const destination = persistedShareId ? `${stripeBase}&share_id=${encodeURIComponent(persistedShareId)}` : stripeBase;
      const response = NextResponse.json({ destination });
      cookiesToSetBuffer.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    }

    // Check if profile exists and has completed onboarding
    const isProfileComplete = Boolean(
      profile && (profile.onboarding_completed === true || !!profile.nickname || !!profile.anonymous_alias)
    );

    let destination = '/dashboard';

    // Active users with shared content bypass onboarding
    if (persistedShareId) {
      destination = `/dashboard/experience/${persistedShareId}`;
      cookiesToSetBuffer.push({
        name: 'share_id',
        value: '',
        options: { path: '/', maxAge: 0 }
      });
    } else if (!isProfileComplete) {
      destination = '/onboarding';
    } else {
      destination = '/dashboard';
    }

    const response = NextResponse.json({ destination });
    cookiesToSetBuffer.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error: ' + (err?.message || err) }, { status: 500 });
  }
}
