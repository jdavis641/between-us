"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
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

export const STREAM_INTERRUPTED_MESSAGE = "Click continue story to expand.";

export function handleStreamError(error: unknown, onError?: (msg: string) => void): string {
  console.warn("Stream error intercepted:", error);
  const msg = STREAM_INTERRUPTED_MESSAGE;
  if (onError) onError(msg);
  return msg;
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

export function LiteratureMarkdown({ content, isGenerating = false }: { content: string; isGenerating?: boolean }) {
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
        <FlameLoader isGenerating={true} progressText="Crafting the narrative..." />
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

export default function LiteratureClient() {
  const [theme, setTheme] = useState("");
  const [targetBoundary, setTargetBoundary] = useState("");
  const [pacing, setPacing] = useState("Medium Burn");
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
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [generationMetric, setGenerationMetric] = useState<{ source: string; speedMs: number } | null>(null);

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
    setPreviews(null);
    setActiveTrope(null);
    setStreamProgress("");
    setError(null);
    setPreviewError(null);
    setRegenerationCount(0);
    setGenerationMetric(null);
    setIsAutoScrollPaused(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Progressive Chapter Assembly Poller:
  // Detects if Chapter 1 is ready and polls Supabase while user reads, updating the body seamlessly when Chapters 2 & 3 append.
  useEffect(() => {
    if (!scenario?.title) return;
    const isProgressive = (scenario as any)?.status === 'chapter_1_ready' || (scenario as any)?.status === 'chapter_2_ready';
    if (!isProgressive) return;

    let pollAttempts = 0;
    const interval = setInterval(async () => {
      pollAttempts++;
      if (pollAttempts > 30) {
        clearInterval(interval);
        return;
      }

      try {
        const { data: latest } = await supabase
          .from('generated_content')
          .select('body')
          .eq('title', scenario.title)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest?.body) {
          const parsed = typeof latest.body === 'string' ? JSON.parse(latest.body) : latest.body;
          const newBody = parsed.body || parsed.text;
          if (newBody && newBody.length > (scenario.body?.length || 0)) {
            setScenario(prev => prev ? {
              ...prev,
              body: newBody,
              chapter: parsed.chapter,
              totalChapters: parsed.totalChapters,
              status: parsed.status
            } : prev);

            if (parsed.status === 'completed' || (parsed.chapter && parsed.chapter >= 3)) {
              clearInterval(interval);
            }
          }
        }
      } catch (pollErr) {
        console.warn("Progressive chapter polling error:", pollErr);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [scenario?.title, (scenario as any)?.status, (scenario as any)?.body?.length, supabase]);

  const handleContinueStory = async () => {
    if (!scenario) return;
    const currentStoryText = scenario.body || scenario.overview || "";
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
          contentType: "literature",
          hasScripts: false,
          theme: theme,
          targetBoundary: targetBoundary,
          previousContent: currentStoryText,
          existingStory: currentStoryText,
          pacing: pacing,
          activeTrope: activeTrope
        })
      }).catch((fetchErr) => {
        console.error("Continuation fetch error:", fetchErr);
        isStreamInterrupted = true;
        throw new Error(STREAM_INTERRUPTED_MESSAGE);
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
        if (!rawText.trim().endsWith('}') && !rawText.trim().endsWith('```')) {
          isStreamInterrupted = true;
        }
      }

      if (newText && newText.trim()) {
        setScenario(prev => {
          if (!prev) return prev;
          const existingBody = prev.body || prev.overview || "";
          return {
            ...prev,
            body: existingBody ? `${existingBody}\n\n${newText.trim()}` : newText.trim()
          };
        });
      }

      if (isStreamInterrupted) {
        setError(STREAM_INTERRUPTED_MESSAGE);
      }
    } catch (err: any) {
      console.error("Continue Story Error:", err);
      const isInterrupted = isStreamInterrupted ||
                            err?.message?.includes("Stream interrupted") || 
                            err?.message?.includes("continue story") ||
                            err?.message?.includes(STREAM_INTERRUPTED_MESSAGE) ||
                            err?.name === "AbortError" || 
                            streamProgress.length > 0;

      setError(isInterrupted ? STREAM_INTERRUPTED_MESSAGE : (err?.message || "Our AI engine encountered an issue continuing your story. Please try again."));

      if (streamProgress && streamProgress.trim().length > 20) {
        const partial = extractStreamingMarkdown(streamProgress);
        const partialText = partial.body || streamProgress;
        if (partialText) {
          setScenario(prev => {
            if (!prev) return prev;
            const existingBody = prev.body || prev.overview || "";
            return {
              ...prev,
              body: existingBody ? `${existingBody}\n\n${partialText.trim()}` : partialText.trim()
            };
          });
        }
      }
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
          targetBoundary,
          theme,
          pacing
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

  const handleGenerate = async (regenOverride?: number) => {
    if (!activeTrope) {
      setError("Please select a story trope preview to continue.");
      return;
    }

    const currentRegen = typeof regenOverride === 'number' ? regenOverride : regenerationCount;
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
          hasScripts: false,
          theme: theme,
          targetBoundary: targetBoundary,
          pacing: pacing,
          activeTrope: activeTrope,
          regenerationCount: currentRegen
        })
      }).catch((fetchErr) => {
        console.error("Generate fetch error:", fetchErr);
        isStreamInterrupted = true;
        throw new Error(STREAM_INTERRUPTED_MESSAGE);
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

      let data: LiteraturePayload | null = null;
      try {
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        data = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn("JSON parse fallback for literature:", parseErr);
        const textToExtract = rawText || streamProgress;
        const extracted = extractStreamingMarkdown(textToExtract);
        if (extracted.body && extracted.body.trim().length > 0) {
          data = {
            title: extracted.title || (activeTrope && activeTrope.title) || theme || "Romantic Literature",
            body: extracted.body.trim()
          };
          if (!rawText.trim().endsWith('}') && !rawText.trim().endsWith('```')) {
            isStreamInterrupted = true;
          }
        } else if (textToExtract.trim().length > 0) {
          data = {
            title: (activeTrope && activeTrope.title) || theme || "Romantic Literature",
            body: textToExtract.trim()
          };
          isStreamInterrupted = true;
        }
      }

      if (!data && (rawText.trim().length > 0 || streamProgress.trim().length > 0)) {
        const fallbackText = rawText.trim() || streamProgress.trim();
        const extracted = extractStreamingMarkdown(fallbackText);
        data = {
          title: extracted.title || (activeTrope && activeTrope.title) || theme || "Romantic Literature",
          body: extracted.body || fallbackText
        };
      }

      if (data) {
        if (!data.body) {
          data.body = (data as any).overview || (data as any).content || (data as any).text || (data as any).story || rawText.trim() || streamProgress.trim();
        }
        setScenario(data);
        const elapsed = Math.round(performance.now() - startTime);
        const source = (data as any).source || ((data as any).cached ? 'supabase_library' : 'euryale_ai');
        setGenerationMetric({
          source,
          speedMs: (data as any).generationSpeedMs || elapsed
        });
        if (currentRegen >= 2) {
          setRegenerationCount(0);
        }
      }

      if (isStreamInterrupted) {
        setError(STREAM_INTERRUPTED_MESSAGE);
      }
    } catch (err: any) {
      console.error("Literature generation error:", err);
      const isInterrupted = isStreamInterrupted ||
                            err?.message?.includes("Stream interrupted") || 
                            err?.message?.includes("continue story") ||
                            err?.message?.includes(STREAM_INTERRUPTED_MESSAGE) ||
                            err?.name === "AbortError" || 
                            streamProgress.length > 0;

      setError(isInterrupted ? STREAM_INTERRUPTED_MESSAGE : (err?.message || "Our AI engine encountered an issue shaping your literature. Please try again."));

      if (streamProgress && streamProgress.trim().length > 0) {
        const partial = extractStreamingMarkdown(streamProgress);
        setScenario({
          title: partial.title || (activeTrope && activeTrope.title) || theme || "Romantic Literature",
          body: partial.body || streamProgress.trim()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    const nextCount = regenerationCount + 1;
    setRegenerationCount(nextCount);
    await handleGenerate(nextCount);
  };

  const content = scenario?.body || (scenario as any)?.text || (scenario as any)?.content || (scenario as any)?.story || scenario?.overview || '';
  const cleanContent = (content || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanOverview = (scenario?.overview || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanPartnerA = (scenario?.partnerAPerspective || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const streamingStory = extractStreamingMarkdown(streamProgress);
  const generatedContent = streamingStory.body || streamProgress;
  const wordCount = (generatedContent || '').trim().split(/\s+/).length;

  return (
    <div className="flex flex-col w-full relative">
      {!scenario && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-medium text-zinc-100 mb-4">Configure Literature</h2>

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
            
            {/* Pacing Radio Button Group */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Pacing</label>
              <div className="flex flex-wrap gap-4">
                {["Quick Burn", "Medium Burn", "Slow Burn"].map((pace) => (
                  <label key={pace} className="flex items-center gap-2 cursor-pointer bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-2.5 transition-colors">
                    <input 
                      type="radio" 
                      name="pacing" 
                      value={pace} 
                      checked={pacing === pace} 
                      onChange={(e) => setPacing(e.target.value)}
                      className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700 focus:ring-red-600"
                    />
                    <span className="text-sm text-zinc-300 font-medium">{pace}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Optional: Include tropes, scenarios, kinks, couples or group dynamics to custom tailor your story
              </label>
              <textarea 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Optional: Include tropes, scenarios, kinks, couples or group dynamics to custom tailor your story"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-300 h-28 focus:outline-none focus:border-red-900"
              />
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

              {loading && wordCount < 1000 && (
                <div className="mt-8">
                  <FlameLoader 
                    isGenerating={loading} 
                    progressText="Crafting the narrative..." 
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
                          Streaming Story Chapters in Real-Time...
                        </span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                        ~{wordCount} words streamed
                      </span>
                    </div>
                  )}

                  {/* Real-time Streamed Content Canvas */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6" style={{ overflowAnchor: 'none' }}>
                    {streamingStory.title && (
                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100 border-b border-zinc-800 pb-4">
                        {streamingStory.title}
                      </h3>
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
                error === STREAM_INTERRUPTED_MESSAGE || error.toLowerCase().includes("continue story to expand") ? (
                  <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-400 rounded-lg p-4 text-center mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
                    <span className="font-medium text-sm md:text-base leading-relaxed w-full text-center sm:text-left">
                      Click continue story to expand.
                    </span>
                    {scenario && (
                      <button
                        onClick={handleContinueStory}
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
                        onClick={handleContinueStory}
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
        </div>
      )}

      {scenario && (
        <div className="animate-in fade-in duration-700 pb-24" style={{ overflowAnchor: 'none' }}>
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
          
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {activeTrope && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-red-950/60 text-red-200 border border-red-800">
                  {activeTrope.trope}
                </span>
                <span className="text-xs text-zinc-500">•</span>
                <span className="text-xs text-zinc-400">{pacing}</span>
              </div>
            )}
            {generationMetric && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border bg-zinc-900 border-zinc-700 text-zinc-300">
                {generationMetric.source === 'semantic_library_cache' || (generationMetric.source || '').includes('semantic') ? (
                  <span className="text-cyan-400 flex items-center gap-1">
                    <span className="text-cyan-300 font-bold">⚡</span> Semantic Vector Cache Hit ({generationMetric.speedMs}ms)
                  </span>
                ) : generationMetric.source === 'supabase_library' || generationMetric.source === 'supabase-library' || (generationMetric.source || '').includes('library') || (generationMetric.source || '').includes('supabase') ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="text-amber-400 font-bold">⚡</span> Retrieved from Supabase Library ({generationMetric.speedMs}ms)
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <span className="text-red-500 font-bold">🔥</span> Generated via Euryale AI ({Math.round(generationMetric.speedMs / 100) / 10}s)
                  </span>
                )}
              </span>
            )}
            {((scenario as any)?.status === 'chapter_1_ready' || (scenario as any)?.status === 'chapter_2_ready') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border bg-amber-950/40 border-amber-800 text-amber-200 animate-pulse">
                <span>📖</span> Chapter {(scenario as any)?.chapter || 1} of 3 — Assembling remaining chapters in background...
              </span>
            )}
            {(scenario as any)?.status === 'completed' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border bg-emerald-950/40 border-emerald-800 text-emerald-300">
                <span>✓</span> Complete 3-Chapter Story
              </span>
            )}
          </div>

          <h2 className="text-3xl font-serif mb-6 text-zinc-100">{scenario.title}</h2>
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-10 mb-8 shadow-inner font-serif text-lg text-zinc-300 leading-loose prose-headings:font-serif">
            <ErrorBoundary fallbackContent={cleanContent}>
              <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap">
                {safeMarkdownString(cleanContent)}
              </ReactMarkdown>
            </ErrorBoundary>
          </div>

          {error && (
            error === STREAM_INTERRUPTED_MESSAGE || error.toLowerCase().includes("continue story to expand") ? (
              <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-400 rounded-lg p-4 text-center mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
                <span className="font-medium text-sm md:text-base leading-relaxed w-full text-center sm:text-left">
                  Click continue story to expand.
                </span>
                <button
                  onClick={handleContinueStory}
                  disabled={isContinuing}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 shadow self-center sm:self-auto"
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
                <button
                  onClick={handleContinueStory}
                  disabled={isContinuing}
                  className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 shadow self-start sm:self-auto"
                >
                  {isContinuing ? "Resuming..." : "Continue Story"}
                </button>
              </div>
            )
          )}

          {/* Story Actions: Configure New Story, Regenerate, & Continue Existing Story */}
          <div className="flex flex-wrap items-center gap-4 mb-8" style={{ overflowAnchor: 'none' }}>
            <button
              onClick={handleConfigureNewStory}
              disabled={isContinuing || loading}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Configure New Story
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isContinuing || loading}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>🔄</span>
              {regenerationCount >= 1 ? "Regenerate (Fresh AI via Euryale)" : `Regenerate (${regenerationCount + 1}/2 from Library)`}
            </button>
            <button
              onClick={handleContinueStory}
              disabled={isContinuing || loading}
              className="px-6 py-2.5 bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isContinuing ? "Extending Story..." : "Continue Existing Story"}
            </button>
          </div>

          {isContinuing && wordCount < 1000 && (
            <div className="mt-4 mb-8">
              <FlameLoader
                isGenerating={isContinuing}
                progressText="Crafting the narrative..."
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
                  Appending new chapters in real-time... (~{wordCount} words)
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
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Rate this Story</h3>
            <RatingWidget contentId={scenario.title} contentType="literature" />
          </div>
        </div>
      )}
    </div>
  );
}
