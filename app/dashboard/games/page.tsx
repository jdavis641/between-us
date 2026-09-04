'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default function GamesHub() {
  const [games, setGames] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('all')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchGames() {
      let query = supabase.from('intimacy_games').select('*')
      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory)
      }
      const { data } = await query
      if (data) setGames(data)
    }
    fetchGames()
  }, [activeCategory, supabase])

  const categories = [
    { id: 'all', label: 'All Games' },
    { id: 'card', label: 'Card Games' },
    { id: 'movie', label: 'Movie Night' },
    { id: 'drinking', label: 'Drinking Games' },
    { id: 'date_night', label: 'Date Night' }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      <h1 className="text-3xl font-bold mb-2">Intimacy Games</h1>
      <p className="text-gray-400 mb-8">Select a category to spark a new connection tonight.</p>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-semibold transition-colors ${
              activeCategory === cat.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map(game => (
          <Link href={`/dashboard/games/${game.id}`} key={game.id}>
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl hover:border-blue-500 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{game.title}</h3>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-900 px-2 py-1 rounded">
                  {game.category.replace('_', ' ')}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{game.description}</p>
              <div className="flex items-center text-sm font-semibold text-yellow-500">
                {/* Intensity display based on the database flag */}
                {game.intensity === 'Sensory' ? '🔥 Sensory' : 
                 game.intensity === 'Playful' ? '🔥🔥 Playful' : 
                 '🔥🔥🔥 Intense'}
              </div>
            </div>
          </Link>
        ))}
        
        {games.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 italic">
            No games found in this category.
          </div>
        )}
      </div>
    </div>
  )
}