'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { boundaryMatrix } from '../lib/boundaryData'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OnboardingFlow() {
  const [step, setStep] = useState(1)
  const [authMessage, setAuthMessage] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    tolerance: '',
    nickname: '',
    pronouns: ''
  })

  // 1. Core Logic: Evaluate User State on Load
  useEffect(() => {
    async function checkUserState() {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        setSession(currentSession)
        
        // Fetch their profile to check payment status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active, tolerance')
          .eq('id', currentSession.user.id)
          .single()
          
        if (profile?.is_active) {
          // If they paid but haven't finished onboarding
          if (!profile.tolerance) {
            setStep(3) // Move to Tolerance selection
          } else {
            // Existing user fully set up -> go to dashboard
            router.push('/dashboard')
            return
          }
        } else {
          setStep(2) // Not paid -> Move to Stripe Gate
        }
      }
      setLoading(false)
    }
    
    checkUserState()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) checkUserState()
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const handleSendMagicLink = async () => {
    if (!formData.email) return
    setAuthMessage('Sending magic link...')
    const { error } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        // Point to the new callback route we just built to prevent the 404
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`, 
      }
    })
    if (error) {
      setAuthMessage(error.message)
    } else {
      setIsEmailSent(true)
    }
  }

  const handleStripeCheckout = () => {
    const stripePaymentLink = `https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00?client_reference_id=${session?.user?.id}`
    window.location.href = stripePaymentLink
  }

  if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Loading secure connection...</div>

  // STEP 1: AUTHENTICATION
  if (step === 1) {
    if (isEmailSent) {
      return (
        <div className="flex flex-col space-y-4 min-h-screen bg-gray-900 text-white p-8 items-center justify-center text-center">
          <div className="w-16 h-16 bg-green-900/50 text-green-500 rounded-full flex items-center justify-center text-3xl mb-4">
            ✓
          </div>
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-gray-300 max-w-md">
            A secure magic link has been sent. Please check your registered email (including spam folders) to log in or complete your setup.
          </p>
        </div>
      )
    }

    return (
      <div className="flex flex-col space-y-4 min-h-screen bg-gray-900 text-white p-8">
        <h2 className="text-2xl font-bold">Step 1: Secure Sign In / Sign Up</h2>
        <p className="text-sm text-gray-400">Enter your email to receive a secure, passwordless magic link.</p>
        <input 
          type="email" 
          placeholder="Enter email address" 
          className="w-full p-3 bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
        <button onClick={handleSendMagicLink} className="bg-blue-600 p-3 rounded font-bold mt-4 hover:bg-blue-500">
          Send Magic Link
        </button>
        {authMessage && <p className="text-yellow-500 font-bold mt-4">{authMessage}</p>}
      </div>
    )
  }

  // STEP 2: PAYMENT GATE
  if (step === 2) return (
    <div className="flex flex-col space-y-4 min-h-screen bg-gray-900 text-white p-8">
      <h2 className="text-2xl font-bold">Step 2: Account Activation</h2>
      <p className="text-gray-300">A $0.99 authorization is required to activate your account and verify age.</p>
      <button onClick={handleStripeCheckout} className="bg-purple-600 px-6 py-3 rounded font-bold hover:bg-purple-500 w-full">
        Pay $0.99 via Stripe
      </button>
      <button onClick={() => setStep(3)} className="text-xs text-gray-500 underline mt-4">
        (Dev Only: Bypass Payment)
      </button>
    </div>
  )

  // STEP 3: TOLERANCE
  if (step === 3) return (
    <div className="flex flex-col space-y-4 min-h-screen bg-gray-900 text-white p-8">
      <h2 className="text-2xl font-bold">Step 3: Choose Your Path</h2>
      <button onClick={() => { setFormData({...formData, tolerance: 'Sensory'}); setStep(4) }} className="border border-gray-600 p-4 rounded text-left hover:bg-gray-800">
        Sensory and Romantic 🔥
      </button>
      <button onClick={() => { setFormData({...formData, tolerance: 'Playful'}); setStep(4) }} className="border border-gray-600 p-4 rounded text-left hover:bg-gray-800">
        Playful and Adventurous 🔥🔥
      </button>
      <button onClick={() => { setFormData({...formData, tolerance: 'Intense'}); setStep(4) }} className="border border-gray-600 p-4 rounded text-left hover:bg-gray-800">
        Intense and Uninhibited 🔥🔥🔥
      </button>
    </div>
  )

  // STEP 4: IDENTITY
  if (step === 4) return (
    <div className="flex flex-col space-y-4 min-h-screen bg-gray-900 text-white p-8">
      <h2 className="text-2xl font-bold">Step 4: Who are you here?</h2>
      <input type="text" placeholder="Unique Nickname" className="p-3 text-black rounded" onChange={(e) => setFormData({...formData, nickname: e.target.value})} />
      <input type="text" placeholder="Pronouns (e.g., they/them, she/her)" className="p-3 text-black rounded" onChange={(e) => setFormData({...formData, pronouns: e.target.value})} />
      <button onClick={async () => {
        if (session) {
          await supabase.from('profiles').update({
            nickname: formData.nickname,
            pronouns: formData.pronouns,
            tolerance: formData.tolerance
          }).eq('id', session.user.id)
        }
        setStep(5)
      }} className="bg-blue-600 p-3 rounded font-bold mt-4 hover:bg-blue-500">
        Next
      </button>
    </div>
  )

  // STEP 5: BOUNDARY QUIZ (The Kink Selection)
  if (step === 5) {
    const currentList = formData.tolerance === 'Sensory' ? boundaryMatrix.Sensory || [] 
                      : formData.tolerance === 'Playful' ? boundaryMatrix.Playful || [] 
                      : boundaryMatrix.Intense || []
                      
    return (
      <div className="flex flex-col space-y-4 min-h-screen bg-gray-900 text-white p-8">
        <h2 className="text-2xl font-bold">Step 5: Set Your Boundaries</h2>
        <p className="text-gray-400 text-sm mb-6">Select definitely, curious, or off-limits.</p>
        
        {/* Insert your existing boundary/kink mapping logic here */}
        <div className="space-y-4 border-t border-gray-700 pt-6">
          <p className="text-sm italic text-gray-500">Boundary module placeholder mapping.</p>
        </div>
  
        <button onClick={() => router.push('/dashboard')} className="bg-green-600 p-3 rounded font-bold mt-8 hover:bg-green-500">
          Complete Onboarding
        </button>
      </div>
    )
  }
}