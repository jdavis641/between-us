'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function InteractionBar({ contentId, contentType }: { contentId: string, contentType: string }) {
  const [rating, setRating] = useState<number>(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasRated, setHasRated] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadFavoriteStatus() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
        
        // Only fetch favorite status, as ratings are completely anonymous
        const { data } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('content_id', contentId)
          .single()
        
        if (data) setIsFavorite(true)
      }
    }
    loadFavoriteStatus()
  }, [contentId, supabase])

  const handleFavoriteToggle = async () => {
    if (!userId) return
    const newStatus = !isFavorite
    setIsFavorite(newStatus)

    if (newStatus) {
      await supabase.from('user_favorites').insert({ 
        user_id: userId, 
        content_id: contentId, 
        content_type: contentType 
      })
    } else {
      await supabase.from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId)
    }
  }

  const handleAnonymousRating = async (flame: number) => {
    if (hasRated) return // Prevent spamming anonymous ratings
    setRating(flame)
    setHasRated(true)

    await supabase.from('anonymous_ratings').insert({ 
      content_id: contentId, 
      content_type: contentType,
      flame_rating: flame
    })
  }

  return (
    <div className="flex items-center space-x-6 bg-gray-800 p-4 rounded-lg border border-gray-700 w-full md:w-auto">
      {/* Anonymous Flame Rating System */}
      <div className="flex flex-col">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((flame) => (
            <button 
              key={flame}
              onClick={() => handleAnonymousRating(flame)}
              disabled={hasRated}
              className={`text-2xl transition-transform ${hasRated && rating >= flame ? 'opacity-100' : 'opacity-30 grayscale'} ${!hasRated && 'hover:scale-125 hover:grayscale-0'}`}
              title={`Rate ${flame} Flames`}
            >
              🔥
            </button>
          ))}
        </div>
        {hasRated && <span className="text-xs text-gray-500 mt-1">Anonymous rating sent</span>}
      </div>

      <div className="w-px h-8 bg-gray-600"></div>

      {/* Account-Linked Favorite Toggle */}
      <button 
        onClick={handleFavoriteToggle}
        className={`text-sm font-bold px-4 py-2 rounded transition-colors ${isFavorite ? 'bg-red-900 text-red-400 border border-red-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
      >
        {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
      </button>
    </div>
  )
}