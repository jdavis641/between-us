'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RANDOMIZER_DATA, IntensityTier, RandomizerType } from '../../lib/randomizer-data';

export default function RandomizerPage() {
  const [activeTier, setActiveTier] = useState<IntensityTier>('playful');
  const [activeType, setActiveType] = useState<RandomizerType>('action');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rollCount, setRollCount] = useState(0);

  // Initialize with a playful action on mount
  useEffect(() => {
    const initialPool = RANDOMIZER_DATA.playful.actions;
    const randomIndex = Math.floor(Math.random() * initialPool.length);
    setCurrentPrompt(initialPool[randomIndex]);
  }, []);

  const rollPrompt = (type: RandomizerType, tier: IntensityTier = activeTier) => {
    setIsAnimating(true);
    setActiveType(type);

    const pool = type === 'action' 
      ? RANDOMIZER_DATA[tier].actions 
      : RANDOMIZER_DATA[tier].starters;

    let nextIndex = Math.floor(Math.random() * pool.length);
    // Avoid immediate duplicate if pool has multiple entries
    if (pool.length > 1 && pool[nextIndex] === currentPrompt) {
      nextIndex = (nextIndex + 1) % pool.length;
    }

    const selected = pool[nextIndex];

    setTimeout(() => {
      setCurrentPrompt(selected);
      setRollCount((prev) => prev + 1);
      setIsAnimating(false);
    }, 120);
  };

  const handleTierChange = (newTier: IntensityTier) => {
    setActiveTier(newTier);
    rollPrompt(activeType, newTier);
  };

  const handleCopy = async () => {
    if (!currentPrompt) return;
    try {
      await navigator.clipboard.writeText(currentPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const tierMeta = RANDOMIZER_DATA[activeTier];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-rose-500/30">
      <div className="max-w-3xl mx-auto p-6 md:p-12 pb-32">
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
              Intimacy Randomizer
            </h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base font-light leading-relaxed">
            Fast, zero-wait intimate sparks, daring challenges, and candid conversation starters calibrated to your chosen intensity.
          </p>
        </header>

        {/* 3-Way Tier Segmented Control */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
              Select Intensity Tier
            </label>
            <span className="text-xs text-zinc-500 font-medium">
              {rollCount > 0 ? `${rollCount} prompts explored` : 'Instant generator'}
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
        </div>

        {/* Prominent Styled Card */}
        <div
          className={`relative bg-zinc-900 border rounded-2xl p-8 md:p-12 mb-8 shadow-2xl transition-all duration-300 flex flex-col justify-between min-h-[260px] md:min-h-[280px] ${
            activeTier === 'sensory'
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
              <span className="text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                {activeType === 'action' ? '🎯 Intimate Action' : '💬 Conversation Starter'}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 bg-zinc-800/60 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700/50 transition-colors cursor-pointer"
              title="Copy to clipboard"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Card Main Prompt Text */}
          <div className="my-auto py-4">
            <div
              className={`transition-all duration-150 transform ${
                isAnimating ? 'opacity-0 scale-98 translate-y-1' : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              <p className="text-xl md:text-2xl font-serif text-zinc-100 leading-relaxed font-normal tracking-wide">
                "{currentPrompt}"
              </p>
            </div>
          </div>

          {/* Card Bottom Meta */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-800/70 text-xs text-zinc-500">
            <span>Tap either button below to reroll instantly</span>
            <span className="font-mono text-zinc-600">Zero wait • Instant</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => rollPrompt('action')}
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
            onClick={() => rollPrompt('conversation')}
            className="py-4 px-6 rounded-xl font-semibold text-base bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-zinc-600 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center gap-3 active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)]"
          >
            <span className="text-xl">💬</span>
            <span>Roll Conversation</span>
          </button>
        </div>

        {/* Additional Instructions & Quick Links */}
        <div className="mt-14 pt-8 border-t border-zinc-800/70 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
          <span>Looking for longer narratives?</span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/roleplay" className="text-red-400 hover:text-red-300 underline transition-colors">
              Role Play Scenarios →
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
