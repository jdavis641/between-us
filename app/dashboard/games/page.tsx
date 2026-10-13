import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import GameList from '@/components/GameList'

export const revalidate = 0

type Game = { id: string, title: string, description: string, category: string, intensity: string }

export default async function GamesHub() {
  const supabase = await createClient()

  // Fetch authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  let userBaseTolerance: string | null = null

  if (user) {
    // Fetch base_tolerance from intimacy_preferences table
    const { data: preferences } = await supabase
      .from('intimacy_preferences')
      .select('*')
      .eq('user_id', user.id)

    const prefRow = preferences?.find((p: any) => 
      p.category_tag === 'Primary Directive' || 
      p.category_tag === 'Base Tolerance' ||
      p.category_tag === 'base_tolerance'
    )
    userBaseTolerance = prefRow?.preference_level || (prefRow as any)?.base_tolerance || null

    if (!userBaseTolerance) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('base_tolerance')
        .eq('id', user.id)
        .maybeSingle()
      userBaseTolerance = profile?.base_tolerance || null
    }
  }

  const { data: games, error } = await supabase.from('intimacy_games').select('*')
  if (error) console.error("Error fetching games:", error)

  // Strictly filter games where intensity matches the user's base_tolerance
  const filteredGames = userBaseTolerance
    ? (games || []).filter((g: Game) => 
        g.intensity === userBaseTolerance || 
        g.intensity?.toLowerCase() === userBaseTolerance.toLowerCase()
      )
    : (games || [])

  const cardGames = filteredGames.filter((g: Game) => g.category === 'card' || g.category === 'Card Games')
  const movieNightGames = filteredGames.filter((g: Game) => g.category === 'movie' || g.category === 'Movie Night Games')
  const drinkingGames = filteredGames.filter((g: Game) => g.category === 'drinking' || g.category === 'Drinking Games')
  const dateNightGames = filteredGames.filter((g: Game) => g.category === 'date_night' || g.category === 'Date Night Games' || g.category === 'date')
  const sections = [
    { title: 'Card Games', id: 'card', data: cardGames },
    { title: 'Movie Night Games', id: 'movie', data: movieNightGames },
    { title: 'Drinking Games', id: 'drinking', data: drinkingGames },
    { title: 'Date Night Games', id: 'date_night', data: dateNightGames }
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 pb-32 font-sans selection:bg-rose-500/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-zinc-100">Intimacy Games</h1>
          <Link 
            href="/dashboard/settings" 
            className="text-sm font-medium text-rose-400 hover:text-rose-300 underline underline-offset-4 transition-colors"
          >
            Change your tolerance level
          </Link>
        </div>
        <p className="text-zinc-400 mb-12 text-lg max-w-2xl font-light leading-relaxed">
          Select a category to spark a new connection tonight. Hand-picked games designed specifically for your shared boundaries.
          {userBaseTolerance && (
            <span className="block mt-2 text-sm text-zinc-500">
              Showing games strictly matching your tolerance: <span className="font-semibold text-rose-400">{userBaseTolerance}</span>
            </span>
          )}
        </p>
        
        {error && (
          <div className="p-4 bg-red-950 border border-red-500 text-red-500 rounded-lg mb-6">
            Database Error: {error.message} (Code: {error.code})
          </div>
        )}
        
        {!error && filteredGames.length === 0 && (
          <div className="p-4 bg-yellow-950 border border-yellow-500 text-yellow-500 rounded-lg mb-6">
            {userBaseTolerance 
              ? `No games found matching your current tolerance level (${userBaseTolerance}).`
              : 'Connection successful, but 0 games found. Seed required.'}
          </div>
        )}

        <GameList sections={sections} />
      </div>
    </div>
  )
}
