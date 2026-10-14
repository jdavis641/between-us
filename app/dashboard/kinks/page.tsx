'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface KinkEntry {
  id: string;
  text: string;
}

export default function KinksManagementPage() {
  const [supabase] = useState(() => createClient())
  const [kinks, setKinks] = useState<KinkEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [kinkInput, setKinkInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchKinks() {
      try {
        let user = (await supabase.auth.getUser()).data.user
        if (!user) {
          const { data: { session } } = await supabase.auth.getSession()
          user = session?.user || null
        }

        if (user) {
          const { data, error: fetchErr } = await supabase
            .from('intimacy_preferences')
            .select('id, category_tag, preference_level, kinks_override')
            .eq('user_id', user.id)
            .neq('category_tag', 'Guest Pass Config')

          if (fetchErr) {
            console.error("Error fetching intimacy_preferences:", fetchErr)
          }

          // Prioritize 'Primary Directive' or any row with kinks_override
          const targetRow = (data as any[])?.find((r: any) => r.category_tag === 'Primary Directive' && r.kinks_override)
                         || (data as any[])?.find((r: any) => r.kinks_override)

          const raw = targetRow?.kinks_override
          if (raw) {
            let textVal = ""
            try {
              const parsed = JSON.parse(raw)
              if (Array.isArray(parsed)) {
                setKinks(parsed)
                textVal = parsed.map((k: any) => k.text || k).join('\n')
              } else if (typeof parsed === 'object' && parsed !== null && parsed.kinks) {
                textVal = Array.isArray(parsed.kinks) ? parsed.kinks.join('\n') : String(parsed.kinks)
                setKinks([{ id: Date.now().toString(), text: textVal }])
              } else {
                textVal = typeof parsed === 'string' ? parsed : raw
                setKinks([{ id: Date.now().toString(), text: textVal }])
              }
            } catch (e) {
              textVal = raw
              setKinks([{ id: Date.now().toString(), text: raw }])
            }
            setKinkInput(textVal)
          }
        }
      } catch (err: any) {
        console.error("Failed to load kinks:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchKinks()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSavedSuccess(false)

    try {
      let user = (await supabase.auth.getUser()).data.user
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession()
        user = session?.user || null
      }

      if (!user) {
        throw new Error("User session expired. Please sign in again.")
      }

      // Check existing row for Primary Directive
      const { data: existingRows } = await supabase
        .from('intimacy_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('category_tag', 'Primary Directive')

      const existingId = existingRows?.[0]?.id

      // Format payload so both plain string & JSON array consumers are satisfied
      const lines = kinkInput.split('\n').map(l => l.trim()).filter(Boolean)
      const newKinksList: KinkEntry[] = lines.length > 0
        ? lines.map((line, idx) => ({ id: `${Date.now()}-${idx}`, text: line }))
        : (kinkInput.trim() ? [{ id: Date.now().toString(), text: kinkInput.trim() }] : [])

      const payload = JSON.stringify(newKinksList)

      const upsertRecord: any = {
        user_id: user.id,
        category_tag: 'Primary Directive',
        preference_level: 'Definitely',
        kinks_override: payload
      }

      if (existingId) {
        upsertRecord.id = existingId
      }

      const { error: upsertErr } = await supabase
        .from('intimacy_preferences')
        .upsert(upsertRecord)

      if (upsertErr) {
        throw upsertErr
      }

      setKinks(newKinksList)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3500)
    } catch (err: any) {
      console.error("Error saving kinks_override:", err)
      setError(err.message || "Failed to save kinks.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-8 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center mb-6">
            &larr; Back to Dashboard
          </Link>
          <header className="border-b border-zinc-800 pb-6">
            <h1 className="text-3xl font-serif font-medium text-zinc-100">Custom Kinks</h1>
            <p className="text-zinc-400 mt-2 text-base">What are you into? Enter your kinks.</p>
          </header>
        </div>

        {loading ? (
          <div className="animate-pulse text-zinc-500 py-12">Loading your custom kinks...</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-4 shadow-xl">
              <label htmlFor="kinks-textarea" className="block text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Custom Desires & Boundaries Override
              </label>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Enter your explicit desires, kinks, and preferences. Items listed here will directly instruct the story and game engine to prioritize your intimate interests.
              </p>
              
              <textarea
                id="kinks-textarea"
                value={kinkInput}
                onChange={(e) => setKinkInput(e.target.value)}
                placeholder="What kinks would you like included in your stories and games? (e.g. sensory deprivation, praise, edging, roleplay, light bondage)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-red-500 min-h-[160px] resize-y font-sans text-base leading-relaxed transition-colors"
              />

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div>
                  {savedSuccess && (
                    <span className="text-green-400 text-sm font-medium flex items-center gap-1.5 animate-in fade-in">
                      <span>✓</span> Custom kinks saved successfully!
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-red-900 hover:bg-red-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm self-end sm:self-auto cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Kinks'}
                </button>
              </div>
            </div>

            {/* Current saved entries preview */}
            {kinks.length > 0 && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Active Kink Overrides ({kinks.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {kinks.map((k, i) => (
                    <span key={k.id || i} className="bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs px-3 py-1.5 rounded-lg">
                      {k.text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
