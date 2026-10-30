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
  seasonal_tag?: string;
}

function formatKinkModifierRule(kinks: string[], tolerance?: string | null): string {
  const joinedKinks = kinks.slice(0, 3).join(', ');
  const tier = (tolerance || '').toLowerCase().trim();
  if (tier === 'sensory') {
    return `🃏 Wildcard / Sensory Dare: Draw this card to explore ${joinedKinks} with gentle, feather-light sensory touch, warm breath, and lingering eye contact.`;
  }
  if (tier === 'playful') {
    return `🃏 Wildcard / Playful Dare: Draw this card to assign a playful dare or forfeit incorporating ${joinedKinks} (suggestive teasing, fun role reversal, or light touch challenges).`;
  }
  if (tier === 'intense') {
    return `🃏 Wildcard / Intense Penalty: The drawing partner must execute or submit to ${joinedKinks} as an explicit physical penalty or direct command sequence.`;
  }
  if (tier === 'extreme') {
    return `🃏 Wildcard / Extreme Forfeit: Complete physical surrender centering on ${joinedKinks} under absolute command with zero hesitation or refusal.`;
  }
  return `🃏 Wildcard / Custom Modifier: Incorporate ${joinedKinks} as a custom dare or physical penalty tailored to your comfort level.`;
}

function injectKinksIntoGame(game: Game, userKinks: string[], tolerance?: string | null): Game {
  if (!userKinks || userKinks.length === 0) return game;
  const modifierRule = formatKinkModifierRule(userKinks, tolerance);

  let contentObj = game.content;
  if (typeof contentObj === 'string') {
    try {
      contentObj = JSON.parse(contentObj);
    } catch {
      contentObj = { rules: [contentObj] };
    }
  }

  let rules: string[] = [];
  if (Array.isArray(contentObj?.rules)) {
    rules = [...contentObj.rules];
  } else if (Array.isArray(contentObj)) {
    rules = [...contentObj];
  } else if (contentObj && typeof contentObj === 'object') {
    rules = Array.isArray(contentObj.steps) ? [...contentObj.steps] : [];
  }

  // Ensure modifier rule is not already present
  if (!rules.some(r => r.includes('🃏 Wildcard'))) {
    rules.push(modifierRule);
  }

  return {
    ...game,
    content: {
      ...(typeof contentObj === 'object' && contentObj !== null ? contentObj : {}),
      rules
    }
  };
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
  let userKinks: string[] = [];

  try {
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (user) {
      // 1. Primary query: authenticated user's active base_tolerance from public.profiles
      const { data: profile } = await serverSupabase
        .from('profiles')
        .select('base_tolerance')
        .eq('id', user.id)
        .maybeSingle();

      userBaseTolerance = profile?.base_tolerance || null;

      // 2. Query custom kinks from public.intimacy_preferences.kinks_override
      const { data: preferences } = await serverSupabase
        .from('intimacy_preferences')
        .select('category_tag, preference_level, kinks_override')
        .eq('user_id', user.id)
        .neq('category_tag', 'Guest Pass Config');

      // Fallback base_tolerance if not found in profiles
      if (!userBaseTolerance && preferences) {
        const prefRow = preferences.find((p: any) => 
          p.category_tag === 'Primary Directive' || 
          p.category_tag === 'Base Tolerance' ||
          p.category_tag === 'base_tolerance'
        );
        userBaseTolerance = prefRow?.preference_level || (prefRow as any)?.base_tolerance || null;
      }

      const kinkRow = preferences?.find((p: any) => p.category_tag === 'Primary Directive' && p.kinks_override)
        || preferences?.find((p: any) => p.kinks_override);

      if (kinkRow?.kinks_override) {
        try {
          const parsed = JSON.parse(kinkRow.kinks_override);
          if (Array.isArray(parsed)) {
            userKinks = parsed.map((k: any) => typeof k === 'string' ? k : (k?.text || '')).filter(Boolean);
          } else if (parsed && typeof parsed === 'object' && parsed.kinks) {
            userKinks = Array.isArray(parsed.kinks) ? parsed.kinks : [String(parsed.kinks)];
          } else if (typeof parsed === 'string') {
            userKinks = [parsed];
          }
        } catch {
          if (typeof kinkRow.kinks_override === 'string') {
            userKinks = kinkRow.kinks_override.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
          }
        }
      }
    }
  } catch (authErr) {
    console.warn("User auth verification in GamesHub:", authErr);
  }

  let dbGames: any[] | null = null;
  try {
    // 1. Query public.intimacy_games using admin client to ensure RLS never blocks catalog reads
    const adminClient = getAdminClient();
    let query = adminClient
      .from('intimacy_games')
      .select('*');

    // Strictly filter query to intimacy_games where intensity matches base_tolerance (case-insensitive)
    if (userBaseTolerance) {
      query = query.ilike('intensity', userBaseTolerance.trim());
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      dbGames = data;
    } else if (error) {
      console.warn("GamesHub admin database fetch warning:", error.message || error);
      // Fallback query via server client with identical intensity filter
      let serverQuery = serverSupabase
        .from('intimacy_games')
        .select('*');
      if (userBaseTolerance) {
        serverQuery = serverQuery.ilike('intensity', userBaseTolerance.trim());
      }
      const { data: serverData } = await serverQuery.order('created_at', { ascending: true });
      if (serverData && serverData.length > 0) {
        dbGames = serverData;
      }
    }
  } catch (fetchErr) {
    console.warn("GamesHub database exception:", fetchErr);
  }

  // Use database games if available, otherwise seamlessly use fallback matrix catalog
  let rawGames: Game[] = (dbGames && dbGames.length > 0) ? dbGames : (FALLBACK_GAMES as any[]);

  // Strict tolerance tier filtering: if base_tolerance is set (e.g. Playful), strictly exclude any Intense/Extreme games
  if (userBaseTolerance) {
    const targetTier = userBaseTolerance.toLowerCase().trim();
    rawGames = rawGames.filter((g: any) => g.intensity?.toLowerCase().trim() === targetTier);
  }

  // Inject user's kinks_override into card game rule sets as suggested dares, penalties, or modifiers
  const games: Game[] = rawGames.map(g => injectKinksIntoGame(g, userKinks, userBaseTolerance));

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
    // Strictly return only games matching the active tolerance level. Never default to Intense or Extreme.
    return allInCat.filter((g: any) => 
      g.intensity?.toLowerCase().trim() === userBaseTolerance?.toLowerCase().trim()
    );
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
              Showing games matching your tolerance: <span className="font-semibold text-rose-400 capitalize">{userBaseTolerance}</span>
            </span>
          )}
          {userKinks.length > 0 && (
            <span className="block mt-1 text-xs text-rose-400/80">
              ✨ {userKinks.length} custom kink modifier{userKinks.length > 1 ? 's' : ''} integrated into game rule cards.
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
          <GameList sections={sections} tolerance={userBaseTolerance} />
        </Suspense>
      </div>
    </div>
  );
}
