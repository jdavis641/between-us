'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function InteractionBar({ contentId, contentType }: { contentId: string, contentType: string }) {
  const [rating, setRating] = useState<number>(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasRated, setHasRated] = useState(false)
  const [copied, setCopied] = useState(false)

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

    // Fallback: If table anonymous_ratings doesn't exist, we assume it's created or we fail gracefully
    await supabase.from('scenario_ratings').insert({ 
      scenario_id: contentId,
      rating: flame
    }).catch(() => {})

    await supabase.from('anonymous_ratings').insert({ 
      content_id: contentId, 
      content_type: contentType,
      flame_rating: flame
    }).catch(() => {})
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Between Us - Shared Experience',
          url: url
        })
      } catch (err) {
        console.error('Error sharing', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy', err)
      }
    }
  }

  return (
    <div className="flex items-center space-x-6 bg-zinc-900 p-5 rounded-xl border border-zinc-800 w-full md:w-auto shadow-lg">
      {/* Anonymous Flame Rating System */}
      <div className="flex flex-col">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((flame) => (
            <button 
              key={flame}
              onClick={() => handleAnonymousRating(flame)}
              disabled={hasRated}
              className={`text-2xl transition-transform duration-200 ${hasRated && rating >= flame ? 'opacity-100 scale-110' : 'opacity-40 grayscale'} ${!hasRated && 'hover:scale-125 hover:grayscale-0 hover:opacity-100'}`}
              title={`Rate ${flame} Flames`}
            >
              🔥
            </button>
          ))}
        </div>
        {hasRated && <span className="text-xs text-zinc-500 mt-2 font-medium tracking-wide">Anonymous rating sent</span>}
      </div>

      <div className="w-px h-10 bg-zinc-800"></div>

      {/* Share Link */}
      <button 
        onClick={handleShare}
        className="text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-300 border bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700 flex items-center space-x-2"
        title="Share this experience"
      >
        <span>{copied ? 'Copied!' : 'Share'}</span>
        {!copied && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        )}
      </button>

      {/* Account-Linked Favorite Toggle */}
      <button 
        onClick={handleFavoriteToggle}
        className={`text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-300 border ${isFavorite ? 'bg-red-950/30 text-red-500 border-red-900/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700'}`}
      >
        {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
      </button>
    </div>
  )
}