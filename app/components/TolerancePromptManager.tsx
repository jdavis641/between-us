'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../src/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function TolerancePromptManager() {
  const [showRecurringSurvey, setShowRecurringSurvey] = useState(false)
  const showPrompt = showRecurringSurvey
  const setShowPrompt = setShowRecurringSurvey
  const [doNotShow, setDoNotShow] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const userIdRef = useRef<string | null>(null)
  const hasDismissedRef = useRef(false)

  const [supabase] = useState(() =>
    createClient({
      global: {
        fetch: (url: any, options: any = {}) => fetch(url, { ...options, cache: 'no-store' })
      }
    })
  )
  const router = useRouter()

  useEffect(() => {
    async function checkPrompt() {
      if (hasDismissedRef.current) return;
      if (typeof window !== 'undefined' && localStorage.getItem('hideBoundaryModal') === 'true') {
        return;
      }

      let activeUserId: string | null = null
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (user && !userError) {
        activeUserId = user.id
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        activeUserId = session?.user?.id || null
      }
      if (!activeUserId) return
      setUserId(activeUserId)
      userIdRef.current = activeUserId

      // Bust the timestamp cache: bypass Next.js cache with no-store headers & fetch options
      const { data, error } = await supabase
        .from('profiles')
        .select('id, account_created_at, last_survey_prompted_at')
        .setHeader('Cache-Control', 'no-cache, no-store')
        .setHeader('Pragma', 'no-cache')
        .eq('id', activeUserId)
        .maybeSingle()

      if (data && !hasDismissedRef.current) {
        setProfile(data)
        
        const now = new Date()
        const createdAt = data.account_created_at ? new Date(data.account_created_at) : new Date()
        const lastPrompted = data.last_survey_prompted_at ? new Date(data.last_survey_prompted_at) : createdAt

        const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24)
        const daysSinceLastPrompt = (now.getTime() - lastPrompted.getTime()) / (1000 * 3600 * 24)

        if (daysSinceCreation < 30) {
          // Prompt weekly
          if (daysSinceLastPrompt >= 7) {
            setShowRecurringSurvey(true)
          }
        } else {
          // Prompt monthly
          if (daysSinceLastPrompt >= 30) {
            setShowRecurringSurvey(true)
          }
        }
      }
    }
    checkPrompt()
  }, [supabase])

  const recordPrompt = async () => {
    let targetUserId = userIdRef.current || userId
    if (!targetUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (user && !userError) {
        targetUserId = user.id
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        targetUserId = session?.user?.id || null
      }
    }
    if (targetUserId) {
      const currentTimestamp = new Date().toISOString()
      const { error } = await supabase
        .from('profiles')
        .update({ last_survey_prompted_at: currentTimestamp })
        .eq('id', targetUserId)
      
      if (error) {
        console.error("Error updating last_survey_prompted_at in profiles:", error)
      } else {
        setProfile((prev: any) => ({ ...prev, last_survey_prompted_at: currentTimestamp }))
      }
    }
  }

  const handleSubmit = async () => {
    // 1. Immediate State Unmount at the VERY TOP so UI physically disappears immediately
    setShowRecurringSurvey(false)
    setShowPrompt(false)
    hasDismissedRef.current = true

    if (doNotShow && typeof window !== 'undefined') {
      localStorage.setItem('hideBoundaryModal', 'true');
    }

    // 2. Fix Database Timestamp Update: explicitly update user profiles row setting last_survey_prompted_at to current timestamp
    await recordPrompt()

    // 3. After Supabase update awaits successfully, execute router.refresh()
    router.refresh()
    router.push('/dashboard/settings')
  }

  const handleUpdate = handleSubmit

  const handleNotNow = async () => {
    // 1. Immediate State Unmount at the VERY TOP so UI physically disappears immediately
    setShowRecurringSurvey(false)
    setShowPrompt(false)
    hasDismissedRef.current = true

    if (doNotShow && typeof window !== 'undefined') {
      localStorage.setItem('hideBoundaryModal', 'true');
    }

    // 2. Fix Database Timestamp Update
    await recordPrompt()

    // 3. After Supabase update awaits successfully, execute router.refresh()
    router.refresh()
  }

  if (hasDismissedRef.current || !showRecurringSurvey) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95">
        <h2 className="text-2xl font-serif font-medium text-zinc-100 mb-2">Time for a Check-In</h2>
        <p className="text-zinc-400 mb-6">
          Desires evolve. We recommend regularly updating your tolerance profile and boundary preferences to ensure the best possible matches and content.
        </p>
        
        <div className="mb-6 flex items-center gap-2">
          <input 
            type="checkbox" 
            id="doNotShow"
            checked={doNotShow}
            onChange={(e) => setDoNotShow(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-red-500 bg-zinc-950"
          />
          <label htmlFor="doNotShow" className="text-sm text-zinc-400 cursor-pointer select-none">
            Do not show again
          </label>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleSubmit}
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
