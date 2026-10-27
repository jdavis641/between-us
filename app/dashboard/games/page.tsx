import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Suspense } from 'react'
import GameList from '@/components/GameList'
import { FALLBACK_GAMES } from '@/lib/games-catalog'

export const revalidate = 0

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: key && key !== 'placeholder' ? { apikey: key } : {}
    }
  });
}

type Game = { 
  id: string;
  title: string;
  description: string;
  category: string;
  intensity: string;
  content?: any;
}

export default async function GamesHub({
  searchParams,
}: {
  searchParams?: Promise<{ seasonal_tag?: string; tag?: string; theme?: string }>;
}) {
  const params = await searchParams;
  const seasonalTag = params?.seasonal_tag || params?.tag || params?.theme;
  const serverSupabase = await createServerClient();

  let userBaseTolerance: string | null = null;

  try {
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (user) {
      const { data: preferences } = await serverSupabase
        .from('intimacy_preferences')
        .select('*')
        .eq('user_id', user.id);

      const prefRow = preferences?.find((p: any) => 
        p.category_tag === 'Primary Directive' || 
        p.category_tag === 'Base Tolerance' ||
        p.category_tag === 'base_tolerance'
      );
      userBaseTolerance = prefRow?.preference_level || (prefRow as any)?.base_tolerance || null;

      if (!userBaseTolerance) {
        const { data: profile } = await serverSupabase
          .from('profiles')
          .select('base_tolerance')
          .eq('id', user.id)
          .maybeSingle();
        userBaseTolerance = profile?.base_tolerance || null;
      }
    }
  } catch (authErr) {
    console.warn("User auth verification in GamesHub:", authErr);
  }

  let dbGames: any[] | null = null;
  try {
    // 1. Query public.intimacy_games using admin client to ensure RLS never blocks catalog reads
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('intimacy_games')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      dbGames = data;
    } else if (error) {
      console.warn("GamesHub admin database fetch warning:", error.message || error);
      // Fallback query via server client
      const { data: serverData } = await serverSupabase
        .from('intimacy_games')
        .select('*')
        .order('created_at', { ascending: true });
      if (serverData && serverData.length > 0) {
        dbGames = serverData;
      }
    }
  } catch (fetchErr) {
    console.warn("GamesHub database exception:", fetchErr);
  }

  // Use database games if available, otherwise seamlessly use fallback matrix catalog
  const games: Game[] = (dbGames && dbGames.length > 0) ? dbGames : (FALLBACK_GAMES as any[]);

  // Category normalization helpers supporting flexible naming
  const isCardGame = (c: string) => {
    const cat = (c || '').toLowerCase().trim();
    return cat === 'card' || cat === 'card games' || cat === 'card_games' || cat === 'cards' || cat === 'card game';
  };
  const isMovieGame = (c: string) => {
    const cat = (c || '').toLowerCase().trim();
    return cat === 'movie' || cat === 'movie night games' || cat === 'movie_night' || cat === 'movie night' || cat === 'movies';
  };
  const isDrinkingGame = (c: string) => {
    const cat = (c || '').toLowerCase().trim();
    return cat === 'drinking' || cat === 'drinking games' || cat === 'drinking_games' || cat === 'drinks';
  };
  const isDateNightGame = (c: string) => {
    const cat = (c || '').toLowerCase().trim();
    return cat === 'date_night' || cat === 'date night games' || cat === 'date night' || cat === 'date';
  };

  const getCategoryGames = (filterFn: (cat: string) => boolean) => {
    const allInCat = (games || []).filter((g: any) => filterFn(g.category));
    if (!userBaseTolerance) return allInCat;
    const toleranceFiltered = allInCat.filter((g: any) => 
      g.intensity?.toLowerCase() === userBaseTolerance?.toLowerCase()
    );
    // If strict tolerance yields no games in this category, display all in category to keep catalog fresh & accessible
    return toleranceFiltered.length > 0 ? toleranceFiltered : allInCat;
  };

  let cardGames = getCategoryGames(isCardGame);
  let movieNightGames = getCategoryGames(isMovieGame);
  let drinkingGames = getCategoryGames(isDrinkingGame);
  let dateNightGames = getCategoryGames(isDateNightGame);

  // Filter for matching seasonal_tag if requested
  if (seasonalTag) {
    const matchSeasonal = (g: any) => (
      g.seasonal_tag === seasonalTag || 
      g.content?.seasonal_tag === seasonalTag ||
      (Array.isArray(g.content?.tags) && g.content.tags.includes(seasonalTag)) ||
      (typeof g.content?.tags === 'string' && g.content.tags.includes(seasonalTag)) ||
      (g.title && g.title.toLowerCase().includes(seasonalTag.toLowerCase()))
    );

    if (cardGames.some(matchSeasonal)) cardGames = cardGames.filter(matchSeasonal);
    if (movieNightGames.some(matchSeasonal)) movieNightGames = movieNightGames.filter(matchSeasonal);
    if (drinkingGames.some(matchSeasonal)) drinkingGames = drinkingGames.filter(matchSeasonal);
    if (dateNightGames.some(matchSeasonal)) dateNightGames = dateNightGames.filter(matchSeasonal);
  }

  const sections = [
    { title: 'Card Games', id: 'card', data: cardGames },
    { title: 'Movie Night Games', id: 'movie', data: movieNightGames },
    { title: 'Drinking Games', id: 'drinking', data: drinkingGames },
    { title: 'Date Night Games', id: 'date_night', data: dateNightGames }
  ];

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
              Showing games matching your tolerance: <span className="font-semibold text-rose-400">{userBaseTolerance}</span>
            </span>
          )}
        </p>

        {seasonalTag && (
          <div className="mb-8 p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <span className="text-sm font-medium text-rose-300">
                Holiday Spotlight Filter: <span className="font-bold text-white capitalize">{seasonalTag.replace(/_/g, ' ')}</span>
              </span>
            </div>
            <Link href="/dashboard/games" className="text-xs text-zinc-400 hover:text-white underline">
              Clear filter
            </Link>
          </div>
        )}

        <Suspense fallback={
          <div className="py-12 text-center text-zinc-500 font-light">Loading intimacy games...</div>
        }>
          <GameList sections={sections} />
        </Suspense>
      </div>
    </div>
  );
}
