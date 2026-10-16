'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import LogoutButton from '../components/LogoutButton'
import { getActiveHoliday, HolidayConfig } from '@/utils/holidayTheme'

const supabase = createClient()

export default function DashboardHome() {
  const [activeHoliday, setActiveHoliday] = useState<HolidayConfig | null>(() => getActiveHoliday())
  const [activeStory, setActiveStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
          .maybeSingle()
        
        if (data) setActiveStory(data)
        
        // Check if user is a guest
        const { data: member } = await supabase
          .from('group_members')
          .select('connection_groups(group_type)')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle()
          
        // @ts-ignore - nested structure
        if (member?.connection_groups?.group_type === 'guest_pass') {
          setIsGuest(true)
        }
      }
      setLoading(false)
    }
    fetchActiveContent()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12 pb-32">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-10 border-b border-gray-800 pb-6">
        <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md" />
        <h1 className="text-3xl font-bold tracking-tight">Between Us</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Settings Notification Banner */}
        <section>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-300 text-sm">
              Change your tolerance level and contribute to the community, anonymously, in the{' '}
              <Link href="/dashboard/settings" className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors">
                settings menu
              </Link>
            </p>
          </div>
        </section>

        {/* Main Navigation Grid */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Explore the Library</h2>
          
          {/* Holiday Spotlight Action Tile */}
          {activeHoliday && (
            <div className="mb-6">
              <Link href={`/dashboard/games?seasonal_tag=${activeHoliday.seasonal_tag}`}>
                <div 
                  className="p-6 md:p-8 rounded-xl border transition-all cursor-pointer group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg hover:shadow-2xl hover:scale-[1.01]"
                  style={{
                    backgroundColor: activeHoliday.bgHex,
                    borderColor: `${activeHoliday.textHex}80`
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className="p-4 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center text-3xl"
                      style={{ backgroundColor: `${activeHoliday.textHex}25` }}
                    >
                      <span>{activeHoliday.icon || '✨'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="text-xs uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: `${activeHoliday.textHex}30`,
                            color: activeHoliday.textHex 
                          }}
                        >
                          Holiday Spotlight
                        </span>
                        <span className="text-xs text-gray-400 font-medium">• {activeHoliday.name}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-pink-200 transition-colors">
                        Holiday Spotlight: {activeHoliday.name}
                      </h3>
                      <p className="text-gray-300 text-sm mt-1 max-w-xl">
                        Explore seasonal intimacy games containing the {activeHoliday.seasonal_tag} theme.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center font-bold text-sm" style={{ color: activeHoliday.textHex }}>
                    <span>Browse Collection</span>
                    <span className="text-2xl transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            </div>
          )}

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
                  <p className="text-gray-400 text-sm">Explore scenarios categorized by Sensory (🔥), Playful (🔥🔥), and Intense (🔥🔥🔥).</p>
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

            <Link href="/dashboard/partnerinvite">
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
          </div>
          <Link href="/dashboard/kinks" className="block">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-red-500/50 transition-all cursor-pointer group flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-3xl">🔥</span>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">custom Kinks</h3>
                  <p className="text-gray-400 text-sm">Define explicit desires that manually override AI boundaries.</p>
                </div>
              </div>
              <span className="text-2xl text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all">→</span>
            </div>
          </Link>
        </section>

        {/* Mobile Logout */}
        <section className="pt-8 pb-12 md:hidden">
          <LogoutButton className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-red-500 font-bold tracking-wide hover:bg-zinc-800 transition-colors" />
        </section>
      </div>
    </div>
  )
}

