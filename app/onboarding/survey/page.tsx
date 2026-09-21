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
    pronouns: '',
    tolerance: 'Playful'
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
        router.push('/login')
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

  const [boundaries, setBoundaries] = useState<Record<string, string>>({})

  const handleBoundarySelect = (id: string, value: string) => {
    setBoundaries(prev => ({...prev, [id]: value}))
  }

  const [quizPage, setQuizPage] = useState(1)

  const handleSubmitBoundaries = async () => {
    // In a real app, save boundaries to supabase here
    router.push('/dashboard')
  }

  // STEP 2: BOUNDARY QUIZ (The Kink Selection)
  if (step === 2) {
    const renderMatrix = (matrixKey: keyof typeof boundaryMatrix) => {
      const currentMatrix = boundaryMatrix[matrixKey] || [];
      return currentMatrix.map((item) => (
        <div key={item.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="font-medium text-zinc-200">{item.label}</p>
            <p className="text-xs text-zinc-500">{item.category}</p>
          </div>
          <div className="flex bg-zinc-950 rounded-lg border border-zinc-800 p-1 shrink-0">
            {['Definitely', 'Curious', 'Off-Limits'].map(opt => (
              <button
                key={opt}
                onClick={() => handleBoundarySelect(item.id, opt)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  boundaries[item.id] === opt 
                    ? opt === 'Definitely' ? 'bg-green-900/40 text-green-400' 
                    : opt === 'Curious' ? 'bg-yellow-900/40 text-yellow-400' 
                    : 'bg-red-900/40 text-red-400'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))
    }

    return (
      <div className="flex flex-col space-y-6 min-h-screen bg-zinc-950 text-white p-8 font-sans max-w-2xl mx-auto py-24">
        <h2 className="text-3xl font-serif font-medium text-zinc-100">Set Your Boundaries</h2>
        <p className="text-zinc-400 font-light mb-8">Select definitely, curious, or off-limits.</p>
        
        <div className="border-t border-zinc-900 pt-8">
          {quizPage === 1 && (
            <>
              <h3 className="text-xl font-medium text-zinc-200 mb-6">Sensory and Romantic</h3>
              {renderMatrix('Sensory')}
              <button onClick={() => setQuizPage(2)} className="w-full bg-zinc-100 text-zinc-950 p-4 rounded-xl font-medium mt-8 hover:bg-white transition-colors">
                Continue to Playful & Adventurous
              </button>
            </>
          )}

          {quizPage === 2 && (
            <>
              <h3 className="text-xl font-medium text-zinc-200 mb-6">Playful and Adventurous</h3>
              {renderMatrix('Playful')}
              <button onClick={() => setQuizPage(3)} className="w-full bg-zinc-100 text-zinc-950 p-4 rounded-xl font-medium mt-8 hover:bg-white transition-colors">
                Next
              </button>
            </>
          )}

          {quizPage === 3 && (
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl text-center space-y-6 mt-4">
              <p className="text-lg text-zinc-300">Would you like to view and complete the survey options for Intense and Uninhibited scenarios?</p>
              <div className="flex flex-col gap-4">
                <button onClick={() => setQuizPage(4)} className="w-full bg-red-900 text-white p-4 rounded-xl font-medium hover:bg-red-800 transition-colors">
                  Yes, show me
                </button>
                <button onClick={handleSubmitBoundaries} className="w-full bg-zinc-800 text-zinc-300 p-4 rounded-xl font-medium hover:bg-zinc-700 transition-colors">
                  No, finish and enter dashboard
                </button>
              </div>
            </div>
          )}

          {quizPage === 4 && (
            <>
              <h3 className="text-xl font-medium text-zinc-200 mb-6">Intense and Uninhibited</h3>
              {renderMatrix('Intense')}
              <button onClick={() => setQuizPage(5)} className="w-full bg-zinc-100 text-zinc-950 p-4 rounded-xl font-medium mt-8 hover:bg-white transition-colors">
                Next
              </button>
            </>
          )}

          {quizPage === 5 && (
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl text-center space-y-6 mt-4">
              <p className="text-lg text-zinc-300">Would you like to view and complete the survey options for Extreme and Taboo scenarios? (Warning: Contains highly sensitive themes).</p>
              <div className="flex flex-col gap-4">
                <button onClick={() => setQuizPage(6)} className="w-full bg-red-900 text-white p-4 rounded-xl font-medium hover:bg-red-800 transition-colors">
                  Yes, show me
                </button>
                <button onClick={handleSubmitBoundaries} className="w-full bg-zinc-800 text-zinc-300 p-4 rounded-xl font-medium hover:bg-zinc-700 transition-colors">
                  No, finish and enter dashboard
                </button>
              </div>
            </div>
          )}

          {quizPage === 6 && (
            <>
              <h3 className="text-xl font-medium text-zinc-200 mb-6">Extreme and Taboo</h3>
              {renderMatrix('Extreme')}
              <button onClick={handleSubmitBoundaries} className="w-full bg-red-900 text-white p-4 rounded-xl font-medium mt-8 hover:bg-red-800 transition-colors shadow-lg shadow-red-900/20">
                Complete Profile & Enter Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    )
  }
}
