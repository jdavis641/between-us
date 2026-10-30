"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import RatingWidget from "@/components/RatingWidget";
import FlameLoader from "@/components/FlameLoader";
import ReactMarkdown from "react-markdown";
import ErrorBoundary, { safeMarkdownString } from "@/components/ErrorBoundary";
import { exportStoryToPdf } from "@/utils/pdfExport";

type ReaderMode = "partner-a" | "partner-b";

interface LiteraturePayload {
  title: string;
  body?: string;
  overview?: string;
  partnerAPerspective?: string;
  partnerBPerspective?: string;
}

export interface StoryPreview {
  id: string;
  title: string;
  trope: string;
  premise: string;
}

export function parseStoryPreviews(raw: any, theme?: string): StoryPreview[] {
  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.previews)) list = raw.previews;
    else if (Array.isArray(raw.tropes)) list = raw.tropes;
    else if (Array.isArray(raw.concepts)) list = raw.concepts;
    else if (Array.isArray(raw.data)) list = raw.data;
    else if (typeof raw.previews === 'string') {
      try {
        const parsed = JSON.parse(raw.previews.replace(/^\`\`\`json\s*/i, '').replace(/^\`\`\`\s*/i, '').replace(/\`\`\`\s*$/i, '').trim());
        if (Array.isArray(parsed)) list = parsed;
        else if (Array.isArray(parsed.previews)) list = parsed.previews;
      } catch {
        list = raw.previews.split(/\n\s*\n/).filter(Boolean);
      }
    }
  } else if (typeof raw === 'string') {
    try {
      const cleaned = raw.trim().replace(/^\`\`\`json\s*/i, '').replace(/^\`\`\`\s*/i, '').replace(/\`\`\`\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) list = parsed;
      else if (Array.isArray(parsed.previews)) list = parsed.previews;
    } catch {
      const chunks = raw.split(/(?=\d+\.\s+\*\*|\n\n#{1,4}\s+|\n\n\*\*)/).map(s => s.trim()).filter(Boolean);
      list = chunks.length > 0 ? chunks : raw.split(/\n\s*\n/).filter(Boolean);
    }
  }

  const result: StoryPreview[] = (list || []).map((item: any, idx: number) => {
    if (typeof item === 'string') {
      const cleanItem = item.trim().replace(/^[-*•\d.]+\s*/, '');
      const colonIdx = cleanItem.indexOf(':');
      let parsedTitle = `Concept ${idx + 1}`;
      let parsedPremise = cleanItem;
      let parsedTrope = "Core Trope";

      if (colonIdx > 0 && colonIdx < 50) {
        parsedTitle = cleanItem.slice(0, colonIdx).replace(/[*_#]/g, '').trim();
        parsedPremise = cleanItem.slice(colonIdx + 1).replace(/^[\s*-]+/, '').trim();
      }
      return {
        id: String(idx + 1),
        title: parsedTitle || `Concept ${idx + 1}`,
        trope: parsedTrope,
        premise: parsedPremise || cleanItem || "A captivating story concept crafted to your preferences."
      };
    }
    return {
      id: String(item.id || idx + 1),
      title: item.title || item.name || `Concept ${idx + 1}`,
      trope: item.trope || item.tag || item.genre || "Core Trope",
      premise: item.premise || item.description || item.summary || item.text || "A captivating story concept crafted to your preferences."
    };
  }).filter(p => p.premise && p.premise.trim().length > 0);

  if (result.length === 0) {
    return [
      {
        id: "1",
        title: theme ? `${theme}: Forced Proximity` : "Midnight Strangers",
        trope: "Forced Proximity",
        premise: "Trapped together when a late-night storm cuts off the mountain pass, old barriers melt into raw, irresistible attraction."
      },
      {
        id: "2",
        title: theme ? `${theme}: Enemies to Lovers` : "Tension & Surrender",
        trope: "Enemies to Lovers",
        premise: "Fierce rivals competing for the same coveted prize find that their sharpest banter barely masks an overwhelming mutual craving."
      },
      {
        id: "3",
        title: theme ? `${theme}: Second Chance` : "Echoes of Desire",
        trope: "Second Chance",
        premise: "Reunited after years apart under the sultry glow of a masquerade ball, past unspoken desires demand an unforgettable reckoning."
      }
    ];
  }

  return result.slice(0, 3);
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

interface LiteratureClientProps {
  initialTolerance?: string;
  initialKinks?: string[];
}

export default function LiteratureClient({ initialTolerance, initialKinks }: LiteratureClientProps = {}) {
  const searchParams = useSearchParams();
  const [theme, setTheme] = useState(() => {
    const p = searchParams?.get('prompt');
    const t = searchParams?.get('theme');
    if (p) return p;
    if (t?.toLowerCase() === 'halloween') return 'Gothic Victorian Masquerade: Midnight Whispers & Velvet Shadows';
    return t || '';
  });

  const [userProfileTolerance, setUserProfileTolerance] = useState<string>(initialTolerance || 'Playful');
  const [userKinksOverride, setUserKinksOverride] = useState<string[]>(initialKinks || []);

  useEffect(() => {
    const p = searchParams?.get('prompt');
    const t = searchParams?.get('theme');
    if (p) {
      setTheme(p);
    } else if (t?.toLowerCase() === 'halloween' && !theme) {
      setTheme('Gothic Victorian Masquerade: Midnight Whispers & Velvet Shadows');
    } else if (t && !theme) {
      setTheme(t);
    }
  }, [searchParams]);

  const [targetBoundary, setTargetBoundary] = useState(initialTolerance || "");

  // Load active tolerance from profiles and kinks_override from intimacy_preferences
  useEffect(() => {
    async function loadUserToleranceAndKinks() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('base_tolerance')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.base_tolerance) {
          setUserProfileTolerance(profile.base_tolerance);
          if (!targetBoundary) {
            setTargetBoundary(profile.base_tolerance);
          }
        }

        const { data: prefData } = await supabase
          .from('intimacy_preferences')
          .select('category_tag, preference_level, kinks_override')
          .eq('user_id', user.id)
          .neq('category_tag', 'Guest Pass Config');

        if (!profile?.base_tolerance && prefData) {
          const basePref = prefData.find((p: any) => p.category_tag === 'Base Tolerance' || p.category_tag === 'Primary Directive');
          if (basePref?.preference_level) {
            setUserProfileTolerance(basePref.preference_level);
            if (!targetBoundary) {
              setTargetBoundary(basePref.preference_level);
            }
          }
        }

        const kinkRow = prefData?.find((p: any) => p.category_tag === 'Primary Directive' && p.kinks_override)
          || prefData?.find((p: any) => p.kinks_override);

        if (kinkRow?.kinks_override) {
          try {
            const parsed = JSON.parse(kinkRow.kinks_override);
            if (Array.isArray(parsed)) {
              setUserKinksOverride(parsed.map((k: any) => typeof k === 'string' ? k : (k?.text || '')).filter(Boolean));
            } else if (parsed && typeof parsed === 'object' && parsed.kinks) {
              setUserKinksOverride(Array.isArray(parsed.kinks) ? parsed.kinks : [String(parsed.kinks)]);
            } else if (typeof parsed === 'string') {
              setUserKinksOverride([parsed]);
            }
          } catch {
            setUserKinksOverride(kinkRow.kinks_override.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean));
          }
        }
      } catch (loadErr) {
        console.warn("Could not load user profile tolerance and kinks:", loadErr);
      }
    }
    loadUserToleranceAndKinks();
  }, [supabase]);
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
  const [loadingText, setLoadingText] = useState("Reviewing your preferences... Creating your content... This is going to be great!");

  // Literature Favorites State
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [storyContentId, setStoryContentId] = useState<string | null>(null);
  const [favoriteToast, setFavoriteToast] = useState<string | null>(null);

  // User Scroll Override & Smart Auto-Scroll States
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const streamBottomRef = useRef<HTMLDivElement>(null);
  const newChapterRef = useRef<HTMLDivElement>(null);

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
    setIsAutoScrollPaused(false);
    setIsFavorite(false);
    setStoryContentId(null);
    setFavoriteToast(null);
    setLoadingText("Reviewing your preferences... Creating your content... This is going to be great!");
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

  // Resolve Story Content ID & Favorite Status when scenario title is available
  useEffect(() => {
    if (!scenario?.title) return;
    async function loadFavoriteStatus() {
      try {
        const { data: row } = await supabase
          .from('generated_content')
          .select('id, is_favorite')
          .eq('title', scenario!.title)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (row?.id) {
          setStoryContentId(row.id);
          if (typeof row.is_favorite === 'boolean') {
            setIsFavorite(row.is_favorite);
          }
        }
      } catch (err) {
        console.warn("Error resolving favorite status:", err);
      }
    }
    loadFavoriteStatus();
  }, [scenario?.title, supabase]);

  const handleDownloadStory = () => {
    if (!scenario) return;
    const title = scenario.title || "Romantic Literature";
    const bodyText = cleanContent || scenario.body || scenario.overview || "";
    const fileContent = `${title}\n\n${bodyText}\n`;
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = title.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
    link.href = url;
    link.download = `${safeTitle || 'story'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleFavorite = async () => {
    if (isFavoriting) return;
    setIsFavoriting(true);
    const newStatus = !isFavorite;
    setIsFavorite(newStatus);

    try {
      let targetId = storyContentId;
      if (!targetId && scenario?.title) {
        const { data: row } = await supabase
          .from('generated_content')
          .select('id')
          .eq('title', scenario.title)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (row?.id) {
          targetId = row.id;
          setStoryContentId(row.id);
        }
      }

      if (targetId) {
        await fetch('/api/favorites/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentId: targetId })
        });
      }

      setFavoriteToast(newStatus ? 'Added to your favorites' : 'Removed from favorites');
      setTimeout(() => setFavoriteToast(null), 3000);
    } catch (favErr) {
      console.warn('Favorite toggle error:', favErr);
      setIsFavorite(!newStatus);
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleContinueStory = async (explicitLatestContent?: string) => {
    const latestGeneratedContent = (typeof explicitLatestContent === 'string' && explicitLatestContent.trim().length > 0)
      ? explicitLatestContent.trim()
      : ((cleanContent || scenario?.body || (scenario as any)?.text || (scenario as any)?.content || (scenario as any)?.story || scenario?.overview || "") as string).trim();

    if (!latestGeneratedContent && !scenario) return;
    const currentStoryText = latestGeneratedContent;
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
          trope: activeTrope?.premise || activeTrope?.trope || theme || '',
          activeTrope: activeTrope,
          kinks: userKinksOverride,
          tolerance: targetBoundary || userProfileTolerance || 'Playful',
          targetBoundary: targetBoundary || userProfileTolerance || 'Playful',
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
        const nextChapter = (scenario as any)?.chapter ? ((scenario as any).chapter + 1) : 2;
        setScenario(prev => {
          if (!prev) {
            return {
              id: storyContentId || 'generated-story',
              title: streamingStory.title || activeTrope?.title || "Romantic Novella",
              body: newText.trim(),
              chapter: nextChapter,
              totalChapters: 20
            };
          }
          const existingBody = prev.body || prev.overview || "";
          const updatedBody = existingBody ? `${existingBody}\n\n${newText.trim()}` : newText.trim();
          return {
            ...prev,
            body: updatedBody,
            chapter: nextChapter,
            totalChapters: 20
          };
        });

        setTimeout(() => {
          newChapterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);

        if (storyContentId) {
          try {
            const existingBody = cleanContent || scenario?.body || "";
            const updatedBody = existingBody ? `${existingBody}\n\n${newText.trim()}` : newText.trim();
            supabase.from('generated_content').update({
              body: JSON.stringify({
                ...scenario,
                body: updatedBody,
                text: updatedBody,
                chapter: nextChapter,
                totalChapters: 20,
                status: `chapter_${nextChapter}_ready`
              })
            }).eq('id', storyContentId);
          } catch {}
        }
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
          setTimeout(() => {
            newChapterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
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
          targetBoundary: targetBoundary || userProfileTolerance || 'Playful',
          tolerance: targetBoundary || userProfileTolerance || 'Playful',
          theme,
          trope: theme,
          kinks: userKinksOverride,
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
            if (errText) {
              if (errText.includes('<!DOCTYPE') || errText.includes('<html')) {
                errorMsg = "The preview engine encountered a temporary network delay. Please try again.";
              } else {
                errorMsg = errText.slice(0, 150);
              }
            }
          } catch {}
        }
        if (res.status === 401) {
          errorMsg = "Auth Rejected: Session expired or missing.";
        }
        throw new Error(errorMsg);
      }

      let parsedData: any = null;
      try {
        parsedData = await res.json();
      } catch {
        try {
          const rawText = await res.text();
          parsedData = rawText;
        } catch {}
      }

      const parsedPreviews = parseStoryPreviews(parsedData, theme);
      if (parsedPreviews && parsedPreviews.length > 0) {
        setPreviews(parsedPreviews);
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
          prompt: theme,
          trope: activeTrope?.premise || activeTrope?.trope || theme || '',
          activeTrope: activeTrope,
          kinks: userKinksOverride,
          tolerance: targetBoundary || userProfileTolerance || 'Playful',
          targetBoundary: targetBoundary || userProfileTolerance || 'Playful',
          pacing: pacing,
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
            if (errText) {
              if (errText.includes('<!DOCTYPE') || errText.includes('<html')) {
                errorMsg = "The content engine temporarily lost gateway connection. Please click Retry Generation.";
              } else {
                errorMsg = errText.slice(0, 150);
              }
            }
          } catch {}
        }
        if (res.status === 401) {
          errorMsg = "Auth Rejected: Session expired or missing.";
        } else if (res.status === 404) {
          errorMsg = "Generation endpoint temporarily unreachable. Please click Retry Generation.";
        } else if (res.status === 504 || res.status === 408) {
          errorMsg = "Generation timed out. Please click Retry Generation to load your story.";
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
    if (nextCount >= 2 || regenerationCount >= 1) {
      setLoadingText("It looks like we missed the mark. No worries, we're generating something special for you.");
    } else {
      setLoadingText("Reviewing your preferences... Creating your content... This is going to be great!");
    }
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
                  onClick={() => handleGenerate()}
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

              {/* Always Available Green Continuation Button for Streamed Story */}
              {!loading && !isContinuing && (generatedContent.trim().length > 0 || streamProgress.trim().length > 0) && (
                <div
                  onClick={() => handleContinueStory(cleanContent || (scenario as any)?.body || generatedContent || streamProgress || '')}
                  className="cursor-pointer bg-emerald-950/40 border border-emerald-800/80 hover:bg-emerald-900/40 text-emerald-300 rounded-xl p-4 text-center mt-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all group"
                >
                  <span className="font-medium text-sm md:text-base leading-relaxed w-full text-center sm:text-left flex items-center gap-2 text-emerald-300">
                    <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
                    Click continue story to expand.
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContinueStory(cleanContent || (scenario as any)?.body || generatedContent || streamProgress || '');
                    }}
                    disabled={isContinuing}
                    className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 shadow self-center sm:self-auto cursor-pointer flex items-center gap-1.5"
                  >
                    Continue Story &gt;
                  </button>
                </div>
              )}

              {error && error !== STREAM_INTERRUPTED_MESSAGE && !error.toLowerCase().includes("continue story to expand") && (
                <div className="mt-4 p-4 bg-red-950/30 border border-red-800 rounded-xl text-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">⚠️</span>
                    <span className="font-medium text-sm md:text-base leading-relaxed">{error}</span>
                  </div>
                  {activeTrope && (
                    <button
                      onClick={() => handleGenerate()}
                      disabled={loading}
                      className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 shadow self-center sm:self-auto cursor-pointer"
                    >
                      {loading ? "Drafting..." : "Retry Generation"}
                    </button>
                  )}
                </div>
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
              className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
            >
              ← Configure a new story
            </button>
            <div className="flex items-center gap-3">
              {/* Literature Favorite Toggle */}
              <button
                onClick={handleToggleFavorite}
                disabled={isFavoriting}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer shadow-sm active:scale-95 ${
                  isFavorite
                    ? "bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700"
                }`}
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <span className={`text-base transition-transform ${isFavorite ? "scale-110" : "grayscale opacity-70"}`}>
                  {isFavorite ? '❤️' : '🤍'}
                </span>
                <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>

              {/* Text Story Download */}
              <button
                onClick={handleDownloadStory}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-sm transition-colors w-fit cursor-pointer shadow-sm active:scale-95"
                title="Download story as .txt"
              >
                <span>📥</span>
                Download Story (.txt)
              </button>

              {/* PDF Story Export */}
              <button
                onClick={() => {
                  const title = scenario.title || "Romantic Literature";
                  const bodyText = cleanContent || scenario.body || scenario.overview || "";
                  exportStoryToPdf(title, bodyText, "LITERATURE");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-sm transition-colors w-fit cursor-pointer shadow-sm active:scale-95"
                title="Download story as PDF"
              >
                <span>📄</span>
                PDF
              </button>
            </div>
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
            {((scenario as any)?.status === 'chapter_1_ready' || (scenario as any)?.status === 'chapter_2_ready') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border bg-zinc-900 border-zinc-700 text-zinc-300">
                <span>📖</span> Chapter {(scenario as any)?.chapter || 1}
              </span>
            )}
            {((scenario as any)?.status === 'completed' || ((scenario as any)?.chapter && (scenario as any).chapter >= 3)) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border bg-zinc-900 border-zinc-700 text-zinc-300">
                <span>📖</span> Novella (Chapter {(scenario as any)?.chapter || 3} of 20)
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
            <div ref={newChapterRef} />
          </div>

          {/* Always Available Single Green Continuation Button */}
          {!loading && !isContinuing && (
            <div
              onClick={() => handleContinueStory(cleanContent || (scenario as any)?.body || generatedContent || streamProgress || '')}
              className="cursor-pointer bg-emerald-950/40 border border-emerald-800/80 hover:bg-emerald-900/40 text-emerald-300 rounded-xl p-4 text-center mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all group"
            >
              <span className="font-medium text-sm md:text-base leading-relaxed w-full text-center sm:text-left flex items-center gap-2 text-emerald-300">
                <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
                Click continue story to expand.
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinueStory(cleanContent || (scenario as any)?.body || generatedContent || streamProgress || '');
                }}
                disabled={isContinuing}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 shadow self-center sm:self-auto cursor-pointer flex items-center gap-1.5"
              >
                Continue Story &gt;
              </button>
            </div>
          )}

          {error && error !== STREAM_INTERRUPTED_MESSAGE && !error.toLowerCase().includes("continue story to expand") && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-800 rounded-xl text-red-300 flex items-center gap-3 shadow-lg animate-in fade-in">
              <span className="text-xl shrink-0">⚠️</span>
              <span className="font-medium text-sm md:text-base leading-relaxed">{error}</span>
            </div>
          )}

          {/* Story Actions: Configure New Story & Regenerate */}
          <div className="flex flex-wrap items-center gap-4 mb-8" style={{ overflowAnchor: 'none' }}>
            <button
              onClick={handleConfigureNewStory}
              disabled={isContinuing || loading}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Configure New Story
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

      {/* Floating Favorite Toast */}
      {favoriteToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
          <span className="text-base">❤️</span>
          <span className="text-sm font-medium text-zinc-200">{favoriteToast}</span>
        </div>
      )}
    </div>
  );
}
