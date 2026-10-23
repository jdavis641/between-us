import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import MovieGameGenerator from '@/components/MovieGameGenerator'
import InteractionBar from '../../../components/InteractionBar'
import { FALLBACK_GAMES } from '@/lib/games-catalog'

export const revalidate = 0 // dynamically fetch data on every request

type GameParams = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function GameDetail({ params }: GameParams) {
  let game: any = null;

  try {
    const resolvedParams = await Promise.resolve(params);
    const gameId = resolvedParams?.id;

    if (gameId) {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('intimacy_games')
          .select('*')
          .eq('id', gameId)
          .maybeSingle();

        if (data && !error) {
          game = data;
        } else {
          // Fallback matching by title / slug
          const cleanSearch = String(gameId).replace(/[-_]/g, ' ');
          const { data: byTitle } = await supabase
            .from('intimacy_games')
            .select('*')
            .ilike('title', `%${cleanSearch}%`)
            .limit(1)
            .maybeSingle();
          if (byTitle) game = byTitle;
        }
      } catch (dbErr) {
        console.warn("GameDetail Supabase fetch error:", dbErr);
      }

      // If not found in database or error occurred, resolve from FALLBACK_GAMES catalog
      if (!game) {
        const normalizedId = String(gameId).toLowerCase().replace(/[-_]/g, '');
        game = FALLBACK_GAMES.find(g => 
          g.id === gameId || 
          g.id.toLowerCase().replace(/[-_]/g, '') === normalizedId ||
          g.title.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedId ||
          g.title.toLowerCase().includes(String(gameId).toLowerCase().replace(/[-_]/g, ' '))
        ) || null;
      }
    }
  } catch (err) {
    console.error("GameDetail server fetch error:", err);
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 flex flex-col items-center justify-center">
        <p className="text-zinc-400 text-lg mb-4">Game not found.</p>
        <Link href="/dashboard/games" className="text-red-400 hover:text-red-300 underline">&larr; Back to Games Hub</Link>
      </div>
    );
  }

  // Safely parse rules as an array with fallback UI to prevent mapping crashes
  let parsedRules: string[] = [];
  try {
    let contentObj = game.content;
    if (typeof contentObj === 'string') {
      try {
        contentObj = JSON.parse(contentObj);
      } catch {}
    }
    if (Array.isArray(contentObj?.rules)) {
      parsedRules = contentObj.rules;
    } else if (Array.isArray(contentObj)) {
      parsedRules = contentObj;
    } else if (typeof contentObj?.rules === 'string') {
      parsedRules = [contentObj.rules];
    }
  } catch (parseErr) {
    console.error("Error parsing game rules array:", parseErr);
  }

  const getIntensityBadge = (intensity: string) => {
    switch (intensity) {
      case 'Sensory': return 'Sensory'
      case 'Playful': return 'Playful'
      case 'Intense': return 'Intense'
      case 'Extreme': return 'Extreme'
      default: return intensity || 'Sensory'
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
              {game.category ? game.category.replace('_', ' ') : 'Game'}
            </span>
          </div>
          
          <div className="flex items-center text-sm font-bold text-red-500 bg-red-950/30 border border-red-900/30 w-fit px-3 py-1.5 rounded-md uppercase tracking-wider">
            {getIntensityBadge(game.intensity)}
          </div>
          
          <p className="text-zinc-400 text-lg leading-relaxed font-light">{game.description}</p>
        </div>

        {game.category === 'movie' && <MovieGameGenerator gameTitle={game.title} />}
        
        {/* Rules & Content Section */}
        <div
          className="space-y-8 py-4 select-none"
          onCopy={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <h2 className="text-2xl font-serif font-medium text-zinc-100">How to Play</h2>
          {parsedRules && parsedRules.length > 0 ? (
            <ol className="space-y-4 list-decimal list-inside">
              {parsedRules.map((rule: string, index: number) => (
                <li key={index} className="flex space-x-4 bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-sm">
                  <span className="text-red-500 font-bold text-lg leading-none">{index + 1}.</span>
                  <span className="text-zinc-300 font-light leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-zinc-400 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed text-center">
              <p className="font-medium text-zinc-300">No rules found.</p>
              <p className="text-sm text-zinc-500 mt-1">No specific rules or instructions could be parsed for this scenario.</p>
            </div>
          )}
        </div>

        {/* The Feedback Loop */}
        <div className="pt-10 border-t border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Rate & Save</h3>
          {game && <InteractionBar contentId={game.id} contentType="game" />}
        </div>
      </div>
    </div>
  )
}
