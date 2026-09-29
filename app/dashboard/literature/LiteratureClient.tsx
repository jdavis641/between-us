"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import RatingWidget from "@/components/RatingWidget";

type ReaderMode = "partner-a" | "partner-b";

interface LiteraturePayload {
  title: string;
  overview: string;
  partnerAPerspective: string;
  partnerBPerspective: string;
}

export default function LiteratureClient() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") || "couple";

  const [playMode, setPlayMode] = useState(initialMode);
  const [activeMode, setActiveMode] = useState<ReaderMode>("partner-a");
  const [scenario, setScenario] = useState<LiteraturePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setScenario(null);

    try {
      const res = await fetch("/api/generate/content", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ 
          contentType: "literature",
          playMode: playMode,
          hasScripts: false
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Auth Rejected: Session expired or missing.");
        }
        throw new Error("Failed to generate literature.");
      }

      const data = await res.json();
      setScenario(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Our AI engine encountered an issue shaping your literature. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full relative">
      {!scenario && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-medium text-zinc-100 mb-4">Configure Literature</h2>
          <div className="flex flex-wrap gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="playMode" 
                value="couple" 
                checked={playMode === "couple"} 
                onChange={(e) => setPlayMode(e.target.value)}
                className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700"
              />
              <span className="text-zinc-300">Couple</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="playMode" 
                value="solo" 
                checked={playMode === "solo"} 
                onChange={(e) => setPlayMode(e.target.value)}
                className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700"
              />
              <span className="text-zinc-300">Solo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="playMode" 
                value="group" 
                checked={playMode === "group"} 
                onChange={(e) => setPlayMode(e.target.value)}
                className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700"
              />
              <span className="text-zinc-300">Group</span>
            </label>
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {loading ? "Drafting Chapter..." : "Generate Chapter"}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400">
              {error}
            </div>
          )}
        </div>
      )}

      {scenario && (
        <div className="animate-in fade-in duration-700 pb-24">
          <button 
            onClick={() => setScenario(null)}
            className="mb-8 text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-colors"
          >
            ← Configure a new chapter
          </button>
          
          <h2 className="text-3xl font-serif mb-6 text-zinc-100">{scenario.title}</h2>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 shadow-inner">
            <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Synopsis</h3>
            <p className="text-zinc-300 leading-relaxed">{scenario.overview}</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-12">
            <div className="flex bg-zinc-900/80 border-b border-zinc-800">
              <button
                onClick={() => setActiveMode("partner-a")}
                className={`flex-1 py-4 text-sm font-medium transition-all ${
                  activeMode === "partner-a" ? "bg-zinc-800 text-white shadow-sm border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                Partner A Lens
              </button>
              <button
                onClick={() => setActiveMode("partner-b")}
                className={`flex-1 py-4 text-sm font-medium transition-all ${
                  activeMode === "partner-b" ? "bg-zinc-800 text-white shadow-sm border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                Partner B Lens
              </button>
            </div>

            <div className="p-6 md:p-8">
              {activeMode === "partner-a" && (
                <div className="animate-in fade-in">
                  <p className="text-zinc-300 leading-loose whitespace-pre-wrap font-serif text-lg">{scenario.partnerAPerspective}</p>
                </div>
              )}

              {activeMode === "partner-b" && (
                <div className="animate-in fade-in">
                  <p className="text-zinc-300 leading-loose whitespace-pre-wrap font-serif text-lg">{scenario.partnerBPerspective}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Rate this Chapter</h3>
            <RatingWidget contentId={scenario.title} contentType="literature" />
          </div>
        </div>
      )}
    </div>
  );
}
