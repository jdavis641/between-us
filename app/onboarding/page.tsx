'use client';

import { COUNTRY_CODES, formatE164Phone, splitPhone } from "@/utils/phone";
import { useState, useEffect, Suspense, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import preferenceMatrix from '../lib/taxonomy/preference-matrix.json'

const supabase = createClient({
  global: {
    fetch: (url: any, opts: any = {}) => fetch(url, { ...opts, cache: 'no-store' })
  }
})

type Tier = 'Sensory' | 'Playful' | 'Intense' | 'Extreme'

interface TaxonomyOption {
  label: string
  weight: number
}

interface CategoryData {
  category: string
  weight?: number
  description?: string
  items: TaxonomyOption[]
}

const WEIGHT_TIER_MAP: Record<number, Tier> = {
  1: 'Sensory',
  2: 'Playful',
  3: 'Intense',
  4: 'Extreme'
}

const TIER_OPTIONS: { name: Tier; description: string; badge: string }[] = [
  {
    name: 'Sensory',
    badge: 'Level 1',
    description: 'Gentle touch, romantic intimacy, deep emotional connection, and slow sensual exploration.'
  },
  {
    name: 'Playful',
    badge: 'Level 2',
    description: 'Adventurous teasing, light bondage, roleplay games, toy exploration, and humorous banter.'
  },
  {
    name: 'Intense',
    badge: 'Level 3',
    description: 'Heavy sensations, power dynamics, impact play, BDSM themes, and uninhibited physical exploration.'
  },
  {
    name: 'Extreme',
    badge: 'Level 4',
    description: 'Edge play, taboo scenarios, psychological roleplay, surreal fantasies, and heavy boundary pushes.'
  }
]

// Mathematical sorting function evaluating array of selected weights to find highest point value
const calculateBaseToleranceTier = (weights: number[]): Tier | null => {
  if (!weights || weights.length === 0) return null
  const sorted = [...weights].sort((a, b) => b - a)
  const highestWeight = sorted[0]
  return WEIGHT_TIER_MAP[highestWeight] || (highestWeight >= 4 ? 'Extreme' : 'Sensory')
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  // Step state: null (loading), 0 (payment), 1 (username), 2 (assessment gate & consent), 3 (preferences & boundary matrix), 4 (final details & completion)
  const [step, setStep] = useState<number | null>(null)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  // Step 1: Username selection state
  const [username, setUsername] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [mobileNumber, setMobileNumber] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [pronouns, setPronouns] = useState('')
  const [shareId, setShareId] = useState<string | null>(null)

  // Step 2: Assessment Gate & Consent state
  const [assessmentAnswer, setAssessmentAnswer] = useState<'undecided' | 'yes' | 'no'>('undecided')
  const [consentAge, setConsentAge] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)

  // Step 3: Preferences & Boundary Matrix state (begins as null / unselected)
  const [generalPreferences, setGeneralPreferences] = useState('')
  const [showChecklist, setShowChecklist] = useState(false)
  const [selectedItems, setSelectedItems] = useState<TaxonomyOption[]>([])
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null)

  // Step 4: Final Details state
  const [specificActivities, setSpecificActivities] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Track and persist share_id parameter
  useEffect(() => {
    const paramShareId = searchParams.get('share_id')
    if (paramShareId) {
      setShareId(paramShareId)
      try {
        sessionStorage.setItem('share_id', paramShareId)
        document.cookie = `share_id=${encodeURIComponent(paramShareId)}; path=/; max-age=86400; SameSite=Lax`
      } catch (e) {
        console.warn('Could not persist share_id in onboarding:', e)
      }
    } else {
      try {
        const stored = sessionStorage.getItem('share_id')
        if (stored) {
          setShareId(stored)
        } else {
          const match = document.cookie.match(/(?:^|;\s*)share_id=([^;]+)/)
          if (match && match[1]) {
            setShareId(decodeURIComponent(match[1]))
          }
        }
      } catch (e) {}
    }
  }, [searchParams])

  // Fetch session & profile
  useEffect(() => {
    async function fetchSession() {
      // Use absolute server-side session validation rather than stale client-side cache
      let activeUser: any = null
      let currentSession: any = null
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (user && !userError) {
        activeUser = user
        const { data: { session } } = await supabase.auth.getSession()
        currentSession = session || { user }
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          activeUser = session.user
          currentSession = session
        }
      }

      if (activeUser) {
        setSession(currentSession)
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeUser.id)
          .maybeSingle()
        
        setProfile(data)

        if (data?.anonymous_alias || data?.nickname) {
          const existingName = data.anonymous_alias || data.nickname || ''
          setUsername(existingName)
          setUsernameStatus('available')
        }
        if (data?.pronouns) {
          setPronouns(data.pronouns)
        }
        if (data?.mobile_number) {
          const split = splitPhone(data.mobile_number)
          setCountryCode(split.countryCode)
          setMobileNumber(split.nationalNumber)
        }

        const effectiveShareId = searchParams.get('share_id') || (() => {
          try { return sessionStorage.getItem('share_id') } catch(e) { return null }
        })() || (() => {
          const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)share_id=([^;]+)/) : null
          return match ? decodeURIComponent(match[1]) : null
        })()

        // If user has an active subscription and arrived via a share link, suspend onboarding survey
        if (data?.is_active && effectiveShareId) {
          try {
            sessionStorage.removeItem('share_id')
            document.cookie = 'share_id=; path=/; max-age=0'
          } catch(e) {}
          window.location.href = `/dashboard/experience/${effectiveShareId}`
          return
        }

        // Inactive users hit the Stripe payment step
        if (!data?.is_active) {
          setStep(0)
        } else {
          setStep(1)
        }
      } else {
        router.push('/login')
      }
    }
    fetchSession()
  }, [router, sessionId])

  // Live-search debounce for username (anonymous_alias)
  useEffect(() => {
    const trimmed = username.trim()
    if (!trimmed) {
      setUsernameStatus('idle')
      setSuggestions([])
      return
    }

    if (profile && (trimmed === profile.anonymous_alias || trimmed === profile.nickname)) {
      setUsernameStatus('available')
      setSuggestions([])
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-nickname', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anonymous_alias: trimmed })
        })
        const data = await res.json()
        if (data.available) {
          setUsernameStatus('available')
          setSuggestions([])
        } else {
          setUsernameStatus('taken')
          setSuggestions(
            data.suggestions && data.suggestions.length > 0
              ? data.suggestions
              : [`${trimmed}_1`, `${trimmed}99`, `real_${trimmed}`]
          )
        }
      } catch (err) {
        console.error('Username check error:', err)
        setUsernameStatus('idle')
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [username, profile])

  const categoriesList: CategoryData[] = useMemo(() => {
    const rawMatrix = preferenceMatrix as any
    const weightSystem: Record<string, number> = rawMatrix?.weight_system || {
      Sensory: 1,
      Playful: 2,
      Intense: 3,
      Extreme: 4
    }

    if (Array.isArray(rawMatrix?.categories)) {
      return rawMatrix.categories.map((c: any) => {
        const catName = c.category || c.name || ''
        const catWeight = c.weight ?? weightSystem[catName] ?? 1
        return {
          category: catName,
          weight: catWeight,
          description: c.description || '',
          items: Array.isArray(c.items)
            ? c.items.map((it: any) => {
                if (typeof it === 'string') {
                  return { label: it, weight: catWeight }
                }
                return {
                  label: it.label || it.name || '',
                  weight: it.weight ?? catWeight
                }
              })
            : []
        }
      })
    }
    return []
  }, [])

  const optionsList: TaxonomyOption[] = useMemo(() => {
    if (Array.isArray((preferenceMatrix as any)?.options)) {
      return (preferenceMatrix as any).options as TaxonomyOption[]
    }
    return categoriesList.flatMap(c => c.items)
  }, [categoriesList])

  // Mathematical sorting function to determine the base tolerance tier from extracted weights
  const calculatedTier: Tier | null = useMemo(() => {
    const selectedWeights = selectedItems.map(item => item.weight)
    if (selectedWeights.length > 0) {
      return calculateBaseToleranceTier(selectedWeights)
    }

    // If no checkbox selected, scan general preferences text if provided
    const text = generalPreferences.toLowerCase()
    if (/extreme|taboo|surreal|non-standard/i.test(text)) return 'Extreme'
    if (/intense|bdsm|power dynamic|impact|group dynamic|heavy/i.test(text)) return 'Intense'
    if (/bondage|toys|teas|exhibit|reversal|playful/i.test(text)) return 'Playful'

    return null
  }, [selectedItems, generalPreferences])

  // Final confirmed tier: starts as null (unselected), updated when user picks an option or matrix assigns it
  const confirmedTier: Tier | null = selectedTier || calculatedTier || null

  // Dynamic post-survey suggestion tailored to confirmed preferences & tolerance tier
  const suggestionDetails = useMemo(() => {
    const tier = confirmedTier || 'Playful'

    switch (tier) {
      case 'Sensory':
        return {
          tierBadge: 'Level 1 • Sensory Intimacy',
          badgeColor: 'border-sky-500/40 text-sky-400 bg-sky-950/40',
          title: 'Gentle Intimacy Games & Touch',
          description: 'Based on your gentle and romantic intimacy preferences, we recommend beginning with our Sensory Intimacy card decks—focused on slow-burn tension, tactile touch, and deep emotional connection.',
          actionLabel: 'Explore Intimacy Games →',
          actionHref: '/dashboard/games'
        }
      case 'Playful':
        return {
          tierBadge: 'Level 2 • Playful & Teasing',
          badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-950/40',
          title: 'Spicy Truth or Dare & Prompt Randomizer',
          description: 'Your profile thrives on playful teasing, adventurous banter, and light roleplay. Jump straight into our zero-wait prompt randomizer.',
          actionLabel: 'Launch Spicy Truth or Dare →',
          actionHref: '/dashboard/randomizer?game=truth_or_dare'
        }
      case 'Intense':
        return {
          tierBadge: 'Level 3 • High-Intensity & Power',
          badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-950/40',
          title: 'Erotic Literature & Power Dynamics',
          description: 'With your preferences tuned for heavier sensations and power dynamics, our Literature Engine can generate immersive romantic fiction tailored to your exact boundaries.',
          actionLabel: 'Generate Erotic Story →',
          actionHref: '/dashboard/literature'
        }
      case 'Extreme':
        return {
          tierBadge: 'Level 4 • Uninhibited & Edge Play',
          badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-950/40',
          title: 'Deep Fantasy & Custom Roleplay',
          description: 'Your boundaries accommodate psychological scenarios and edge play. Discover deep custom literature and roleplay scenarios tailored to your uninhibited desires.',
          actionLabel: 'Explore Literature Engine →',
          actionHref: '/dashboard/literature'
        }
      default:
        return {
          tierBadge: 'Recommended Initial Action',
          badgeColor: 'border-red-500/40 text-red-400 bg-red-950/40',
          title: 'Curated Intimacy Games',
          description: 'Your preferences have been calibrated. Jump into our curated library of interactive games designed to deepen connection and desire.',
          actionLabel: 'Explore Intimacy Games →',
          actionHref: '/dashboard/games'
        }
    }
  }, [confirmedTier])

  // Handlers - Extracts the weight property of each selected item and auto-assigns tier based on point weights
  const handleToggleOption = (option: TaxonomyOption) => {
    setSelectedItems(prev => {
      const exists = prev.some(item => item.label === option.label)
      const next = exists
        ? prev.filter(item => item.label !== option.label)
        : [...prev, { label: option.label, weight: option.weight }]

      const newWeights = next.map(i => i.weight)
      const newCalculatedTier = calculateBaseToleranceTier(newWeights)
      if (newCalculatedTier) {
        setSelectedTier(newCalculatedTier)
      } else {
        setSelectedTier(null)
      }
      return next
    })
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameStatus !== 'available' || !username.trim()) return

    if (session?.user?.id) {
      await supabase
        .from('profiles')
        .update({
          nickname: username.trim(),
          anonymous_alias: username.trim(),
          mobile_number: formatE164Phone(countryCode, mobileNumber) || null
        })
        .eq('id', session.user.id)
    }
    setStep(2)
  }

  const handleEnterDashboard = async (targetHref: string = '/dashboard?tour=true') => {
    setIsSubmitting(true)
    try {
      let userId = session?.user?.id
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
      }
      if (!userId) {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        userId = currentSession?.user?.id
      }

      if (userId) {
        const finalAlias = (username || '').trim() || profile?.nickname || profile?.anonymous_alias || 'Member'
        const finalTier = confirmedTier || profile?.base_tolerance || 'Sensory'
        const finalPhone = formatE164Phone(countryCode, mobileNumber) || profile?.mobile_number || null
        const currentTimestamp = new Date().toISOString()

        // 1. Enforce Database Persistence: await successful Supabase UPDATE before routing
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            nickname: finalAlias,
            anonymous_alias: finalAlias,
            base_tolerance: finalTier,
            pronouns: (pronouns || '').trim() || profile?.pronouns || null,
            mobile_number: finalPhone,
            literature_prompt_status: 'completed',
            onboarding_completed: true,
            is_active: true,
            last_survey_prompted_at: currentTimestamp
          })
          .eq('id', userId)

        if (profileError) {
          console.error("Error updating profile before entering dashboard:", profileError)
        }

        // Ensure intimacy_preferences has Base Tolerance
        try {
          const { data: existingTolerance } = await supabase
            .from('intimacy_preferences')
            .select('id')
            .eq('user_id', userId)
            .eq('category_tag', 'Base Tolerance')
            .maybeSingle()

          if (existingTolerance) {
            await supabase
              .from('intimacy_preferences')
              .update({ preference_level: finalTier })
              .eq('id', existingTolerance.id)
          } else {
            await supabase
              .from('intimacy_preferences')
              .insert({
                user_id: userId,
                category_tag: 'Base Tolerance',
                preference_level: finalTier
              })
          }
        } catch (prefErr) {
          console.warn("Could not ensure intimacy_preferences row:", prefErr)
        }
      }

      // 2. Bust Client-Side Cache immediately after successful DB update and before routing
      router.refresh()

      // Then execute the navigation
      router.push(targetHref)
    } catch (err) {
      console.error("Error persisting profile before entering dashboard:", err)
      router.refresh()
      router.push(targetHref)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let userId = session?.user?.id
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
      }
      if (!userId) throw new Error('No active user session found')
      const finalAlias = username.trim()

      // 1. Save to profiles table
      await supabase
        .from('profiles')
        .update({
          nickname: finalAlias,
          anonymous_alias: finalAlias,
          base_tolerance: confirmedTier,
          pronouns: pronouns.trim(),
          mobile_number: formatE164Phone(countryCode, mobileNumber) || null,
          literature_prompt_status: 'completed',
          onboarding_completed: true,
          is_active: true,
          last_survey_prompted_at: new Date().toISOString()
        })
        .eq('id', userId)

      router.refresh()

      // 2. Save Base Tolerance to intimacy_preferences
      const { data: existingTolerance } = await supabase
        .from('intimacy_preferences')
        .select('id')
        .eq('user_id', userId)
        .eq('category_tag', 'Base Tolerance')
        .maybeSingle()

      if (existingTolerance) {
        await supabase
          .from('intimacy_preferences')
          .update({ preference_level: confirmedTier })
          .eq('id', existingTolerance.id)
      } else {
        await supabase
          .from('intimacy_preferences')
          .insert({
            user_id: userId,
            category_tag: 'Base Tolerance',
            preference_level: confirmedTier
          })
      }

      // 3. Save Primary Directive with consolidated desires & kinks
      const selectedLabels = selectedItems.map(item => item.label)
      const consolidatedKinks: string[] = []
      if (generalPreferences.trim()) consolidatedKinks.push(`General Interests: ${generalPreferences.trim()}`)
      if (selectedLabels.length > 0) consolidatedKinks.push(`Selected Boundaries: ${selectedLabels.join(', ')}`)
      if (specificActivities.trim()) consolidatedKinks.push(`Scenarios & Tropes: ${specificActivities.trim()}`)

      const kinksFormatted = consolidatedKinks.map((k, idx) => ({
        id: `${Date.now()}-${idx}`,
        text: k
      }))

      const { data: existingDirective } = await supabase
        .from('intimacy_preferences')
        .select('id')
        .eq('user_id', userId)
        .eq('category_tag', 'Primary Directive')
        .maybeSingle()

      if (existingDirective) {
        await supabase
          .from('intimacy_preferences')
          .update({
            preference_level: confirmedTier,
            kinks_override: JSON.stringify(kinksFormatted)
          })
          .eq('id', existingDirective.id)
      } else {
        await supabase
          .from('intimacy_preferences')
          .insert({
            user_id: userId,
            category_tag: 'Primary Directive',
            preference_level: confirmedTier,
            kinks_override: JSON.stringify(kinksFormatted)
          })
      }

      // 4. Save individual category tags for selected string labels
      for (const label of selectedLabels) {
        await supabase
          .from('intimacy_preferences')
          .upsert({
            user_id: userId,
            category_tag: label,
            preference_level: 'Definitely'
          })
      }

      setIsCompleted(true)
    } catch (err) {
      console.error('Error saving onboarding data:', err)
      alert('There was an issue saving your preferences. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === null) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-500 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading onboarding engine...</span>
        </div>
      </div>
    )
  }

  // STEP 0: STRIPE PAYMENT
  if (step === 0) {
    return (
      <div className="flex flex-col space-y-6 min-h-screen bg-zinc-950 text-white p-8 items-center justify-center font-sans">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/60 p-8 rounded-2xl border border-zinc-800 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto bg-red-950/60 border border-red-900/50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            ✨
          </div>
          <h2 className="text-3xl font-serif font-medium text-zinc-100">Activate Account</h2>
          <p className="text-zinc-400 mt-2 font-light leading-relaxed">
            Complete your subscription to access personalized games, literature, roleplay scenarios, and your Between Us Pass.
          </p>
          <a
            href={`https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00?client_reference_id=${session?.user?.id}&prefilled_email=${encodeURIComponent(session?.user?.email || '')}${shareId ? `&share_id=${encodeURIComponent(shareId)}` : ''}`}
            className="block w-full bg-red-900 text-white p-4 rounded-xl font-medium hover:bg-red-800 transition-colors mt-6 shadow-lg shadow-red-900/20"
          >
            Pay with Stripe
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 md:p-12 flex flex-col items-center justify-center selection:bg-red-500/30">
      <div className="max-w-xl w-full">
        
        {/* Progress Bar Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-2">
            <span>Onboarding Journey</span>
            <span>Step {step} of 4</span>
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className="bg-gradient-to-r from-red-700 to-red-500 h-full transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: USERNAME SELECTION */}
        {step === 1 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300">
            <div className="mb-8">
              <span className="text-xs uppercase tracking-widest text-red-500 font-bold">Step 1: Identity</span>
              <h2 className="text-3xl font-serif font-medium text-zinc-100 mt-1">Choose Your Anonymous Alias</h2>
              <p className="text-zinc-400 mt-2 text-sm leading-relaxed font-light">
                Your username is completely anonymous. It identifies you on the platform and lets partners connect with you without exposing real identities.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Username (Anonymous Alias)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g., MidnightWanderer, VelvetEcho"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                    className={`w-full p-4 bg-zinc-950 text-white placeholder-zinc-500 border rounded-xl text-base focus:outline-none transition-colors ${
                      usernameStatus === 'available'
                        ? 'border-green-600/80 focus:border-green-500'
                        : usernameStatus === 'taken'
                          ? 'border-red-600/80 focus:border-red-500'
                          : 'border-zinc-800 focus:border-zinc-600'
                    }`}
                  />
                  {usernameStatus === 'checking' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Real-time status feedback */}
                <div className="mt-2.5 min-h-[24px]">
                  {usernameStatus === 'checking' && (
                    <p className="text-xs text-yellow-400 font-medium flex items-center gap-1.5">
                      Checking availability...
                    </p>
                  )}
                  {usernameStatus === 'available' && (
                    <p className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                      <span>✓</span> Username available
                    </p>
                  )}
                  {usernameStatus === 'taken' && (
                    <div className="space-y-3">
                      <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                        <span>✕</span> Taken
                      </p>
                      {suggestions.length > 0 && (
                        <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                          <p className="text-xs text-zinc-400 mb-2 font-medium">Available variations you can use:</p>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.map((sug) => (
                              <button
                                type="button"
                                key={sug}
                                onClick={() => setUsername(sug)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Mobile Number (Optional)
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="p-4 bg-zinc-950 text-white border border-zinc-800 rounded-xl text-base focus:outline-none focus:border-zinc-600 transition-colors shrink-0"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="flex-1 p-4 bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl text-base focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1.5 font-light">
                  (this is encouraged to link accounts)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Pronouns (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., they/them, she/her, he/him"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  className="w-full p-4 bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl text-base focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={usernameStatus !== 'available' || !username.trim()}
                className="w-full py-4 px-6 bg-red-900 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-red-950 text-base"
              >
                Continue to Assessment Gate →
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: ASSESSMENT GATE & CONSENT */}
        {step === 2 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300">
            <span className="text-xs uppercase tracking-widest text-red-500 font-bold">Step 2: Assessment Gate</span>

            {assessmentAnswer === 'undecided' && (
              <div className="space-y-6 mt-2">
                <h2 className="text-3xl font-serif font-medium text-zinc-100">
                  Would you like to complete the onboarding assessment now?
                </h2>

                <div className="p-5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">Platform Notice</p>
                  <p className="text-sm text-zinc-300 leading-relaxed font-light">
                    Betweenusapp.io will anonymously assign your preferences and interests to your username, allowing the system to curate games, stories, and roleplay scenarios to your exact preferences. If you choose to invite a partner using the Between Us Pass, both users' preferences will be curated into the system for mutual satisfaction.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssessmentAnswer('yes')}
                    className="flex-1 py-4 px-6 bg-red-900 hover:bg-red-800 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-950 text-base text-center"
                  >
                    Yes, take assessment
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssessmentAnswer('no')}
                    className="flex-1 py-4 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors border border-zinc-700 text-base text-center"
                  >
                    No, skip for now
                  </button>
                </div>
              </div>
            )}

            {assessmentAnswer === 'no' && (
              <div className="space-y-6 mt-2">
                <h2 className="text-2xl font-serif font-medium text-zinc-100">Assessment Deferred</h2>
                <div className="p-5 bg-red-950/30 border border-red-900/60 rounded-xl text-red-300 text-sm leading-relaxed">
                  You will be required to complete the assessment after 24 hours to continue using premium features.
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        let activeUserId = session?.user?.id;
                        if (!activeUserId) {
                          const { data: { user } } = await supabase.auth.getUser();
                          activeUserId = user?.id;
                        }
                        if (activeUserId) {
                          await supabase.from('profiles').update({
                            last_survey_prompted_at: new Date().toISOString(),
                            literature_prompt_status: 'completed'
                          }).eq('id', activeUserId);
                          router.refresh();
                        }
                      } catch (err) {
                        console.error('Error deferring assessment:', err);
                      }
                      router.push('/dashboard');
                    }}
                    className="flex-1 py-4 px-6 bg-red-900 hover:bg-red-800 text-white font-medium rounded-xl transition-colors text-base text-center shadow-lg shadow-red-950"
                  >
                    Proceed to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssessmentAnswer('yes')}
                    className="py-4 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors border border-zinc-700 text-base text-center"
                  >
                    ← Complete it now
                  </button>
                </div>
              </div>
            )}

            {assessmentAnswer === 'yes' && (
              <div className="space-y-6 mt-2">
                <div>
                  <h2 className="text-3xl font-serif font-medium text-zinc-100">Consent & Age Verification</h2>
                  <p className="text-zinc-400 mt-2 text-sm leading-relaxed font-light">
                    Please review and acknowledge the two legal consent statements below to proceed.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-colors ${
                    consentAge ? 'bg-red-950/20 border-red-700/80 text-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={consentAge}
                      onChange={(e) => setConsentAge(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded text-red-600 bg-zinc-900 border-zinc-700 focus:ring-red-600"
                    />
                    <span className="text-sm leading-relaxed">
                      I am over 18 years of age, and myself and any partner are above the legal age of consent in our jurisdiction.
                    </span>
                  </label>

                  <label className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-colors ${
                    consentTerms ? 'bg-red-950/20 border-red-700/80 text-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={consentTerms}
                      onChange={(e) => setConsentTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded text-red-600 bg-zinc-900 border-zinc-700 focus:ring-red-600"
                    />
                    <span className="text-sm leading-relaxed">
                      Betweenusapp.io contains adult themes but is an intimacy communication tool designed to encourage mutually beneficial intimate communication, not a porn site.
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssessmentAnswer('undecided')}
                    className="py-4 px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!consentAge || !consentTerms}
                    onClick={() => setStep(3)}
                    className="flex-1 py-4 px-6 bg-red-900 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-red-950 text-base"
                  >
                    Continue to Preferences →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PREFERENCES & BOUNDARY MATRIX */}
        {step === 3 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300">
            <span className="text-xs uppercase tracking-widest text-red-500 font-bold">Step 3: Boundaries &amp; Desires</span>
            <h2 className="text-3xl font-serif font-medium text-zinc-100 mt-1">Select Your Tolerance Tier</h2>
            <p className="text-zinc-400 mt-2 text-sm leading-relaxed font-light">
              Choose your baseline tolerance level to help curate games, literature, and scenarios tailored to your comfort.
            </p>

            <div className="space-y-6 mt-6">
              {/* 4 Explicit Tolerance Options */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Tolerance Options
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {TIER_OPTIONS.map((t) => {
                    const isSelected = confirmedTier === t.name
                    return (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => setSelectedTier(t.name)}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-red-950/50 border-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-1 ring-red-500'
                            : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <span className="font-serif font-medium text-lg text-zinc-100">{t.name}</span>
                          <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">{t.badge}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-light leading-relaxed">
                          {t.description}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Helper Text and Recommendation Link */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-2">
                <p className="text-sm text-zinc-300 leading-relaxed font-light">
                  Not sure?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setShowChecklist(prev => !prev)
                    }}
                    className="text-red-400 hover:text-red-300 underline underline-offset-4 font-medium transition-colors"
                  >
                    Click the link
                  </button>{' '}
                  to choose interests and we will make a recommendation.
                </p>

                {confirmedTier && (
                  <p className="text-xs text-green-400 font-medium flex items-center gap-1.5 pt-1">
                    <span>✓</span> Current selection: <strong className="text-white font-semibold">{confirmedTier}</strong>
                  </p>
                )}
              </div>

              {/* Categorized Boundary Matrix */}
              {showChecklist && (
                <div className="space-y-6 p-5 bg-zinc-950/80 border border-zinc-800 rounded-xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                        Categorized Boundary Matrix
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Select specific interests or boundaries below to calculate your tolerance tier based on point weights.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowChecklist(false)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Hide ▲
                    </button>
                  </div>

                  {categoriesList.map((cat) => {
                    if (!cat.items || cat.items.length === 0) return null

                    return (
                      <div key={cat.category} className="border-t border-zinc-800/80 pt-4 first:border-t-0 first:pt-0">
                        <div className="mb-2">
                          <h4 className="text-sm font-semibold text-zinc-200">{cat.category}</h4>
                          {cat.description && (
                            <p className="text-xs text-zinc-400 mt-0.5 font-light">{cat.description}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {cat.items.map((opt) => {
                            const isChecked = selectedItems.some(i => i.label === opt.label)
                            return (
                              <label
                                key={opt.label}
                                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-red-950/40 border-red-700 text-white'
                                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleOption(opt)}
                                  className="w-4 h-4 rounded text-red-600 bg-zinc-950 border-zinc-700 focus:ring-red-600"
                                />
                                <span>{opt.label}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* General preferences textarea */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Additional interests or boundary notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={generalPreferences}
                  onChange={(e) => setGeneralPreferences(e.target.value)}
                  placeholder="e.g., Deep romantic connection, slow sensual touch, light teasing, exploration of playful power dynamics, role reversals..."
                  className="w-full p-4 bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl text-base focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-4 px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!confirmedTier}
                  onClick={() => setStep(4)}
                  className="flex-1 py-4 px-6 bg-red-900 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-red-950 text-base"
                >
                  Next: Final Details →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: FINAL DETAILS & DASHBOARD ROUTING */}
        {step === 4 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300">
            <span className="text-xs uppercase tracking-widest text-red-500 font-bold">Step 4: Final Details</span>
            <h2 className="text-3xl font-serif font-medium text-zinc-100 mt-1">Almost Done</h2>
            <p className="text-zinc-400 mt-2 text-sm leading-relaxed font-light">
              Add any specific scenarios, tropes, or fantasies you'd like our game master and literature engine to incorporate.
            </p>

            {!isCompleted ? (
              <form onSubmit={handleStep4Submit} className="space-y-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    To finish your profile, please include any specific activities, scenarios, or tropes you would like to include.
                  </label>
                  <textarea
                    rows={4}
                    value={specificActivities}
                    onChange={(e) => setSpecificActivities(e.target.value)}
                    placeholder="e.g., A rainy secluded cabin night, masked encounter, enemies to lovers, slow burn tension, praise, sensory games..."
                    className="w-full p-4 bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-800 rounded-xl text-base focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>

                <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-xs text-zinc-400 leading-relaxed">
                  💡 You can update your tolerance levels, specific kinks, and preferences anytime in your <strong className="text-zinc-300 font-medium">Settings</strong>.
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setStep(3)}
                    className="py-4 px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 px-6 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-950 text-base flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <span>Complete Profile & Enter Dashboard →</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-6 text-center space-y-6 animate-in fade-in duration-500">
                <div className="w-16 h-16 mx-auto bg-green-950/60 border border-green-800/80 rounded-2xl flex items-center justify-center text-3xl shadow-inner text-green-400">
                  ✓
                </div>
                
                <div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-medium text-zinc-100">
                    Preferences Saved & Calibrated!
                  </h3>
                  <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed mt-2 font-light">
                    Your boundaries, tolerance matrix, and intimacy desires are securely configured. You can update these anytime in your Settings.
                  </p>
                </div>

                {/* Dynamic Suggestion Block */}
                <div className="p-6 bg-zinc-950/90 border border-zinc-800 rounded-2xl text-left space-y-4 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${suggestionDetails.badgeColor}`}>
                      {suggestionDetails.tierBadge}
                    </span>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                      Recommended Initial Action
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-serif font-medium text-zinc-100">
                      {suggestionDetails.title}
                    </h4>
                    <p className="text-sm text-zinc-400 leading-relaxed mt-1 font-light">
                      {suggestionDetails.description}
                    </p>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="pt-3 border-t border-zinc-800/80">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                        Active Desires & Themes:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItems.slice(0, 5).map(item => (
                          <span
                            key={item.label}
                            className="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg"
                          >
                            {item.label}
                          </span>
                        ))}
                        {selectedItems.length > 5 && (
                          <span className="text-xs px-2 py-1 text-zinc-500">
                            +{selectedItems.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleEnterDashboard(suggestionDetails.actionHref)}
                      className="flex-1 py-3.5 px-6 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-950 text-sm flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <span>{suggestionDetails.actionLabel}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleEnterDashboard('/dashboard?tour=true')}
                      className="py-3.5 px-6 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-zinc-300 font-medium rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors text-sm cursor-pointer"
                    >
                      {isSubmitting ? 'Entering Dashboard...' : 'Enter Dashboard (Tour) →'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default function OnboardingSurvey() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-sans">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading onboarding engine...</span>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
