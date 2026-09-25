import { createClient } from '@supabase/supabase-js'
import GameList from '@/components/GameList'

export const revalidate = 0

type Game = { id: string, title: string, description: string, category: string, intensity: string }

export default async function GamesHub() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: games, error } = await supabase.from('intimacy_games').select('*')
  if (error) console.error("Error fetching games:", error)
  const cardGames = games?.filter((g: Game) => g.category === 'card' || g.category === 'Card Games') || []
  const movieNightGames = games?.filter((g: Game) => g.category === 'movie' || g.category === 'Movie Night Games') || []
  const drinkingGames = games?.filter((g: Game) => g.category === 'drinking' || g.category === 'Drinking Games') || []
  const dateNightGames = games?.filter((g: Game) => g.category === 'date_night' || g.category === 'Date Night Games') || []
  const sections = [ { title: 'Card Games', id: 'card', data: cardGames }, { title: 'Movie Night Games', id: 'movie', data: movieNightGames }, { title: 'Drinking Games', id: 'drinking', data: drinkingGames }, { title: 'Date Night Games', id: 'date', data: dateNightGames } ]
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 pb-32 font-sans selection:bg-rose-500/30">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-zinc-100">Intimacy Games</h1>
        <p className="text-zinc-400 mb-12 text-lg max-w-2xl font-light leading-relaxed">Select a category to spark a new connection tonight. Hand-picked games designed specifically for your shared boundaries.</p>
        <GameList sections={sections} />
      </div>
    </div>
  )
}
