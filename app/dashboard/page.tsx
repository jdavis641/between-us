'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardHome() {
  const [activeStory, setActiveStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Kink Override State
  const [showKinkBox, setShowKinkBox] = useState(false)
  const [kinkText, setKinkText] = useState('')
  const [savingKink, setSavingKink] = useState(false)
  const [kinkSaved, setKinkSaved] = useState(false)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    async function fetchActiveContent() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Fetch the most recent active generated story or roleplay
        const { data } = await supabase
          .from('generated_content')
          .select('id, title, content_type')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (data) setActiveStory(data)
        
        // Fetch existing kink override
        const { data: prefData } = await supabase
          .from('intimacy_preferences')
          .select('kinks_override')
          .eq('user_id', session.user.id)
          .not('kinks_override', 'is', null)
          .limit(1)
          .single()
          
        if (prefData?.kinks_override) {
          setKinkText(prefData.kinks_override)
        }
        
        // Check if user is a guest
        const { data: member } = await supabase
          .from('group_members')
          .select('connection_groups(group_type)')
          .eq('user_id', session.user.id)
          .limit(1)
          .single()
          
        // @ts-ignore - nested structure
        if (member?.connection_groups?.group_type === 'guest_pass') {
          setIsGuest(true)
        }
      }
      setLoading(false)
    }
    fetchActiveContent()
  }, [supabase])

  const handleSaveKink = async () => {
    setSavingKink(true)
    setKinkSaved(false)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      // Upsert the kinks override by updating records for this user or inserting if none
      const { data: existingPrefs } = await supabase.from('intimacy_preferences').select('id').eq('user_id', session.user.id).limit(1)
      if (existingPrefs && existingPrefs.length > 0) {
        await supabase.from('intimacy_preferences').update({ kinks_override: kinkText }).eq('user_id', session.user.id)
      } else {
        await supabase.from('intimacy_preferences').insert({ user_id: session.user.id, category_tag: 'Base', preference_level: 'Standard', kinks_override: kinkText })
      }
      setKinkSaved(true)
      setTimeout(() => setKinkSaved(false), 3000)
    }
    setSavingKink(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12 pb-32">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-10 border-b border-gray-800 pb-6">
        <span className="text-4xl">🔥</span>
        <h1 className="text-3xl font-bold tracking-tight">Between Us</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Active AI Story/Roleplay Banner */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Your Active Experience</h2>
          {loading ? (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-pulse h-24"></div>
          ) : activeStory ? (
            <Link href={`/dashboard/experience/${activeStory.id}`}>
              <div className="bg-gradient-to-r from-blue-900 to-gray-800 p-6 rounded-xl border border-blue-800 hover:border-blue-500 transition-colors cursor-pointer group flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{activeStory.title}</h3>
                  <p className="text-sm text-gray-300 mt-1">
                    {activeStory.content_type === 'midweek_story' ? 'Continue Reading Chapter...' : 'View Weekend Roleplay Script'}
                  </p>
                </div>
                <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </Link>
          ) : (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
              <p className="text-gray-400 text-sm">Your game master is preparing your next scenario.</p>
            </div>
          )}
        </section>

        {/* Main Navigation Grid */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Explore the Library</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Intimacy Games Hub Link */}
            <Link href="/dashboard/games">
              <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-yellow-500 transition-all cursor-pointer group flex flex-col items-center text-center space-y-4">
                <div className="bg-gray-900 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <span className="text-4xl">🎲</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Intimacy Games</h3>
                  <p className="text-gray-400 text-sm">Browse card games, movie night rules, drinking games, and date night activities.</p>
                </div>
              </div>
            </Link>

            {/* Role Play Hub Link */}
            <Link href="/dashboard/roleplay">
              <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:bg-gray-750 hover:border-red-500 transition-all cursor-pointer group flex flex-col items-center text-center space-y-4">
                <div className="bg-gray-900 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <span className="text-4xl">🎭</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Role Play Scenarios</h3>
                  <p className="text-gray-400 text-sm">Explore scenarios categorized by Mild (🔥), Medium (🔥🔥), and Spicy (🔥🔥🔥).</p>
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* Account Actions */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Account Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/dashboard/pass">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-pink-500 transition-all cursor-pointer group flex items-center space-x-4">
                <span className="text-3xl">🎟️</span>
                <div>
                  <h3 className={`text-lg font-bold ${isGuest ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    {isGuest ? 'View Shared Between Us Pass' : 'Between Us Guest Pass'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {isGuest ? 'Click to see your partner\'s boundaries and instructions.' : 'Generate a temporary hookup pass.'}
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/settings">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all cursor-pointer group flex items-center space-x-4">
                <span className="text-3xl">🤝</span>
                <div>
                  <h3 className="text-lg font-bold text-white">Invite Partner</h3>
                  <p className="text-gray-400 text-sm">Connect by querying a username (anonymous alias).</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* AI Kink Override */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Custom Boundaries</h2>
            <button
              onClick={() => setShowKinkBox(!showKinkBox)}
              className="text-xs font-bold uppercase tracking-widest bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-zinc-300 transition-colors border border-zinc-700"
            >
              {showKinkBox ? 'Close' : 'Kink Override'}
            </button>
          </div>
          
          {showKinkBox && (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 transition-all animate-in fade-in slide-in-from-top-2">
              <label htmlFor="kinks" className="block text-sm font-medium text-zinc-300 mb-2">
                Manual AI Instruction Override
              </label>
              <textarea
                id="kinks"
                value={kinkText}
                onChange={(e) => setKinkText(e.target.value)}
                placeholder="what kinks would you like included in your stories and games? (the more detail the better)"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-zinc-200 focus:border-red-500 focus:outline-none transition-colors min-h-[120px] resize-y mb-4"
              />
              <div className="flex items-center justify-end gap-4">
                {kinkSaved && <span className="text-sm text-green-400">Settings updated!</span>}
                <button
                  onClick={handleSaveKink}
                  disabled={savingKink}
                  className="bg-red-900 hover:bg-red-800 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {savingKink ? 'Saving...' : 'Save Override'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
