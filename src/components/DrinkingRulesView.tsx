'use client';

import { useState, useMemo } from 'react';
import { DrinkingPace, adaptRuleForPace } from '@/lib/movie-game-generator';

interface DrinkingRulesViewProps {
  initialRules: string[];
  category: string;
  intensity?: string;
}

export default function DrinkingRulesView({
  initialRules,
  category,
  intensity
}: DrinkingRulesViewProps) {
  const [drinkingPace, setDrinkingPace] = useState<DrinkingPace>('medium');
  const [checkedRules, setCheckedRules] = useState<Record<number, boolean>>({});
  const [sipCount, setSipCount] = useState(0);

  const isDrinkingCategory = (category || '').toLowerCase().includes('drink') ||
    (category || '').toLowerCase().includes('movie');

  // Dynamically adapt rules when drinking pace changes
  const adaptedRules = useMemo(() => {
    if (!isDrinkingCategory) return initialRules;
    return initialRules.map((rule) => adaptRuleForPace(rule, drinkingPace));
  }, [initialRules, drinkingPace, isDrinkingCategory]);

  const toggleCheck = (idx: number) => {
    setCheckedRules((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const paceDetails = {
    light: {
      label: 'Light Drinking',
      icon: '🍺',
      summary: 'Conservative Pace',
      description: 'Sips are conservative (1 sip for major triggers, 2 sips for rare moments; non-alcoholic sips or hydration breaks suggested).'
    },
    medium: {
      label: 'Medium Drinking',
      icon: '🥂',
      summary: 'Balanced Party Pace',
      description: '1 sip for common tropes, 2 sips for standout moments, finish drink for critical plot climaxes.'
    },
    heavy: {
      label: 'Heavy Drinking',
      icon: '🔥',
      summary: 'High-Frequency Escalation',
      description: 'Frequent 1-2 sip cues, shots/chugs on dramatic reveals, heavy penalties for skipped questions/dares.'
    }
  };

  return (
    <div className="space-y-6">
      {/* 3-way Segmented Control / Radio Selector for Drinking Games */}
      {isDrinkingCategory && (
        <div className="bg-zinc-900/90 border-2 border-zinc-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🍷</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                  Select Drinking Intensity Level
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Adjusts frequency, volume, and sip penalties in real time.
              </p>
            </div>

            {/* 3-way Segmented Control */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setDrinkingPace('light')}
                className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 ${
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
                className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 ${
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
                className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 ${
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

          {/* Active Pace Description Banner */}
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            drinkingPace === 'light'
              ? 'bg-amber-950/20 border-amber-600/40 text-amber-300'
              : drinkingPace === 'heavy'
                ? 'bg-red-950/25 border-red-600/50 text-red-300'
                : 'bg-rose-950/20 border-rose-600/40 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-base">{paceDetails[drinkingPace].icon}</span>
              <span>
                <strong className="font-semibold">{paceDetails[drinkingPace].summary}:</strong>{' '}
                {paceDetails[drinkingPace].description}
              </span>
            </div>

            {/* Quick Sip Tracker */}
            <div className="flex items-center gap-1.5 shrink-0 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-200">
              <span className="text-[11px] text-zinc-400 font-medium">Sips:</span>
              <span className="font-bold text-white text-xs">{sipCount}</span>
              <button
                type="button"
                onClick={() => setSipCount(Math.max(0, sipCount - 1))}
                className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center justify-center font-bold"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setSipCount(sipCount + 1)}
                className="w-5 h-5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules & Content List */}
      <div className="space-y-4 select-none">
        <h2 className="text-2xl font-serif font-medium text-zinc-100 flex items-center justify-between">
          <span>How to Play</span>
          {isDrinkingCategory && (
            <span className="text-xs font-sans font-normal text-zinc-400 flex items-center gap-1.5">
              <span>Pace:</span>
              <span className="capitalize font-semibold text-rose-400">{drinkingPace}</span>
            </span>
          )}
        </h2>

        {adaptedRules && adaptedRules.length > 0 ? (
          <ol className="space-y-4 list-decimal list-inside">
            {adaptedRules.map((rule: string, index: number) => {
              const isChecked = Boolean(checkedRules[index]);
              return (
                <li
                  key={index}
                  onClick={() => toggleCheck(index)}
                  className={`flex space-x-4 p-5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    isChecked
                      ? 'bg-zinc-950/60 border-zinc-800/60 text-zinc-500 line-through'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <span className={`font-bold text-lg leading-none ${
                    isChecked ? 'text-zinc-600' : 'text-red-500'
                  }`}>
                    {index + 1}.
                  </span>
                  <span className="font-light leading-relaxed flex-grow">
                    {rule}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="text-zinc-400 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed text-center">
            <p className="font-medium text-zinc-300">No rules found.</p>
            <p className="text-sm text-zinc-500 mt-1">No specific rules or instructions could be parsed for this scenario.</p>
          </div>
        )}
      </div>
    </div>
  );
}
