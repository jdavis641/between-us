'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { boundaryMatrix } from '../../lib/boundaryData'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OnboardingSurvey() {
  const [step, setStep] = useState(1)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    nickname: '',
    pronouns: ''
  })

  useEffect(() => {
    async function fetchSession() {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession) {
        setSession(currentSession)
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single()
        setProfile(data)
      } else {
        router.push('/signin')
      }
    }
    fetchSession()
  }, [router])

  // STEP 1: IDENTITY
  if (step === 1) {
    return (
      <div className="flex flex-col space-y-6 min-h-screen bg-zinc-950 text-white p-8 items-center justify-center font-sans">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-3xl font-serif font-medium text-zinc-100">Who are you here?</h2>
            <p className="text-zinc-400 mt-2 font-light">Set your anonymous identity for the platform.</p>
          </div>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Unique Nickname" 
              className="w-full p-4 bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl focus:outline-none focus:border-red-900/50" 
              onChange={(e) => setFormData({...formData, nickname: e.target.value})} 
            />
            <input 
              type="text" 
              placeholder="Pronouns (e.g., they/them, she/her)" 
              className="w-full p-4 bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl focus:outline-none focus:border-red-900/50" 
              onChange={(e) => setFormData({...formData, pronouns: e.target.value})} 
            />
          </div>
          
          <button onClick={async () => {
            if (session) {
              await supabase.from('profiles').update({
                nickname: formData.nickname,
                pronouns: formData.pronouns,
              }).eq('id', session.user.id)
            }
            setStep(2)
          }} className="w-full bg-zinc-100 text-zinc-950 p-4 rounded-xl font-medium hover:bg-white transition-colors">
            Next: Boundary Quiz
          </button>
        </div>
      </div>
    )
  }

  // STEP 2: BOUNDARY QUIZ (The Kink Selection)
  if (step === 2) {
    // In a real app, render matrix based on profile?.tolerance
    return (
      <div className="flex flex-col space-y-6 min-h-screen bg-zinc-950 text-white p-8 font-sans max-w-2xl mx-auto py-24">
        <h2 className="text-3xl font-serif font-medium text-zinc-100">Set Your Boundaries</h2>
        <p className="text-zinc-400 font-light mb-8">Select definitely, curious, or off-limits.</p>
        
        <div className="space-y-4 border-t border-zinc-900 pt-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
            <p className="text-sm italic text-zinc-500 text-center">Boundary module placeholder mapping.</p>
          </div>
        </div>
  
        <button onClick={() => router.push('/dashboard')} className="w-full bg-red-900 text-white p-4 rounded-xl font-medium mt-12 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20">
          Complete Onboarding
        </button>
      </div>
    )
  }
}
