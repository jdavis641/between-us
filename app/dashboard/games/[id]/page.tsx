'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import InteractionBar from '../../../components/InteractionBar'

export default function GameDetail({ params }: { params: { id: string } }) {
  const [game, setGame] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchGame() {
      const { data } = await supabase
        .from('intimacy_games')
        .select('*')
        .eq('id', params.id)
        .single()

      if (data) setGame(data)
      setLoading(false)
    }
    fetchGame()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading experience...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center space-y-4">
        <p className="text-red-500 text-xl font-bold">Game not found.</p>
        <Link href="/dashboard/games" className="text-blue-500 hover:underline">Return to Games Hub</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12 pb-32">
      <Link href="/dashboard/games" className="text-sm text-gray-400 hover:text-white transition-colors mb-8 inline-block">
        &larr; Back to Games Hub
      </Link>
      
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-4 border-b border-gray-800 pb-8">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl md:text-5xl font-bold">{game.title}</h1>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-800 px-3 py-1 rounded">
              {game.category.replace('_', ' ')}
            </span>
          </div>
          
          <div className="flex items-center text-sm font-semibold text-yellow-500">
            {game.intensity === 'Sensory' ? '🔥 Sensory' : 
             game.intensity === 'Playful' ? '🔥🔥 Playful' : 
             '🔥🔥🔥 Intense'}
          </div>
          
          <p className="text-gray-300 text-lg leading-relaxed">{game.description}</p>
        </div>

        {/* Rules & Content Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-100">How to Play</h2>
          {game.content?.rules ? (
            <ul className="space-y-4">
              {game.content.rules.map((rule: string, index: number) => (
                <li key={index} className="flex space-x-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <span className="text-blue-500 font-bold">{index + 1}.</span>
                  <span className="text-gray-300">{rule}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No specific rules provided for this scenario.</p>
          )}
        </div>

        {/* The Feedback Loop */}
        <div className="pt-8 border-t border-gray-800">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Rate & Save</h3>
          <InteractionBar contentId={game.id} contentType="game" />
        </div>
      </div>
    </div>
  )
}