'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getShuffledCardGames, clearAndReseedShuffleCache } from '@/utils/shuffle';
import { createClient } from '@/utils/supabase/client';
import { DrinkingPace, adaptRuleForPace } from '@/lib/movie-game-generator';

export type Game = {
  id: string;
  title: string;
  description: string;
  category: string;
  intensity: string;
  content?: any;
  seasonal_tag?: string;
  isAiGenerated?: boolean;
};

export type GameSection = {
  id: string;
  title: string;
  data: Game[];
};

interface GamesClientProps {
  initialSections: GameSection[];
  tolerance?: string | null;
  seasonalTag?: string | null;
  userKinks?: string[];
}

export default function GamesClient({
  initialSections,
  tolerance,
  seasonalTag,
  userKinks = []
}: GamesClientProps) {
  const searchParams = useSearchParams();
  const themeParam = seasonalTag || searchParams?.get('theme') || searchParams?.get('seasonal_tag') || '';
  const isHalloween = themeParam.toLowerCase() === 'halloween';

  // Client-side search and category filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'card' | 'movie' | 'drinking' | 'date_night'>('all');
  const [drinkingPace, setDrinkingPace] = useState<DrinkingPace>('medium');
  const [sections, setSections] = useState<GameSection[]>(initialSections);

  // Dynamic AI Movie Game Generator state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMovieTitle, setGeneratingMovieTitle] = useState('');
  const [customMovieGame, setCustomMovieGame] = useState<any | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Interactive watch-along gameplay state for custom movie game
  const [checkedRules, setCheckedRules] = useState<Record<string, boolean>>({});
  const [sipCount, setSipCount] = useState(0);
  const [copiedStatus, setCopiedStatus] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customGameRef = useRef<HTMLDivElement>(null);
  const [supabase] = useState(() => createClient());

  // Tolerance session shuffle synchronization
  useEffect(() => {
    if (typeof window !== 'undefined' && tolerance) {
      const stored = sessionStorage.getItem('between_us_card_tolerance');
      if (stored && stored !== tolerance.toLowerCase()) {
        clearAndReseedShuffleCache(tolerance);
      }
    }
  }, [tolerance]);

  // Handle card game reshuffling and Halloween priority ordering
  useEffect(() => {
    setSections(prevSections =>
      prevSections.map(sec => {
        let items = sec.data || [];
        if (sec.id === 'card' && items.length > 0) {
          items = getShuffledCardGames(items, tolerance || undefined);
        }

        if (isHalloween) {
          const isHalloweenItem = (g: any) =>
            g.seasonal_tag === 'halloween' ||
            g.content?.seasonal_tag === 'halloween' ||
            (g.id && g.id.toLowerCase().includes('halloween')) ||
            (g.title && g.title.toLowerCase().includes('halloween')) ||
            (g.description && g.description.toLowerCase().includes('halloween'));

          const halloweenMatches = items.filter(isHalloweenItem);
          const otherItems = items.filter((g: any) => !isHalloweenItem(g));
          items = [...halloweenMatches, ...otherItems];
        }

        return { ...sec, data: items };
      })
    );
  }, [tolerance, isHalloween]);

  // Check URL hash on load for deep linking (e.g. #movie, #card)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['card', 'movie', 'drinking', 'date_night'].includes(hash)) {
        setSelectedCategory(hash as any);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Category normalization helper
  const normalizeCategory = (cat: string) => {
    const c = (cat || '').toLowerCase().trim();
    if (c.includes('card')) return 'card';
    if (c.includes('movie')) return 'movie';
    if (c.includes('drink')) return 'drinking';
    if (c.includes('date')) return 'date_night';
    return c;
  };

  // Compute category counts for toggle badge selector
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, card: 0, movie: 0, drinking: 0, date_night: 0 };
    for (const sec of sections) {
      const count = sec.data.length;
      counts.all += count;
      if (counts[sec.id] !== undefined) {
        counts[sec.id] += count;
      }
    }
    return counts;
  }, [sections]);

  // Live client-side filtering by Search Term and Selected Category
  const filteredSections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return sections
      .filter(sec => {
        if (selectedCategory === 'all') return true;
        return sec.id === selectedCategory;
      })
      .map(sec => {
        if (!term) return sec;

        const matchingGames = sec.data.filter(game => {
          const titleMatch = (game.title || '').toLowerCase().includes(term);
          const categoryMatch = (game.category || '').toLowerCase().includes(term);
          const descMatch = (game.description || '').toLowerCase().includes(term);
          
          let rulesMatch = false;
          const rules = getRules(game);
          if (rules.length > 0) {
            rulesMatch = rules.some(r => r.toLowerCase().includes(term));
          }

          return titleMatch || categoryMatch || descMatch || rulesMatch;
        });

        return { ...sec, data: matchingGames };
      });
  }, [sections, searchTerm, selectedCategory]);

  const totalFilteredCount = useMemo(() => {
    return filteredSections.reduce((acc, sec) => acc + sec.data.length, 0);
  }, [filteredSections]);

  // Extract rules helper
  function getRules(game: any): string[] {
    try {
      let content = game?.content;
      if (typeof content === 'string') {
        try { content = JSON.parse(content); } catch {}
      }
      if (Array.isArray(content?.rules)) return content.rules;
      if (Array.isArray(content)) return content;
      if (Array.isArray(game?.rules)) return game.rules;
    } catch {}
    return [];
  }

  // Intensity badge helper
  const getIntensityBadge = (intensity?: string) => {
    switch ((intensity || '').toLowerCase()) {
      case 'sensory': return '🌱 Sensory';
      case 'playful': return '🌶️ Playful';
      case 'intense': return '🔥 Intense';
      case 'extreme': return '🧨 Extreme';
      default: return intensity ? `🌱 ${intensity}` : '🌱 Sensory';
    }
  };

  // Generate dynamic AI Movie Drinking Game
  const handleGenerateMovieGame = async (targetTitle?: string, targetPace?: DrinkingPace) => {
    const movieToGenerate = (targetTitle || searchTerm).trim();
    const paceToUse = targetPace || drinkingPace;
    if (!movieToGenerate) {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      return;
    }

    setIsGenerating(true);
    setGeneratingMovieTitle(movieToGenerate);
    setGenerationError(null);

    try {
      let token = '';
      try {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || '';
      } catch (authErr) {
        console.warn('Could not read user session token:', authErr);
      }

      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(anonKey ? { apikey: anonKey } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : (anonKey ? { Authorization: `Bearer ${anonKey}` } : {}))
      };

      // Call dedicated generation endpoint with exact requested contract:
      // { movie_title: searchTerm, category: 'movie_drinking', drinking_pace: selectedPace }
      const res = await fetch('/api/generate/movie-game', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          movie_title: movieToGenerate,
          category: 'movie_drinking',
          drinking_pace: paceToUse
        })
      });

      if (!res.ok) {
        // Fallback to /api/generate/content with identical payload
        const fallbackRes = await fetch('/api/generate/content', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            movie_title: movieToGenerate,
            category: 'movie_drinking',
            drinking_pace: paceToUse
          })
        });
        if (!fallbackRes.ok) {
          throw new Error(`Generation failed with status ${fallbackRes.status}`);
        }
        const data = await fallbackRes.json();
        setCustomMovieGame(data);
        insertGameIntoCatalog(data);
      } else {
        const data = await res.json();
        setCustomMovieGame(data);
        insertGameIntoCatalog(data);
      }

      // Reset interactive trackers for fresh watch-along
      setCheckedRules({});
      setSipCount(0);

      // Smooth scroll to generated custom game
      setTimeout(() => {
        if (customGameRef.current) {
          customGameRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } catch (err: any) {
      console.error('Failed to generate movie drinking game:', err);
      setGenerationError(err?.message || 'Could not generate movie drinking game. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add generated game to catalog so it's browsable in current session
  const insertGameIntoCatalog = (newGame: any) => {
    setSections(prevSections => {
      const alreadyExists = prevSections.some(sec => sec.data.some(g => g.id === newGame.id));
      if (alreadyExists) return prevSections;

      return prevSections.map(sec => {
        if (sec.id === 'movie') {
          return {
            ...sec,
            data: [{ ...newGame, isAiGenerated: true }, ...sec.data]
          };
        }
        return sec;
      });
    });
  };

  // Toggle rule checkbox
  const toggleRuleCheck = (ruleKey: string) => {
    setCheckedRules(prev => ({
      ...prev,
      [ruleKey]: !prev[ruleKey]
    }));
  };

  // Copy structured rules to clipboard
  const handleCopyRules = () => {
    if (!customMovieGame) return;
    const rules = getRules(customMovieGame);
    const textToCopy = [
      `🎬 ${customMovieGame.title}`,
      `${customMovieGame.description}`,
      '',
      '--- RULES ---',
      ...rules.map((r, i) => `${i + 1}. ${r}`)
    ].join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2500);
  };

  // Structured rules breakdown helper for the custom game
  const structuredRules = useMemo(() => {
    if (!customMovieGame) return null;
    const rawStructured = customMovieGame.content?.structured_rules;
    const allRules: string[] = getRules(customMovieGame);

    const take1 = rawStructured?.take_1_sip?.length > 0
      ? rawStructured.take_1_sip
      : allRules.filter(r => r.toLowerCase().includes('1 sip') || r.includes('🍺')).map(r => r.replace(/^🍺?\s*Take 1 Sip:\s*/i, ''));

    const take2 = rawStructured?.take_2_sips?.length > 0
      ? rawStructured.take_2_sips
      : allRules.filter(r => r.toLowerCase().includes('2 sip') || r.includes('🍻')).map(r => r.replace(/^🍻?\s*Take 2 Sips:\s*/i, ''));

    const intermission = rawStructured?.physical_intermission_cues?.length > 0
      ? rawStructured.physical_intermission_cues
      : allRules.filter(r => r.toLowerCase().includes('intermission') || r.includes('⏸️')).map(r => r.replace(/^⏸️?\s*Physical Intermission Cue:\s*/i, ''));

    const t1 = take1.length > 0 ? take1 : allRules.slice(0, 3);
    const t2 = take2.length > 0 ? take2 : allRules.slice(3, 6);
    const inter = intermission.length > 0 ? intermission : allRules.slice(6);

    return {
      take1: t1.map((r: string) => adaptRuleForPace(r, drinkingPace)),
      take2: t2.map((r: string) => adaptRuleForPace(r, drinkingPace)),
      intermission: inter.map((r: string) => adaptRuleForPace(r, drinkingPace))
    };
  }, [customMovieGame, drinkingPace]);

  return (
    <div className="space-y-10">
      {/* ======================================================== */}
      {/* 1. HIGH-CONTRAST SEARCH & THEME BAR + BADGE SELECTOR     */}
      {/* ======================================================== */}
      <div className="bg-zinc-900/95 border-2 border-zinc-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4">
        {/* Search Input Bar with Embedded/Adjacent Action Button */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  if (totalFilteredCount === 0) {
                    handleGenerateMovieGame();
                  }
                }
              }}
              placeholder="Search games or enter a movie title for custom drinking rules (e.g., '50 Shades', 'The Odyssey')..."
              className="w-full bg-zinc-950 border border-zinc-700 focus:border-rose-500 rounded-xl pl-11 pr-10 py-3.5 text-zinc-100 placeholder-zinc-500 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dedicated "Generate Movie Drinking Game" Button */}
          <button
            type="button"
            onClick={() => handleGenerateMovieGame()}
            disabled={isGenerating}
            className="shrink-0 bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-3.5 rounded-xl shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 text-sm md:text-base border border-rose-400/40"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span className="text-lg">🎬</span>
                <span>Generate Movie Drinking Game</span>
              </>
            )}
          </button>
        </div>

        {/* Category Toggle / Badge Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/80">
          <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mr-1 flex items-center gap-1">
            <span>Filter:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 border ${
              selectedCategory === 'all'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-950 ring-1 ring-rose-500/30 font-semibold'
                : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <span>All Categories</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'all' ? 'bg-rose-500/40 text-rose-200' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {categoryCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('card')}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 border ${
              selectedCategory === 'card'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-950 ring-1 ring-rose-500/30 font-semibold'
                : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <span>🃏 Card</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'card' ? 'bg-rose-500/40 text-rose-200' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {categoryCounts.card}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('movie')}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 border ${
              selectedCategory === 'movie'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-950 ring-1 ring-rose-500/30 font-semibold'
                : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <span>🎬 Movie</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'movie' ? 'bg-rose-500/40 text-rose-200' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {categoryCounts.movie}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('drinking')}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 border ${
              selectedCategory === 'drinking'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-950 ring-1 ring-rose-500/30 font-semibold'
                : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <span>🍷 Drinking</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'drinking' ? 'bg-rose-500/40 text-rose-200' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {categoryCounts.drinking}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('date_night')}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 border ${
              selectedCategory === 'date_night'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-950 ring-1 ring-rose-500/30 font-semibold'
                : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <span>✨ Date Night</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'date_night' ? 'bg-rose-500/40 text-rose-200' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {categoryCounts.date_night}
            </span>
          </button>

          {/* Search Term Clear / Feedback Indicator */}
          {searchTerm && (
            <div className="ml-auto text-xs text-zinc-400 flex items-center gap-2">
              <span>Found <strong className="text-zinc-200">{totalFilteredCount}</strong> matching game{totalFilteredCount === 1 ? '' : 's'}</span>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-rose-400 hover:text-rose-300 underline font-medium"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* 3-way Drinking Pace Segmented Control for Movie Game Generator & Drinking Games */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
              <span>🍷</span>
              <span>Drinking Intensity:</span>
            </span>

            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setDrinkingPace('light')}
                className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  drinkingPace === 'light'
                    ? 'bg-amber-600/30 text-amber-200 border border-amber-500 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <span>🍺</span>
                <span>Light Drinking</span>
              </button>

              <button
                type="button"
                onClick={() => setDrinkingPace('medium')}
                className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  drinkingPace === 'medium'
                    ? 'bg-rose-600/30 text-rose-200 border border-rose-500 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <span>🥂</span>
                <span>Medium Drinking</span>
              </button>

              <button
                type="button"
                onClick={() => setDrinkingPace('heavy')}
                className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  drinkingPace === 'heavy'
                    ? 'bg-red-600/30 text-red-200 border border-red-500 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <span>🔥</span>
                <span>Heavy Drinking</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-zinc-400 font-light flex items-center gap-1">
            {drinkingPace === 'light' && (
              <span className="text-amber-300/90 flex items-center gap-1">
                <span>🍺</span>
                <span>Conservative sips (1-sip triggers, hydration breaks suggested)</span>
              </span>
            )}
            {drinkingPace === 'medium' && (
              <span className="text-rose-300/90 flex items-center gap-1">
                <span>🥂</span>
                <span>Balanced party pace (Standard 1-2 sips for tropes & climaxes)</span>
              </span>
            )}
            {drinkingPace === 'heavy' && (
              <span className="text-red-300/90 flex items-center gap-1">
                <span>🔥</span>
                <span>High-frequency escalation (2 sips, shots/chugs & forfeit penalties)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DYNAMIC LOADING STATE                                 */}
      {/* ======================================================== */}
      {isGenerating && (
        <div className="p-8 rounded-2xl bg-zinc-900/90 border-2 border-rose-500/70 shadow-[0_0_35px_rgba(244,63,94,0.25)] flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-3xl">
              🍿
            </div>
            <div className="absolute -bottom-1 -right-1 text-2xl animate-bounce">
              🍷
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-serif font-medium text-rose-200">
              Generating custom drinking rules for &ldquo;{generatingMovieTitle}&rdquo;...
            </h3>
            <p className="text-sm text-zinc-400 max-w-md">
              Analyzing cinematic tropes, structuring 1-Sip and 2-Sip rules, and crafting physical intermission challenges for couples.
            </p>
          </div>
          <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 animate-[pulse_1s_ease-in-out_infinite]"></div>
          </div>
        </div>
      )}

      {/* Generation Error State */}
      {generationError && !isGenerating && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span>⚠️</span>
            <span>{generationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGenerationError(null)}
            className="text-xs text-red-300 hover:text-white underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. RENDERING CUSTOM GENERATED MOVIE GAME (SHOWCASE)      */}
      {/* ======================================================== */}
      {customMovieGame && (
        <div
          ref={customGameRef}
          className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-950 border-2 border-rose-500/80 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/30 space-y-6"
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-600/70 text-rose-300 flex items-center gap-1.5">
                  <span>🎬</span> AI Watch-Along Edition
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-red-950/40 border border-red-900/40 text-red-400">
                  {getIntensityBadge(customMovieGame.intensity)}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300">
                  Category: Movie
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                  drinkingPace === 'light'
                    ? 'bg-amber-950/80 border-amber-600/70 text-amber-300'
                    : drinkingPace === 'heavy'
                      ? 'bg-red-950/80 border-red-600/70 text-red-300'
                      : 'bg-rose-950/80 border-rose-600/70 text-rose-300'
                }`}>
                  <span>{drinkingPace === 'light' ? '🍺' : drinkingPace === 'heavy' ? '🔥' : '🥂'}</span>
                  <span className="capitalize">{drinkingPace} Drinking</span>
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-medium text-zinc-100">
                {customMovieGame.title}
              </h2>
              <p className="text-zinc-300 text-base font-light max-w-3xl leading-relaxed">
                {customMovieGame.description}
              </p>

              {/* Showcase Drinking Pace Switcher */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Pace:</span>
                <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDrinkingPace('light')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      drinkingPace === 'light'
                        ? 'bg-amber-600/30 text-amber-200 border border-amber-500 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>🍺</span>
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrinkingPace('medium')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      drinkingPace === 'medium'
                        ? 'bg-rose-600/30 text-rose-200 border border-rose-500 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>🥂</span>
                    <span>Medium</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrinkingPace('heavy')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      drinkingPace === 'heavy'
                        ? 'bg-red-600/30 text-red-200 border border-red-500 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>🔥</span>
                    <span>Heavy</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyRules}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-medium border border-zinc-700 transition-colors flex items-center gap-1.5"
                title="Copy rules to clipboard"
              >
                <span>{copiedStatus ? '✓' : '📋'}</span>
                <span>{copiedStatus ? 'Copied!' : 'Copy Rules'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomMovieGame(null)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
                title="Close showcase"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Live Watch-Along Sip Tracker Bar */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥂</span>
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tonight&apos;s Sip Tally</div>
                <div className="text-xl font-bold text-rose-300">
                  {sipCount} Sip{sipCount === 1 ? '' : 's'} Logged
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSipCount(Math.max(0, sipCount - 1))}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-lg flex items-center justify-center transition-colors"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setSipCount(sipCount + 1)}
                className="px-4 h-8 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center justify-center transition-colors"
              >
                + Take Sip
              </button>
              {sipCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSipCount(0)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline ml-2"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Three Distinct Structured Rule Tiers */}
          {structuredRules && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Tier 1: Take 1 Sip */}
              <div className="bg-zinc-950/90 border border-amber-500/40 rounded-xl p-5 space-y-4 shadow-sm flex flex-col">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍺</span>
                    <h3 className="font-serif font-medium text-amber-200 text-lg">Take 1 Sip</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-400/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                    Frequent Tropes
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-light">
                  Drink once whenever subtle cues or signature tropes appear:
                </p>
                <ul className="space-y-3 flex-grow">
                  {structuredRules.take1.map((rule: string, idx: number) => {
                    const ruleId = `t1-${idx}`;
                    const isChecked = Boolean(checkedRules[ruleId]);
                    return (
                      <li
                        key={ruleId}
                        onClick={() => toggleRuleCheck(ruleId)}
                        className={`text-sm p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-amber-950/20 border-amber-600/50 text-zinc-400 line-through'
                            : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-200 hover:border-amber-500/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 accent-amber-500 rounded cursor-pointer"
                        />
                        <span className="leading-snug font-light">{rule}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Tier 2: Take 2 Sips */}
              <div className="bg-zinc-950/90 border border-rose-500/40 rounded-xl p-5 space-y-4 shadow-sm flex flex-col">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍻</span>
                    <h3 className="font-serif font-medium text-rose-200 text-lg">Take 2 Sips</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-rose-400/80 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                    Cinematic Moments
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-light">
                  Drink twice during major turning points, iconic lines, and climax scenes:
                </p>
                <ul className="space-y-3 flex-grow">
                  {structuredRules.take2.map((rule: string, idx: number) => {
                    const ruleId = `t2-${idx}`;
                    const isChecked = Boolean(checkedRules[ruleId]);
                    return (
                      <li
                        key={ruleId}
                        onClick={() => toggleRuleCheck(ruleId)}
                        className={`text-sm p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-rose-950/20 border-rose-600/50 text-zinc-400 line-through'
                            : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-200 hover:border-rose-500/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 accent-rose-500 rounded cursor-pointer"
                        />
                        <span className="leading-snug font-light">{rule}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Tier 3: Physical Intermission Cues */}
              <div className="bg-zinc-950/90 border border-purple-500/40 rounded-xl p-5 space-y-4 shadow-sm flex flex-col">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏸️</span>
                    <h3 className="font-serif font-medium text-purple-200 text-lg">Intermission Cues</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-400/80 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                    Pause Film For Couples
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-light">
                  Hit pause at these cues for alternating truth, dare, or sensual touch rituals:
                </p>
                <ul className="space-y-3 flex-grow">
                  {structuredRules.intermission.map((rule: string, idx: number) => {
                    const ruleId = `t3-${idx}`;
                    const isChecked = Boolean(checkedRules[ruleId]);
                    return (
                      <li
                        key={ruleId}
                        onClick={() => toggleRuleCheck(ruleId)}
                        className={`text-sm p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-purple-950/20 border-purple-600/50 text-zinc-400 line-through'
                            : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-200 hover:border-purple-500/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 accent-purple-500 rounded cursor-pointer"
                        />
                        <span className="leading-snug font-light">{rule}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Footer controls */}
          <div className="flex flex-wrap items-center justify-between pt-4 border-t border-zinc-800/80 text-xs text-zinc-400 gap-3">
            <span className="flex items-center gap-1.5">
              <span>💡</span>
              <span>Tap any rule to cross it off as you watch together tonight.</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCheckedRules({})}
                className="hover:text-zinc-200 underline transition-colors"
              >
                Reset Checklist
              </button>
              <button
                type="button"
                onClick={() => handleGenerateMovieGame()}
                className="text-rose-400 hover:text-rose-300 font-medium underline transition-colors"
              >
                Regenerate Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. EMPTY SEARCH MATCH: AI MOVIE GENERATOR CALL-TO-ACTION */}
      {/* ======================================================== */}
      {totalFilteredCount === 0 && searchTerm.trim().length > 0 && !isGenerating && (
        <div className="bg-zinc-900/90 border-2 border-dashed border-rose-500/50 rounded-2xl p-8 md:p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-3xl mx-auto">
            🎬
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-2xl font-serif font-medium text-zinc-100">
              No pre-seeded games for &ldquo;{searchTerm.trim()}&rdquo;
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              We couldn&apos;t find an existing game in the catalog, but our AI can instantly build a custom couple&apos;s watch-along drinking game tailored specifically for this film!
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => handleGenerateMovieGame(searchTerm.trim())}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-medium px-6 py-3.5 rounded-xl shadow-xl shadow-rose-950/40 transition-all inline-flex items-center gap-2 border border-rose-400/30"
            >
              <span>✨</span>
              <span>Generate Drinking Game for &ldquo;{searchTerm.trim()}&rdquo;</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. FILTERED SECTIONS & GAME CARDS CATALOG               */}
      {/* ======================================================== */}
      <div className="space-y-16">
        {filteredSections.map((section, idx) => {
          if (section.data.length === 0 && searchTerm.trim().length > 0) {
            return null;
          }

          let hasTaggedFirstHalloween = false;

          return (
            <section key={idx} id={section.id} className="scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-4">
                <h2 className="text-2xl font-serif font-medium text-zinc-200 flex items-center gap-2">
                  <span>{section.title}</span>
                  <span className="text-xs font-sans text-zinc-500 font-normal">
                    ({section.data.length})
                  </span>
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                  {section.id === 'drinking' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Pace:
                      </span>
                      <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setDrinkingPace('light')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                            drinkingPace === 'light'
                              ? 'bg-amber-600/30 text-amber-200 border border-amber-500 shadow-sm font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                          }`}
                        >
                          <span>🍺</span>
                          <span>Light</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrinkingPace('medium')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                            drinkingPace === 'medium'
                              ? 'bg-rose-600/30 text-rose-200 border border-rose-500 shadow-sm font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                          }`}
                        >
                          <span>🥂</span>
                          <span>Medium</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrinkingPace('heavy')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                            drinkingPace === 'heavy'
                              ? 'bg-red-600/30 text-red-200 border border-red-500 shadow-sm font-semibold'
                              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                          }`}
                        >
                          <span>🔥</span>
                          <span>Heavy</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isHalloween && (
                    <span className="text-xs font-sans text-orange-400 bg-orange-950/40 border border-orange-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <span>🎃</span> Halloween Filter Active
                    </span>
                  )}
                </div>
              </div>

              {/* Drinking Pace Banner for Drinking Games Section */}
              {section.id === 'drinking' && (
                <div className={`mb-6 p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
                  drinkingPace === 'light'
                    ? 'bg-amber-950/20 border-amber-600/40 text-amber-300'
                    : drinkingPace === 'heavy'
                      ? 'bg-red-950/25 border-red-600/50 text-red-300'
                      : 'bg-rose-950/20 border-rose-600/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{drinkingPace === 'light' ? '🍺' : drinkingPace === 'heavy' ? '🔥' : '🥂'}</span>
                    <span>
                      <strong className="font-semibold capitalize">{drinkingPace} Pace Active:</strong>{' '}
                      {drinkingPace === 'light' && 'Conservative sips (1-sip triggers, non-alcoholic sips & hydration breaks suggested).'}
                      {drinkingPace === 'medium' && 'Balanced party pace (1-sip tropes, 2-sips major moments, finish drink for climaxes).'}
                      {drinkingPace === 'heavy' && 'High-frequency escalation (Frequent 1-2 sips, shots/chugs on reveals, heavy penalties).'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                    Rules Dynamically Scaled
                  </span>
                </div>
              )}

              {section.data.length === 0 ? (
                <p className="text-zinc-500 italic bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 border-dashed text-center">
                  No games found in this category yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.data.map((game: any) => {
                    const rules = getRules(game);
                    const isGameHalloween =
                      game.seasonal_tag === 'halloween' ||
                      game.content?.seasonal_tag === 'halloween' ||
                      (game.id && game.id.toLowerCase().includes('halloween')) ||
                      (game.title && game.title.toLowerCase().includes('halloween'));

                    const isFirstFeatured = isGameHalloween && !hasTaggedFirstHalloween;
                    if (isFirstFeatured) {
                      hasTaggedFirstHalloween = true;
                    }

                    return (
                      <Link
                        href={`/dashboard/games/${game.id}`}
                        key={game.id}
                        id={isFirstFeatured ? 'halloween-featured-game' : undefined}
                        data-theme={isGameHalloween ? 'halloween' : undefined}
                        className="block h-full group"
                      >
                        <div className={`p-6 rounded-xl transition-all duration-300 cursor-pointer h-full flex flex-col shadow-lg hover:-translate-y-1 ${
                          game.isAiGenerated
                            ? 'bg-zinc-900 border-2 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30 hover:border-rose-400'
                            : isGameHalloween
                              ? 'bg-zinc-900/95 border-2 border-orange-500/80 shadow-[0_0_25px_rgba(249,115,22,0.25)] ring-2 ring-orange-500/30 hover:border-orange-400'
                              : 'bg-zinc-900 border border-zinc-800 hover:border-red-900/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                        }`}>
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <h3 className={`text-xl font-bold transition-colors ${
                              game.isAiGenerated
                                ? 'text-rose-200 group-hover:text-rose-300'
                                : isGameHalloween
                                  ? 'text-orange-200 group-hover:text-orange-300'
                                  : 'group-hover:text-red-400'
                            }`}>
                              {game.title}
                            </h3>
                            {game.isAiGenerated ? (
                              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950/80 border border-rose-600/70 text-rose-300 flex items-center gap-1">
                                <span>✨</span> AI Custom
                              </span>
                            ) : isGameHalloween ? (
                              <span className="shrink-0 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-950/70 border border-orange-600/70 text-orange-300 flex items-center gap-1">
                                <span>🎃</span> Halloween
                              </span>
                            ) : null}
                          </div>

                          <p className="text-zinc-400 text-sm mb-6 flex-grow leading-relaxed font-light">
                            {game.description}
                          </p>

                          {rules.length > 0 && (
                            <div className="mb-4 text-xs text-zinc-400 flex items-center justify-between gap-1.5 font-medium">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  game.isAiGenerated
                                    ? 'bg-rose-400'
                                    : isGameHalloween
                                      ? 'bg-orange-500'
                                      : 'bg-rose-500'
                                }`}></span>
                                <span>{rules.length} Interactive Rules</span>
                              </div>
                              {section.id === 'drinking' && (
                                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                                  {drinkingPace} pace
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-auto">
                            <div className="flex items-center text-xs font-bold text-red-500 bg-red-950/30 border border-red-900/30 w-fit px-3 py-1.5 rounded-md uppercase tracking-wider">
                              {getIntensityBadge(game.intensity)}
                            </div>
                            <span className={`text-xs transition-colors font-medium ${
                              game.isAiGenerated
                                ? 'text-rose-400 group-hover:text-rose-300 font-semibold'
                                : isGameHalloween
                                  ? 'text-orange-400 group-hover:text-orange-300 font-semibold'
                                  : 'text-zinc-500 group-hover:text-zinc-300'
                            }`}>
                              Play Game &rarr;
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
