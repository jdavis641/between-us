"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RatingWidget from "@/components/RatingWidget";

type ReaderMode = "partner-a" | "partner-b" | "weekend-script";

interface ScenarioPayload {
  title: string;
  overview: string;
  preExperienceTasks: string[];
  partnerAPerspective: string;
  partnerBPerspective: string;
  fullScript: string | null;
}

function RolePlayContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "couple";
  
  const [activeMode, setActiveMode] = useState<ReaderMode>("partner-a");
  const [scenario, setScenario] = useState<ScenarioPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenario = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch("/api/generate/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            contentType: "roleplay", 
            category: "Roleplay Exploration", 
            playMode: mode, 
            hasScripts: true 
          })
        });

        if (!res.ok) throw new Error("Failed to generate scenario");
        
        const data = await res.json();
        setScenario(data);
      } catch (err: any) {
        console.error(err);
        setError("Our AI engine encountered an issue shaping your scenario. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchScenario();
  }, [mode]);

  return (
    <main className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 max-w-3xl mx-auto w-full relative">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4">
        <h1 className="text-xl font-bold tracking-widest uppercase text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
          Immersive Role Play
        </h1>
      </header>

      <div className="p-6 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 animate-in fade-in">
            <span className="text-4xl animate-bounce">🎭</span>
            <p className="text-zinc-400">The engine is computing your safe boundaries and drafting a unique scenario...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/20 border border-red-900/50 rounded-xl text-center">
            <p className="text-red-400">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-zinc-900 rounded-lg text-zinc-300">Retry</button>
          </div>
        ) : scenario ? (
          <div className="animate-in fade-in duration-700">
            <h2 className="text-3xl font-serif mb-6 text-zinc-100">{scenario.title}</h2>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 shadow-inner">
              <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Setting the Scene</h3>
              <p className="text-zinc-300 leading-relaxed">{scenario.overview}</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-12">
              {/* Dual Tab Toggle */}
              <div className="flex bg-zinc-900/80 border-b border-zinc-800">
                <button
                  onClick={() => setActiveMode("partner-a")}
                  className={`flex-1 py-4 text-sm font-medium transition-all ${
                    activeMode === "partner-a"
                      ? "bg-zinc-800 text-white shadow-sm border-b-2 border-red-500"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  }`}
                >
                  Partner A Lens
                </button>
                <button
                  onClick={() => setActiveMode("partner-b")}
                  className={`flex-1 py-4 text-sm font-medium transition-all ${
                    activeMode === "partner-b"
                      ? "bg-zinc-800 text-white shadow-sm border-b-2 border-orange-500"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  }`}
                >
                  Partner B Lens
                </button>
                {scenario.fullScript && (
                  <button
                    onClick={() => setActiveMode("weekend-script")}
                    className={`flex-1 py-4 text-sm font-medium transition-all ${
                      activeMode === "weekend-script"
                        ? "bg-red-950/20 text-red-300 border-b-2 border-red-500"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                    }`}
                  >
                    Theatrical Script
                  </button>
                )}
              </div>
              
              <div className="p-6 md:p-8">
                {activeMode === "partner-a" && (
                  <div className="animate-in slide-in-from-left-4 fade-in duration-500 space-y-6">
                    <div>
                      <h4 className="text-xs uppercase text-zinc-500 mb-2 font-bold tracking-wider">Secret Pre-Experience Task</h4>
                      <p className="text-zinc-300 bg-zinc-900 p-4 rounded-lg border-l-2 border-red-500">{scenario.preExperienceTasks[0] || "No task assigned."}</p>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase text-zinc-500 mb-2 font-bold tracking-wider">Your Inner Monologue & Motivation</h4>
                      <p className="text-lg font-serif leading-loose text-zinc-200 whitespace-pre-wrap">{scenario.partnerAPerspective}</p>
                    </div>
                  </div>
                )}

                {activeMode === "partner-b" && (
                  <div className="animate-in slide-in-from-right-4 fade-in duration-500 space-y-6">
                    <div>
                      <h4 className="text-xs uppercase text-zinc-500 mb-2 font-bold tracking-wider">Secret Pre-Experience Task</h4>
                      <p className="text-zinc-300 bg-zinc-900 p-4 rounded-lg border-l-2 border-orange-500">{scenario.preExperienceTasks[1] || scenario.preExperienceTasks[0] || "No task assigned."}</p>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase text-zinc-500 mb-2 font-bold tracking-wider">Your Inner Monologue & Motivation</h4>
                      <p className="text-lg font-serif leading-loose text-zinc-200 whitespace-pre-wrap">{scenario.partnerBPerspective}</p>
                    </div>
                  </div>
                )}

                {activeMode === "weekend-script" && scenario.fullScript && (
                  <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                     <h4 className="text-xs uppercase text-zinc-500 mb-4 font-bold tracking-wider text-center">Dialogue Reference</h4>
                     <p className="text-lg font-serif leading-loose text-zinc-300 whitespace-pre-wrap p-6 bg-zinc-950 border border-zinc-900 rounded-xl shadow-inner">
                       {scenario.fullScript}
                     </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-16 border-t border-zinc-900 pt-8">
              <RatingWidget contentType="roleplay" contentId={scenario.title.replace(/\s+/g, '-').toLowerCase()} />
            </div>

          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function RolePlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading experience...</div>
      </div>
    }>
      <RolePlayContent />
    </Suspense>
  );
}
