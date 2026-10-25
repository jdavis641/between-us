import { createClient as createAdminClient } from '@supabase/supabase-js'
import Link from 'next/link'
import MovieGameGenerator from '@/components/MovieGameGenerator'
import InteractionBar from '@/components/InteractionBar'
import { FALLBACK_GAMES } from '@/lib/games-catalog'

export const revalidate = 0 // dynamically fetch data on every request

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: key && key !== 'placeholder' ? { apikey: key } : {}
    }
  });
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GameDetailPage({ params }: PageProps) {
  try {
    const { id } = await params;
    const gameId = id?.trim();

    let game: any = null;

    if (gameId) {
      try {
        const supabase = getAdminSupabase();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gameId);

        // 1. Target public.intimacy_games by exact UUID if valid
        if (isUuid) {
          const { data, error } = await supabase
            .from('intimacy_games')
            .select('*')
            .eq('id', gameId)
            .maybeSingle();

          if (data && !error) {
            game = data;
          }
        }

        // 2. Fallback matching by title or slug in database
        if (!game) {
          const cleanSearch = String(gameId).replace(/[-_]/g, ' ').trim();
          const { data: byTitle } = await supabase
            .from('intimacy_games')
            .select('*')
            .ilike('title', `%${cleanSearch}%`)
            .limit(1)
            .maybeSingle();
          if (byTitle) game = byTitle;
        }
      } catch (dbErr) {
        console.warn("GameDetailPage Supabase fetch error:", dbErr);
      }

      // 3. Fallback to catalog if database row not found
      if (!game) {
        const normalizedId = String(gameId).toLowerCase().replace(/[-_]/g, '');
        const cleanSearch = String(gameId).replace(/[-_]/g, ' ').trim().toLowerCase();
        game = FALLBACK_GAMES.find(g => 
          g.id === gameId || 
          g.id.toLowerCase().replace(/[-_]/g, '') === normalizedId ||
          g.title.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedId ||
          g.title.toLowerCase().includes(cleanSearch)
        ) || null;
      }
    }

    if (!game) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 flex flex-col items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4">
            <h2 className="text-xl font-medium text-zinc-200">Game Not Found</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The game you are looking for does not exist or has been relocated.
            </p>
            <Link 
              href="/dashboard/games" 
              className="inline-block text-sm text-rose-400 hover:text-rose-300 underline font-medium transition-colors"
            >
              &larr; Back to Games Hub
            </Link>
          </div>
        </div>
      );
    }

    // Safely parse rules from content.rules, array, or text format
    let parsedRules: string[] = [];
    try {
      let contentObj = game.content;
      if (typeof contentObj === 'string') {
        try {
          contentObj = JSON.parse(contentObj);
        } catch {
          if (contentObj.includes('\n')) {
            parsedRules = contentObj.split('\n').map((r: string) => r.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
          } else if (contentObj.trim().length > 0) {
            parsedRules = [contentObj.trim()];
          }
        }
      }

      if (parsedRules.length === 0 && contentObj) {
        if (Array.isArray(contentObj?.rules)) {
          parsedRules = contentObj.rules;
        } else if (Array.isArray(contentObj?.steps)) {
          parsedRules = contentObj.steps;
        } else if (Array.isArray(contentObj?.instructions)) {
          parsedRules = contentObj.instructions;
        } else if (Array.isArray(contentObj)) {
          parsedRules = contentObj;
        } else if (typeof contentObj?.rules === 'string') {
          parsedRules = contentObj.rules.split('\n').map((r: string) => r.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
        } else if (typeof contentObj?.how_to_play === 'string') {
          parsedRules = contentObj.how_to_play.split('\n').map((r: string) => r.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
        }
      }

      if (parsedRules.length === 0 && Array.isArray(game.rules)) {
        parsedRules = game.rules;
      }

      // Robust fallback if malformed or empty
      if (parsedRules.length === 0) {
        if (game.description) {
          parsedRules = [
            game.description,
            "Take turns following the prompts or actions designated for this experience.",
            "Maintain open communication and respect all established boundaries throughout."
          ];
        } else {
          parsedRules = [
            "Set aside uninterrupted time in a comfortable, private setting.",
            "Take turns initiating each phase of the game at your own pace.",
            "Check in frequently to adapt intensity to your shared comfort level."
          ];
        }
      }
    } catch (parseErr) {
      console.error("Error parsing game rules array:", parseErr);
      parsedRules = [
        "Set aside uninterrupted time in a comfortable, private setting.",
        "Take turns initiating each phase of the game at your own pace.",
        "Check in frequently to adapt intensity to your shared comfort level."
      ];
    }

    const getIntensityBadge = (intensity?: string) => {
      switch (intensity?.toLowerCase()) {
        case 'sensory': return '🌱 Sensory';
        case 'playful': return '🌶️ Playful';
        case 'intense': return '🔥 Intense';
        case 'extreme': return '🧨 Extreme';
        default: return intensity ? `🌱 ${intensity}` : '🌱 Sensory';
      }
    };

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
                {game.category ? String(game.category).replace('_', ' ') : 'Game'}
              </span>
            </div>
            
            <div className="flex items-center text-sm font-bold text-red-500 bg-red-950/30 border border-red-900/30 w-fit px-3 py-1.5 rounded-md uppercase tracking-wider">
              {getIntensityBadge(game.intensity)}
            </div>
            
            <p className="text-zinc-400 text-lg leading-relaxed font-light">{game.description}</p>
          </div>

          {game.category === 'movie' && <MovieGameGenerator gameTitle={game.title} />}
          
          {/* Rules & Content Section */}
          <div className="space-y-8 py-4 select-none">
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
            {game && <InteractionBar contentId={game.id} contentType="game" contentTitle={game.title} />}
          </div>
        </div>
      </div>
    );
  } catch (pageErr) {
    console.error("Unhandled error in GameDetailPage:", pageErr);
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 flex flex-col items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-medium text-zinc-200">Game Temporarily Unavailable</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            We encountered an issue loading this scenario. Please return to the games library.
          </p>
          <Link 
            href="/dashboard/games" 
            className="inline-block text-sm text-rose-400 hover:text-rose-300 underline font-medium transition-colors"
          >
            &larr; Back to Games Hub
          </Link>
        </div>
      </div>
    );
  }
}
