"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import RatingWidget from "@/components/RatingWidget";
import FlameLoader from "../../components/FlameLoader";

type ReaderMode = "partner-a" | "partner-b";

interface LiteraturePayload {
  title: string;
  body?: string;
  overview?: string;
  partnerAPerspective?: string;
  partnerBPerspective?: string;
}

export default function LiteratureClient() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") || "couple";

  const [playMode, setPlayMode] = useState(initialMode);
  const [theme, setTheme] = useState("");
  const [targetBoundary, setTargetBoundary] = useState("");
  const [activeMode, setActiveMode] = useState<ReaderMode>("partner-a");
  const [scenario, setScenario] = useState<LiteraturePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamProgress, setStreamProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setScenario(null);
    setStreamProgress("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Session is still hydrating. Please wait a second and click Generate again.');
        setLoading(false);
        return;
      }

      const res = await fetch("/api/generate/content", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ 
          contentType: "literature",
          playMode: playMode,
          hasScripts: false,
          theme: theme,
          targetBoundary: targetBoundary
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Auth Rejected: Session expired or missing.");
        }
        throw new Error("Failed to generate literature.");
      }

      const reader = res.body?.getReader();
      let rawText = "";

      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          rawText += chunk;
          setStreamProgress(prev => prev + chunk);
        }
      } else {
        rawText = await res.text();
      }

      let data: LiteraturePayload;
      try {
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        data = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn("JSON parse fallback for literature:", parseErr);
        data = {
          title: theme || "Romantic Literature",
          body: rawText
        };
      }

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
                value="solo" 
                checked={playMode === 'solo'} 
                onChange={(e) => setPlayMode(e.target.value)}
                className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700"
              />
              <span className="text-zinc-300">Solo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="playMode" 
                value="couple" 
                checked={playMode === 'couple'} 
                onChange={(e) => setPlayMode(e.target.value)}
                className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700"
              />
              <span className="text-zinc-300">Couple</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="playMode" 
                value="group" 
                checked={playMode === 'group'} 
                onChange={(e) => setPlayMode(e.target.value)}
                className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700"
              />
              <span className="text-zinc-300">Group</span>
            </label>
          </div>

          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Target Boundary Level (Optional)</label>
              <select 
                value={targetBoundary} 
                onChange={(e) => setTargetBoundary(e.target.value)}
                className="w-full md:w-1/2 bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-300 focus:outline-none focus:border-red-900"
              >
                <option value="">Default (Use Profile Baseline)</option>
                <option value="Sensory">Sensory (Gentle & Emotional)</option>
                <option value="Playful">Playful (Teasing & Fun)</option>
                <option value="Intense">Intense (High Stakes & Passionate)</option>
                <option value="Extreme">Extreme (Boundary Pushing)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Theme Suggestions (Optional)</label>
              <textarea 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g., A rainy night in a secluded cabin, masquerade ball, enemies to lovers..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-300 h-24 focus:outline-none focus:border-red-900"
              />
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {loading ? "Drafting Story..." : "Generate Story"}
          </button>

          {loading && (
            <div className="mt-6">
              <FlameLoader 
                isGenerating={loading} 
                progressText={streamProgress.length > 0 ? "Streaming story chapters..." : "Connecting to story engine..."} 
              />
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400">
              {error}
            </div>
          )}
        </div>
      )}

      {scenario && (
        <div className="animate-in fade-in duration-700 pb-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <button 
              onClick={() => setScenario(null)}
              className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-colors"
            >
              ← Configure a new story
            </button>
            <button
              onClick={() => {
                const title = scenario.title || "Untitled Story";
                const bodyText = scenario.body || scenario.overview || "";
                const blob = new Blob([`# ${title}\n\n${bodyText}\n`], { type: 'text/markdown;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-sm transition-colors w-fit"
            >
              <span>📥</span>
              Download Story
            </button>
          </div>
          
          <h2 className="text-3xl font-serif mb-6 text-zinc-100">{scenario.title}</h2>
          
          {scenario.body ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-10 mb-12 shadow-inner">
              <div className="prose prose-invert prose-red max-w-none prose-p:leading-loose prose-p:font-serif prose-p:text-lg prose-headings:font-serif">
                <p className="text-zinc-300 leading-loose whitespace-pre-wrap font-serif text-lg">{scenario.body}</p>
              </div>
            </div>
          ) : (
            <>
              {scenario.overview && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 shadow-inner">
                  <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Synopsis</h3>
                  <p className="text-zinc-300 leading-relaxed">{scenario.overview}</p>
                </div>
              )}

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
            </>
          )}
          
          <div className="pt-8 border-t border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Rate this Story</h3>
            <RatingWidget contentId={scenario.title} contentType="literature" />
          </div>
        </div>
      )}
    </div>
  );
}
