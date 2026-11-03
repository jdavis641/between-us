'use client'

import { useState, Suspense, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'

const supabase = createClient()

function AuthVerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [email, setEmail] = useState(() => searchParams.get('email') || '')
  const [otp, setOtp] = useState(() => searchParams.get('code') || '')
  const [authMessage, setAuthMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    // 1. Check searchParams for invite_token or pass_id
    const token = searchParams.get('invite_token') || 
                  searchParams.get('pass_id') || 
                  searchParams.get('token') || 
                  searchParams.get('pass') || 
                  searchParams.get('pass_token');

    if (token) {
      try {
        sessionStorage.setItem('pending_invite_token', token);
        sessionStorage.setItem('invite_token', token);
        sessionStorage.setItem('pass_token', token);
        document.cookie = `invite_token=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `pass_token=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
      } catch (e) {
        console.warn('Failed to store pending_invite_token:', e);
      }
    }

    const emailParam = searchParams.get('email');
    if (emailParam && !email) {
      setEmail(emailParam);
    }

    const codeParam = searchParams.get('code');
    if (codeParam && !otp) {
      setOtp(codeParam);
    }
  }, [searchParams]);

  const handleVerifyOtp = async () => {
    if (!email || !otp || otp.length < 6) return
    setLoading(true)
    setAuthMessage('Verifying code...')

    try {
      const shareId = searchParams.get('share_id') || (() => {
        try { return sessionStorage.getItem('share_id') } catch(e) { return null }
      })()

      const shareLens = searchParams.get('lens') || (() => {
        try { return sessionStorage.getItem('share_lens') } catch(e) { return null }
      })()

      const effectiveInviteToken = searchParams.get('invite_token') || 
                                   searchParams.get('pass_id') || 
                                   searchParams.get('token') || 
                                   searchParams.get('pass') || 
                                   searchParams.get('pass_token') || 
                                   (() => {
                                     try { return sessionStorage.getItem('pending_invite_token') || sessionStorage.getItem('invite_token') || sessionStorage.getItem('pass_token') } catch(e) { return null }
                                   })()

      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: otp,
          share_id: shareId,
          lens: shareLens,
          invite_token: effectiveInviteToken,
          pass_token: effectiveInviteToken,
          pass: effectiveInviteToken
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthMessage(data.error || 'Verification failed');
        setLoading(false);
      } else {
        // When OTP verification succeeds in the client action:
        // 1. Check sessionStorage.getItem('pending_invite_token')
        let pendingToken: string | null = null;
        try {
          pendingToken = sessionStorage.getItem('pending_invite_token');
        } catch (e) {}

        if (!pendingToken) {
          pendingToken = effectiveInviteToken;
        }

        // 2. If found, execute POST /api/invite/claim with { token } before navigating to /dashboard
        if (pendingToken) {
          try {
            const claimRes = await fetch('/api/invite/claim', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(data.session?.access_token ? { 'Authorization': `Bearer ${data.session.access_token}` } : {})
              },
              body: JSON.stringify({ 
                token: pendingToken,
                invite_token: pendingToken,
                userId: data.user?.id,
                userEmail: data.user?.email || email
              })
            });

            // 3. Clear the token from sessionStorage upon 200 response
            if (claimRes.ok || claimRes.status === 200) {
              try {
                sessionStorage.removeItem('pending_invite_token');
                sessionStorage.removeItem('invite_token');
                sessionStorage.removeItem('pass_token');
                document.cookie = 'invite_token=; path=/; max-age=0';
                document.cookie = 'pass_token=; path=/; max-age=0';
                document.cookie = 'pass=; path=/; max-age=0';
              } catch (e) {}
            }
          } catch (claimErr) {
            console.error('Error claiming guest pass post-OTP:', claimErr);
          }
        }

        const target = pendingToken ? '/dashboard' : (data.destination || '/dashboard');

        if (target.includes('/dashboard/experience/')) {
          try {
            sessionStorage.removeItem('share_id');
            sessionStorage.removeItem('share_lens');
            document.cookie = 'share_id=; path=/; max-age=0';
            document.cookie = 'share_lens=; path=/; max-age=0';
          } catch(e) {}
        }

        window.location.href = target;
      }
    } catch (err: any) {
      setAuthMessage('Network error: ' + err.message);
      setLoading(false);
    }
  }

  const handleResendCode = async () => {
    if (!email || resendCooldown > 0) return
    setResendMessage('')
    setResendCooldown(60)

    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      setResendMessage('Failed to resend: ' + error.message)
      setResendCooldown(0)
    } else {
      setResendMessage('New code sent!')
    }
  }

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  useEffect(() => {
    if (otp.length === 6 && email) {
      handleVerifyOtp()
    }
  }, [otp, email])

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white p-8 font-sans items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md shadow-[0_0_15px_rgba(244,63,94,0.15)]" />
          </div>
          <h2 className="text-3xl font-serif font-medium text-zinc-100">Verify Code</h2>
          <p className="text-zinc-400 mt-2 font-light">
            Enter the 6-digit access code sent to {email ? <span className="text-zinc-200 font-medium">{email}</span> : 'your email'}.
          </p>
        </div>

        <div className="space-y-4">
          {!email && (
            <input 
              type="email" 
              placeholder="Email address" 
              className="w-full p-4 bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl focus:outline-none focus:border-red-900/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          )}

          <input 
            type="text" 
            placeholder="6-digit code" 
            maxLength={6}
            className="w-full p-4 bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl focus:outline-none focus:border-red-900/50 text-center tracking-widest text-2xl"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            disabled={loading}
          />
          <button 
            onClick={handleVerifyOtp} 
            disabled={loading || otp.length < 6 || !email}
            className="w-full bg-zinc-100 text-zinc-950 p-4 rounded-xl font-medium hover:bg-white transition-colors disabled:opacity-50"
          >
            Verify & Continue
          </button>

          <div className="text-center pt-2">
            {resendCooldown > 0 ? (
              <p className="text-zinc-500 text-sm">Resend code in {resendCooldown}s</p>
            ) : (
              <button 
                onClick={handleResendCode}
                disabled={loading || !email}
                className="text-zinc-400 text-sm hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4"
              >
                Didn't receive a code? Resend
              </button>
            )}
            {resendMessage && <p className={`text-xs mt-2 ${resendMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{resendMessage}</p>}
          </div>

          {authMessage && <p className="text-red-400 text-sm font-medium mt-4 text-center">{authMessage}</p>}
        </div>
      </div>
    </div>
  )
}

export default function AuthVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">Loading...</div>}>
      <AuthVerifyContent />
    </Suspense>
  )
}
