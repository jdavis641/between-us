import Link from "next/link";

export const metadata = {
  title: "Halloween Spotlight | Between Us",
  description: "Spooky and gothic intimacy experiences, erotic literature, roleplays, and games.",
};

export default function HalloweenSpotlightPage() {
  const literaturePrompts = [
    {
      title: "The Masquerade of Shadows",
      trope: "Anonymous Masquerade",
      description: "A decadent midnight masquerade at a secluded gothic manor where whispered identities remain hidden under velvet masks and flickering candlelight.",
      prompt: "The Masquerade of Shadows: A decadent midnight masquerade at a secluded gothic manor with velvet masks and flickering candlelight.",
    },
    {
      title: "Midnight Storm at Blackwood Manor",
      trope: "Forced Proximity & Storm",
      description: "Stranded together in an ancient Victorian library while thunder shakes the leaded windows, damp clothes and roaring hearths giving way to unspoken cravings.",
      prompt: "Midnight Storm at Blackwood Manor: Stranded in a stormy Victorian library with roaring hearths, ancient secrets, and simmering restraint.",
    },
    {
      title: "The Vampire's Vow",
      trope: "Immortal Romance",
      description: "An eternal, slow-burn romantic reckoning under an ominous harvest full moon, where electric touch and forbidden vows bridge the centuries.",
      prompt: "The Vampire's Vow: An immortal, slow-burn romantic reckoning under a harvest full moon with eternal devotion and electrifying touch.",
    },
  ];

  const roleplayScenarios = [
    {
      title: "Master & Governess of Ravenloft",
      mode: "Sensual Dynamic",
      description: "A strict yet intoxicating encounter in a moonlit manor drawing room with velvet blindfolds and whispered commands.",
      prompt: "Master & Governess of Ravenloft: A strict yet intoxicating sensual dynamic in a moonlit manor with whispered commands.",
    },
    {
      title: "The Midnight Witching Hour",
      mode: "Ritual & Hypnotic",
      description: "A clandestine spellbound ritual where every breath, pulse, and caress is charged with hypnotic devotion and candlelight.",
      prompt: "The Midnight Witching Hour: A clandestine spellbound ritual charged with hypnotic devotion, incense, and sensory touch.",
    },
    {
      title: "Haunted Speakeasy Lovers",
      mode: "1920s Prohibition Ghost",
      description: "Two strangers locked in an underground 1920s jazz cellar after hours as ghostly music echoes faintly through the velvet shadows.",
      prompt: "Haunted Speakeasy Lovers: Strangers locked in an underground 1920s jazz lounge after hours as eerie melodies echo through the shadows.",
    },
  ];

  const halloweenGames = [
    {
      title: "Costume Confessions & Wicked Dares",
      category: "Card Game",
      description: "Draw cards testing your hidden secrets, wicked desires, and escalating physical dares in the dark.",
    },
    {
      title: "Pumpkin Truth or Strip Dare",
      category: "Party Game",
      description: "A spicy seasonal twist on classic party games where every refusal brings playful romantic penalties.",
    },
    {
      title: "Midnight Tarot & Sensory Touch",
      category: "Sensory Game",
      description: "Draw tarot cards that dictate sensory touch, temperature play, and boundary exploration for two.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500/30 p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-400 hover:text-orange-400 transition-colors inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Dashboard
          </Link>
        </div>

        {/* Hero Spotlight Header */}
        <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-br from-orange-950/80 via-zinc-900 to-amber-950/40 border border-orange-500/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-8xl opacity-15 pointer-events-none select-none">
            🎃
          </div>
          <div className="relative z-10 space-y-4">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-full">
              Seasonal Spotlight
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-white tracking-tight">
              Halloween: Shadows, Whispers & Gothic Intimacy
            </h1>
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl leading-relaxed font-light">
              Immerse yourself in haunting romance. From stormy Victorian libraries and masquerade balls to wicked card games and hypnotic roleplay.
            </p>
          </div>
        </div>

        {/* Section 1: Gothic Literature */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-2xl font-serif font-medium text-zinc-100 flex items-center gap-3">
                <span>🕯️</span> Gothic Erotic Stories
              </h2>
              <p className="text-sm text-zinc-400 mt-1 font-light">
                Sensory, slow-burn narratives crafted for candlelit evenings.
              </p>
            </div>
            <Link
              href="/dashboard/literature?theme=halloween"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow transition-colors shrink-0"
            >
              Generate Story &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {literaturePrompts.map((item, idx) => (
              <Link
                key={idx}
                href={`/dashboard/literature?theme=halloween&prompt=${encodeURIComponent(item.prompt)}`}
                className="group p-6 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-orange-500/60 hover:bg-zinc-900 transition-all flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 bg-orange-950/40 border border-orange-900/60 px-2.5 py-0.5 rounded-full inline-block">
                    {item.trope}
                  </span>
                  <h3 className="text-lg font-serif font-medium text-zinc-100 group-hover:text-orange-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-orange-400 group-hover:text-orange-300">
                  <span>Start Reading</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 2: Spooky Roleplay Scenarios */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-2xl font-serif font-medium text-zinc-100 flex items-center gap-3">
                <span>🎭</span> Halloween Roleplay Scenarios
              </h2>
              <p className="text-sm text-zinc-400 mt-1 font-light">
                Dual-perspective guided encounters charged with suspense and intensity.
              </p>
            </div>
            <Link
              href="/dashboard/roleplay?theme=halloween"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow transition-colors shrink-0"
            >
              Launch Roleplay &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roleplayScenarios.map((item, idx) => (
              <Link
                key={idx}
                href={`/dashboard/roleplay?theme=halloween&prompt=${encodeURIComponent(item.prompt)}`}
                className="group p-6 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-orange-500/60 hover:bg-zinc-900 transition-all flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2.5 py-0.5 rounded-full inline-block">
                    {item.mode}
                  </span>
                  <h3 className="text-lg font-serif font-medium text-zinc-100 group-hover:text-orange-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-orange-400 group-hover:text-orange-300">
                  <span>Enter Scenario</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 3: Halloween Card & Party Games */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-2xl font-serif font-medium text-zinc-100 flex items-center gap-3">
                <span>🃏</span> Spooky Games & Party Dares
              </h2>
              <p className="text-sm text-zinc-400 mt-1 font-light">
                Interactive card decks and dice games tailored for Halloween night.
              </p>
            </div>
            <Link
              href="/dashboard/games?theme=halloween"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow transition-colors shrink-0"
            >
              Browse Games &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {halloweenGames.map((item, idx) => (
              <Link
                key={idx}
                href="/dashboard/games?theme=halloween"
                className="group p-6 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-orange-500/60 hover:bg-zinc-900 transition-all flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/40 border border-rose-900/60 px-2.5 py-0.5 rounded-full inline-block">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-serif font-medium text-zinc-100 group-hover:text-orange-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-orange-400 group-hover:text-orange-300">
                  <span>Play Game</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
