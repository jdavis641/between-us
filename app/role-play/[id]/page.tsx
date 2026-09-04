import Link from "next/link";
import Rating from "@/components/Rating";
import SuggestScenario from "@/components/SuggestScenario";

export default async function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Mock data for the specific scenario
  const scenario = {
    id: id,
    title: "The Coffee Shop Encounter",
    intensity: "mild" as const,
    preTasks: [
      "Prepare a cup of coffee or tea.",
      "Wear casual clothing, perhaps a light jacket.",
      "Set up the living room to feel like a busy café.",
      "Put on a background playlist of low-fi café sounds."
    ],
    storyboard: "You are both sitting at adjacent tables. Partner A is engrossed in a book. Partner B gets up to get a napkin, bumps the table, and spills a small amount of water (acting as coffee). This unexpected incident forces an apology and initiates the first interaction.",
    scripts: [
      { speaker: "Partner B", text: "Oh my gosh, I am so sorry! I wasn't watching where I was going." },
      { speaker: "Partner A", text: "It's alright, really. Just a little water. Though, you might owe me a new coffee." },
      { speaker: "Partner B", text: "I'd be happy to. Can I sit down while I wait for it?" },
      { speaker: "Partner A", text: "Sure. I'm [Your Name], by the way." }
    ]
  };

  return (
    <main className="flex flex-col min-h-screen p-6 bg-zinc-950 text-zinc-100 max-w-3xl mx-auto relative pb-24">
      <header className="flex items-center mb-10 relative pt-2">
        <Link href="/role-play" className="absolute left-0 p-2 -ml-2 text-zinc-400 hover:text-white transition-colors flex items-center justify-center rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-2xl font-bold text-center w-full flex items-center justify-center px-12">
          {scenario.title}
        </h1>
      </header>

      <div className="flex flex-col gap-10">
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-5 text-red-400 flex items-center gap-3 border-b border-zinc-800 pb-3">
            <span className="text-2xl">📝</span> Pre-Experience Tasks
          </h2>
          <ul className="list-disc list-inside space-y-3 text-zinc-300 ml-2">
            {scenario.preTasks.map((task, i) => (
              <li key={i} className="pl-2">{task}</li>
            ))}
          </ul>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-5 text-red-400 flex items-center gap-3 border-b border-zinc-800 pb-3">
            <span className="text-2xl">🎬</span> The Storyboard
          </h2>
          <p className="text-zinc-300 leading-relaxed text-lg">
            {scenario.storyboard}
          </p>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-5 text-red-400 flex items-center gap-3 border-b border-zinc-800 pb-3">
            <span className="text-2xl">💬</span> Scripts
          </h2>
          <div className="flex flex-col gap-5">
            {scenario.scripts.map((line, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">{line.speaker}</span>
                <p className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-zinc-200">"{line.text}"</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-16 pt-10 border-t border-zinc-800 flex flex-col items-center gap-10">
        <Rating scenarioId={scenario.id} />
        <SuggestScenario />
      </div>
    </main>
  );
}
