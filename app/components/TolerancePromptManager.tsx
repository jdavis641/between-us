'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../src/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function TolerancePromptManager() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function checkPrompt() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('profiles')
        .select('account_created_at, last_survey_prompted_at')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setProfile(data)
        
        const now = new Date()
        const createdAt = data.account_created_at ? new Date(data.account_created_at) : new Date()
        const lastPrompted = data.last_survey_prompted_at ? new Date(data.last_survey_prompted_at) : createdAt

        const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24)
        const daysSinceLastPrompt = (now.getTime() - lastPrompted.getTime()) / (1000 * 3600 * 24)

        if (daysSinceCreation < 30) {
          // Prompt weekly
          if (daysSinceLastPrompt >= 7) {
            setShowPrompt(true)
          }
        } else {
          // Prompt monthly
          if (daysSinceLastPrompt >= 30) {
            setShowPrompt(true)
          }
        }
      }
    }
    checkPrompt()
  }, [supabase])

  const handleUpdate = async () => {
    // A real implementation would mark this and redirect to survey
    await recordPrompt()
    router.push('/onboarding/survey')
  }

  const handleNotNow = async () => {
    await recordPrompt()
    setShowPrompt(false)
  }

  const recordPrompt = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase
        .from('profiles')
        .update({ last_survey_prompted_at: new Date().toISOString() })
        .eq('id', session.user.id)
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95">
        <h2 className="text-2xl font-serif font-medium text-zinc-100 mb-2">Time for a Check-In</h2>
        <p className="text-zinc-400 mb-6">
          Desires evolve. We recommend regularly updating your tolerance profile and boundary preferences to ensure the best possible matches and content.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={handleUpdate}
            className="w-full py-3 bg-red-900 text-white rounded-xl font-medium hover:bg-red-800 transition-colors"
          >
            Update Preferences Now
          </button>
          <button 
            onClick={handleNotNow}
            className="w-full py-3 bg-zinc-900 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  )
}
