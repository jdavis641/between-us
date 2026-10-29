'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  RANDOMIZER_DATA,
  TRUTH_OR_DARE_DATA,
  NEVER_HAVE_I_EVER_DATA,
  communicationStartersPlayful,
  communicationStartersIntense,
  IntensityTier,
  RandomizerType,
  RandomizerGameMode,
  TruthOrDareType
} from '../../lib/randomizer-data';

function RandomizerHubContent() {
  const searchParams = useSearchParams();
  const initialGameParam = searchParams.get('game') as RandomizerGameMode | null;

  const [activeGame, setActiveGame] = useState<RandomizerGameMode>(() => {
    if (
      initialGameParam &&
      ['original', 'truth_or_dare', 'never_have_i_ever', 'communication-starters'].includes(initialGameParam)
    ) {
      return initialGameParam;
    }
    return 'original';
  });

  const [activeTier, setActiveTier] = useState<IntensityTier>('playful');
  const [activeType, setActiveType] = useState<RandomizerType>('action');
  const [activeTodType, setActiveTodType] = useState<TruthOrDareType>('truth');
  const [commCategory, setCommCategory] = useState<'playful' | 'intense'>('playful');

  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [rollCount, setRollCount] = useState(0);

  // Interactive reaction counters for Never Have I Ever
  const [nhieCounts, setNhieCounts] = useState<{ have: number; never: number }>({ have: 0, never: 0 });
  const [nhieFeedback, setNhieFeedback] = useState<string | null>(null);

  // Helper to pick prompt from pool avoiding immediate duplicate
  const pickRandom = (pool: string[], current: string): string => {
    if (!pool || pool.length === 0) return '';
    if (pool.length === 1) return pool[0];
    const filtered = pool.filter((item) => item !== current);
    const candidates = filtered.length > 0 ? filtered : pool;
    const nextIndex = Math.floor(Math.random() * candidates.length);
    return candidates[nextIndex];
  };

  // Roll prompt based on active game
  const rollGamePrompt = (
    game: RandomizerGameMode = activeGame,
    tier: IntensityTier = activeTier,
    todType?: TruthOrDareType,
    origType?: RandomizerType,
    commCat: 'playful' | 'intense' = commCategory
  ) => {
    setIsAnimating(true);
    setNhieFeedback(null);

    let nextPrompt = '';

    if (game === 'original') {
      const type = origType || activeType;
      setActiveType(type);
      const pool = type === 'action' ? RANDOMIZER_DATA[tier].actions : RANDOMIZER_DATA[tier].starters;
      nextPrompt = pickRandom(pool, currentPrompt);
    } else if (game === 'truth_or_dare') {
      const type = todType || activeTodType;
      setActiveTodType(type);
      const pool = type === 'truth' ? TRUTH_OR_DARE_DATA[tier].truths : TRUTH_OR_DARE_DATA[tier].dares;
      nextPrompt = pickRandom(pool, currentPrompt);
    } else if (game === 'never_have_i_ever') {
      const pool = NEVER_HAVE_I_EVER_DATA[tier].statements;
      nextPrompt = pickRandom(pool, currentPrompt);
    } else if (game === 'communication-starters') {
      const pool = commCat === 'playful' ? communicationStartersPlayful : communicationStartersIntense;
      nextPrompt = pickRandom(pool, currentPrompt);
    }

    setTimeout(() => {
      setCurrentPrompt(nextPrompt);
      setRollCount((prev) => prev + 1);
      setIsAnimating(false);
    }, 120);
  };

  // Switch game mode
  const handleGameSelect = (newGame: RandomizerGameMode) => {
    setActiveGame(newGame);
    rollGamePrompt(newGame, activeTier, undefined, undefined, commCategory);
  };

  // Switch tier
  const handleTierChange = (newTier: IntensityTier) => {
    setActiveTier(newTier);
    rollGamePrompt(activeGame, newTier, undefined, undefined, commCategory);
  };

  // Switch communication category
  const handleCommCategoryChange = (newCat: 'playful' | 'intense') => {
    setCommCategory(newCat);
    rollGamePrompt('communication-starters', activeTier, undefined, undefined, newCat);
  };

  // Initialize on mount or when searchParams change
  useEffect(() => {
    rollGamePrompt(activeGame, activeTier, undefined, undefined, commCategory);
  }, []);

  const handleNhieReaction = (type: 'have' | 'never') => {
    setNhieCounts((prev) => ({
      ...prev,
      [type]: prev[type] + 1
    }));
    setNhieFeedback(
      type === 'have'
        ? '🍷 You’ve done it! Take a sip or tell the spicy story...'
        : '😇 Innocent! Clean record... for now.'
    );
    setTimeout(() => setNhieFeedback(null), 3500);
  };

  const commMeta = {
    playful: {
      name: 'Playful',
      badge: '💬 Emotional Reconnection',
      bgBadge: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80',
      description: 'Deep, non-sexual reconnection prompts focusing on emotional presence, vulnerability, and adoration.'
    },
    intense: {
      name: 'Intense',
      badge: '🔥 Desires & Intimacy',
      bgBadge: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
      description: 'Explicit intimacy and desire prompts focusing on fantasies, kinks, tactile anticipation, and unfiltered passion.'
    }
  };

  const tierMeta =
    activeGame === 'original'
      ? RANDOMIZER_DATA[activeTier]
      : activeGame === 'truth_or_dare'
      ? TRUTH_OR_DARE_DATA[activeTier]
      : activeGame === 'never_have_i_ever'
      ? NEVER_HAVE_I_EVER_DATA[activeTier]
      : {
          badge: commMeta[commCategory].badge,
          bgBadge: commMeta[commCategory].bgBadge,
          description: commMeta[commCategory].description,
          color: commCategory === 'playful' ? 'indigo' : 'rose'
        };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-rose-500/30">
      <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            ← Return to Dashboard
          </Link>
        </div>

        {/* Header */}
        <header className="mb-10 border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎲</span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-100">
              Randomizer Games Hub
            </h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base font-light leading-relaxed">
            Fast, zero-wait intimate prompts: The Original Randomizer, Spicy Truth or Dare, Never Have I Ever, and Communication Starters.
          </p>
        </header>

        {/* 4 Distinct Selection Tiles */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
              Choose Game Mode
            </label>
            <span className="text-xs text-zinc-500">
              {rollCount > 0 ? `${rollCount} prompts explored` : 'Instant generator'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tile 1: The Original Randomizer */}
            <button
              type="button"
              onClick={() => handleGameSelect('original')}
              className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-full group ${
                activeGame === 'original'
                  ? 'bg-zinc-900 border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/40'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      activeGame === 'original'
                        ? 'bg-emerald-950 text-emerald-300'
                        : 'bg-zinc-800 text-zinc-300 group-hover:scale-105 transition-transform'
                    }`}
                  >
                    🎲
                  </div>
                </div>
                <h3 className="text-lg font-serif font-bold text-white mb-1 group-hover:text-emerald-200 transition-colors">
                  The Original Randomizer
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Spontaneous tactile actions and deep conversation starters across 3 intensity levels.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                <span className={activeGame === 'original' ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
                  {activeGame === 'original' ? '● Active Game' : 'Select Game'}
                </span>
                <span className="text-zinc-500 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            {/* Tile 2: Truth or Dare */}
            <button
              type="button"
              onClick={() => handleGameSelect('truth_or_dare')}
              className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-full group ${
                activeGame === 'truth_or_dare'
                  ? 'bg-zinc-900 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.18)] ring-1 ring-amber-500/40'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      activeGame === 'truth_or_dare'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-zinc-800 text-zinc-300 group-hover:scale-105 transition-transform'
                    }`}
                  >
                    🎭
                  </div>
                </div>
                <h3 className="text-lg font-serif font-bold text-white mb-1 group-hover:text-amber-200 transition-colors">
                  Truth or Dare
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Vulnerable confessions and physical dares calibrated from gentle romance to feral intensity.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                <span className={activeGame === 'truth_or_dare' ? 'text-amber-400 font-semibold' : 'text-zinc-500'}>
                  {activeGame === 'truth_or_dare' ? '● Active Game' : 'Select Game'}
                </span>
                <span className="text-zinc-500 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            {/* Tile 3: Never Have I Ever */}
            <button
              type="button"
              onClick={() => handleGameSelect('never_have_i_ever')}
              className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-full group ${
                activeGame === 'never_have_i_ever'
                  ? 'bg-zinc-900 border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.18)] ring-1 ring-rose-500/40'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      activeGame === 'never_have_i_ever'
                        ? 'bg-rose-950 text-rose-300'
                        : 'bg-zinc-800 text-zinc-300 group-hover:scale-105 transition-transform'
                    }`}
                  >
                    🥂
                  </div>
                </div>
                <h3 className="text-lg font-serif font-bold text-white mb-1 group-hover:text-rose-200 transition-colors">
                  Never Have I Ever
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Spicy confessions, romantic milestones, and taboo experiences to uncover hidden desires.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                <span className={activeGame === 'never_have_i_ever' ? 'text-rose-400 font-semibold' : 'text-zinc-500'}>
                  {activeGame === 'never_have_i_ever' ? '● Active Game' : 'Select Game'}
                </span>
                <span className="text-zinc-500 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            {/* Tile 4: Communication Starters */}
            <button
              type="button"
              onClick={() => handleGameSelect('communication-starters')}
              className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-full group ${
                activeGame === 'communication-starters'
                  ? 'bg-zinc-900 border-indigo-500/80 shadow-[0_0_25px_rgba(99,102,241,0.18)] ring-1 ring-indigo-500/40'
                  : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      activeGame === 'communication-starters'
                        ? 'bg-indigo-950 text-indigo-300'
                        : 'bg-zinc-800 text-zinc-300 group-hover:scale-105 transition-transform'
                    }`}
                  >
                    💬
                  </div>
                </div>
                <h3 className="text-lg font-serif font-bold text-white mb-1 group-hover:text-indigo-200 transition-colors">
                  Communication Starters
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Curated prompts to bridge the gap: deep emotional reconnection or unapologetic sexual desires.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                <span className={activeGame === 'communication-starters' ? 'text-indigo-400 font-semibold' : 'text-zinc-500'}>
                  {activeGame === 'communication-starters' ? '● Active Game' : 'Select Game'}
                </span>
                <span className="text-zinc-500 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>
        </section>

        {/* Tier Control OR Communication Starters Segmented Control */}
        {activeGame === 'communication-starters' ? (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                Select Conversation Mode
              </label>
              <span className="text-xs text-zinc-500 italic">
                Communication Starters
              </span>
            </div>

            <div className="grid grid-cols-2 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 shadow-inner gap-1">
              {/* Playful Option */}
              <button
                type="button"
                onClick={() => handleCommCategoryChange('playful')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  commCategory === 'playful'
                    ? 'bg-indigo-950 text-indigo-200 border border-indigo-800/80 shadow-md scale-[1.01]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span>💬</span>
                <span>Playful (Deep Connection)</span>
              </button>

              {/* Intense Option */}
              <button
                type="button"
                onClick={() => handleCommCategoryChange('intense')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  commCategory === 'intense'
                    ? 'bg-rose-950 text-rose-200 border border-rose-800/80 shadow-md scale-[1.01]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span>🔥</span>
                <span>Intense (Desires & Intimacy)</span>
              </button>
            </div>

            <p className="mt-3 text-xs text-zinc-500 italic px-1">
              {commMeta[commCategory].description}
            </p>
          </section>
        ) : (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                Select Intensity Tier
              </label>
              <span className="text-xs text-zinc-500 italic">
                {activeGame === 'original'
                  ? 'Original Randomizer'
                  : activeGame === 'truth_or_dare'
                  ? 'Truth or Dare'
                  : 'Never Have I Ever'}
              </span>
            </div>

            <div className="grid grid-cols-3 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 shadow-inner gap-1">
              {/* Sensory Tier Button */}
              <button
                type="button"
                onClick={() => handleTierChange('sensory')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  activeTier === 'sensory'
                    ? 'bg-emerald-950 text-emerald-200 border border-emerald-800/80 shadow-md scale-[1.01]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span>🌿</span>
                <span>Sensory</span>
              </button>

              {/* Playful Tier Button */}
              <button
                type="button"
                onClick={() => handleTierChange('playful')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  activeTier === 'playful'
                    ? 'bg-amber-950 text-amber-200 border border-amber-800/80 shadow-md scale-[1.01]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span>🔥</span>
                <span>Playful</span>
              </button>

              {/* Intense Tier Button */}
              <button
                type="button"
                onClick={() => handleTierChange('intense')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                  activeTier === 'intense'
                    ? 'bg-rose-950 text-rose-200 border border-rose-800/80 shadow-md scale-[1.01]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span>⚡</span>
                <span>Intense</span>
              </button>
            </div>

            <p className="mt-3 text-xs text-zinc-500 italic px-1">
              {tierMeta.description}
            </p>
          </section>
        )}

        {/* Prominent Styled Game Card */}
        <div
          onCopy={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          className={`select-none relative bg-zinc-900 border rounded-2xl p-8 md:p-12 mb-8 shadow-2xl transition-all duration-300 flex flex-col justify-between min-h-[280px] md:min-h-[300px] ${
            activeGame === 'communication-starters'
              ? commCategory === 'playful'
                ? 'border-indigo-900/60 shadow-[0_0_30px_rgba(99,102,241,0.08)]'
                : 'border-rose-900/60 shadow-[0_0_30px_rgba(244,63,94,0.08)]'
              : activeTier === 'sensory'
              ? 'border-emerald-900/60 shadow-[0_0_30px_rgba(16,185,129,0.06)]'
              : activeTier === 'playful'
              ? 'border-amber-900/60 shadow-[0_0_30px_rgba(245,158,11,0.06)]'
              : 'border-rose-900/60 shadow-[0_0_30px_rgba(244,63,94,0.08)]'
          }`}
        >
          {/* Card Header Tags */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${tierMeta.bgBadge}`}>
                {tierMeta.badge}
              </span>

              {/* Game Specific Type Badges */}
              {activeGame === 'original' && (
                <span className="text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                  {activeType === 'action' ? '🎯 Intimate Action' : '💬 Conversation Starter'}
                </span>
              )}

              {activeGame === 'truth_or_dare' && (
                <span
                  className={`text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    activeTodType === 'truth'
                      ? 'bg-cyan-950/70 text-cyan-300 border-cyan-800/70'
                      : 'bg-rose-950/70 text-rose-300 border-rose-800/70'
                  }`}
                >
                  {activeTodType === 'truth' ? '🔮 Truth Confession' : '⚡ Daring Challenge'}
                </span>
              )}

              {activeGame === 'never_have_i_ever' && (
                <span className="text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-950/70 text-purple-300 border border-purple-800/70">
                  🥂 Never Have I Ever
                </span>
              )}

              {activeGame === 'communication-starters' && (
                <span className="text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                  💬 Communication Starter
                </span>
              )}
            </div>
          </div>

          {/* Card Main Prompt Text */}
          <div
            className={`my-auto py-4 select-none ${activeGame === 'communication-starters' ? 'text-center' : ''}`}
            onCopy={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div
              className={`transition-all duration-150 transform ${
                isAnimating ? 'opacity-0 scale-98 translate-y-1' : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              <p className="text-xl md:text-2xl font-serif text-zinc-100 leading-relaxed font-normal tracking-wide select-none">
                "{currentPrompt}"
              </p>
            </div>

            {/* Never Have I Ever Interactive Reaction & Rule */}
            {activeGame === 'never_have_i_ever' && (
              <div className="mt-6 pt-4 border-t border-zinc-800/50">
                <p className="text-xs text-zinc-400 italic mb-4">
                  🍷 Rule: If you have done this, take a sip or share the spicy story. If you never have, stay innocent!
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleNhieReaction('have')}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/70 text-rose-200 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span>🙋‍♂️ I Have (Sip 🍷)</span>
                    <span className="bg-rose-900/80 px-1.5 py-0.5 rounded text-[10px]">{nhieCounts.have}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNhieReaction('never')}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span>😇 I Never</span>
                    <span className="bg-zinc-700/80 px-1.5 py-0.5 rounded text-[10px]">{nhieCounts.never}</span>
                  </button>
                </div>

                {nhieFeedback && (
                  <p className="mt-3 text-xs text-rose-300 animate-in fade-in font-medium">
                    {nhieFeedback}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Card Bottom Meta */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-800/70 text-xs text-zinc-500">
            <span>
              {activeGame === 'original'
                ? 'Tap either button below to reroll'
                : activeGame === 'truth_or_dare'
                ? 'Choose Truth, Dare, or Surprise Me below'
                : activeGame === 'never_have_i_ever'
                ? 'Tap Next Statement to continue'
                : 'Draw a card or skip to find the right conversation spark'}
            </span>
            <span className="font-mono text-zinc-600">Zero wait • Instant</span>
          </div>
        </div>

        {/* Game-Specific Action Buttons */}
        {activeGame === 'original' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => rollGamePrompt('original', activeTier, undefined, 'action')}
              className={`py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-3 active:scale-95 border ${
                activeTier === 'sensory'
                  ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border-emerald-800/80 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                  : activeTier === 'playful'
                  ? 'bg-amber-950 hover:bg-amber-900 text-amber-200 border-amber-800/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'bg-rose-950 hover:bg-rose-900 text-rose-200 border-rose-800/80 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              }`}
            >
              <span className="text-xl">🎯</span>
              <span>Roll Action</span>
            </button>

            <button
              type="button"
              onClick={() => rollGamePrompt('original', activeTier, undefined, 'conversation')}
              className="py-4 px-6 rounded-xl font-semibold text-base bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-zinc-600 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-3 active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)]"
            >
              <span className="text-xl">💬</span>
              <span>Roll Conversation</span>
            </button>
          </div>
        )}

        {activeGame === 'truth_or_dare' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => rollGamePrompt('truth_or_dare', activeTier, 'truth')}
              className="py-4 px-6 rounded-xl font-semibold text-base bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-800/80 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
            >
              <span className="text-xl">🔮</span>
              <span>Roll Truth</span>
            </button>

            <button
              type="button"
              onClick={() => rollGamePrompt('truth_or_dare', activeTier, 'dare')}
              className="py-4 px-6 rounded-xl font-semibold text-base bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800/80 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]"
            >
              <span className="text-xl">⚡</span>
              <span>Roll Dare</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const randomChoice: TruthOrDareType = Math.random() > 0.5 ? 'truth' : 'dare';
                rollGamePrompt('truth_or_dare', activeTier, randomChoice);
              }}
              className="py-4 px-6 rounded-xl font-semibold text-base bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-zinc-600 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-2.5 active:scale-95"
            >
              <span className="text-xl">🎲</span>
              <span>Surprise Me</span>
            </button>
          </div>
        )}

        {activeGame === 'never_have_i_ever' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => rollGamePrompt('never_have_i_ever', activeTier)}
              className="py-4 px-6 rounded-xl font-semibold text-base bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800/80 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-3 active:scale-95 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]"
            >
              <span className="text-xl">🥂</span>
              <span>Next Statement</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const tiers: IntensityTier[] = ['sensory', 'playful', 'intense'];
                const randomTier = tiers[Math.floor(Math.random() * tiers.length)];
                setActiveTier(randomTier);
                rollGamePrompt('never_have_i_ever', randomTier);
              }}
              className="py-4 px-6 rounded-xl font-semibold text-base bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-zinc-600 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-3 active:scale-95"
            >
              <span className="text-xl">🎲</span>
              <span>Randomize Tier & Prompt</span>
            </button>
          </div>
        )}

        {/* Communication Starters Actions */}
        {activeGame === 'communication-starters' && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => rollGamePrompt('communication-starters', activeTier, undefined, undefined, commCategory)}
              className={`w-full sm:w-auto min-w-[220px] py-4 px-8 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-3 active:scale-95 border ${
                commCategory === 'playful'
                  ? 'bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border-indigo-800/80 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                  : 'bg-rose-950 hover:bg-rose-900 text-rose-200 border-rose-800/80 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              }`}
            >
              <span className="text-xl">🎴</span>
              <span>Draw Next Card</span>
            </button>

            <button
              type="button"
              onClick={() => rollGamePrompt('communication-starters', activeTier, undefined, undefined, commCategory)}
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 bg-transparent hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Skip</span>
              <span className="text-xs text-zinc-500">→</span>
            </button>
          </div>
        )}

        {/* Additional Instructions & Quick Links */}
        <div className="mt-14 pt-8 border-t border-zinc-800/70 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
          <span>Looking for longer narratives & curated rules?</span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/games" className="text-yellow-400 hover:text-yellow-300 underline transition-colors">
              Card Games →
            </Link>
            <Link href="/dashboard/roleplay" className="text-red-400 hover:text-red-300 underline transition-colors">
              Role Play →
            </Link>
            <Link href="/dashboard/literature" className="text-purple-400 hover:text-purple-300 underline transition-colors">
              Erotic Stories →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RandomizerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center font-serif text-lg">
          Loading Randomizer Games Hub...
        </div>
      }
    >
      <RandomizerHubContent />
    </Suspense>
  );
}
