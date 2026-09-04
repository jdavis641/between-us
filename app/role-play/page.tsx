"use client";

import { useState } from "react";
import Link from "next/link";

type Intensity = "mild" | "medium" | "spicy";

interface Scenario {
  id: string;
  title: string;
  teaser: string;
  intensity: Intensity;
}

const scenarios: Scenario[] = [
  {
    id: "1",
    title: "The Coffee Shop Encounter",
    teaser: "You are strangers meeting at a busy café. One of you spills coffee on the other, sparking an unexpected conversation...",
    intensity: "mild",
  },
  {
    id: "2",
    title: "First Date Jitters",
    teaser: "Recreate your very first date, but this time, you both have a secret to confess before the night ends.",
    intensity: "mild",
  },
  {
    id: "3",
    title: "The Strict Boss",
    teaser: "An after-hours meeting in the office turns into a performance review neither of you will forget.",
    intensity: "medium",
  },
  {
    id: "4",
    title: "Undercover Agents",
    teaser: "You are rival spies assigned to the same target, forced to share a single hotel room to maintain your cover.",
    intensity: "medium",
  },
  {
    id: "5",
    title: "The Secret Admirer",
    teaser: "A masked stranger at a masquerade ball has been watching you all night, and finally makes their move.",
    intensity: "spicy",
  },
  {
    id: "6",
    title: "Room Service",
    teaser: "A lonely hotel guest orders room service late at night, and the attendant is more than happy to cater to their every need.",
    intensity: "spicy",
  },
];

const intensityEmojis = {
  mild: "🔥",
  medium: "🔥🔥",
  spicy: "🔥🔥🔥",
};

const ScenarioCard = ({ scenario }: { scenario: Scenario }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-red-500/50 transition-colors flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-zinc-100">{scenario.title}</h3>
        <span className="text-xl shrink-0 ml-2" title={scenario.intensity}>
          {intensityEmojis[scenario.intensity]}
        </span>
      </div>
      <p className="text-zinc-400 text-sm leading-relaxed">{scenario.teaser}</p>
      <Link href={`/role-play/${scenario.id}`} className="mt-2 w-full py-2.5 bg-red-950/30 text-red-400 hover:bg-red-950/60 rounded-lg font-medium transition-colors text-sm border border-red-900/30 text-center block">
        Start Scenario
      </Link>
    </div>
  );
};

export default function RolePlayPage() {
  const [activeTab, setActiveTab] = useState<Intensity>("mild");

  const filteredScenarios = scenarios.filter((s) => s.intensity === activeTab);

  return (
    <main className="flex flex-col min-h-screen p-6 bg-zinc-950 text-zinc-100 max-w-md mx-auto relative">
      <header className="flex items-center mb-8 relative pt-2">
        <Link href="/dashboard" className="absolute left-0 p-2 -ml-2 text-zinc-400 hover:text-white transition-colors flex items-center justify-center rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-2xl font-bold text-center w-full flex items-center justify-center gap-2">
          <span>🎭</span> Role Play
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex bg-zinc-900 p-1 rounded-xl mb-6 shadow-inner border border-zinc-800">
        {(["mild", "medium", "spicy"] as Intensity[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all capitalize flex items-center justify-center gap-1.5 ${
              activeTab === tab
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {tab} <span>{intensityEmojis[tab]}</span>
          </button>
        ))}
      </div>

      {/* Scenarios List */}
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {filteredScenarios.length > 0 ? (
          filteredScenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))
        ) : (
          <p className="text-center text-zinc-500 mt-8">No scenarios available for this intensity yet.</p>
        )}
      </div>
    </main>
  );
}
