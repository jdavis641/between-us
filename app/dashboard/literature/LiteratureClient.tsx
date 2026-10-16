"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import RatingWidget from "@/components/RatingWidget";
import FlameLoader from "@/components/FlameLoader";
import ReactMarkdown from "react-markdown";
import ErrorBoundary, { safeMarkdownString } from "@/components/ErrorBoundary";

type ReaderMode = "partner-a" | "partner-b";

interface LiteraturePayload {
  title: string;
  body?: string;
  overview?: string;
  partnerAPerspective?: string;
  partnerBPerspective?: string;
}

interface StoryPreview {
  id: string;
  title: string;
  trope: string;
  premise: string;
}

export function extractStreamingMarkdown(raw: string): { title?: string; body: string } {
  if (!raw || !raw.trim()) return { body: "" };

  try {
    const cleaned = raw.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    const body = parsed.body || parsed.text || parsed.content || parsed.story || "";
    if (body) {
      return { title: parsed.title, body: String(body).replace(/\\n/g, '\n').replace(/\\"/g, '"') };
    }
  } catch {}

  const titleMatch = raw.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"?/);
  const title = titleMatch ? titleMatch[1].replace(/\\"/g, '"') : undefined;

  const bodyMatch = raw.match(/"(?:body|text|content|story|continuation)"\s*:\s*"([\s\S]*)/i);
  if (bodyMatch && bodyMatch[1]) {
    let partial = bodyMatch[1];
    partial = partial.replace(/"\s*,\s*"[^"]*"\s*:\s*[\s\S]*$/, '');
    partial = partial.replace(/"\s*}\s*$/, '');
    partial = partial.replace(/"$/, '');
    const clean = partial
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\t/g, '\t');
    return { title, body: clean };
  }

  const cleaned = raw
    .replace(/^\{?\s*"title"\s*:\s*"[^"]*",?\s*"(?:body|text)"\s*:\s*"?/i, '')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"');
  return { title, body: cleaned };
}

export default function LiteratureClient() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") || "couple";

  const [playMode, setPlayMode] = useState(initialMode);
  const [theme, setTheme] = useState("");
  const [targetBoundary, setTargetBoundary] = useState("");
  const [pacing, setPacing] = useState("Slow Burn");
  const [storyLength, setStoryLength] = useState("Novella (1-3 Minute Load Time)");
  const [previews, setPreviews] = useState<StoryPreview[] | null>(null);
  const [activeTrope, setActiveTrope] = useState<StoryPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

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
    setPreviews(null);
    setActiveTrope(null);
    setStreamProgress("");
    setError(null);
    setPreviewError(null);
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
          previousContent: currentStoryText,
          existingStory: currentStoryText,
          pacing: pacing,
          storyLength: storyLength,
          activeTrope: activeTrope
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

      if (!rawText || !rawText.trim()) {
        throw new Error("No response received from the server. Please try again.");
      }

      let newText = "";
      try {
        const cleaned = rawText.trim()
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.error) {
          throw new Error(typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error));
        }

        newText = parsed.text || parsed.body || parsed.content || parsed.continuation || parsed.story || parsed.data?.text || parsed.data?.body || "";

        if (!newText && typeof parsed === 'object' && parsed !== null) {
          for (const key of Object.keys(parsed)) {
            if (typeof parsed[key] === 'string' && parsed[key].length > 20) {
              newText = parsed[key];
              break;
            }
          }
        }
      } catch (parseErr: any) {
        if (parseErr?.message && !parseErr.message.includes("JSON")) {
          throw parseErr;
        }
        console.warn("JSON parse fallback for continuation:", parseErr);
        const matchBody = rawText.match(/"(?:text|body|content|continuation)"\s*:\s*"([\s\S]*)/i);
        if (matchBody && matchBody[1]) {
          let extracted = matchBody[1];
          extracted = extracted.replace(/"\s*}\s*$/, '').replace(/"\s*,\s*"[^"]+"\s*:\s*[\s\S]*$/, '');
          newText = extracted.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
        } else {
          newText = rawText.trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```markdown\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
        }
      }

      if (!newText || !newText.trim()) {
        throw new Error("No continuation text was received. Please try again.");
      }

      setScenario(prev => {
        if (!prev) return prev;
        const existingBody = prev.body || prev.overview || "";
        return {
          ...prev,
          body: existingBody ? `${existingBody}\n\n${newText.trim()}` : newText.trim()
        };
      });
    } catch (err: any) {
      console.error("Continue Story Error:", err);
      setError(err?.message || "Our AI engine encountered an issue continuing your story. Please try again.");
    } finally {
      setIsContinuing(false);
    }
  };

  const handleGeneratePreviews = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setError(null);
    setActiveTrope(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPreviewError('Session is still hydrating or expired. Please wait a second and try again.');
        setPreviewLoading(false);
        return;
      }

      const res = await fetch("/api/generate/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          playMode,
          targetBoundary,
          theme,
          pacing,
          storyLength
        })
      });

      if (!res.ok) {
        let errorMsg = `Failed to generate previews (${res.status})`;
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

      const data = await res.json();
      if (data.previews && Array.isArray(data.previews) && data.previews.length > 0) {
        setPreviews(data.previews);
      } else {
        throw new Error("No story previews returned from engine.");
      }
    } catch (err: any) {
      console.error("Preview Generation Error:", err);
      setPreviewError(err?.message || "Our AI engine encountered an issue shaping story previews. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!activeTrope) {
      setError("Please select a story trope preview to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    setScenario(null);
    setStreamProgress("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Session is still hydrating. Please wait a second and click Generate again.');
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
          targetBoundary: targetBoundary,
          pacing: pacing,
          storyLength: storyLength,
          activeTrope: activeTrope
        })
      });

      if (!res.ok) {
        let errorMsg = `Failed to generate literature (${res.status})`;
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

      let data: LiteraturePayload;
      try {
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        data = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn("JSON parse fallback for literature:", parseErr);
        data = {
          title: (activeTrope && activeTrope.title) || theme || "Romantic Literature",
          body: rawText
        };
      }

      setScenario(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Our AI engine encountered an issue shaping your literature. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const content = scenario?.body || '';
  const cleanContent = (content || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanOverview = (scenario?.overview || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanPartnerA = (scenario?.partnerAPerspective || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanPartnerB = (scenario?.partnerBPerspective || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const streamingStory = extractStreamingMarkdown(streamProgress);

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

          <div className="mb-6 space-y-5">
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

            {/* Pacing Radio Button Group */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Pacing</label>
              <div className="flex flex-wrap gap-4">
                {["Slow Burn", "Medium Burn", "Quick Burn"].map((pace) => (
                  <label key={pace} className="flex items-center gap-2 cursor-pointer bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-2.5 transition-colors">
                    <input 
                      type="radio" 
                      name="pacing" 
                      value={pace} 
                      checked={pacing === pace} 
                      onChange={(e) => {
                        const newPacing = e.target.value;
                        setPacing(newPacing);
                        if (newPacing === "Slow Burn" && storyLength.includes("Short Story")) {
                          setStoryLength("Novella (1-3 Minute Load Time)");
                        }
                      }}
                      className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700 focus:ring-red-600"
                    />
                    <span className="text-sm text-zinc-300 font-medium">{pace}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Story Length Radio Button Group */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Story Length</label>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                {[
                  "Short Story (Under 1 Minute Load Time)",
                  "Novella (1-3 Minute Load Time)",
                  "Novel (3+ Minute Load Time)"
                ].map((len) => {
                  const isShortStory = len.includes("Short Story");
                  const isOptionDisabled = isShortStory && pacing === "Slow Burn";

                  return (
                    <label 
                      key={len} 
                      className={`flex items-center gap-2 rounded-lg px-4 py-2.5 transition-colors ${
                        isOptionDisabled 
                          ? "opacity-50 cursor-not-allowed bg-zinc-950/40 border border-zinc-900 text-zinc-500" 
                          : "cursor-pointer bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="storyLength" 
                        value={len} 
                        disabled={isOptionDisabled}
                        checked={storyLength === len} 
                        onChange={(e) => setStoryLength(e.target.value)}
                        className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm font-medium">
                        {len}
                        {isOptionDisabled && (
                          <span className="block sm:inline sm:ml-2 text-xs text-zinc-500 font-normal">
                            (Unavailable for Slow Burn)
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          
          {!previews ? (
            <div>
              <button
                onClick={handleGeneratePreviews}
                disabled={previewLoading}
                className="w-full md:w-auto px-8 py-3 bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {previewLoading ? "Crafting Previews..." : "Generate Preview"}
              </button>

              {previewLoading && (
                <div className="mt-6">
                  <FlameLoader 
                    isGenerating={previewLoading} 
                    progressText="Crafting story premises & tropes..." 
                  />
                </div>
              )}

              {previewError && (
                <div className="mt-4 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400">
                  {previewError}
                </div>
              )}
            </div>
          ) : (
            <div className="pt-6 border-t border-zinc-800 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-zinc-100 mb-1">Select a Story Trope & Premise</h3>
                <p className="text-sm text-zinc-400">
                  Choose one of the 3 generated concepts below to enable full story generation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {previews.map((preview, idx) => {
                  const isSelected = activeTrope?.id === preview.id;
                  return (
                    <div
                      key={preview.id || idx}
                      onClick={() => setActiveTrope(preview)}
                      className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-red-950/30 border-red-600 ring-2 ring-red-600/40 shadow-lg text-white"
                          : "bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full ${
                            isSelected ? "bg-red-900/80 text-red-200 border border-red-700" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}>
                            {preview.trope || "Core Trope"}
                          </span>
                          {isSelected && (
                            <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                              ✓ Selected
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-serif font-medium text-zinc-100 mb-2">{preview.title}</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed font-sans">{preview.premise}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-zinc-800/60 text-xs text-zinc-500">
                        {isSelected ? "Selected for generation" : "Click to select trope"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons: Generate Story (disabled until trope selected) & Generate New Previews */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleGenerate}
                  disabled={!activeTrope || loading}
                  className="px-8 py-3 bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? "Drafting Story..." : "Generate Story"}
                </button>
                <button
                  onClick={handleGeneratePreviews}
                  disabled={previewLoading || loading}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors"
                >
                  {previewLoading ? "Crafting New Previews..." : "Generate New Previews"}
                </button>
              </div>

              {loading && streamProgress.length === 0 && (
                <div className="mt-6">
                  <FlameLoader 
                    isGenerating={loading} 
                    progressText="Connecting to story engine & establishing narrative stream..." 
                  />
                </div>
              )}

              {loading && streamProgress.length > 0 && (
                <div className="mt-8 space-y-6 animate-in fade-in duration-300">
                  {/* Real-time Streaming Status Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-red-900/50 p-4 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                      </span>
                      <span className="text-sm font-semibold text-red-200">
                        Streaming Story Chapters in Real-Time...
                      </span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                      ~{Math.round(streamProgress.split(/\s+/).filter(Boolean).length)} words streamed
                    </span>
                  </div>

                  {/* Real-time Streamed Content Canvas */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
                    {streamingStory.title && (
                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100 border-b border-zinc-800 pb-4">
                        {streamingStory.title}
                      </h3>
                    )}

                    <div className="prose prose-invert max-w-none text-zinc-200 font-serif leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
                      <ErrorBoundary fallbackContent={streamingStory.body || streamProgress}>
                        <ReactMarkdown>
                          {safeMarkdownString(streamingStory.body || streamProgress)}
                        </ReactMarkdown>
                      </ErrorBoundary>
                      <span className="inline-block w-2 h-5 bg-red-500 ml-1 animate-pulse align-middle" />
                    </div>
                  </div>
                </div>
              )}

              {previewLoading && (
                <div className="mt-6">
                  <FlameLoader 
                    isGenerating={previewLoading} 
                    progressText="Crafting 3 new story previews..." 
                  />
                </div>
              )}

              {previewError && (
                <div className="mt-4 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400">
                  {previewError}
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400">
                  {error}
                </div>
              )}
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
          
          {activeTrope && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-red-950/60 text-red-200 border border-red-800">
                {activeTrope.trope}
              </span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400">{pacing}</span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400">{storyLength}</span>
            </div>
          )}

          <h2 className="text-3xl font-serif mb-6 text-zinc-100">{scenario.title}</h2>
          
          {scenario.body ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-10 mb-8 shadow-inner font-serif text-lg text-zinc-300 leading-loose prose-headings:font-serif">
              <ErrorBoundary fallbackContent={cleanContent}>
                <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap">
                  {safeMarkdownString(cleanContent)}
                </ReactMarkdown>
              </ErrorBoundary>
            </div>
          ) : (
            <>
              {scenario.overview && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 shadow-inner">
                  <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Synopsis</h3>
                  <ErrorBoundary fallbackContent={cleanOverview}>
                    <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap font-serif text-zinc-300 leading-relaxed">
                      {safeMarkdownString(cleanOverview)}
                    </ReactMarkdown>
                  </ErrorBoundary>
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
                      <ErrorBoundary fallbackContent={cleanPartnerA}>
                        <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap font-serif text-lg text-zinc-300 leading-loose">
                          {safeMarkdownString(cleanPartnerA)}
                        </ReactMarkdown>
                      </ErrorBoundary>
                    </div>
                  )}

                  {activeMode === "partner-b" && (
                    <div className="animate-in fade-in">
                      <ErrorBoundary fallbackContent={cleanPartnerB}>
                        <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap font-serif text-lg text-zinc-300 leading-loose">
                          {safeMarkdownString(cleanPartnerB)}
                        </ReactMarkdown>
                      </ErrorBoundary>
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

          {isContinuing && streamProgress.length === 0 && (
            <div className="mt-4 mb-8">
              <FlameLoader
                isGenerating={isContinuing}
                progressText="Connecting to story engine to extend..."
              />
            </div>
          )}

          {isContinuing && streamProgress.length > 0 && (
            <div className="mt-4 mb-8 space-y-4">
              <div className="flex items-center gap-2.5 text-xs text-red-300 bg-red-950/40 border border-red-900/50 p-3 rounded-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="font-medium">
                  Appending new chapters in real-time...
                </span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 text-zinc-300 font-serif leading-loose whitespace-pre-wrap">
                <ErrorBoundary fallbackContent={streamingStory.body || streamProgress}>
                  <ReactMarkdown>{safeMarkdownString(streamingStory.body || streamProgress)}</ReactMarkdown>
                </ErrorBoundary>
                <span className="inline-block w-2 h-4 bg-red-500 ml-1 animate-pulse align-middle" />
              </div>
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
