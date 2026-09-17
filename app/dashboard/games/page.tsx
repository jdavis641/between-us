import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const revalidate = 0 // dynamically fetch data on every request to ensure fresh content

type Game = {
  id: string
  title: string
  description: string
  category: string
  intensity: string
}

export default async function GamesHub() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch all games directly on the server
  const { data: games, error } = await supabase.from('intimacy_games').select('*')

  if (error) {
    console.error("Error fetching games:", error)
  }

  // Categorize games
  const cardGames = games?.filter((g: Game) => g.category === 'card' || g.category === 'Card Games') || []
  const movieNightGames = games?.filter((g: Game) => g.category === 'movie' || g.category === 'Movie Night Games') || []
  const drinkingGames = games?.filter((g: Game) => g.category === 'drinking' || g.category === 'Drinking Games') || []
  const dateNightGames = games?.filter((g: Game) => g.category === 'date_night' || g.category === 'Date Night Games') || []

  const sections = [
    { title: 'Card Games', data: cardGames },
    { title: 'Movie Night Games', data: movieNightGames },
    { title: 'Drinking Games', data: drinkingGames },
    { title: 'Date Night Games', data: dateNightGames }
  ]

  const getIntensityBadge = (intensity: string) => {
    switch (intensity) {
      case 'Sensory': return '🔥 Sensory'
      case 'Playful': return '🔥🔥 Playful'
      case 'Intense': return '🔥🔥🔥 Intense'
      case 'Extreme': return '🌶️ Extreme'
      default: return `🔥 ${intensity || 'Sensory'}`
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 pb-32 font-sans selection:bg-rose-500/30">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-zinc-100">Intimacy Games</h1>
        <p className="text-zinc-400 mb-12 text-lg max-w-2xl font-light leading-relaxed">
          Select a category to spark a new connection tonight. Hand-picked games designed specifically for your shared boundaries.
        </p>

        <div className="space-y-16">
          {sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-2xl font-serif font-medium mb-6 text-zinc-200 border-b border-zinc-800 pb-4">
                {section.title}
              </h2>
              {section.data.length === 0 ? (
                <p className="text-zinc-500 italic bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 border-dashed text-center">
                  No games found in this category yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.data.map((game: Game) => (
                    <Link href={`/dashboard/games/${game.id}`} key={game.id} className="block h-full group">
                      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-red-900/50 transition-all duration-300 cursor-pointer h-full flex flex-col shadow-lg hover:shadow-[0_0_20px_rgba(244,63,94,0.1)] hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors">
                            {game.title}
                          </h3>
                        </div>
                        <p className="text-zinc-400 text-sm mb-6 flex-grow leading-relaxed font-light">
                          {game.description}
                        </p>
                        <div className="flex items-center text-xs font-bold text-red-500 bg-red-950/30 border border-red-900/30 w-fit px-3 py-1.5 rounded-md uppercase tracking-wider">
                          {getIntensityBadge(game.intensity)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}