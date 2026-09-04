'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default function DashboardHome() {
  const [activeStory, setActiveStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
      }
      setLoading(false)
    }
    fetchActiveContent()
  }, [supabase])

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
              <p className="text-gray-400 text-sm">Your AI Game Master is preparing your next scenario.</p>
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
      </div>
    </div>
  )
}
