import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, code, share_id } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
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

    // Admin bypass list
    const adminEmails = [
      'jdcdjd664411@proton.me',
      'jdavis641+ember@gmail.com',
      'crystalbrndt3+spark@gmail.com'
    ];

    const isAdmin = Boolean(email && adminEmails.includes(email.toLowerCase()));
    if (isAdmin) {
      await supabase.from('profiles').upsert({ id: data.user.id, is_active: true }, { onConflict: 'id' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    const isUserActive = Boolean(profile?.is_active === true || isAdmin);

    // Check if profile exists and has completed onboarding
    const isProfileComplete = Boolean(
      profile && (profile.onboarding_completed === true || !!profile.nickname || !!profile.anonymous_alias)
    );

    let destination = '/dashboard';

    // Conditional routing: Shared content with onboarding suspension
    if (persistedShareId && isUserActive) {
      // Active user with shared link: bypass nickname/onboarding check entirely
      destination = `/dashboard/experience/${persistedShareId}`;
      // Clear share_id cookie so subsequent standard logins properly intercept for onboarding
      cookiesToSetBuffer.push({
        name: 'share_id',
        value: '',
        options: { path: '/', maxAge: 0 }
      });
    } else if (!isUserActive) {
      // Inactive/new user: route to Stripe, preserving share_id context
      const stripeBase = `https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00?client_reference_id=${data.user.id}&prefilled_email=${encodeURIComponent(email)}`;
      destination = persistedShareId ? `${stripeBase}&share_id=${encodeURIComponent(persistedShareId)}` : stripeBase;
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
