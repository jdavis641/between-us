import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import InteractionBar from '../../../components/InteractionBar'
import { notFound } from 'next/navigation'

export const revalidate = 0 // dynamically fetch data on every request

type GameParams = {
  params: { id: string }
}

export default async function GameDetail({ params }: GameParams) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: game } = await supabase
    .from('intimacy_games')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!game) {
    notFound()
  }

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
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/dashboard/games" className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors mb-8 inline-flex items-center group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Games Hub
        </Link>
        
        {/* Header Section */}
        <div className="space-y-6 border-b border-zinc-800 pb-10">
          <div className="flex justify-between items-start">
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-zinc-100">{game.title}</h1>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
              {game.category.replace('_', ' ')}
            </span>
          </div>
          
          <div className="flex items-center text-sm font-bold text-red-500 bg-red-950/30 border border-red-900/30 w-fit px-3 py-1.5 rounded-md uppercase tracking-wider">
            {getIntensityBadge(game.intensity)}
          </div>
          
          <p className="text-zinc-400 text-lg leading-relaxed font-light">{game.description}</p>
        </div>

        {/* Rules & Content Section */}
        <div className="space-y-8 py-4">
          <h2 className="text-2xl font-serif font-medium text-zinc-100">How to Play</h2>
          {game.content?.rules ? (
            <ul className="space-y-4">
              {game.content.rules.map((rule: string, index: number) => (
                <li key={index} className="flex space-x-4 bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-sm">
                  <span className="text-red-500 font-bold text-lg leading-none">{index + 1}.</span>
                  <span className="text-zinc-300 font-light leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-500 italic font-light p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed text-center">
              No specific rules provided for this scenario.
            </p>
          )}
        </div>

        {/* The Feedback Loop */}
        <div className="pt-10 border-t border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Rate & Save</h3>
          <InteractionBar contentId={game.id} contentType="game" />
        </div>
      </div>
    </div>
  )
}