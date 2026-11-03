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
        <FlameLoader isGenerating={true} progressText="Reviewing your preferences... Creating your content... Enjoy!" />
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

interface RolePlayClientProps {
  initialTolerance?: string;
  initialKinks?: string[];
}

export default function RolePlayClient({ initialTolerance, initialKinks }: RolePlayClientProps = {}) {
  const searchParams = useSearchParams();
  const rawMode = searchParams.get("mode");
  const initialMode = rawMode === "group" ? "group" : "couple";
  
  const [playMode, setPlayMode] = useState(initialMode);
  const [theme, setTheme] = useState(() => {
    const p = searchParams.get("prompt");
    const t = searchParams.get("theme");
    if (p) return p;
    if (t?.toLowerCase() === "halloween") return "Gothic Masquerade: Midnight Rituals & Dark Secrets";
    return t || "";
  });

  const [userProfileTolerance, setUserProfileTolerance] = useState<string>(initialTolerance || 'Playful');
  const [userKinksOverride, setUserKinksOverride] = useState<string[]>(initialKinks || []);

  useEffect(() => {
    const p = searchParams.get("prompt");
    const t = searchParams.get("theme");
    if (p) {
      setTheme(p);
    } else if (t?.toLowerCase() === "halloween" && !theme) {
      setTheme("Gothic Masquerade: Midnight Rituals & Dark Secrets");
    } else if (t && !theme) {
      setTheme(t);
    }
  }, [searchParams]);

  const [targetBoundary, setTargetBoundary] = useState(initialTolerance || "");
  const [kinksInput, setKinksInput] = useState(() => (initialKinks && initialKinks.length > 0) ? initialKinks.join(', ') : "");
  const pacing = "Medium Burn";
  const [activeMode, setActiveMode] = useState<ReaderMode>("partner-a");
  const [scenario, setScenario] = useState<ScenarioPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [streamProgress, setStreamProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [loadingText, setLoadingText] = useState("Reviewing your preferences... Creating your content... Enjoy!");
  const [storyId, setStoryId] = useState<string>("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareMethod, setShareMethod] = useState<'email' | 'sms'>('email');
  const [shareRecipient, setShareRecipient] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isPartnerDispatching, setIsPartnerDispatching] = useState(false);
  const [partnerDispatchSuccess, setPartnerDispatchSuccess] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const ensureStoryId = async (): Promise<string> => {
    if (storyId) return storyId;
    let targetId = crypto.randomUUID();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && scenario) {
        const { data: existing } = await supabase
          .from('generated_content')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', scenario.title)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          setStoryId(existing.id);
          return existing.id;
        }

        await supabase.from('generated_content').insert({
          id: targetId,
          user_id: user.id,
          content_type: 'roleplay',
          title: scenario.title,
          body: JSON.stringify(scenario),
          pre_experience_tasks: scenario.preExperienceTasks || null,
          status: 'active'
        });
        setStoryId(targetId);
        return targetId;
      }
    } catch (err) {
      console.warn("Could not ensure storyId in Supabase:", err);
    }
    setStoryId(targetId);
    return targetId;
  };

  const handleOpenShareModal = async () => {
    await ensureStoryId();
    setIsShareModalOpen(true);
    setShareError(null);
    setPartnerDispatchSuccess(null);
  };

  const handleCopyRecipientLink = async () => {
    const currentId = await ensureStoryId();
    const url = `https://betweenusapp.io/dashboard/experience/${currentId}?lens=b`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedLink(true);
      setShareToast('Recipient link (?lens=b) copied to clipboard');
      setTimeout(() => {
        setCopiedLink(false);
        setShareToast(null);
      }, 3500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handlePartnerDispatch = async () => {
    if (isPartnerDispatching || !scenario) return;
    setIsPartnerDispatching(true);
    setShareError(null);
    setPartnerDispatchSuccess(null);

    try {
      const currentId = await ensureStoryId();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          storyId: currentId,
          storyTitle: scenario.title,
          recipient: 'partner',
          isPartnerDispatch: true,
          lens: 'b'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch to partner');
      }

      setPartnerDispatchSuccess(data.message || 'Dispatched directly to partner!');
      setShareToast('Roleplay dispatched to partner!');
      setTimeout(() => {
        setIsShareModalOpen(false);
        setPartnerDispatchSuccess(null);
        setShareToast(null);
      }, 2500);
    } catch (err: any) {
      console.error("Error dispatching to partner:", err);
      setShareError(err.message || 'Failed to dispatch to partner. Please use direct link or email/SMS.');
    } finally {
      setIsPartnerDispatching(false);
    }
  };

  const handleShareStory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!shareRecipient.trim() || isSharing || !scenario) return;

    setIsSharing(true);
    setShareError(null);

    try {
      const currentId = await ensureStoryId();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          storyId: currentId,
          storyTitle: scenario.title,
          recipient: shareRecipient.trim(),
          lens: 'b'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch share');
      }

      setShareRecipient('');
      setIsShareModalOpen(false);
      setShareToast('Roleplay shared with Lens B recipient view');
      setTimeout(() => setShareToast(null), 4000);
    } catch (err: any) {
      console.error("Error sharing roleplay:", err);
      setShareError(err.message || 'Failed to share roleplay. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

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
              const list = parsed.map((k: any) => typeof k === 'string' ? k : (k?.text || '')).filter(Boolean);
              setUserKinksOverride(list);
              setKinksInput(prev => prev ? prev : list.join(', '));
            } else if (parsed && typeof parsed === 'object' && parsed.kinks) {
              const list = Array.isArray(parsed.kinks) ? parsed.kinks : [String(parsed.kinks)];
              setUserKinksOverride(list);
              setKinksInput(prev => prev ? prev : list.join(', '));
            } else if (typeof parsed === 'string') {
              setUserKinksOverride([parsed]);
              setKinksInput(prev => prev ? prev : parsed);
            }
          } catch {
            const list = kinkRow.kinks_override.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
            setUserKinksOverride(list);
            setKinksInput(prev => prev ? prev : list.join(', '));
          }
        }
      } catch (loadErr) {
        console.warn("Could not load user profile tolerance and kinks:", loadErr);
      }
    }
    loadUserToleranceAndKinks();
  }, [supabase]);

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
    setLoadingText("Reviewing your preferences... Creating your content... Enjoy!");
    setStoryId("");
    setIsShareModalOpen(false);
    setShareError(null);
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

      const inputKinks = kinksInput
        .split(/[,;\n]+/)
        .map(k => k.trim())
        .filter(Boolean);

      const combinedKinks = Array.from(new Set([...userKinksOverride, ...inputKinks]));
      const effectiveTolerance = targetBoundary || userProfileTolerance || 'Playful';

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
          prompt: theme,
          trope: theme,
          selectedKinks: combinedKinks,
          kinks: combinedKinks,
          tolerance: effectiveTolerance,
          targetBoundary: effectiveTolerance,
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
      setLoadingText("Reviewing your preferences... Creating your content... Enjoy!");
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

      const inputKinks = kinksInput
        .split(/[,;\n]+/)
        .map(k => k.trim())
        .filter(Boolean);

      const combinedKinks = Array.from(new Set([...userKinksOverride, ...inputKinks]));
      const effectiveTolerance = targetBoundary || userProfileTolerance || 'Playful';
      const clientStoryId = crypto.randomUUID();
      setStoryId(clientStoryId);

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
          prompt: theme,
          trope: theme,
          selectedKinks: combinedKinks,
          kinks: combinedKinks,
          tolerance: effectiveTolerance,
          targetBoundary: effectiveTolerance,
          pacing: pacing,
          regenerationCount: currentRegen,
          storyId: clientStoryId
        })
      }).catch((fetchErr) => {
        console.error("Generate fetch error:", fetchErr);
        isStreamInterrupted = true;
        throw new Error(STREAM_INTERRUPTED_MESSAGE);
      });

      const serverContentId = res.headers.get('x-content-id');
      if (serverContentId) {
        setStoryId(serverContentId);
      }

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
      setLoadingText("Reviewing your preferences... Creating your content... Enjoy!");
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
              <label className="block text-sm font-medium text-zinc-300 mb-2">Theme & Setting Suggestions (Optional)</label>
              <textarea 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g., A rainy night in a secluded cabin, masquerade ball, enemies to lovers..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-300 h-24 focus:outline-none focus:border-red-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Kinks, Tropes & Desired Dynamics (Optional)</label>
              <input 
                type="text"
                value={kinksInput}
                onChange={(e) => setKinksInput(e.target.value)}
                placeholder="e.g., praise, sensory deprivation, light bondage, power exchange..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-red-900"
              />
            </div>
          </div>
          
          <button
            onClick={() => handleGenerate()}
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {loading ? "Drafting Scenario..." : "Generate Story"}
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

          {/* Always Available Green Continuation Button for Streamed Roleplay */}
          {!loading && !isContinuing && (generatedContent.trim().length > 0 || streamProgress.trim().length > 0) && (
            <div
              onClick={() => handleContinueStory((scenario as any)?.fullScript || (scenario as any)?.body || (scenario as any)?.text || generatedContent || streamProgress || '')}
              className="cursor-pointer bg-emerald-950/40 border border-emerald-800/80 hover:bg-emerald-900/40 text-emerald-300 rounded-xl p-4 text-center mt-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all group"
            >
              <span className="font-medium text-sm md:text-base leading-relaxed w-full text-center sm:text-left flex items-center gap-2 text-emerald-300">
                <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
                Click continue story to expand.
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinueStory((scenario as any)?.fullScript || (scenario as any)?.body || (scenario as any)?.text || generatedContent || streamProgress || '');
                }}
                disabled={isContinuing}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shrink-0 shadow self-center sm:self-auto cursor-pointer flex items-center gap-1.5"
              >
                Continue Story &gt;
              </button>
            </div>
          )}

          {error && error !== STREAM_INTERRUPTED_MESSAGE && !error.toLowerCase().includes("continue story to expand") && (
            <div className="mt-4 p-4 bg-red-950/30 border border-red-800 rounded-xl text-red-300 flex items-center gap-3 shadow-lg animate-in fade-in">
              <span className="text-xl shrink-0">⚠️</span>
              <span className="font-medium text-sm md:text-base leading-relaxed">{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Generated Content Area */}
      {scenario && (
        <div className="animate-in fade-in duration-700 pb-24" style={{ overflowAnchor: 'none' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <button 
              onClick={handleConfigureNewStory}
              className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
            >
              ← Configure a new scenario
            </button>
            <button
              onClick={handleOpenShareModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white border border-red-700/60 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <span className="text-base">📤</span>
              <span>Share Roleplay</span>
            </button>
          </div>
          
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

          {/* Always Available Green Continuation Button for Roleplay Scenario */}
          {!loading && !isContinuing && (
            <div
              onClick={() => handleContinueStory((scenario as any)?.fullScript || (scenario as any)?.body || (scenario as any)?.text || generatedContent || '')}
              className="cursor-pointer bg-emerald-950/40 border border-emerald-800/80 hover:bg-emerald-900/40 text-emerald-300 rounded-xl p-4 text-center mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all group"
            >
              <span className="font-medium text-sm md:text-base leading-relaxed w-full text-center sm:text-left flex items-center gap-2 text-emerald-300">
                <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
                Click continue story to expand.
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinueStory((scenario as any)?.fullScript || (scenario as any)?.body || (scenario as any)?.text || generatedContent || '');
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
            <button
              onClick={handleOpenShareModal}
              disabled={isContinuing || loading}
              className="px-6 py-2.5 bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white border border-red-700/60 rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>📤</span>
              Share Roleplay
            </button>
          </div>

          {isContinuing && wordCount < 1000 && (
            <div className="mt-4 mb-8">
              <FlameLoader
                isGenerating={isContinuing}
                progressText="Reviewing your preferences... Creating your content... Enjoy!"
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

      {/* Share Dialog Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <h3 className="text-xl font-serif font-bold text-zinc-100">
                    Share Roleplay Scenario
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-xs text-purple-300 bg-purple-950/60 border border-purple-800/60 px-2.5 py-0.5 rounded-full mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Recipient View: Partner B Lens (Lens A Hidden)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xl font-bold p-1 leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              Share <span className="text-zinc-200 font-semibold">"{scenario?.title}"</span> with your partner. They will receive their dedicated <strong className="text-purple-300">Partner B Lens</strong> and the Weekend Script, keeping your Partner A secrets hidden.
            </p>

            {/* 1. Dedicated Recipient Link with ?lens=b */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <span>🔗</span> Recipient Link (Partner B)
                </label>
                <span className="text-[10px] text-purple-400 font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                  ?lens=b
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://betweenusapp.io/dashboard/experience/${storyId}?lens=b`}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyRecipientLink}
                  className="shrink-0 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold transition-all border border-zinc-700 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {copiedLink ? '✓ Copied!' : 'Copy Recipient Link'}
                </button>
              </div>
            </div>

            {/* 2. One-Click Partner Dispatch */}
            <div className="bg-gradient-to-r from-red-950/30 to-purple-950/30 p-4 rounded-xl border border-red-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span>✨</span> Send to Linked Partner
                </span>
                <p className="text-xs text-zinc-400">
                  Dispatches directly to your Between Us Pass connected partner.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePartnerDispatch}
                disabled={isPartnerDispatching}
                className="shrink-0 px-4 py-2.5 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                {isPartnerDispatching ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping mr-1" />
                    Sending...
                  </>
                ) : partnerDispatchSuccess ? (
                  '✓ Sent to Partner!'
                ) : (
                  'Dispatch to Partner >'
                )}
              </button>
            </div>

            {partnerDispatchSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <span>✓</span> {partnerDispatchSuccess}
              </div>
            )}

            {/* 3. Email & SMS Direct Dispatch */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold block">
                Or Dispatch via Email / SMS
              </span>

              {/* Delivery Method Selector */}
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setShareMethod('email'); setShareError(null); }}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                    shareMethod === 'email' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => { setShareMethod('sms'); setShareError(null); }}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                    shareMethod === 'sms' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Mobile Number (SMS)
                </button>
              </div>

              <form onSubmit={handleShareStory} className="space-y-4">
                {shareMethod === 'email' ? (
                  <div>
                    <input
                      type="email"
                      value={shareRecipient}
                      onChange={(e) => setShareRecipient(e.target.value)}
                      placeholder="partner@example.com"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-zinc-200 focus:outline-none focus:border-red-500 text-sm transition-colors"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      type="tel"
                      value={shareRecipient}
                      onChange={(e) => setShareRecipient(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-zinc-200 focus:outline-none focus:border-red-500 text-sm transition-colors"
                      required
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Dispatched via Twilio SMS text message with Lens B link attached.
                    </p>
                  </div>
                )}

                {shareError && (
                  <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-xs">
                    {shareError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSharing || !shareRecipient.trim()}
                    className="px-5 py-2.5 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSharing ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping mr-1" />
                        Sending Link...
                      </>
                    ) : (
                      'Send Recipient Link'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Visual Success Toast */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-green-800/80 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <span className="text-green-400 text-lg">✓</span>
          <span className="text-sm font-medium text-zinc-200">{shareToast}</span>
        </div>
      )}
    </div>
  );
}
