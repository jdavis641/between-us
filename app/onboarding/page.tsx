'use client';

import { COUNTRY_CODES, formatE164Phone, splitPhone } from "@/utils/phone";
import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient({
  global: {
    fetch: (url: any, opts: any = {}) => fetch(url, { ...opts, cache: 'no-store' })
  }
});

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  // Step state: null (loading), 0 (payment), 1 (minimal identity: alias & optional phone)
  const [step, setStep] = useState<number | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Minimal identity state
  const [username, setUsername] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [mobileNumber, setMobileNumber] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);

  // Track and persist share_id parameter
  useEffect(() => {
    const paramShareId = searchParams.get('share_id');
    if (paramShareId) {
      setShareId(paramShareId);
      try {
        sessionStorage.setItem('share_id', paramShareId);
        document.cookie = `share_id=${encodeURIComponent(paramShareId)}; path=/; max-age=86400; SameSite=Lax`;
      } catch (e) {
        console.warn('Could not persist share_id in onboarding:', e);
      }
    } else {
      try {
        const stored = sessionStorage.getItem('share_id');
        if (stored) {
          setShareId(stored);
        } else {
          const match = document.cookie.match(/(?:^|;\s*)share_id=([^;]+)/);
          if (match && match[1]) {
            setShareId(decodeURIComponent(match[1]));
          }
        }
      } catch (e) {}
    }
  }, [searchParams]);

  // Fetch session & profile
  useEffect(() => {
    async function fetchSession() {
      let activeUser: any = null;
      let currentSession: any = null;
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user && !userError) {
        activeUser = user;
        const { data: { session: s } } = await supabase.auth.getSession();
        currentSession = s || { user };
      } else {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s?.user) {
          activeUser = s.user;
          currentSession = s;
        }
      }

      if (activeUser) {
        setSession(currentSession);

        let data: any = null;
        try {
          const res = await fetch('/api/profile', {
            headers: currentSession?.access_token ? {
              'Authorization': `Bearer ${currentSession.access_token}`
            } : {},
            cache: 'no-store'
          });
          if (res.ok) {
            const json = await res.json();
            data = json.profile;
          }
        } catch (e) {
          console.warn('[Onboarding] Failed to fetch profile from /api/profile:', e);
        }

        if (!data) {
          const { data: dbData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', activeUser.id)
            .maybeSingle();
          data = dbData;
        }

        setProfile(data);

        if (data?.anonymous_alias || data?.nickname) {
          const existingName = data.anonymous_alias || data.nickname || '';
          setUsername(existingName);
          setUsernameStatus('available');
        }

        if (data?.mobile_number) {
          const split = splitPhone(data.mobile_number);
          setCountryCode(split.countryCode);
          setMobileNumber(split.nationalNumber);
        }

        const effectiveShareId = searchParams.get('share_id') || (() => {
          try { return sessionStorage.getItem('share_id'); } catch(e) { return null; }
        })() || (() => {
          const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)share_id=([^;]+)/) : null;
          return match ? decodeURIComponent(match[1]) : null;
        })();

        // If user has an active subscription and arrived via a share link, navigate directly
        if (data?.is_active && effectiveShareId) {
          try {
            sessionStorage.removeItem('share_id');
            document.cookie = 'share_id=; path=/; max-age=0';
          } catch(e) {}
          window.location.href = `/dashboard/experience/${effectiveShareId}`;
          return;
        }

        // Inactive users hit Stripe payment step
        if (!data?.is_active) {
          setStep(0);
        } else {
          setStep(1);
        }
      } else {
        router.push('/login');
      }
    }
    fetchSession();
  }, [router, sessionId, searchParams]);

  // Live-search debounce for anonymous_alias
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus('idle');
      setSuggestions([]);
      return;
    }

    if (profile && (trimmed === profile.anonymous_alias || trimmed === profile.nickname)) {
      setUsernameStatus('available');
      setSuggestions([]);
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-nickname', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anonymous_alias: trimmed })
        });
        const data = await res.json();
        if (data.available) {
          setUsernameStatus('available');
          setSuggestions([]);
        } else {
          setUsernameStatus('taken');
          setSuggestions(
            data.suggestions && data.suggestions.length > 0
              ? data.suggestions
              : [`${trimmed}_1`, `${trimmed}99`, `real_${trimmed}`]
          );
        }
      } catch (err) {
        console.error('Username check error:', err);
        setUsernameStatus('idle');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || usernameStatus === 'taken' || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let activeUserId = session?.user?.id;
      if (!activeUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        activeUserId = user?.id;
      }

      if (!activeUserId) {
        router.push('/login');
        return;
      }

      const formattedPhone = formatE164Phone(countryCode, mobileNumber) || null;

      // Persist profile identity via /api/profile service role pipeline
      const sessionToken = session?.access_token;
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
        },
        body: JSON.stringify({
          nickname: cleanUsername,
          anonymous_alias: cleanUsername,
          mobile_number: formattedPhone,
          onboarding_completed: true,
          literature_prompt_status: 'completed'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error saving minimal onboarding profile via /api/profile:", errorData);
        setError("Could not save your profile. " + (errorData.error || 'Server error'));
        setIsSubmitting(false);
        return;
      }

      // Directly route to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      setError(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  if (step === null) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-500 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading onboarding engine...</span>
        </div>
      </div>
    );
  }

  // STEP 0: STRIPE PAYMENT
  if (step === 0) {
    return (
      <div className="flex flex-col space-y-6 min-h-screen bg-zinc-950 text-white p-8 items-center justify-center font-sans">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/60 p-8 rounded-2xl border border-zinc-800 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto bg-red-950/60 border border-red-900/50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            ✨
          </div>
          <h2 className="text-3xl font-serif font-medium text-zinc-100">Activate Account</h2>
          <p className="text-zinc-400 mt-2 font-light leading-relaxed">
            Complete your subscription to access personalized games, literature, roleplay scenarios, and your Between Us Pass.
          </p>
          <a
            href={`https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00?client_reference_id=${session?.user?.id}&prefilled_email=${encodeURIComponent(session?.user?.email || '')}${shareId ? `&share_id=${encodeURIComponent(shareId)}` : ''}`}
            className="block w-full bg-red-900 text-white p-4 rounded-xl font-medium hover:bg-red-800 transition-colors mt-6 shadow-lg shadow-red-900/20"
          >
            Pay with Stripe
          </a>
        </div>
      </div>
    );
  }

  // STEP 1: MINIMAL ONBOARDING IDENTITY
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 md:p-12 flex flex-col items-center justify-center selection:bg-red-500/30">
      <div className="max-w-xl w-full">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-red-500 font-bold">Quick Setup</span>
              <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 transition-colors">Skip to Dashboard &rarr;</Link>
            </div>
            <h1 className="text-3xl font-serif font-medium text-zinc-100 mt-1">Choose Your Anonymous Alias</h1>
            <p className="text-zinc-400 mt-2 text-sm leading-relaxed font-light">
              Your alias keeps your identity private on Between Us. You can curate your boundary preferences and tolerance tier anytime inside Account Settings.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-900 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Anonymous Alias / Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g., MidnightWanderer, VelvetEcho"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                  className={`w-full p-4 bg-zinc-950 text-white placeholder-zinc-500 border rounded-xl text-base focus:outline-none transition-colors ${
                    usernameStatus === 'available'
                      ? 'border-green-600/80 focus:border-green-500'
                      : usernameStatus === 'taken'
                        ? 'border-red-600/80 focus:border-red-500'
                        : 'border-zinc-800 focus:border-zinc-600'
                  }`}
                />
                {usernameStatus === 'checking' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Status indicator */}
              <div className="mt-2.5 min-h-[24px]">
                {usernameStatus === 'checking' && (
                  <p className="text-xs text-yellow-400 font-medium flex items-center gap-1.5">
                    Checking availability...
                  </p>
                )}
                {usernameStatus === 'available' && (
                  <p className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                    <span>✓</span> Username available
                  </p>
                )}
                {usernameStatus === 'taken' && (
                  <div className="space-y-3">
                    <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                      <span>✕</span> Username already taken
                    </p>
                    {suggestions.length > 0 && (
                      <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                        <p className="text-xs text-zinc-400 mb-2 font-medium">Available variations:</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setUsername(sug)}
                              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Optional Mobile Number */}
            <div className="pt-2 border-t border-zinc-800/60">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Mobile Number (SMS)
                </label>
                <span className="text-xs text-zinc-500">Optional</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3 font-light leading-relaxed">
                Add an optional phone number to receive discreet notifications or partner invite links.
              </p>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-zinc-600 shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="flex-1 p-3.5 bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || usernameStatus === 'taken' || !username.trim()}
                className="w-full py-4 px-6 bg-red-900 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-red-950 text-base flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Entering Dashboard...</span>
                  </>
                ) : (
                  <span>Enter Dashboard &rarr;</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-500 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading onboarding...</span>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
