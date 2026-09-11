'use client'
import { useState, Suspense, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams, useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function SignInContent() {
  const searchParams = useSearchParams()
  const paymentSuccess = searchParams.get('message') === 'payment_success'
  
  const [email, setEmail] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)

  const router = useRouter()
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push('/dashboard')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  const handleSendMagicLink = async () => {
    if (!email) return
    setAuthMessage('Sending magic link...')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`, 
      }
    })
    
    if (error) {
      setAuthMessage(error.message)
    } else {
      setIsEmailSent(true)
    }
  }

  if (isEmailSent) {
    return (
      <div className="flex flex-col space-y-6 min-h-screen bg-zinc-950 text-white p-8 items-center justify-center text-center font-sans">
        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-full flex items-center justify-center text-3xl mb-4 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          ✉️
        </div>
        <h2 className="text-3xl font-serif font-medium">Check your email</h2>
        <p className="text-zinc-400 max-w-md text-lg font-light leading-relaxed">
          A secure magic link has been sent. Please check your inbox to securely log in. 
        </p>
        <p className="text-zinc-500 text-sm mt-4 italic">
          Tip: You may need to open the link in a new tab or page.
        </p>
      </div>
    )
  }

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
          <p className="text-zinc-400 mt-2 font-light">Enter your email to receive a secure login link.</p>
        </div>

        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email address" 
            className="w-full p-4 bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl focus:outline-none focus:border-red-900/50"
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          <button 
            onClick={handleSendMagicLink} 
            className="w-full bg-zinc-100 text-zinc-950 p-4 rounded-xl font-medium hover:bg-white transition-colors"
          >
            Send Magic Link
          </button>
          {authMessage && <p className="text-red-400 text-sm font-medium mt-4 text-center">{authMessage}</p>}
        </div>
      </div>
    </div>
  )
}

export default function SignInFlow() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-white p-8">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}
