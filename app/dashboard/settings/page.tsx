'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleManageBilling = async () => {
    try {
      setIsRedirecting(true)
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Could not generate billing portal link: " + (data.error || "Unknown error"))
        setIsRedirecting(false)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to load billing portal.")
      setIsRedirecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-zinc-500 animate-pulse">
        Loading settings...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-serif font-medium text-zinc-100">Account Settings</h1>
          <p className="text-zinc-500 mt-2">Manage your preferences and billing securely.</p>
        </header>

        <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-xl font-medium text-zinc-200">Account Status</h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/80 gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Subscription Plan</p>
              <p className="text-lg text-zinc-200 mt-1">
                {profile?.is_active ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Premium Member
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-zinc-600"></span> Inactive Trial
                  </span>
                )}
              </p>
            </div>
            
            <button 
              onClick={handleManageBilling}
              disabled={isRedirecting}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-medium px-6 py-3 rounded-xl transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              {isRedirecting ? 'Redirecting...' : 'Unsubscribe / Manage Billing'}
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-800/50">
            <div>
              <p className="text-sm text-zinc-500 mb-1">Nickname</p>
              <p className="text-zinc-300 font-medium">{profile?.nickname || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-1">Base Tolerance Tier</p>
              <p className="text-zinc-300 font-medium">{profile?.tolerance || 'Not set'}</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
