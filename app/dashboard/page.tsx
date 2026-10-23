'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import LogoutButton from '../components/LogoutButton'
import DashboardTicker from './components/DashboardTicker'
import { getActiveHoliday, HolidayConfig } from '@/utils/holidayTheme'

const supabase = createClient()

export default function DashboardHome() {
  const [activeHoliday, setActiveHoliday] = useState<HolidayConfig | null>(() => getActiveHoliday())
  const [activeStory, setActiveStory] = useState<any>(null)
  const [baseTolerance, setBaseTolerance] = useState<string | null>(null)
  const [isOnboardingIncomplete, setIsOnboardingIncomplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    async function fetchActiveContent() {
      let activeUserId: string | null = null
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (user && !userError) {
        activeUserId = user.id
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        activeUserId = session?.user?.id || null
      }

      if (activeUserId) {
        // Query user profile to verify boundary calibration and onboarding completion
        const { data: profile } = await supabase
          .from('profiles')
          .select('base_tolerance, onboarding_completed, nickname')
          .eq('id', activeUserId)
          .maybeSingle()

        setBaseTolerance(profile?.base_tolerance || null)
        const isIncomplete = !profile?.base_tolerance || profile?.onboarding_completed !== true || !profile?.nickname;
        setIsOnboardingIncomplete(isIncomplete);

        // Fetch the most recent active generated story or roleplay
        const { data } = await supabase
          .from('generated_content')
          .select('id, title, content_type')
          .eq('user_id', activeUserId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (data) setActiveStory(data)
        
        // Check if user is a guest
        const { data: member } = await supabase
          .from('group_members')
          .select('connection_groups(group_type)')
          .eq('user_id', activeUserId)
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
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white selection:bg-red-500/30">
      {/* Prominent Dashboard Onboarding Completion Banner */}
      {!loading && isOnboardingIncomplete && (
        <div className="w-full bg-gradient-to-r from-rose-950 via-zinc-900 to-rose-950 border-b border-rose-500/40 py-4 px-6 shadow-2xl relative z-20">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">✨</span>
              <p className="text-sm sm:text-base font-medium text-zinc-100 leading-relaxed">
                Welcome! Please visit the <Link href="/dashboard/settings" className="text-rose-400 hover:text-rose-300 font-bold underline underline-offset-4 transition-colors">settings menu</Link> to complete your onboarding and customize your boundaries.
              </p>
            </div>
            <Link 
              href="/dashboard/settings" 
              className="shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold rounded-lg shadow transition-colors w-fit"
            >
              Settings &rarr;
            </Link>
          </div>
        </div>
      )}

      <div className="p-6 md:p-12 pb-32">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-10 border-b border-gray-800 pb-6">
          <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md" />
          <h1 className="text-3xl font-bold tracking-tight">Between Us</h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Settings Notification Banner */}
          <section>
            <DashboardTicker />
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
                          {activeHoliday.title}
                        </h3>
                        <p className="text-sm text-gray-300 mt-1">
                          Explore seasonal intimacy games containing the {activeHoliday.seasonal_tag} theme.
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-2 text-white font-medium text-sm group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <span>&rarr;</span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Erotic Literature Card */}
              <Link href="/dashboard/literature">
                <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl hover:border-red-500/50 transition-all cursor-pointer group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors">Erotic Literature</h3>
                      <span className="text-2xl">📖</span>
                    </div>
                    <p className="text-gray-400 text-sm">Immersive romantic stories crafted strictly within your shared boundaries.</p>
                  </div>
                  <div className="mt-4 text-xs font-semibold text-red-400 group-hover:translate-x-1 transition-transform inline-flex items-center">
                    Generate Story &rarr;
                  </div>
                </div>
              </Link>

              {/* Role-Play Scenarios Card */}
              <Link href="/dashboard/roleplay">
                <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl hover:border-red-500/50 transition-all cursor-pointer group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors">Role-Play Scripts</h3>
                      <span className="text-2xl">🎭</span>
                    </div>
                    <p className="text-gray-400 text-sm">Perspective-based dialogue and step-by-step actions for tonight.</p>
                  </div>
                  <div className="mt-4 text-xs font-semibold text-red-400 group-hover:translate-x-1 transition-transform inline-flex items-center">
                    Build Scenario &rarr;
                  </div>
                </div>
              </Link>

              {/* Intimacy Games Card */}
              <Link href="/dashboard/games">
                <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl hover:border-red-500/50 transition-all cursor-pointer group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors">Intimacy Games</h3>
                      <span className="text-2xl">🎲</span>
                    </div>
                    <p className="text-gray-400 text-sm">Browse card games, movie night rules, drinking games, and date night activities.</p>
                  </div>
                  <div className="mt-4 text-xs font-semibold text-red-400 group-hover:translate-x-1 transition-transform inline-flex items-center">
                    Play Tonight &rarr;
                  </div>
                </div>
              </Link>

              {/* Relationship Randomizer Card */}
              <Link href="/dashboard/randomizer">
                <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl hover:border-red-500/50 transition-all cursor-pointer group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors">The Randomizer</h3>
                      <span className="text-2xl">⚡</span>
                    </div>
                    <p className="text-gray-400 text-sm">Quick, spontaneous prompts: Truth or Dare, Intimacy Dice, and quick conversation sparks.</p>
                  </div>
                  <div className="mt-4 text-xs font-semibold text-red-400 group-hover:translate-x-1 transition-transform inline-flex items-center">
                    Roll Randomizer &rarr;
                  </div>
                </div>
              </Link>

              {/* Favorites Hub Card */}
              <Link href="/dashboard/favorites">
                <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl hover:border-red-500/50 transition-all cursor-pointer group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors">Saved Favorites</h3>
                      <span className="text-2xl">❤️</span>
                    </div>
                    <p className="text-gray-400 text-sm">Quickly revisit and replay your top-rated stories and intimacy scenarios.</p>
                  </div>
                  <div className="mt-4 text-xs font-semibold text-red-400 group-hover:translate-x-1 transition-transform inline-flex items-center">
                    View Favorites &rarr;
                  </div>
                </div>
              </Link>

              {/* Settings / Tolerance Management Card */}
              <Link href="/dashboard/settings">
                <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl hover:border-red-500/50 transition-all cursor-pointer group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors">Settings & Boundaries</h3>
                      <span className="text-2xl">🛡️</span>
                    </div>
                    <p className="text-gray-400 text-sm">Adjust your base tolerance tier, review hard limits, or update your password.</p>
                  </div>
                  <div className="mt-4 text-xs font-semibold text-red-400 group-hover:translate-x-1 transition-transform inline-flex items-center">
                    Manage Limits &rarr;
                  </div>
                </div>
              </Link>

            </div>
          </section>

          {/* Active / Continue Story Section */}
          {activeStory && (
            <section className="bg-gray-800/30 border border-gray-700/40 rounded-xl p-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Resume Where You Left Off</h2>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-white">{activeStory.title}</h4>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">{activeStory.content_type}</span>
                </div>
                <Link
                  href={`/dashboard/${activeStory.content_type}`}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Continue &rarr;
                </Link>
              </div>
            </section>
          )}

          {/* Account & Profile Overview Section */}
          <section className="pt-6 border-t border-gray-800 flex justify-between items-center text-sm text-gray-400">
            <div>
              Signed in as <span className="text-white font-medium">{isGuest ? 'Guest Partner' : 'Account Owner'}</span>
            </div>
            <LogoutButton />
          </section>

        </div>
      </div>
    </div>
  )
}
