'use client'
import { useState, Suspense, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'

const supabase = createClient()

function SignInContent({ initialInviteToken }: { initialInviteToken?: string | null }) {
  const searchParams = useSearchParams()
  
  const [email, setEmail] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMessage, setResendMessage] = useState('')
  const [shareId, setShareId] = useState<string | null>(null)
  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    return initialInviteToken || 
           searchParams.get('invite_token') || 
           searchParams.get('token') || 
           searchParams.get('pass') || 
           searchParams.get('pass_token') || 
           null;
  })

  const router = useRouter()

  useEffect(() => {
    const urlShareId = searchParams.get('share_id')
    if (urlShareId) {
      setShareId(urlShareId)
      try {
        sessionStorage.setItem('share_id', urlShareId)
        document.cookie = `share_id=${encodeURIComponent(urlShareId)}; path=/; max-age=86400; SameSite=Lax`
      } catch (e) {
        console.warn('Could not store share_id in login:', e)
      }
    } else {
      try {
        const stored = sessionStorage.getItem('share_id')
        if (stored) {
          setShareId(stored)
          document.cookie = `share_id=${encodeURIComponent(stored)}; path=/; max-age=86400; SameSite=Lax`
        } else {
          const match = document.cookie.match(/(?:^|;\s*)share_id=([^;]+)/)
          if (match && match[1]) {
            const cookieVal = decodeURIComponent(match[1])
            setShareId(cookieVal)
            sessionStorage.setItem('share_id', cookieVal)
          }
        }
      } catch (e) {
        console.warn('Could not read stored share_id in login:', e)
      }
    }

    const urlInviteToken = searchParams.get('invite_token') || 
                           searchParams.get('token') || 
                           searchParams.get('pass') || 
                           searchParams.get('pass_token') || 
                           initialInviteToken;
    if (urlInviteToken) {
      setInviteToken(urlInviteToken)
      try {
        sessionStorage.setItem('invite_token', urlInviteToken)
        sessionStorage.setItem('pass_token', urlInviteToken)
        document.cookie = `invite_token=${encodeURIComponent(urlInviteToken)}; path=/; max-age=86400; SameSite=Lax`
        document.cookie = `pass_token=${encodeURIComponent(urlInviteToken)}; path=/; max-age=86400; SameSite=Lax`
      } catch (e) {}
    } else {
      try {
        const storedInvite = sessionStorage.getItem('invite_token') || sessionStorage.getItem('pass_token')
        if (storedInvite) {
          setInviteToken(storedInvite)
        } else {
          const matchInvite = document.cookie.match(/(?:^|;\s*)(?:invite_token|pass_token|pass)=([^;]+)/)
          if (matchInvite && matchInvite[1]) {
            setInviteToken(decodeURIComponent(matchInvite[1]))
          }
        }
      } catch (e) {}
    }
  }, [searchParams, initialInviteToken])
  
  const handleSendOtp = async () => {
    if (!email) return
    setLoading(true)
    setAuthMessage('Sending code...')
    const { error } = await supabase.auth.signInWithOtp({
      email,
    })
    
    if (error) {
      setAuthMessage(error.message)
    } else {
      setAuthMessage('')
      setIsEmailSent(true)
    }
    setLoading(false)
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) return
    setLoading(true)
    setAuthMessage('Verifying code...')

    try {
      const effectiveShareId = shareId || searchParams.get('share_id') || (() => {
        try { return sessionStorage.getItem('share_id') } catch(e) { return null }
      })()

      const effectiveInviteToken = inviteToken || 
                                   searchParams.get('invite_token') || 
                                   searchParams.get('token') || 
                                   searchParams.get('pass') || 
                                   searchParams.get('pass_token') || 
                                   (() => {
                                     try { return sessionStorage.getItem('invite_token') || sessionStorage.getItem('pass_token') } catch(e) { return null }
                                   })()

      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: otp,
          share_id: effectiveShareId,
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
        // Immediately after the OTP succeeds and session cookie is planted,
        // evaluate if an invite_token exists in state
        const tokenToClaim = inviteToken || effectiveInviteToken;
        if (tokenToClaim) {
          try {
            await fetch('/api/invite/claim', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(data.session?.access_token ? { 'Authorization': `Bearer ${data.session.access_token}` } : {})
              },
              body: JSON.stringify({ 
                invite_token: tokenToClaim,
                token: tokenToClaim,
                pass: tokenToClaim,
                userId: data.user?.id,
                userEmail: data.user?.email || email
              })
            });
          } catch (claimErr) {
            console.error('Error claiming guest pass post-OTP:', claimErr);
          }
        }

        const target = (inviteToken || effectiveInviteToken) ? '/dashboard' : (data.destination || '/dashboard');

        // Clear persisted state
        try {
          sessionStorage.removeItem('invite_token');
          sessionStorage.removeItem('pass_token');
          document.cookie = 'invite_token=; path=/; max-age=0';
          document.cookie = 'pass_token=; path=/; max-age=0';
          document.cookie = 'pass=; path=/; max-age=0';
        } catch(e) {}

        if (target.includes('/dashboard/experience/')) {
          try {
            sessionStorage.removeItem('share_id');
            document.cookie = 'share_id=; path=/; max-age=0';
          } catch(e) {}
        }

        // Direct navigation to server-determined destination (drops active users straight to dashboard or Stripe)
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
    if (otp.length === 6) {
      handleVerifyOtp()
    }
  }, [otp])

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white p-8 font-sans items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md shadow-[0_0_15px_rgba(244,63,94,0.15)]" />
          </div>
          <h2 className="text-3xl font-serif font-medium text-zinc-100">Sign In</h2>
          {!isEmailSent ? (
            <p className="text-zinc-400 mt-2 font-light">Enter your email to receive a secure login code.</p>
          ) : (
            <p className="text-zinc-400 mt-2 font-light">Check your email for your 6-digit secure access code.</p>
          )}
        </div>

        <div className="space-y-4">
          {!isEmailSent ? (
            <>
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full p-4 bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl focus:outline-none focus:border-red-900/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <button 
                onClick={handleSendOtp} 
                disabled={loading}
                className="w-full bg-zinc-100 text-zinc-950 p-4 rounded-xl font-medium hover:bg-white transition-colors disabled:opacity-50"
              >
                Send Code
              </button>
            </>
          ) : (
            <>
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
                disabled={loading || otp.length < 6}
                className="w-full bg-zinc-100 text-zinc-950 p-4 rounded-xl font-medium hover:bg-white transition-colors disabled:opacity-50"
              >
                Verify Code
              </button>
              <div className="text-center pt-2">
                {resendCooldown > 0 ? (
                  <p className="text-zinc-500 text-sm">Resend code in {resendCooldown}s</p>
                ) : (
                  <button 
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-zinc-400 text-sm hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4"
                  >
                    Didn't receive a code? Resend
                  </button>
                )}
                {resendMessage && <p className={`text-xs mt-2 ${resendMessage.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{resendMessage}</p>}
              </div>
            </>
          )}
          {authMessage && <p className="text-red-400 text-sm font-medium mt-4 text-center">{authMessage}</p>}
        </div>
      </div>
    </div>
  )
}

export default function SignInFlow({ initialInviteToken }: { initialInviteToken?: string | null }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">Loading...</div>}>
      <SignInContent initialInviteToken={initialInviteToken} />
    </Suspense>
  )
}

