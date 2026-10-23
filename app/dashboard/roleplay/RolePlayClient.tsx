"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import RatingWidget from "@/components/RatingWidget";
import FlameLoader from "@/components/FlameLoader";
import ReactMarkdown from "react-markdown";
import ErrorBoundary, { safeMarkdownString } from "@/components/ErrorBoundary";

type ReaderMode = "partner-a" | "partner-b" | "weekend-script";

interface ScenarioPayload {
  title: string;
  overview: string;
  preExperienceTasks: string[];
  partnerAPerspective: string;
  partnerBPerspective: string;
  fullScript: string | null;
}

export const STREAM_INTERRUPTED_MESSAGE = "Click continue story to expand.";

export function handleStreamError(error: unknown, onError?: (msg: string) => void): string {
  console.warn("Stream error intercepted:", error);
  const msg = STREAM_INTERRUPTED_MESSAGE;
  if (onError) onError(msg);
  return msg;
}

export function extractStreamingRoleplay(raw: string): {
  title?: string;
  overview?: string;
  fullScript: string;
} {
  if (!raw || !raw.trim()) return { overview: "", fullScript: "" };

  try {
    const cleaned = raw.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      title: parsed.title,
      overview: parsed.overview || "",
      fullScript: parsed.fullScript || parsed.script || parsed.body || ""
    };
  } catch {}

  const titleMatch = raw.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"?/);
  const overviewMatch = raw.match(/"overview"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"?/);
  const scriptMatch = raw.match(/"(?:fullScript|dialogue|script|body)"\s*:\s*"([\s\S]*)/i);

  let script = "";
  if (scriptMatch && scriptMatch[1]) {
    script = scriptMatch[1]
      .replace(/"\s*}\s*$/, '')
      .replace(/"$/, '')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"');
  }

  return {
    title: titleMatch ? titleMatch[1].replace(/\\"/g, '"') : undefined,
    overview: overviewMatch ? overviewMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "",
    fullScript: script || raw.replace(/^\{?\s*"title":\s*"[^"]*",?/i, '').replace(/\\n/g, '\n').replace(/\\"/g, '"')
  };
}

export function RolePlayMarkdown({ content, isGenerating = false }: { content: string; isGenerating?: boolean }) {
  const generatedContent = content || '';
  const wordCount = (generatedContent || '').trim().split(/\s+/).length;
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight || document.documentElement.clientHeight;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom > 100) {
        setIsAutoScrollPaused(true);
      } else {
        setIsAutoScrollPaused(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isGenerating && !isAutoScrollPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [content, isGenerating, isAutoScrollPaused]);

  if (isGenerating && wordCount < 1000) {
    return (
      <div className="py-6">
        <FlameLoader isGenerating={true} progressText="Reviewing your preferences... Creating your content... This is going to be great!" />
      </div>
    );
  }

  const cleanContent = safeMarkdownString(generatedContent);
  return (
    <div style={{ overflowAnchor: "none" }} className="space-y-4">
      <ErrorBoundary fallbackContent={cleanContent}>
        <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap">{cleanContent}</ReactMarkdown>
      </ErrorBoundary>
      <div ref={bottomRef} />
    </div>
  );
}

export default function RolePlayClient() {
  const searchParams = useSearchParams();
  const rawMode = searchParams.get("mode");
  const initialMode = rawMode === "group" ? "group" : "couple";
  
  const [playMode, setPlayMode] = useState(initialMode);
  const [theme, setTheme] = useState("");
  const [targetBoundary, setTargetBoundary] = useState("");
  const pacing = "Medium Burn";
  const [activeMode, setActiveMode] = useState<ReaderMode>("partner-a");
  const [scenario, setScenario] = useState<ScenarioPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [streamProgress, setStreamProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [loadingText, setLoadingText] = useState("Reviewing your preferences... Creating your content... This is going to be great!");

  // User Scroll Override & Smart Auto-Scroll States
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const streamBottomRef = useRef<HTMLDivElement>(null);

  // User Scroll Override Listener:
  // If user scrolls up (more than 100px from the bottom of the viewport),
  // pause auto-scroll so the reader is not yanked away from their current paragraph.
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight || document.documentElement.clientHeight;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom > 100) {
        setIsAutoScrollPaused(true);
      } else {
        setIsAutoScrollPaused(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smart Auto-Scroll:
  // Only scroll down while generating/continuing if isAutoScrollPaused is false.
  // When generation finishes (loading & isContinuing become false), no auto-scroll is fired.
  useEffect(() => {
    if (!isAutoScrollPaused && (loading || isContinuing) && streamBottomRef.current) {
      streamBottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [streamProgress, loading, isContinuing, isAutoScrollPaused]);

  const handleConfigureNewStory = () => {
    setLoading(false);
    setIsContinuing(false);
    setScenario(null);
    setStreamProgress("");
    setRegenerationCount(0);
    setIsAutoScrollPaused(false);
    setLoadingText("Reviewing your preferences... Creating your content... This is going to be great!");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueStory = async (explicitLatestContent?: string) => {
    if (!scenario) return;
    const currentStoryText = (typeof explicitLatestContent === 'string' && explicitLatestContent.trim().length > 0)
      ? explicitLatestContent.trim()
      : ((scenario as any)?.body || (scenario as any)?.text || (scenario.fullScript
          ? `Setting the Scene:\n${scenario.overview}\n\nAction Script:\n${scenario.fullScript}`
          : scenario.overview || "")).trim();
    setIsContinuing(true);
    setIsAutoScrollPaused(false);
    setError(null);
    setStreamProgress("");
    let isStreamInterrupted = false;

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
          contentType: "roleplay",
          playMode: playMode,
          hasScripts: true,
          theme: theme,
          targetBoundary: targetBoundary,
          previousContent: currentStoryText,
          existingStory: currentStoryText,
          pacing: pacing
        })
      }).catch((fetchErr) => {
        console.error("Continuation fetch error:", fetchErr);
        isStreamInterrupted = true;
        throw new Error(STREAM_INTERRUPTED_MESSAGE);
      });

      if (!res.ok) {
        let errorMsg = `Failed to continue scenario (${res.status})`;
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
        try {
          while (true) {
            const { done, value } = await reader.read().catch((readErr) => {
              console.warn("Continuation stream interrupted mid-read:", readErr);
              isStreamInterrupted = true;
              throw new Error(STREAM_INTERRUPTED_MESSAGE);
            });
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            rawText += chunk;
            setStreamProgress(prev => prev + chunk);
          }
        } catch (streamErr: any) {
          console.warn("Continuation stream reading interrupted:", streamErr);
          isStreamInterrupted = true;
        }
      } else {
        rawText = await res.text().catch(() => {
          isStreamInterrupted = true;
          throw new Error(STREAM_INTERRUPTED_MESSAGE);
        });
      }

      if (!rawText || !rawText.trim()) {
        throw new Error(STREAM_INTERRUPTED_MESSAGE);
      }

      let parsedData: any = null;
      let newText = "";
      try {
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        parsedData = JSON.parse(cleaned);
        newText = parsedData?.fullScript || parsedData?.text || parsedData?.body || parsedData?.content || parsedData?.overview || "";
      } catch (parseErr) {
        try {
          parsedData = JSON.parse(rawText);
          newText = parsedData?.fullScript || parsedData?.text || parsedData?.body || parsedData?.content || parsedData?.overview || "";
        } catch {
          console.warn("JSON parse fallback for roleplay continuation:", parseErr);
          const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
          newText = cleaned;
          if (!rawText.trim().endsWith('}') && !rawText.trim().endsWith('```')) {
            isStreamInterrupted = true;
          }
        }
      }

      if (!newText || !newText.trim()) {
        throw new Error(STREAM_INTERRUPTED_MESSAGE);
      }

      setScenario(prev => {
        if (!prev) return prev;
        const existingScript = prev.fullScript || prev.overview || "";
        return {
          ...prev,
          fullScript: existingScript ? `${existingScript}\n\n${newText}` : newText
        };
      });

      // Visibly switch to the Action Script tab so the user sees the updated continuation immediately
      setActiveMode("weekend-script");

      if (isStreamInterrupted) {
        setError(STREAM_INTERRUPTED_MESSAGE);
      }
    } catch (err: any) {
      console.error("Continue Scenario Error:", err);
      const isInterrupted = isStreamInterrupted ||
                            err?.message?.includes("Stream interrupted") || 
                            err?.message?.includes("continue story") ||
                            err?.message?.includes(STREAM_INTERRUPTED_MESSAGE) ||
                            err?.name === "AbortError" || 
                            streamProgress.length > 0;

      setError(isInterrupted ? STREAM_INTERRUPTED_MESSAGE : (err?.message || "Our AI engine encountered an issue continuing your scenario. Please try again."));

      if (streamProgress && streamProgress.trim().length > 20) {
        const partial = extractStreamingRoleplay(streamProgress);
        const partialText = partial.fullScript || partial.overview || streamProgress;
        if (partialText) {
          setScenario(prev => {
            if (!prev) return prev;
            const existingScript = prev.fullScript || prev.overview || "";
            return {
              ...prev,
              fullScript: existingScript ? `${existingScript}\n\n${partialText.trim()}` : partialText.trim()
            };
          });
          setActiveMode("weekend-script");
        }
      }
    } finally {
      setIsContinuing(false);
    }
  };

  const handleGenerate = async (regenOverride?: number) => {
    const currentRegen = typeof regenOverride === 'number' ? regenOverride : regenerationCount;
    if (currentRegen >= 2 || (typeof regenOverride === 'number' && regenOverride >= 2)) {
      setLoadingText("It looks like we missed the mark. No worries, we're generating something special for you.");
    } else {
      setLoadingText("Reviewing your preferences... Creating your content... This is going to be great!");
    }
    setLoading(true);
    setIsAutoScrollPaused(false);
    setError(null);
    setScenario(null);
    setStreamProgress("");
    let isStreamInterrupted = false;
    const startTime = performance.now();
    
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
          contentType: "roleplay",
          playMode: playMode,
          hasScripts: true,
          theme: theme,
          targetBoundary: targetBoundary,
          pacing: pacing,
          regenerationCount: currentRegen
        })
      }).catch((fetchErr) => {
        console.error("Generate fetch error:", fetchErr);
        isStreamInterrupted = true;
        throw new Error(STREAM_INTERRUPTED_MESSAGE);
      });

      if (!res.ok) {
        let errorMsg = "Failed to generate scenario";
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
        try {
          while (true) {
            const { done, value } = await reader.read().catch((readErr) => {
              console.warn("Generate stream interrupted mid-read:", readErr);
              isStreamInterrupted = true;
              throw new Error(STREAM_INTERRUPTED_MESSAGE);
            });
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            rawText += chunk;
            setStreamProgress(prev => prev + chunk);
          }
        } catch (streamErr: any) {
          console.warn("Generate stream reading interrupted:", streamErr);
          isStreamInterrupted = true;
        }
      } else {
        rawText = await res.text().catch(() => {
          isStreamInterrupted = true;
          throw new Error(STREAM_INTERRUPTED_MESSAGE);
        });
      }

      let data: ScenarioPayload;
      try {
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        data = JSON.parse(cleaned);
      } catch (parseErr) {
        try {
          data = JSON.parse(rawText);
        } catch {
          console.warn("JSON parse fallback for roleplay generation:", parseErr);
          const textToExtract = rawText || streamProgress;
          const extracted = extractStreamingRoleplay(textToExtract);
          data = {
            title: extracted.title || theme || "Roleplay Experience",
            overview: extracted.overview || textToExtract,
            preExperienceTasks: [],
            partnerAPerspective: extracted.overview || textToExtract,
            partnerBPerspective: extracted.overview || textToExtract,
            fullScript: extracted.fullScript || textToExtract
          };
          if (!rawText.trim().endsWith('}') && !rawText.trim().endsWith('```')) {
            isStreamInterrupted = true;
          }
        }
      }

      if (data) {
        if (!data.fullScript) {
          data.fullScript = (data as any).script || (data as any).body || (data as any).text || data.overview || rawText || streamProgress;
        }
        setScenario(data);
        if (currentRegen >= 2) {
          setRegenerationCount(0);
        }
      }

      if (isStreamInterrupted) {
        setError(STREAM_INTERRUPTED_MESSAGE);
      }
    } catch (err: any) {
      console.error("Roleplay generation error:", err);
      const isInterrupted = isStreamInterrupted ||
                            err?.message?.includes("Stream interrupted") || 
                            err?.message?.includes("continue story") ||
                            err?.message?.includes(STREAM_INTERRUPTED_MESSAGE) ||
                            err?.name === "AbortError" || 
                            streamProgress.length > 0;
      setError(isInterrupted ? STREAM_INTERRUPTED_MESSAGE : (err?.message || "Our AI engine encountered an issue shaping your scenario. Please try again."));

      if (streamProgress && streamProgress.trim().length > 0) {
        const partial = extractStreamingRoleplay(streamProgress);
        setScenario({
          title: partial.title || theme || "Roleplay Experience",
          overview: partial.overview || streamProgress,
          preExperienceTasks: [],
          partnerAPerspective: partial.overview || streamProgress,
          partnerBPerspective: partial.overview || streamProgress,
          fullScript: partial.fullScript || streamProgress
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    const nextCount = regenerationCount + 1;
    setRegenerationCount(nextCount);
    if (nextCount >= 2 || regenerationCount >= 1) {
      setLoadingText("It looks like we missed the mark. No worries, we're generating something special for you.");
    } else {
      setLoadingText("Reviewing your preferences... Creating your content... This is going to be great!");
    }
    await handleGenerate(nextCount);
  };

  const content = scenario?.fullScript || scenario?.overview || '';
  const cleanContent = (content || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanOverview = (scenario?.overview || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const rawPartnerA = scenario?.partnerAPerspective;
  const rawPartnerB = scenario?.partnerBPerspective;
  const partnerAName = typeof rawPartnerA === 'object' && rawPartnerA !== null ? (rawPartnerA as any)?.nickname || (rawPartnerA as any)?.name : null;
  const partnerBName = typeof rawPartnerB === 'object' && rawPartnerB !== null ? (rawPartnerB as any)?.nickname || (rawPartnerB as any)?.name : null;
  const cleanPartnerA = (
    typeof rawPartnerA === 'string'
      ? rawPartnerA
      : ((rawPartnerA as any)?.perspective || (rawPartnerA as any)?.content || (rawPartnerA as any)?.text || (rawPartnerA as any)?.monologue || '')
  ).replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanPartnerB = (
    typeof rawPartnerB === 'string'
      ? rawPartnerB
      : ((rawPartnerB as any)?.perspective || (rawPartnerB as any)?.content || (rawPartnerB as any)?.text || (rawPartnerB as any)?.monologue || '')
  ).replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const streamingRoleplay = extractStreamingRoleplay(streamProgress);
  const generatedContent = streamingRoleplay.fullScript || streamProgress;
  const wordCount = (generatedContent || '').trim().split(/\s+/).length;

  return (
    <div className="flex flex-col w-full relative">
      {/* Configuration & Generate Area */}
      {!scenario && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-medium text-zinc-100 mb-4">Configure Scenario</h2>
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
                value="group" 
                checked={playMode === "group"} 
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
            onClick={() => handleGenerate()}
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {loading ? "Drafting Scenario..." : "Generate Experience"}
          </button>

              {loading && wordCount < 1000 && (
                <div className="mt-8">
                  <FlameLoader 
                    isGenerating={loading} 
                    progressText={loadingText} 
                  />
                </div>
              )}

              {(wordCount >= 1000 || (!loading && (generatedContent.trim().length > 0 || streamProgress.trim().length > 0))) && (
                <div className="mt-8 space-y-6 animate-in fade-in duration-300" style={{ overflowAnchor: 'none' }}>
                  {/* Real-time Streaming Status Bar */}
                  {loading && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-red-900/50 p-4 rounded-xl shadow-lg">
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                        </span>
                        <span className="text-sm font-semibold text-red-200">
                          Game Master Streaming Scenario in Real-Time...
                        </span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                        ~{wordCount} words streamed
                      </span>
                    </div>
                  )}

                  {/* Real-time Streamed Scenario Canvas */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6" style={{ overflowAnchor: 'none' }}>
                    {streamingRoleplay.title && (
                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100 border-b border-zinc-800 pb-4">
                        {streamingRoleplay.title}
                      </h3>
                    )}

                    {streamingRoleplay.overview && (
                      <div className="bg-zinc-950/60 p-5 rounded-xl border border-zinc-800/80">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">The Setting & Storyboard</h4>
                        <p className="text-zinc-300 font-serif leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                          {streamingRoleplay.overview}
                        </p>
                      </div>
                    )}

                    <div className="prose prose-invert max-w-none text-zinc-200 font-serif leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
                      <ErrorBoundary fallbackContent={generatedContent}>
                        <ReactMarkdown>
                          {safeMarkdownString(generatedContent)}
                        </ReactMarkdown>
                      </ErrorBoundary>
                      {loading && <span className="inline-block w-2 h-5 bg-red-500 ml-1 animate-pulse align-middle" />}
                    </div>
                    <div ref={streamBottomRef} />
                  </div>
                </div>
              )}

          {error && (
            error === STREAM_INTERRUPTED_MESSAGE || error.toLowerCase().includes("continue story to expand") ? (
              <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-400 rounded-lg p-4 text-center mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
                <span className="font-medium text-sm md:text-base leading-relaxed w-full text-center sm:text-left">
                  Click continue story to expand.
                </span>
                {scenario && (
                  <button
                    onClick={() => handleContinueStory((scenario as any)?.body || (scenario as any)?.text || '')}
                    disabled={isContinuing}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 shadow self-center sm:self-auto"
                  >
                    {isContinuing ? "Expanding..." : "Continue Story"}
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 p-4 bg-red-950/30 border border-red-800 rounded-xl text-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">⚠️</span>
                  <span className="font-medium text-sm md:text-base leading-relaxed">{error}</span>
                </div>
                {scenario && (
                  <button
                    onClick={() => handleContinueStory((scenario as any)?.body || (scenario as any)?.text || '')}
                    disabled={isContinuing}
                    className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 shadow self-start sm:self-auto"
                  >
                    {isContinuing ? "Resuming..." : "Continue Story"}
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Generated Content Area */}
      {scenario && (
        <div className="animate-in fade-in duration-700 pb-24" style={{ overflowAnchor: 'none' }}>
          <button 
            onClick={handleConfigureNewStory}
            className="mb-8 text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-colors"
          >
            ← Configure a new scenario
          </button>
          
          <h2 className="text-3xl font-serif mb-6 text-zinc-100">{scenario.title}</h2>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 shadow-inner">
            <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Setting the Scene</h3>
            <ErrorBoundary fallbackContent={cleanOverview}>
              <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap font-serif text-zinc-300 leading-relaxed">
                {safeMarkdownString(cleanOverview)}
              </ReactMarkdown>
            </ErrorBoundary>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-8">
            <div className="flex bg-zinc-900/80 border-b border-zinc-800">
              <button
                onClick={() => setActiveMode("partner-a")}
                className={`flex-1 py-4 text-sm font-medium transition-all ${
                  activeMode === "partner-a" ? "bg-zinc-800 text-white shadow-sm border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                {partnerAName ? `${partnerAName}'s Lens` : "Partner A Lens"}
              </button>
              <button
                onClick={() => setActiveMode("partner-b")}
                className={`flex-1 py-4 text-sm font-medium transition-all ${
                  activeMode === "partner-b" ? "bg-zinc-800 text-white shadow-sm border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                {partnerBName ? `${partnerBName}'s Lens` : "Partner B Lens"}
              </button>
              {scenario.fullScript && (
                <button
                  onClick={() => setActiveMode("weekend-script")}
                  className={`flex-1 py-4 text-sm font-medium transition-all ${
                    activeMode === "weekend-script" ? "bg-zinc-800 text-white shadow-sm border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  }`}
                >
                  Action Script
                </button>
              )}
            </div>

            <div className="p-6 md:p-8">
              {activeMode === "partner-a" && (
                <div className="animate-in fade-in space-y-6">
                  {scenario?.preExperienceTasks && scenario.preExperienceTasks[0] && (
                    <div className="bg-red-950/10 border border-red-900/20 rounded-lg p-5">
                      <h4 className="text-red-500 font-bold text-sm uppercase tracking-wider mb-2">Pre-Experience Task</h4>
                      <p className="text-zinc-300">{scenario.preExperienceTasks[0]}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-zinc-500 font-bold text-sm uppercase tracking-wider mb-3">
                      Internal Monologue {partnerAName ? `(${partnerAName})` : ''}
                    </h4>
                    {cleanPartnerA ? (
                      <ErrorBoundary fallbackContent={cleanPartnerA}>
                        <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap text-zinc-300 leading-loose">
                          {safeMarkdownString(cleanPartnerA)}
                        </ReactMarkdown>
                      </ErrorBoundary>
                    ) : (
                      <div className="py-8 text-center text-zinc-400 font-serif italic bg-zinc-900/40 rounded-xl p-6 border border-zinc-800">
                        Partner A perspective is temporarily hydrating...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeMode === "partner-b" && (
                <div className="animate-in fade-in space-y-6">
                  {scenario?.preExperienceTasks && scenario.preExperienceTasks[1] && (
                    <div className="bg-red-950/10 border border-red-900/20 rounded-lg p-5">
                      <h4 className="text-red-500 font-bold text-sm uppercase tracking-wider mb-2">Pre-Experience Task</h4>
                      <p className="text-zinc-300">{scenario.preExperienceTasks[1]}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-zinc-500 font-bold text-sm uppercase tracking-wider mb-3">
                      Internal Monologue {partnerBName ? `(${partnerBName})` : ''}
                    </h4>
                    {cleanPartnerB ? (
                      <ErrorBoundary fallbackContent={cleanPartnerB}>
                        <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap text-zinc-300 leading-loose">
                          {safeMarkdownString(cleanPartnerB)}
                        </ReactMarkdown>
                      </ErrorBoundary>
                    ) : (
                      <div className="py-8 text-center text-zinc-400 font-serif italic bg-zinc-900/40 rounded-xl p-6 border border-zinc-800">
                        Partner B perspective is temporarily hydrating or awaiting narrative details...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeMode === "weekend-script" && scenario.fullScript && (
                <div className="animate-in fade-in">
                  <h4 className="text-zinc-500 font-bold text-sm uppercase tracking-wider mb-4">The Scene</h4>
                  <div className="bg-zinc-900 p-6 rounded-lg font-mono text-sm text-zinc-300 leading-relaxed border border-zinc-800">
                    <ErrorBoundary fallbackContent={cleanContent}>
                      <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap">
                        {safeMarkdownString(cleanContent)}
                      </ReactMarkdown>
                    </ErrorBoundary>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            error === STREAM_INTERRUPTED_MESSAGE || error.toLowerCase().includes("continue story to expand") ? (
              <div
                onClick={() => !isContinuing && handleContinueStory((scenario as any)?.body || (scenario as any)?.text || '')}
                className="cursor-pointer bg-emerald-900/30 border border-emerald-800 hover:bg-emerald-900/40 text-emerald-400 rounded-lg p-4 text-center mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in transition-colors group"
              >
                <span className="font-medium text-sm md:text-base leading-relaxed w-full text-center sm:text-left flex items-center gap-2">
                  <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
                  Click continue story to expand.
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContinueStory((scenario as any)?.body || (scenario as any)?.text || '');
                  }}
                  disabled={isContinuing}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 shadow self-center sm:self-auto cursor-pointer"
                >
                  {isContinuing ? "Expanding..." : "Continue Story"}
                </button>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-red-950/30 border border-red-800 rounded-xl text-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">⚠️</span>
                  <span className="font-medium text-sm md:text-base leading-relaxed">{error}</span>
                </div>
              </div>
            )
          )}

          {/* Scenario Actions: Configure New Scenario & Regenerate */}
          <div className="flex flex-wrap items-center gap-4 mb-8" style={{ overflowAnchor: 'none' }}>
            <button
              onClick={handleConfigureNewStory}
              disabled={isContinuing || loading}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Configure New Scenario
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isContinuing || loading}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>🔄</span>
              Regenerate
            </button>
          </div>

          {isContinuing && wordCount < 1000 && (
            <div className="mt-4 mb-8">
              <FlameLoader
                isGenerating={isContinuing}
                progressText="Reviewing your preferences... Creating your content... This is going to be great!"
              />
            </div>
          )}

          {isContinuing && wordCount >= 1000 && (
            <div className="mt-4 mb-8 space-y-4" style={{ overflowAnchor: 'none' }}>
              <div className="flex items-center gap-2.5 text-xs text-red-300 bg-red-950/40 border border-red-900/50 p-3 rounded-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="font-medium">
                  Appending scenario continuation in real-time... (~{wordCount} words)
                </span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 text-zinc-300 font-serif leading-loose whitespace-pre-wrap">
                <ErrorBoundary fallbackContent={generatedContent}>
                  <ReactMarkdown>{safeMarkdownString(generatedContent)}</ReactMarkdown>
                </ErrorBoundary>
                <span className="inline-block w-2 h-4 bg-red-500 ml-1 animate-pulse align-middle" />
              </div>
              <div ref={streamBottomRef} />
            </div>
          )}
          
          <div className="pt-8 border-t border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Rate this Scenario</h3>
            <RatingWidget contentId={scenario.title} contentType="roleplay" />
          </div>
        </div>
      )}
    </div>
  );
}
