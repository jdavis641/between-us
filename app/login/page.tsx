'use client'
import { useState, Suspense, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams, useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
    }
  }
)

function SignInContent() {
  const searchParams = useSearchParams()
  const paymentSuccess = searchParams.get('message') === 'payment_success'
  
  const [email, setEmail] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMessage, setResendMessage] = useState('')

  const router = useRouter()
  
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
    const { data, error } = await supabase.auth.verifyOtp({ 
      email, 
      token: otp, 
      type: 'email' 
    })

    if (error) {
      setAuthMessage('Invalid code: ' + error.message)
      setLoading(false)
    } else if (data?.user) {
      // Ensure session is fully hydrated in browser context before routing
      await supabase.auth.getSession()

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active, nickname')
        .eq('id', data.user.id)
        .single()

      if (profile?.is_active) {
        if (!profile.nickname) {
          router.push('/onboarding/survey')
        } else {
          router.push('/dashboard')
        }
      } else {
        window.location.href = `https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00?client_reference_id=${data.user.id}`
      }
    } else {
      setAuthMessage('Verification failed, no user returned.')
      setLoading(false)
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
        {paymentSuccess && (
          <div className="bg-green-950/40 border border-green-900/50 p-4 rounded-xl mb-8">
            <p className="text-green-400 text-sm font-medium text-center">Payment authorized! Please sign in below to finish setting up your account.</p>
          </div>
        )}
        
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

export default function SignInFlow() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}
