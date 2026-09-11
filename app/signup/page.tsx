'use client'
import { useState } from 'react'
import Image from 'next/image'

export default function SignUpFlow() {
  const [formData, setFormData] = useState({
    email: '',
    tolerance: ''
  })
  const [step, setStep] = useState(1)

  const handleStripeCheckout = () => {
    // In production, tolerance should be passed to the backend or Stripe metadata
    const stripePaymentLink = `https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00?prefilled_email=${encodeURIComponent(formData.email)}`
    window.location.href = stripePaymentLink
  }

  // STEP 1: EMAIL
  if (step === 1) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-white p-8 font-sans items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mx-auto mb-4">
              <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md shadow-[0_0_15px_rgba(244,63,94,0.15)]" />
            </div>
            <h2 className="text-3xl font-bold font-serif text-zinc-100">Create Your Account</h2>
            <p className="text-zinc-400 mt-2 font-light">Enter a secure email address. We recommend a burner email for full anonymity.</p>
          </div>
        <input 
          type="email" 
          placeholder="Email address" 
          className="w-full p-3 bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-800 rounded-lg focus:outline-none focus:border-red-900"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
        <button 
          onClick={() => { if(formData.email) setStep(2) }} 
          className="w-full bg-zinc-100 text-zinc-950 p-4 rounded-xl font-medium mt-4 hover:bg-white transition-colors"
        >
          Next
        </button>
        </div>
      </div>
    )
  }

  // STEP 2: TOLERANCE & PAYMENT
  if (step === 2) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-white p-8 font-sans items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mx-auto mb-4">
              <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md shadow-[0_0_15px_rgba(244,63,94,0.15)]" />
            </div>
            <h2 className="text-3xl font-bold font-serif text-zinc-100">Choose Your Base Path</h2>
            <p className="text-zinc-400 mt-2 font-light">You can adjust these settings later.</p>
          </div>
          
          <div className="space-y-4">
            <button onClick={() => setFormData({...formData, tolerance: 'Sensory'})} className={`w-full border p-4 rounded-xl text-left transition-colors ${formData.tolerance === 'Sensory' ? 'bg-zinc-800 border-zinc-500' : 'border-zinc-800 hover:bg-zinc-900'}`}>
              Sensory and Romantic 🔥
            </button>
            <button onClick={() => setFormData({...formData, tolerance: 'Playful'})} className={`w-full border p-4 rounded-xl text-left transition-colors ${formData.tolerance === 'Playful' ? 'bg-zinc-800 border-zinc-500' : 'border-zinc-800 hover:bg-zinc-900'}`}>
              Playful and Adventurous 🔥🔥
            </button>
            <button onClick={() => setFormData({...formData, tolerance: 'Intense'})} className={`w-full border p-4 rounded-xl text-left transition-colors ${formData.tolerance === 'Intense' ? 'bg-zinc-800 border-zinc-500' : 'border-zinc-800 hover:bg-zinc-900'}`}>
              Intense and Uninhibited 🔥🔥🔥
            </button>
          </div>

        {formData.tolerance && (
          <div className="mt-8 pt-8 border-t border-zinc-800 animate-in fade-in">
            <p className="text-zinc-300 text-sm mb-4">A $0.99 authorization is required to activate your account and verify age.</p>
            <button onClick={handleStripeCheckout} className="bg-red-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-800 w-full transition-colors shadow-lg shadow-red-900/20">
              Start Trial & Pay $0.99 via Stripe
            </button>
            <button onClick={() => {
              // Dev bypass: Pretend payment authorized and redirect to sign in
              window.location.href = "/signin?message=payment_success"
            }} className="text-xs text-zinc-500 underline mt-4 block text-center w-full">
              (Dev Only: Bypass Payment to Sign In)
            </button>
          </div>
        )}
        </div>
      </div>
    )
  }
}
