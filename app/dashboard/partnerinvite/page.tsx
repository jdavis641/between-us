'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function InvitePartnerPage() {
  const [searchMethod, setSearchMethod] = useState<'username'|'email'|'phone'>('username')
  const [searchValue, setSearchValue] = useState('')
  const [foundUser, setFoundUser] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [liabilityChecked, setLiabilityChecked] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  const [boundaries, setBoundaries] = useState<string[]>([])
  const [customKinks, setCustomKinks] = useState<any[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedKinks, setSelectedKinks] = useState<string[]>([])

  useEffect(() => {
    async function fetchPrefs() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('intimacy_preferences')
        .select('*')
        .eq('user_id', session.user.id)

      if (data) {
        const b = data.filter((p: any) => p.preference_level === 'Definitely' || p.preference_level === 'Curious').map((p: any) => p.category_tag)
        setBoundaries(b)
        setSelectedTags(b)

        const kinksRow = data.find((p: any) => p.kinks_override)
        if (kinksRow) {
          try {
            const parsed = JSON.parse(kinksRow.kinks_override)
            if (Array.isArray(parsed)) {
              setCustomKinks(parsed)
              setSelectedKinks(parsed.map(k => k.text))
            } else {
              setCustomKinks([{id: '1', text: kinksRow.kinks_override}])
              setSelectedKinks([kinksRow.kinks_override])
            }
          } catch(e) {
            setCustomKinks([{id: '1', text: kinksRow.kinks_override}])
            setSelectedKinks([kinksRow.kinks_override])
          }
        }
      }
    }
    fetchPrefs()
  }, [])

  const handleSearch = async () => {
    if (!searchValue.trim()) return
    setIsSearching(true)
    
    // Mocking the search for now. In a real scenario, we'd query the 'profiles' table 
    setTimeout(() => {
      setFoundUser({ username: searchValue })
      setIsSearching(false)
    }, 600)
  }

  const handleSendInvite = () => {
    // Mock sending the invite
    setTimeout(() => {
      setInviteSent(true)
    }, 500)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const toggleKink = (text: string) => {
    setSelectedKinks(prev => prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text])
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-serif font-medium text-zinc-100">Link Partner Account</h1>
          <p className="text-zinc-500 mt-2">Find your partner by their anonymous alias, email, or phone to link accounts.</p>
        </header>

        {!inviteSent ? (
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-6">
                <button onClick={() => setSearchMethod('username')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${searchMethod === 'username' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Username</button>
                <button onClick={() => setSearchMethod('email')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${searchMethod === 'email' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Email</button>
                <button onClick={() => setSearchMethod('phone')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${searchMethod === 'phone' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Phone</button>
              </div>

              <div className="flex gap-4">
                <input
                  type={searchMethod === 'email' ? 'email' : searchMethod === 'phone' ? 'tel' : 'text'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={`Enter their ${searchMethod}`}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-red-500"
                />
                <button 
                  onClick={handleSearch}
                  disabled={isSearching || !searchValue}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {foundUser && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 mt-8 p-6 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
                  <div className="w-12 h-12 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center font-bold text-xl">
                    {foundUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-200">{foundUser.username}</h3>
                    <p className="text-sm text-zinc-500">Account Found</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-md font-semibold text-zinc-200 mb-3">Select Boundaries to Share</h4>
                  {boundaries.length === 0 ? <p className="text-sm text-zinc-500">No boundaries set.</p> : (
                    <div className="flex flex-wrap gap-2">
                      {boundaries.map(b => (
                        <label key={b} className={`px-3 py-1.5 rounded-full border cursor-pointer transition-colors text-xs font-semibold ${selectedTags.includes(b) ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
                          <input type="checkbox" className="hidden" checked={selectedTags.includes(b)} onChange={() => toggleTag(b)} />
                          {b}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-4 border-b border-zinc-800 pb-4">
                  <h4 className="text-md font-semibold text-zinc-200 mb-3">Select Custom Kinks to Share</h4>
                  {customKinks.length === 0 ? <p className="text-sm text-zinc-500">No custom kinks set.</p> : (
                    <div className="flex flex-col gap-2">
                      {customKinks.map(k => (
                        <label key={k.id} className={`p-3 rounded-lg border cursor-pointer transition-colors text-sm ${selectedKinks.includes(k.text) ? 'bg-red-900/10 text-red-300 border-red-900/30' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
                          <input type="checkbox" className="hidden" checked={selectedKinks.includes(k.text)} onChange={() => toggleKink(k.text)} />
                          {k.text}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="liability-consent"
                    checked={liabilityChecked}
                    onChange={(e) => setLiabilityChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-red-500 bg-zinc-950"
                  />
                  <label htmlFor="liability-consent" className="text-sm text-zinc-400">
                    I understand that I am securely linking my profile to <strong>{foundUser.username}</strong> to compute our shared boundaries.
                  </label>
                </div>

                <button 
                  onClick={handleSendInvite}
                  disabled={!liabilityChecked}
                  className="w-full py-3 bg-red-900 hover:bg-red-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Link Accounts
                </button>
              </div>
            )}
          </section>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Link Request Sent!</h2>
            <p className="text-zinc-400 mb-6">Your partner has been notified. Once they accept, your boundaries will be securely computed.</p>
            <button 
              onClick={() => { setInviteSent(false); setFoundUser(null); setSearchValue(''); setLiabilityChecked(false); }}
              className="text-zinc-400 hover:text-white underline text-sm transition-colors"
            >
              Link another account
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
