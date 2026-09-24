'use client'

import { useState } from 'react'

export default function InvitePartnerPage() {
  const [searchUsername, setSearchUsername] = useState('')
  const [foundUser, setFoundUser] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [liabilityChecked, setLiabilityChecked] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  const handleSearch = async () => {
    if (!searchUsername.trim()) return
    setIsSearching(true)
    
    // Mocking the search for now. In a real scenario, we'd query the 'profiles' table 
    // for anonymous_alias or nickname = searchUsername
    setTimeout(() => {
      setFoundUser({ username: searchUsername })
      setIsSearching(false)
    }, 600)
  }

  const handleSendInvite = () => {
    // Mock sending the invite
    setTimeout(() => {
      setInviteSent(true)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-serif font-medium text-zinc-100">Link Partner Account</h1>
          <p className="text-zinc-500 mt-2">Find your partner by their anonymous alias to link accounts.</p>
        </header>

        {!inviteSent ? (
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Partner's Username</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  placeholder="Enter their anonymous alias"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-red-500"
                />
                <button 
                  onClick={handleSearch}
                  disabled={isSearching || !searchUsername}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {foundUser && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 mt-8 p-6 bg-zinc-950 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center font-bold text-xl">
                    {foundUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-200">{foundUser.username}</h3>
                    <p className="text-sm text-zinc-500">Account Found</p>
                  </div>
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
              onClick={() => { setInviteSent(false); setFoundUser(null); setSearchUsername(''); setLiabilityChecked(false); }}
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
