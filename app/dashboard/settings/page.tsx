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

  // Username Modification State
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [savingUsername, setSavingUsername] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const { data: prefData } = await supabase
          .from('intimacy_preferences')
          .select('preference_level')
          .eq('user_id', session.user.id)
          .limit(1)

        setProfile({
          ...profileData,
          base_tolerance: prefData && prefData.length > 0 ? prefData[0].preference_level : 'Not set'
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  // Debounced Username Availability Check
  useEffect(() => {
    const currentName = profile?.anonymous_alias || profile?.nickname
    if (!newUsername || newUsername.trim() === '' || newUsername.trim() === currentName) {
      setUsernameStatus('idle')
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setUsernameStatus('checking')
      try {
        const res = await fetch('/api/check-nickname', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: newUsername.trim() })
        })
        const data = await res.json()
        if (data.available) {
          setUsernameStatus('available')
          setSuggestions([])
        } else {
          setUsernameStatus('taken')
          setSuggestions(data.suggestions || [])
        }
      } catch (err) {
        console.error(err)
        setUsernameStatus('idle')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [newUsername, profile])

  const handleSaveUsername = async (usernameToSave: string) => {
    if (!usernameToSave || usernameToSave.trim() === '') return
    setSavingUsername(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: usernameToSave, anonymous_alias: usernameToSave })
        .eq('id', session.user.id)
      
      if (!error) {
        setProfile((prev: any) => ({ ...prev, nickname: usernameToSave, anonymous_alias: usernameToSave }))
        setIsEditingUsername(false)
        setNewUsername('')
      } else {
        alert("Error saving username: " + error.message)
      }
    }
    setSavingUsername(false)
  }

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

          <div className="space-y-6 pt-4 border-t border-zinc-800/50">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-zinc-500">Nickname / Anonymous Alias</p>
                {!isEditingUsername && (
                  <button 
                    onClick={() => {
                      setIsEditingUsername(true)
                      setNewUsername(profile?.anonymous_alias || profile?.nickname || '')
                    }}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wide"
                  >
                    Change Username
                  </button>
                )}
              </div>
              
              {!isEditingUsername ? (
                <p className="text-zinc-300 font-medium text-lg">{profile?.anonymous_alias || profile?.nickname || 'Not set'}</p>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className={`flex-1 bg-zinc-950 border rounded-lg px-4 py-2 text-zinc-200 focus:outline-none transition-colors ${
                        usernameStatus === 'taken' ? 'border-red-500/50 focus:border-red-500' :
                        usernameStatus === 'available' ? 'border-green-500/50 focus:border-green-500' :
                        'border-zinc-800 focus:border-blue-500'
                      }`}
                      placeholder="Enter new username"
                    />
                    <button
                      onClick={() => handleSaveUsername(newUsername.trim())}
                      disabled={savingUsername || usernameStatus !== 'available'}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white disabled:text-zinc-500 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {savingUsername ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUsername(false)
                        setNewUsername('')
                      }}
                      className="text-zinc-400 hover:text-zinc-300 px-2 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="text-sm">
                    {usernameStatus === 'checking' && <span className="text-zinc-500">Checking availability...</span>}
                    {usernameStatus === 'available' && <span className="text-green-400">Username is available!</span>}
                    {usernameStatus === 'taken' && (
                      <div className="text-red-400 space-y-2">
                        <p>This username is already taken.</p>
                        {suggestions.length > 0 && (
                          <div>
                            <p className="text-zinc-400 text-xs uppercase mb-1">Available Suggestions:</p>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.map((sug) => (
                                <button
                                  key={sug}
                                  onClick={() => setNewUsername(sug)}
                                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded border border-zinc-700 text-sm transition-colors"
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
              )}
            </div>
            
            <div>
              <p className="text-sm text-zinc-500 mb-1">Base Tolerance Tier</p>
              <p className="text-zinc-300 font-medium">{profile?.base_tolerance || profile?.tolerance || 'Not set'}</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
