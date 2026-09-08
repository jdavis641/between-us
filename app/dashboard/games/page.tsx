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
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12 pb-32">
      <h1 className="text-3xl md:text-5xl font-bold mb-4">Intimacy Games</h1>
      <p className="text-gray-400 mb-12 text-lg max-w-2xl">
        Select a category to spark a new connection tonight. Hand-picked games designed specifically for your shared boundaries.
      </p>

      <div className="space-y-16">
        {sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-2xl font-bold mb-6 text-gray-200 border-b border-gray-800 pb-3">
              {section.title}
            </h2>
            {section.data.length === 0 ? (
              <p className="text-gray-500 italic bg-gray-800/50 p-6 rounded-xl border border-gray-800 border-dashed text-center">
                No games found in this category yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.data.map((game: Game) => (
                  <Link href={`/dashboard/games/${game.id}`} key={game.id} className="block h-full">
                    <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl hover:border-blue-500 transition-colors cursor-pointer group h-full flex flex-col shadow-lg hover:shadow-blue-900/20">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">
                          {game.title}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                        {game.description}
                      </p>
                      <div className="flex items-center text-sm font-bold text-yellow-500 bg-yellow-900/20 w-fit px-3 py-1.5 rounded-md">
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
  )
}