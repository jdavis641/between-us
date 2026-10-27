'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getShuffledCardGames } from '@/utils/shuffle';

export default function GameList({ sections }: { sections: any[] }) {
  const [activeHash, setActiveHash] = useState('');
  const [displaySections, setDisplaySections] = useState(sections);
  const searchParams = useSearchParams();

  const themeParam = searchParams?.get('theme') || searchParams?.get('seasonal_tag') || '';
  const isHalloween = themeParam.toLowerCase() === 'halloween';

  // Session-based card game reshuffle & seasonal filtering
  useEffect(() => {
    setDisplaySections(
      sections.map(sec => {
        let items = sec.data || [];
        if (sec.id === 'card' && items.length > 0) {
          // Perform session-based reshuffling for card games
          items = getShuffledCardGames(items);
        }

        // Auto-filter if theme === 'halloween'
        if (isHalloween) {
          const isHalloweenItem = (g: any) =>
            g.seasonal_tag === 'halloween' ||
            g.content?.seasonal_tag === 'halloween' ||
            (g.id && g.id.toLowerCase().includes('halloween')) ||
            (g.title && g.title.toLowerCase().includes('halloween')) ||
            (g.description && g.description.toLowerCase().includes('halloween'));

          const halloweenMatches = items.filter(isHalloweenItem);
          const otherItems = items.filter((g: any) => !isHalloweenItem(g));
          // Place Halloween themed games at the front of each section
          items = [...halloweenMatches, ...otherItems];
        }

        return { ...sec, data: items };
      })
    );
  }, [sections, isHalloween]);

  // Smooth-scroll and highlight themed game card on load
  useEffect(() => {
    if (isHalloween) {
      const timer = setTimeout(() => {
        const target = document.getElementById('halloween-featured-game') || document.querySelector('[data-theme="halloween"]');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isHalloween, displaySections]);

  useEffect(() => {
    const handleHashChange = () => setActiveHash(window.location.hash);
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const normalizeId = (id: string) => {
    const clean = id.replace(/^#/, '');
    if (clean === 'date' || clean === 'date_night') return 'date_night';
    return clean;
  };

  const activeNorm = normalizeId(activeHash);

  const matchedSections = activeNorm 
    ? displaySections.filter(s => normalizeId(s.id) === activeNorm)
    : displaySections;

  const filteredSections = matchedSections.length > 0 ? matchedSections : displaySections;
  
  const getIntensityBadge = (intensity?: string) => {
    switch ((intensity || '').toLowerCase()) {
      case 'sensory': return '🌱 Sensory';
      case 'playful': return '🌶️ Playful';
      case 'intense': return '🔥 Intense';
      case 'extreme': return '🧨 Extreme';
      default: return intensity ? `🌱 ${intensity}` : '🌱 Sensory';
    }
  };

  const getRules = (game: any): string[] => {
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
  };

  let hasTaggedFirstHalloween = false;

  return (
    <div className="space-y-16">
      {filteredSections.map((section, idx) => (
        <section key={idx} id={section.id} className="scroll-mt-24">
          <h2 className="text-2xl font-serif font-medium mb-6 text-zinc-200 border-b border-zinc-800 pb-4 flex items-center justify-between">
            <span>{section.title}</span>
            {isHalloween && (
              <span className="text-xs font-sans text-orange-400 bg-orange-950/40 border border-orange-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span>🎃</span> Halloween Filter Active
              </span>
            )}
          </h2>
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
                      isGameHalloween
                        ? 'bg-zinc-900/95 border-2 border-orange-500/80 shadow-[0_0_25px_rgba(249,115,22,0.25)] ring-2 ring-orange-500/30 hover:border-orange-400'
                        : 'bg-zinc-900 border border-zinc-800 hover:border-red-900/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                    }`}>
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <h3 className={`text-xl font-bold transition-colors ${
                          isGameHalloween ? 'text-orange-200 group-hover:text-orange-300' : 'group-hover:text-red-400'
                        }`}>
                          {game.title}
                        </h3>
                        {isGameHalloween && (
                          <span className="shrink-0 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-950/70 border border-orange-600/70 text-orange-300 flex items-center gap-1">
                            <span>🎃</span> Halloween
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-sm mb-6 flex-grow leading-relaxed font-light">
                        {game.description}
                      </p>

                      {rules.length > 0 && (
                        <div className="mb-4 text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${isGameHalloween ? 'bg-orange-500' : 'bg-rose-500'}`}></span>
                          <span>{rules.length} Interactive Rules</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-auto">
                        <div className="flex items-center text-xs font-bold text-red-500 bg-red-950/30 border border-red-900/30 w-fit px-3 py-1.5 rounded-md uppercase tracking-wider">
                          {getIntensityBadge(game.intensity)}
                        </div>
                        <span className={`text-xs transition-colors font-medium ${
                          isGameHalloween ? 'text-orange-400 group-hover:text-orange-300 font-semibold' : 'text-zinc-500 group-hover:text-zinc-300'
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
      ))}
    </div>
  );
}
