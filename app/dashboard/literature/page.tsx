"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RatingWidget from "@/components/RatingWidget";

type ReaderMode = "partner-a" | "partner-b" | "weekend-script";

function LiteratureReaderContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "couple";

  const [activeMode, setActiveMode] = useState<ReaderMode>("partner-a");
  const [scenarioText, setScenarioText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestScenario = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/generate/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            contentType: "literature", 
            category: "Erotic Fantasy", 
            playMode: mode, 
            hasScripts: false 
          })
        });

        if (!res.ok) throw new Error("Failed to fetch literature");
        
        const data = await res.json();
        
        // Construct the readable text format from the JSON schema
        let compiledText = `**${data.title}**\n\n`;
        compiledText += `**Context & Setting:**\n${data.overview}\n\n`;
        
        if (activeMode === "partner-a") {
          compiledText += `**Your Perspective:**\n${data.partnerAPerspective}\n\n`;
          if (data.preExperienceTasks && data.preExperienceTasks[0]) {
            compiledText += `*Secret Task: ${data.preExperienceTasks[0]}*`;
          }
        } else if (activeMode === "partner-b") {
          compiledText += `**Your Perspective:**\n${data.partnerBPerspective}\n\n`;
          if (data.preExperienceTasks && data.preExperienceTasks[1]) {
            compiledText += `*Secret Task: ${data.preExperienceTasks[1]}*`;
          }
        } else {
          compiledText += `**Live Script / Flow:**\n${data.fullScript || "No explicit script provided for this scenario. Let the moment guide you."}`;
        }
        
        setScenarioText(compiledText);
      } catch (err) {
        console.error(err);
        setScenarioText("The engine is currently resting. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestScenario();
  }, [activeMode, mode]);

  return (
    <main className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 max-w-2xl mx-auto w-full relative">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
           <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <span className="font-serif italic text-zinc-300">The Weekly Release</span>
        <div className="w-20"></div> {/* Spacer for centering */}
      </header>

      <div className="p-6 pb-24">
        {/* Immersive Reader Toggles */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl mb-8 border border-zinc-800 shadow-inner">
          <button
            onClick={() => setActiveMode("partner-a")}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeMode === "partner-a"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Partner A Lens
          </button>
          <button
            onClick={() => setActiveMode("partner-b")}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeMode === "partner-b"
                ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Partner B Lens
          </button>
          <button
            onClick={() => setActiveMode("weekend-script")}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeMode === "weekend-script"
                ? "bg-red-950/40 text-red-200 border border-red-900/50"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Live Script
          </button>
        </div>

        {/* Reader Canvas */}
        <article className="prose prose-invert prose-zinc prose-p:leading-loose prose-p:text-zinc-300 prose-strong:text-zinc-100 max-w-none">
          {loading ? (
            <div className="flex flex-col gap-4 animate-pulse mt-10">
              <div className="h-4 bg-zinc-900 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-900 rounded w-full"></div>
              <div className="h-4 bg-zinc-900 rounded w-5/6"></div>
              <div className="h-4 bg-zinc-900 rounded w-full mt-4"></div>
              <div className="h-4 bg-zinc-900 rounded w-4/5"></div>
            </div>
          ) : (
            <div className="font-serif text-lg leading-relaxed space-y-6 whitespace-pre-wrap animate-in fade-in duration-700">
              {scenarioText}
              
              {scenarioText && scenarioText !== "The engine is currently resting. Please try again later." && (
                <div className="mt-16 border-t border-zinc-900 pt-8">
                  <RatingWidget contentType="literature" contentId="weekly-scenario" />
                </div>
              )}
            </div>
          )}
        </article>
      </div>
    </main>
  );
}

export default function LiteratureReaderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading experience...</div>
      </div>
    }>
      <LiteratureReaderContent />
    </Suspense>
  );
}
