import Link from "next/link";
import RatingWidget from "@/components/RatingWidget";

interface Game {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

const categories = [
  {
    id: "card-games",
    title: "Card Games 🃏",
    games: [
      { id: "c1", title: "Truth or Dare", description: "A classic card twist on the traditional game.", emoji: "🎴" },
      { id: "c2", title: "Never Have I Ever", description: "Discover new secrets about each other.", emoji: "🃏" },
      { id: "c3", title: "Would You Rather", description: "Tough choices for couples.", emoji: "🤔" },
    ],
  },
  {
    id: "movie-night",
    title: "Movie Night Games 🍿",
    games: [
      { id: "m1", title: "Trope Bingo", description: "First to get a line of romantic tropes wins.", emoji: "🎟️" },
      { id: "m2", title: "Kiss Cam", description: "Every time they kiss on screen, you do too.", emoji: "🎬" },
    ],
  },
  {
    id: "drinking",
    title: "Drinking Games 🥂",
    games: [
      { id: "d1", title: "Sip or Strip", description: "Answer the question correctly, or pay the price.", emoji: "🍷" },
      { id: "d2", title: "Two Truths & a Shot", description: "Guess the lie, or take a sip.", emoji: "🥃" },
      { id: "d3", title: "Drunk Jenga", description: "Pull a block and do what it says.", emoji: "🧊" },
    ],
  },
  {
    id: "date-night",
    title: "Date Night Games ✨",
    games: [
      { id: "n1", title: "The 36 Questions", description: "Questions designed to build intimacy.", emoji: "💬" },
      { id: "n2", title: "Blindfold Taste Test", description: "Guess the snack while blindfolded.", emoji: "🍫" },
      { id: "n3", title: "Memory Lane", description: "Revisit your favorite memories together.", emoji: "📸" },
    ],
  },
];

const GameCard = ({ game }: { game: Game }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-orange-500/50 transition-colors flex flex-col gap-3 h-full">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-zinc-100">{game.title}</h3>
        <span className="text-2xl shrink-0 ml-2">{game.emoji}</span>
      </div>
      <p className="text-zinc-400 text-sm leading-relaxed flex-1">{game.description}</p>
      <button className="mt-2 w-full py-2.5 bg-orange-950/30 text-orange-400 hover:bg-orange-950/60 rounded-lg font-medium transition-colors text-sm border border-orange-900/30">
        Play
      </button>
    </div>
  );
};

export default function GamesPage() {
  return (
    <main className="flex flex-col min-h-screen p-6 bg-zinc-950 text-zinc-100 max-w-4xl mx-auto relative">
      <header className="flex items-center mb-10 relative pt-2">
        <Link href="/dashboard" className="absolute left-0 p-2 -ml-2 text-zinc-400 hover:text-white transition-colors flex items-center justify-center rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-2xl font-bold text-center w-full flex items-center justify-center gap-2">
          <span>🎲</span> Intimacy Games
        </h1>
      </header>

      <div className="flex flex-col gap-12 pb-12">
        {categories.map((category) => (
          <section key={category.id} id={category.id} className="scroll-mt-8">
            <h2 className="text-xl font-semibold mb-5 text-zinc-200 border-b border-zinc-800 pb-2">
              {category.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {category.games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        ))}
      </div>
      
      <div className="mt-8 border-t border-zinc-900 pt-8 pb-12">
        <RatingWidget contentType="game" contentId="games-library" />
      </div>
    </main>
  );
}
