'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function GameList({ sections }: { sections: any[] }) {
  const [activeHash, setActiveHash] = useState('');

  useEffect(() => {
    const onHashChange = () => {
      setActiveHash(window.location.hash.replace('#', ''));
    };
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const getIntensityBadge = (intensity: string) => {
    switch (intensity) {
      case 'Sensory': return '🌱 Sensory';
      case 'Playful': return '🌶️ Playful';
      case 'Intense': return '🔥 Intense';
      case 'Extreme': return '🧨 Extreme';
      default: return `🌱 ${intensity || 'Sensory'}`;
    }
  };

  const visibleSections = activeHash 
    ? sections.filter(s => s.id === activeHash)
    : sections;

  return (
    <div className="space-y-16">
      {visibleSections.map((section, idx) => (
        <section key={idx} id={section.id}>
          <h2 className="text-2xl font-serif font-medium mb-6 text-zinc-200 border-b border-zinc-800 pb-4">
            {section.title}
          </h2>
          {section.data.length === 0 ? (
            <p className="text-zinc-500 italic bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 border-dashed text-center">
              No games found in this category yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.data.map((game: any) => (
                <Link href={`/dashboard/games/${game.id}`} key={game.id} className="block h-full group">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-red-900/50 transition-all duration-300 cursor-pointer h-full flex flex-col shadow-lg hover:shadow-[0_0_20px_rgba(244,63,94,0.1)] hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors">
                        {game.title}
                      </h3>
                    </div>
                    <p className="text-zinc-400 text-sm mb-6 flex-grow leading-relaxed font-light">
                      {game.description}
                    </p>
                    <div className="flex items-center text-xs font-bold text-red-500 bg-red-950/30 border border-red-900/30 w-fit px-3 py-1.5 rounded-md uppercase tracking-wider">
                      {getIntensityBadge(game.intensity)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
