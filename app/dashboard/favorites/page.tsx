'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

const supabase = createClient()

interface FavoriteItem {
  id: string
  title: string
  content_type: string
  body?: string
  created_at?: string
  play_mode?: string
  tolerance_tier?: string
  theme_tags?: string
  excerpt?: string
}

export default function FavoritesHubPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'roleplay' | 'literature' | 'game'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadFavorites() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          window.location.href = '/login'
          return
        }

        const userId = session.user.id
        const itemsMap = new Map<string, FavoriteItem>()

        // 1. Fetch from generated_content where is_favorite = true or theme_tags has [favorite]
        const { data: genData, error: genError } = await supabase
          .from('generated_content')
          .select('id, title, content_type, body, created_at, play_mode, tolerance_tier, theme_tags, is_favorite')
          .eq('user_id', userId)
          .or('is_favorite.eq.true,theme_tags.ilike.%[favorite]%')
          .order('created_at', { ascending: false })

        if (genData) {
          genData.forEach(item => {
            let excerpt = ''
            if (item.body) {
              try {
                const parsed = JSON.parse(item.body.replace(/```json|```/g, '').trim())
                excerpt = parsed.overview || parsed.partnerAPerspective || parsed.body || ''
                if (typeof excerpt === 'string') {
                  excerpt = excerpt.slice(0, 160).replace(/[#*`_]/g, '').trim() + '...'
                }
              } catch {
                excerpt = String(item.body).slice(0, 160).replace(/[#*`_]/g, '').trim() + '...'
              }
            }

            itemsMap.set(item.id, {
              id: item.id,
              title: item.title || 'Untitled Experience',
              content_type: item.content_type || 'roleplay',
              body: item.body,
              created_at: item.created_at,
              play_mode: item.play_mode,
              tolerance_tier: item.tolerance_tier,
              theme_tags: item.theme_tags,
              excerpt
            })
          })
        }

        // 2. Cross-reference user_favorites table for favorited IDs
        try {
          const { data: favRows } = await supabase
            .from('user_favorites')
            .select('content_id, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (favRows && favRows.length > 0) {
            const missingIds = favRows
              .map(f => f.content_id)
              .filter(id => !itemsMap.has(id))

            if (missingIds.length > 0) {
              const { data: missingContent } = await supabase
                .from('generated_content')
                .select('id, title, content_type, body, created_at, play_mode, tolerance_tier, theme_tags')
                .in('id', missingIds)

              if (missingContent) {
                missingContent.forEach(item => {
                  let excerpt = ''
                  if (item.body) {
                    try {
                      const parsed = JSON.parse(item.body.replace(/```json|```/g, '').trim())
                      excerpt = parsed.overview || parsed.partnerAPerspective || parsed.body || ''
                      if (typeof excerpt === 'string') {
                        excerpt = excerpt.slice(0, 160).replace(/[#*`_]/g, '').trim() + '...'
                      }
                    } catch {
                      excerpt = String(item.body).slice(0, 160).replace(/[#*`_]/g, '').trim() + '...'
                    }
                  }

                  itemsMap.set(item.id, {
                    id: item.id,
                    title: item.title || 'Untitled Experience',
                    content_type: item.content_type || 'roleplay',
                    body: item.body,
                    created_at: item.created_at,
                    play_mode: item.play_mode,
                    tolerance_tier: item.tolerance_tier,
                    theme_tags: item.theme_tags,
                    excerpt
                  })
                })
              }
            }
          }
        } catch (favErr) {
          // user_favorites table might not be queried or populated yet
        }

        const sortedFavorites = Array.from(itemsMap.values()).sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });

        setFavorites(sortedFavorites)
      } catch (err) {
        console.error('Error loading favorites:', err)
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [])

  const handleRemoveFavorite = async (id: string, title: string) => {
    setTogglingId(id)
    const originalFavorites = [...favorites]

    // Optimistic removal
    setFavorites(prev => prev.filter(f => f.id !== id))
    setToast(`Removed "${title}" from favorites`)
    setTimeout(() => setToast(null), 3500)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          contentId: id,
          isFavorite: false
        })
      })

      if (!res.ok) {
        throw new Error('Failed to remove favorite')
      }
    } catch (err) {
      console.error('Error removing favorite:', err)
      // Revert optimistic update
      setFavorites(originalFavorites)
      setToast('Failed to update favorite status. Please try again.')
      setTimeout(() => setToast(null), 3500)
    } finally {
      setTogglingId(null)
    }
  }

  const filteredFavorites = favorites.filter(item => {
    // Filter by category
    if (filter === 'roleplay' && item.content_type !== 'roleplay') return false
    if (filter === 'literature' && item.content_type !== 'literature' && item.content_type !== 'midweek_story') return false
    if (filter === 'game' && item.content_type !== 'game') return false

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesTitle = item.title?.toLowerCase().includes(q)
      const matchesExcerpt = item.excerpt?.toLowerCase().includes(q)
      const matchesTags = item.theme_tags?.toLowerCase().includes(q)
      if (!matchesTitle && !matchesExcerpt && !matchesTags) return false
    }

    return true
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-rose-500/30">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-12">
        
        {/* Navigation & Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1 mb-6"
          >
            &larr; Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">❤️</span>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-zinc-100">
                  Your Favorites
                </h1>
              </div>
              <p className="text-zinc-400 text-base md:text-lg font-light leading-relaxed max-w-2xl">
                Revisit and replay your saved scenarios, erotic literature, and preferred intimacy experiences in one curated hub.
              </p>
            </div>

            <div className="text-sm text-zinc-500 font-mono">
              {favorites.length} {favorites.length === 1 ? 'saved experience' : 'saved experiences'}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Filter Tabs */}
          <div className="flex items-center bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({favorites.length})
            </button>
            <button
              onClick={() => setFilter('roleplay')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'roleplay'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Roleplay ({favorites.filter(f => f.content_type === 'roleplay').length})
            </button>
            <button
              onClick={() => setFilter('literature')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'literature'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Literature ({favorites.filter(f => f.content_type === 'literature' || f.content_type === 'midweek_story').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search favorites..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-700/60 transition-colors"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="animate-spin text-3xl mb-4">⌛</div>
            <p className="text-zinc-500 font-serif italic text-lg">Loading your saved favorites...</p>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-10 md:p-16 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-zinc-800/80 rounded-full flex items-center justify-center mx-auto text-3xl border border-zinc-700">
              ❤️
            </div>
            
            {favorites.length === 0 ? (
              <>
                <h3 className="text-2xl font-serif font-bold text-zinc-200">
                  No Favorites Saved Yet
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  When you discover a scenario or literature piece you love, click the <span className="text-rose-400 font-semibold">Favorite</span> button while reading to save it here for instant replay.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <Link
                    href="/dashboard/roleplay"
                    className="px-5 py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-900/60 rounded-xl text-sm font-medium transition-all"
                  >
                    Explore Roleplay Scenarios
                  </Link>
                  <Link
                    href="/dashboard/literature"
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-sm font-medium transition-all"
                  >
                    Generate Literature
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-serif font-bold text-zinc-200">
                  No Matching Favorites Found
                </h3>
                <p className="text-zinc-400 text-sm">
                  Try adjusting your search terms or selecting a different category filter.
                </p>
                <button
                  onClick={() => { setFilter('all'); setSearchQuery(''); }}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm hover:bg-zinc-700 transition-colors"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map(item => {
              const isRoleplay = item.content_type === 'roleplay'
              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : null

              return (
                <div
                  key={item.id}
                  className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-rose-900/50 hover:bg-zinc-900/90 transition-all shadow-lg group relative"
                >
                  <div>
                    {/* Top row: badge + un-favorite button */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                        isRoleplay
                          ? 'bg-red-950/40 text-red-400 border-red-900/40'
                          : 'bg-rose-950/40 text-rose-300 border-rose-900/40'
                      }`}>
                        {isRoleplay ? 'Roleplay' : 'Literature'}
                      </span>

                      <button
                        onClick={() => handleRemoveFavorite(item.id, item.title)}
                        disabled={togglingId === item.id}
                        className="text-rose-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remove from favorites"
                      >
                        <span className="text-lg">❤️</span>
                      </button>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-serif font-bold text-zinc-100 group-hover:text-rose-200 transition-colors mb-2.5 line-clamp-2">
                      {item.title}
                    </h2>

                    {/* Excerpt */}
                    {item.excerpt && (
                      <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3 font-light">
                        {item.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Metadata and Action */}
                  <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between mt-auto">
                    <span className="text-xs text-zinc-500 font-mono">
                      {formattedDate || 'Saved'}
                    </span>

                    <Link
                      href={`/dashboard/experience/${item.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-400 group-hover:text-rose-300 transition-colors"
                    >
                      Read Now &rarr;
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
            <span className="text-rose-400 text-lg">❤️</span>
            <span className="text-sm font-medium text-zinc-200">{toast}</span>
          </div>
        )}

      </div>
    </main>
  )
}
