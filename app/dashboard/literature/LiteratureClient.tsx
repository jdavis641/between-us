"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import RatingWidget from "@/components/RatingWidget";
import FlameLoader from "../../components/FlameLoader";
import ReactMarkdown from "react-markdown";

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
  const [isContinuing, setIsContinuing] = useState(false);
  const [streamProgress, setStreamProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const handleConfigureNewStory = () => {
    setLoading(false);
    setIsContinuing(false);
    setScenario(null);
    setStreamProgress("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueStory = async () => {
    if (!scenario) return;
    const currentStoryText = scenario.body || scenario.overview || "";
    setIsContinuing(true);
    setError(null);
    setStreamProgress("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Session is still hydrating or expired. Please wait a second and click Continue again.');
        setIsContinuing(false);
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
          targetBoundary: targetBoundary,
          previousContent: currentStoryText
        })
      });

      if (!res.ok) {
        let errorMsg = `Failed to continue literature (${res.status})`;
        try {
          const errData = await res.json();
          if (errData?.error) {
            errorMsg = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error);
          }
        } catch {
          try {
            const errText = await res.text();
            if (errText) errorMsg = errText;
          } catch {}
        }
        if (res.status === 401) {
          errorMsg = "Auth Rejected: Session expired or missing.";
        }
        throw new Error(errorMsg);
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

      let newText = "";
      try {
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        newText = parsed.body || parsed.text || parsed.content || parsed.continuation || parsed.story || "";
      } catch (parseErr) {
        console.warn("JSON parse fallback for continuation:", parseErr);
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        newText = cleaned;
      }

      if (!newText || !newText.trim()) {
        throw new Error("No continuation text was received. Please try again.");
      }

      setScenario(prev => {
        if (!prev) return prev;
        const existingBody = prev.body || prev.overview || "";
        return {
          ...prev,
          body: existingBody ? `${existingBody}\n\n${newText}` : newText
        };
      });
    } catch (err: any) {
      console.error("Continue Story Error:", err);
      setError(err?.message || "Our AI engine encountered an issue continuing your story. Please try again.");
    } finally {
      setIsContinuing(false);
    }
  };

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

  const content = scenario?.body || '';
  const cleanContent = (content || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanOverview = (scenario?.overview || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanPartnerA = (scenario?.partnerAPerspective || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanPartnerB = (scenario?.partnerBPerspective || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');

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
              onClick={handleConfigureNewStory}
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
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-10 mb-8 shadow-inner font-serif text-lg text-zinc-300 leading-loose prose-headings:font-serif">
              <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap">
                {cleanContent}
              </ReactMarkdown>
            </div>
          ) : (
            <>
              {scenario.overview && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 shadow-inner">
                  <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Synopsis</h3>
                  <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap font-serif text-zinc-300 leading-relaxed">
                    {cleanOverview}
                  </ReactMarkdown>
                </div>
              )}

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-8">
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
                      <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap font-serif text-lg text-zinc-300 leading-loose">
                        {cleanPartnerA}
                      </ReactMarkdown>
                    </div>
                  )}

                  {activeMode === "partner-b" && (
                    <div className="animate-in fade-in">
                      <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap font-serif text-lg text-zinc-300 leading-loose">
                        {cleanPartnerB}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Story Actions: Configure New Story & Continue Existing Story */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <button
              onClick={handleConfigureNewStory}
              disabled={isContinuing}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Configure New Story
            </button>
            <button
              onClick={handleContinueStory}
              disabled={isContinuing}
              className="px-6 py-2.5 bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isContinuing ? "Extending Story..." : "Continue Existing Story"}
            </button>
          </div>

          {isContinuing && (
            <div className="mt-4 mb-8">
              <FlameLoader
                isGenerating={isContinuing}
                progressText={streamProgress.length > 0 ? "Extending story chapters..." : "Generating continuation..."}
              />
            </div>
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
