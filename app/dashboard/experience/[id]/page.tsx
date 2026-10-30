'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import RatingWidget from '@/components/RatingWidget'
import SuggestScenario from '@/components/SuggestScenario'
import ErrorBoundary, { safeMarkdownString } from '@/components/ErrorBoundary'
import { exportStoryToPdf } from "@/utils/pdfExport"
import { splitStoryIntoPages } from "@/lib/storyPagination"

export { splitStoryIntoPages }

type ReaderMode = "partner-a" | "partner-b" | "script";

export const STREAM_INTERRUPTED_MESSAGE = "Click continue story to expand.";

export default function ExperienceReader({ params }: { params: any }) {
  const [supabase] = useState(() => createClient())
  const [experience, setExperience] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<ReaderMode>("script")
  const [textSize, setTextSize] = useState<"text-lg" | "text-xl" | "text-2xl">("text-lg")
  const [storyId, setStoryId] = useState<string>("")
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareMethod, setShareMethod] = useState<'email' | 'sms'>('email')
  const [shareRecipient, setShareRecipient] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareToast, setShareToast] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const [favoriteToast, setFavoriteToast] = useState<string | null>(null)
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false)
  
  // Paginated Reader State & Smart Scroll
  const [pages, setPages] = useState<string[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0)
  const [isPrefetching, setIsPrefetching] = useState<boolean>(false)
  const pageContainerRef = useRef<HTMLDivElement>(null)
  const hasPrefetchedPages4to6 = useRef<boolean>(false)

  useEffect(() => {
    async function fetchContent() {
      const resolved = await params;
      const id = resolved?.id || params?.id;
      if (!id) return;
      setStoryId(id);

      // Verify user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        try {
          sessionStorage.setItem('share_id', id);
          document.cookie = `share_id=${encodeURIComponent(id)}; path=/; max-age=86400; SameSite=Lax`;
        } catch (e) {}
        window.location.href = `/login?share_id=${id}`;
        return;
      }

      // Check if user is active
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile && profile.is_active === false) {
        try {
          sessionStorage.setItem('share_id', id);
          document.cookie = `share_id=${encodeURIComponent(id)}; path=/; max-age=86400; SameSite=Lax`;
        } catch (e) {}
        window.location.href = `https://buy.stripe.com/28EcN5goV16l9JBgFNbbG00?client_reference_id=${session.user.id}&prefilled_email=${encodeURIComponent(session.user.email || '')}&share_id=${id}`;
        return;
      }

      let data: any = null;
      try {
        const { data: rowData, error: fetchErr } = await supabase
          .from('generated_content')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchErr) {
          console.warn("Defensive fetch of generated_content encountered error:", fetchErr);
        }
        data = rowData;
      } catch (e) {
        console.warn("Exception fetching generated_content:", e);
      }

      if (data) {
        // Defensive: do not make is_favorite a hard dependency if not hydrated; fallback gracefully to false
        const isFav = typeof data.is_favorite === 'boolean'
          ? data.is_favorite
          : Boolean(typeof data.theme_tags === 'string' && data.theme_tags.includes('[favorite]'));
        setIsFavorite(isFav);

        if (!isFav) {
          // Check user_favorites via API
          try {
            const favRes = await fetch(`/api/favorites/toggle?contentId=${id}`);
            if (favRes.ok) {
              const favJson = await favRes.json();
              if (favJson.isFavorite) {
                setIsFavorite(true);
              }
            }
          } catch {}
        }

        // Try to parse the body as JSON if it was stored as JSON from Gemini
        try {
           const parsedBody = JSON.parse(data.body.replace(/```json|```/g, '').trim());
           if (typeof parsedBody === 'object' && parsedBody !== null) {
              data.parsedData = parsedBody;
           }
        } catch(e) {
           // Plain text
           data.parsedData = null;
        }

        const scriptContent = data.parsedData?.body || data.parsedData?.text || data.parsedData?.fullScript || data.body || '';
        const rawContent = typeof scriptContent === 'string' ? scriptContent : JSON.stringify(scriptContent);
        let initialPages: string[] = [];
        if (Array.isArray(data.parsedData?.pages) && data.parsedData.pages.length > 0) {
          initialPages = data.parsedData.pages;
        } else {
          initialPages = splitStoryIntoPages(rawContent);
        }
        if (initialPages.length === 0 && rawContent) {
          initialPages = [rawContent];
        }
        setPages(initialPages);

        try {
          const savedPage = localStorage.getItem(`story_page_${id}`);
          if (savedPage) {
            const pageNum = parseInt(savedPage, 10);
            if (!isNaN(pageNum) && pageNum >= 0 && pageNum < initialPages.length) {
              setCurrentPageIndex(pageNum);
            }
          }
        } catch {}

        setExperience(data)
      }
      setLoading(false)
    }
    fetchContent()
  }, [params])

  // Restore reading progress from localStorage on mount / once story is loaded
  useEffect(() => {
    if (loading || !experience || !storyId) return;

    try {
      const savedPage = localStorage.getItem(`story_page_${storyId}`);
      if (savedPage) {
        const pageNum = parseInt(savedPage, 10);
        if (!isNaN(pageNum) && pageNum >= 0 && pageNum < pages.length) {
          setCurrentPageIndex(pageNum);
        }
      }
      const savedPosition = localStorage.getItem(`story_progress_${storyId}`);
      if (savedPosition) {
        const targetScroll = parseInt(savedPosition, 10);
        if (!isNaN(targetScroll) && targetScroll > 0) {
          const timer = setTimeout(() => {
            window.scrollTo({
              top: targetScroll,
              behavior: 'smooth'
            });
          }, 150);
          return () => clearTimeout(timer);
        }
      }
    } catch (err) {
      console.warn("Could not retrieve saved story progress:", err);
    }
  }, [loading, experience, storyId]);

  // Track and debounce scroll position to save to localStorage
  useEffect(() => {
    if (loading || !experience || !storyId) return;

    let debounceTimer: NodeJS.Timeout | null = null;

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

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        try {
          const scrollPosition = window.scrollY;
          if (scrollPosition >= 0) {
            localStorage.setItem(`story_progress_${storyId}`, scrollPosition.toString());
          }
        } catch (err) {
          console.warn("Could not save story progress:", err);
        }
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loading, experience, storyId]);

  const handleDownloadStory = () => {
    if (!experience) return;

    const contentObj = experience.parsedData || {};
    const title = contentObj.title || experience.title || "Untitled Story";
    const scriptBody = pages.length > 0 ? pages.join('\n\n') : (contentObj.body || contentObj.fullScript || experience.body);
    const isRoleplay = experience.content_type !== 'midweek_story';
    const storyboard = contentObj.overview || contentObj.storyboard || "";
    const preTasks = contentObj.tasks || contentObj.preExperienceTasks || experience.pre_experience_tasks || [];
    const partnerA = contentObj.partnerAPerspective || contentObj.partner_a_perspective || "";
    const partnerB = contentObj.partnerBPerspective || contentObj.partner_b_perspective || "";

    let fileContent = `# ${title}\n\n`;

    if (experience.content_type === 'literature' || !isRoleplay) {
      const bodyText = typeof scriptBody === 'string'
        ? scriptBody
        : (contentObj.body || JSON.stringify(scriptBody, null, 2));
      fileContent += `${bodyText}\n`;
    } else {
      if (storyboard) {
        fileContent += `## Storyboard\n${storyboard}\n\n`;
      }
      if (preTasks && preTasks.length > 0) {
        fileContent += `## Pre-Experience Tasks\n${preTasks.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}\n\n`;
      }
      if (partnerA) {
        fileContent += `## Partner A Perspective\n${partnerA}\n\n`;
      }
      if (partnerB) {
        fileContent += `## Partner B Perspective\n${partnerB}\n\n`;
      }
      if (scriptBody) {
        fileContent += `## The Script\n${typeof scriptBody === 'string' ? scriptBody : JSON.stringify(scriptBody, null, 2)}\n\n`;
      }
    }

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

  const handleDownloadPdf = () => {
    if (!experience) return;

    const contentObj = experience.parsedData || {};
    const title = contentObj.title || experience.title || "Untitled Story";
    const scriptBody = pages.length > 0 ? pages.join('\n\n') : (contentObj.body || contentObj.fullScript || experience.body);
    const isRoleplay = experience.content_type !== 'midweek_story';
    const storyboard = contentObj.overview || contentObj.storyboard || "";
    const preTasks = contentObj.tasks || contentObj.preExperienceTasks || experience.pre_experience_tasks || [];
    const partnerA = contentObj.partnerAPerspective || contentObj.partner_a_perspective || "";
    const partnerB = contentObj.partnerBPerspective || contentObj.partner_b_perspective || "";

    let fileContent = `# ${title}\n\n`;

    if (experience.content_type === 'literature' || !isRoleplay) {
      const bodyText = typeof scriptBody === 'string'
        ? scriptBody
        : (contentObj.body || JSON.stringify(scriptBody, null, 2));
      fileContent += `${bodyText}\n`;
    } else {
      if (storyboard) {
        fileContent += `## Storyboard\n${storyboard}\n\n`;
      }
      if (preTasks && preTasks.length > 0) {
        fileContent += `## Pre-Experience Tasks\n${preTasks.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}\n\n`;
      }
      if (partnerA) {
        fileContent += `## Partner A Perspective\n${partnerA}\n\n`;
      }
      if (partnerB) {
        fileContent += `## Partner B Perspective\n${partnerB}\n\n`;
      }
      if (scriptBody) {
        fileContent += `## The Script\n${typeof scriptBody === 'string' ? scriptBody : JSON.stringify(scriptBody, null, 2)}\n\n`;
      }
    }

    exportStoryToPdf(title, fileContent, experience.content_type ? experience.content_type.toUpperCase() : 'STORY');
  };

  const handleShareStory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!shareRecipient.trim() || isSharing) return;

    setIsSharing(true);
    setShareError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const contentObj = experience?.parsedData || {};
      const title = contentObj.title || experience?.title || "Intimate Story";

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          storyId,
          storyTitle: title,
          recipient: shareRecipient.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch share');
      }

      setShareRecipient('');
      setIsShareModalOpen(false);
      setShareToast('Story shared successfully');
      setTimeout(() => setShareToast(null), 4000);
    } catch (err: any) {
      console.error("Error sharing story:", err);
      setShareError(err.message || 'Failed to share story. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyDirectLink = async () => {
    const directUrl = `https://betweenusapp.io/dashboard/experience/${storyId}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(directUrl);
      }
      setCopiedLink(true);
      setShareToast('Story link copied to clipboard');
      setTimeout(() => {
        setCopiedLink(false);
        setShareToast(null);
      }, 3500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShareClick = async () => {
    const directUrl = `https://betweenusapp.io/dashboard/experience/${storyId}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const contentObj = experience?.parsedData || {};
        const title = contentObj.title || experience?.title || "Between Us Story";
        await navigator.share({
          title,
          url: directUrl,
        });
        return;
      } catch (err: any) {
        if (err && err.name === 'AbortError') return;
        console.error("Navigator share failed, falling back:", err);
      }
    }
    // Fallback: copy link and open modal
    await handleCopyDirectLink();
    setIsShareModalOpen(true);
    setShareError(null);
  };

  const handleToggleFavorite = async () => {
    if (isFavoriting || !storyId) return;
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    setIsFavoriting(true);
    setFavoriteToast(nextFavorite ? 'Added to favorites' : 'Removed from favorites');
    setTimeout(() => setFavoriteToast(null), 3500);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          contentId: storyId,
          isFavorite: nextFavorite
        })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to update favorite status');
      }
      if (typeof resJson.isFavorite === 'boolean') {
        setIsFavorite(resJson.isFavorite);
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      setIsFavorite(!nextFavorite); // Revert on failure
      setFavoriteToast('Failed to update favorite status');
      setTimeout(() => setFavoriteToast(null), 3500);
    } finally {
      setIsFavoriting(false);
    }
  };

  // Page Navigation Handlers with Smart Scroll strictly to the top of the container
  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);
      try {
        localStorage.setItem(`story_page_${storyId}`, nextIndex.toString());
      } catch {}

      if (pageContainerRef.current) {
        pageContainerRef.current.scrollTop = 0;
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      const prevIndex = currentPageIndex - 1;
      setCurrentPageIndex(prevIndex);
      try {
        localStorage.setItem(`story_page_${storyId}`, prevIndex.toString());
      } catch {}

      if (pageContainerRef.current) {
        pageContainerRef.current.scrollTop = 0;
      }
    }
  };

  // Background Pre-Generation Engine:
  // When user navigates to Page 2 (index 1), automatically fire a silent background API request
  // to generate Pages 4-6, sending the ENTIRETY of the updated story state to OpenRouter,
  // and appending newly generated pages to the cached page array.
  useEffect(() => {
    if (currentPageIndex !== 1) return;
    if (!storyId || !experience) return;
    if (pages.length >= 6 || hasPrefetchedPages4to6.current || isPrefetching) return;

    hasPrefetchedPages4to6.current = true;
    let isCancelled = false;

    async function prefetchPages4to6() {
      setIsPrefetching(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.warn("[Background Prefetch] No active session token found for prefetch");
          setIsPrefetching(false);
          return;
        }

        const contentType = experience.content_type === 'roleplay' || experience.content_type === 'weekend_scenario' ? 'roleplay' : 'literature';
        // Send the entirety of the updated story state (all previous pages concatenated)
        const fullStorySoFar = pages.join('\n\n').trim();

        console.log("[Background Prefetch] Prefetching Pages 4-6 in background...");
        const res = await fetch('/api/generate/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include',
          body: JSON.stringify({
            contentType,
            hasScripts: contentType === 'roleplay',
            previousContent: fullStorySoFar,
            existingStory: fullStorySoFar,
            startChapter: 4,
            endChapter: 6,
            theme: experience.title || '',
            storyId
          })
        });

        if (!res.ok) {
          throw new Error(`Background prefetch failed (${res.status})`);
        }

        let raw = '';
        const reader = res.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            raw += decoder.decode(value, { stream: true });
          }
        } else {
          raw = await res.text();
        }

        if (isCancelled) return;

        let newContent = '';
        try {
          const parsed = JSON.parse(raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, ''));
          newContent = parsed.body || parsed.text || parsed.content || '';
        } catch {
          newContent = raw.trim();
        }

        if (newContent && newContent.trim().length > 0) {
          const newPages = splitStoryIntoPages(newContent);
          if (newPages.length > 0) {
            setPages(prevPages => {
              const existingFullText = prevPages.join('\n\n');
              const nonDuplicate = newPages.filter(p => !existingFullText.includes(p.slice(0, 80)));
              if (nonDuplicate.length === 0) return prevPages;
              const updated = [...prevPages, ...nonDuplicate];

              // Persist update in Supabase silently
              const updatedBody = updated.join('\n\n');
              supabase
                .from('generated_content')
                .update({
                  body: JSON.stringify({
                    ...(experience.parsedData || {}),
                    body: updatedBody,
                    text: updatedBody,
                    pages: updated,
                    chapter: updated.length,
                    title: experience.title
                  })
                })
                .eq('id', storyId)
                .then(() => {
                  console.log('[Background Prefetch] Successfully persisted Pages 4-6 to Supabase');
                })
                .catch((err: any) => {
                  console.warn('[Background Prefetch] Failed to persist prefetch to Supabase:', err);
                });

              return updated;
            });

            setExperience((prev: any) => {
              if (!prev) return prev;
              const updatedBody = `${(prev.body || '').trim()}\n\n${newContent.trim()}`;
              return {
                ...prev,
                body: updatedBody,
                parsedData: prev.parsedData ? {
                  ...prev.parsedData,
                  body: updatedBody,
                  text: updatedBody
                } : null
              };
            });
          }
        }
      } catch (err) {
        console.warn("[Background Prefetch] Error pre-generating Pages 4-6:", err);
      } finally {
        if (!isCancelled) {
          setIsPrefetching(false);
        }
      }
    }

    prefetchPages4to6();

    return () => {
      isCancelled = true;
    };
  }, [currentPageIndex, storyId, experience, pages, isPrefetching]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse font-serif italic text-lg">Preparing the scene...</p>
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-8 flex flex-col items-center justify-center space-y-4">
        <p className="text-red-500 text-xl font-bold">Content not found.</p>
        <Link href="/dashboard" className="text-red-500 hover:underline">Return to Dashboard</Link>
      </div>
    )
  }

  const isRoleplay = experience?.content_type === 'roleplay' || experience?.content_type === 'weekend_scenario';
  const contentObj = experience?.parsedData || {};
  
  const rawPartnerA = contentObj.partnerA || contentObj.partnerAPerspective || contentObj.partner_a_perspective || contentObj.partner_a;
  const rawPartnerB = contentObj.partnerB || contentObj.partnerBPerspective || contentObj.partner_b_perspective || contentObj.partner_b;

  const partnerANickname = typeof rawPartnerA === 'object' && rawPartnerA !== null ? rawPartnerA?.nickname || rawPartnerA?.name : null;
  const partnerBNickname = typeof rawPartnerB === 'object' && rawPartnerB !== null ? rawPartnerB?.nickname || rawPartnerB?.name : null;

  const partnerA = typeof rawPartnerA === 'string'
    ? rawPartnerA
    : (rawPartnerA?.perspective || rawPartnerA?.content || rawPartnerA?.text || rawPartnerA?.monologue || (rawPartnerA ? JSON.stringify(rawPartnerA) : '')) || "Your partner is eagerly anticipating what comes next. Lean into the mystery and excitement.";

  const partnerB = typeof rawPartnerB === 'string'
    ? rawPartnerB
    : (rawPartnerB?.perspective || rawPartnerB?.content || rawPartnerB?.text || rawPartnerB?.monologue || (rawPartnerB ? JSON.stringify(rawPartnerB) : '')) || "The tension is building. Focus on the sensory details and let the moment guide you.";

  const preTasks = contentObj.tasks || contentObj.preExperienceTasks || experience?.pre_experience_tasks || [];
  const storyboard = contentObj.overview || contentObj.storyboard || "The stage is set for an intimate encounter.";
  const scriptBody = contentObj.body || contentObj.text || contentObj.content || contentObj.story || contentObj.fullScript || experience?.body || experience?.overview || '';

  const content = typeof scriptBody === 'string' ? scriptBody : (scriptBody ? JSON.stringify(scriptBody, null, 2) : '');
  const cleanContent = (content || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanStoryboard = (storyboard || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanPartnerA = (partnerA || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const cleanPartnerB = (partnerB || '').replace(/\\n/g, '\n').replace(/\n{3,}/g, '\n\n');

  const isInterruptedStory = (cleanContent || '').includes("Stream interrupted") || 
                             (cleanContent || '').includes("Click Continue Story to resume") || 
                             (cleanContent || '').includes("Click continue story to expand") ||
                             experience?.status === 'interrupted' ||
                             experience?.is_interrupted === true;

  const displayContent = (cleanContent || '')
    .replace(/⚠️?\s*Stream interrupted\.?\s*(Click Continue Story to resume)?/gi, '')
    .trim();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 lg:p-12 pb-32 font-sans selection:bg-red-900/50">
      
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Top Controls & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-6 gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center">
            &larr; Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handleToggleFavorite}
              disabled={isFavoriting}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer shadow-sm active:scale-95 ${
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

            <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800/50">
              <button onClick={() => setTextSize("text-lg")} className={`px-3 py-1 rounded text-sm transition-colors ${textSize === 'text-lg' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>A</button>
              <button onClick={() => setTextSize("text-xl")} className={`px-3 py-1 rounded text-base transition-colors ${textSize === 'text-xl' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>A</button>
              <button onClick={() => setTextSize("text-2xl")} className={`px-3 py-1 rounded text-lg font-bold transition-colors ${textSize === 'text-2xl' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>A</button>
            </div>
          </div>
        </div>
        
        {/* Header */}
        <header className="space-y-4 text-center mt-8">
          <span className="text-xs font-bold uppercase tracking-widest text-red-500 bg-red-950/30 px-4 py-1.5 rounded-full border border-red-900/30">
            {isRoleplay ? 'Weekend Roleplay' : 'Serialized Literature'}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-zinc-100 leading-tight tracking-tight mt-6">
            {contentObj.title || experience.title}
          </h1>
        </header>

        {/* The Toggles */}
        {isRoleplay && (
          <div className="flex flex-col sm:flex-row bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800/80 max-w-2xl mx-auto shadow-inner gap-1">
            <button
              onClick={() => setActiveMode("partner-a")}
              className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-lg transition-all duration-300 ${
                activeMode === "partner-a"
                  ? "bg-zinc-800 text-white shadow-md border border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
              }`}
            >
              {partnerANickname ? `${partnerANickname}'s Lens` : "Partner A Lens"}
            </button>
            <button
              onClick={() => setActiveMode("partner-b")}
              className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-lg transition-all duration-300 ${
                activeMode === "partner-b"
                  ? "bg-zinc-800 text-white shadow-md border border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
              }`}
            >
              {partnerBNickname ? `${partnerBNickname}'s Lens` : "Partner B Lens"}
            </button>
            <button
              onClick={() => setActiveMode("script")}
              className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-lg transition-all duration-300 ${
                activeMode === "script"
                  ? "bg-red-950/40 text-red-300 shadow-md border border-red-900/50"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
              }`}
            >
              Weekend Script
            </button>
          </div>
        )}

        <article
          style={{ overflowAnchor: 'none' }}
          onCopy={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          className={`select-none prose prose-invert prose-zinc max-w-none ${textSize} leading-loose space-y-12 transition-all duration-300`}
        >
          
          {/* Partner Lenses */}
          {activeMode === "partner-a" && isRoleplay && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl shadow-xl">
               <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-500 mb-6 font-sans">
                 Psychological Profile: {partnerANickname || "Partner A"}
               </h2>
               {cleanPartnerA ? (
                 <ErrorBoundary fallbackContent={cleanPartnerA}>
                   <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap font-serif text-zinc-300">
                     {safeMarkdownString(cleanPartnerA)}
                   </ReactMarkdown>
                 </ErrorBoundary>
               ) : (
                 <div className="py-8 text-center text-zinc-400 font-serif italic bg-zinc-950/40 rounded-xl border border-zinc-800">
                   Partner A perspective is temporarily hydrating...
                 </div>
               )}
             </div>
          )}

          {activeMode === "partner-b" && isRoleplay && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl shadow-xl">
               <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-500 mb-6 font-sans">
                 Psychological Profile: {partnerBNickname || "Partner B"}
               </h2>
               {cleanPartnerB ? (
                 <ErrorBoundary fallbackContent={cleanPartnerB}>
                   <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap font-serif text-zinc-300">
                     {safeMarkdownString(cleanPartnerB)}
                   </ReactMarkdown>
                 </ErrorBoundary>
               ) : (
                 <div className="py-8 text-center text-zinc-400 font-serif italic bg-zinc-950/40 rounded-xl border border-zinc-800">
                   Partner B perspective is temporarily hydrating or awaiting narrative details...
                 </div>
               )}
             </div>
          )}

          {/* Script / Body Mode */}
          {(!isRoleplay || activeMode === "script") && (
            <div className="animate-in fade-in duration-700 space-y-16">
              
              {isRoleplay && preTasks && preTasks.length > 0 && (
                <section className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-red-800"></div>
                  <h3 className="text-lg font-bold font-sans uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-3">
                    <span className="text-2xl">📋</span> Pre-Experience Tasks
                  </h3>
                  <ul className="space-y-4 font-sans text-base">
                    {preTasks.map((task: string, i: number) => (
                      <li key={i} className="flex gap-4 items-start text-zinc-300 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                        <span className="text-red-500 font-bold mt-0.5">{i + 1}.</span>
                        <span className="leading-relaxed">{task}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {isRoleplay && storyboard && (
                <section className="bg-zinc-950 border border-zinc-800/60 p-6 md:p-8 rounded-2xl">
                  <h3 className="text-sm font-bold font-sans uppercase tracking-widest text-zinc-500 mb-6">The Storyboard</h3>
                  <ErrorBoundary fallbackContent={cleanStoryboard}>
                    <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap font-serif italic text-zinc-300 leading-relaxed">
                      {safeMarkdownString(cleanStoryboard)}
                    </ReactMarkdown>
                  </ErrorBoundary>
                </section>
              )}

              <section className="space-y-6 pt-4 font-serif text-zinc-200" style={{ overflowAnchor: 'none' }}>
                {isRoleplay && <h3 className="text-sm font-bold font-sans uppercase tracking-widest text-zinc-500 mb-8 border-b border-zinc-800 pb-4">The Script</h3>}

                {/* Fixed-Height Reading Container to simulate actual book pages */}
                <div
                  ref={pageContainerRef}
                  style={{ overflowAnchor: 'none' }}
                  className="min-h-[550px] max-h-[750px] md:h-[720px] overflow-y-auto rounded-2xl bg-zinc-900/30 border border-zinc-800/80 p-6 sm:p-10 md:p-12 shadow-2xl relative scroll-smooth focus:outline-none"
                >
                  <ErrorBoundary fallbackContent={pages[currentPageIndex] || displayContent}>
                    <ReactMarkdown className="prose prose-invert max-w-none whitespace-pre-wrap">
                      {safeMarkdownString(pages[currentPageIndex] || displayContent)}
                    </ReactMarkdown>
                  </ErrorBoundary>
                </div>

                {/* Paginated Navigation UI */}
                <div
                  style={{ overflowAnchor: 'none' }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 shadow-lg mt-6"
                >
                  <button
                    type="button"
                    onClick={handlePreviousPage}
                    disabled={currentPageIndex === 0}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60"
                    title="Previous Page"
                  >
                    <span>&larr;</span> Previous Page
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-zinc-300 font-serif">
                      Page {currentPageIndex + 1} of {Math.max(pages.length, 1)}
                    </span>
                    {isPrefetching && (
                      <span className="text-xs text-rose-400 animate-pulse flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        Pre-generating chapters in background...
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={currentPageIndex >= pages.length - 1}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-red-950/70 hover:bg-red-900/90 text-red-200 hover:text-white border border-red-900/60 shadow-md"
                    title="Next Page"
                  >
                    Next Page <span>&rarr;</span>
                  </button>
                </div>
              </section>

            </div>
          )}

        </article>

        {/* Story Actions (Download, Share, & Favorite) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <button
              onClick={handleDownloadStory}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-red-900/50 rounded-xl font-medium transition-all shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95 group cursor-pointer"
              title="Download story as .txt"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">📥</span>
              Download Story (.txt)
            </button>
            <button
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-red-900/50 rounded-xl font-medium transition-all shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95 group cursor-pointer"
              title="Download story as PDF"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">📄</span>
              PDF
            </button>
            <button
              onClick={handleShareClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-red-950/40 hover:bg-red-900/60 text-red-200 hover:text-white border border-red-900/60 hover:border-red-700 rounded-xl font-medium transition-all shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-95 group cursor-pointer select-none pointer-events-auto"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">📤</span>
              Share
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={isFavoriting}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-medium transition-all shadow-lg active:scale-95 group cursor-pointer border ${
                isFavorite
                  ? "bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border-rose-800/80 shadow-[0_0_25px_rgba(244,63,94,0.35)]"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700/80 hover:border-rose-900/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]"
              }`}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <span className={`text-xl transition-transform group-hover:scale-125 ${isFavorite ? "scale-110" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"}`}>
                {isFavorite ? '❤️' : '🤍'}
              </span>
              <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>
          </div>
          <span className="text-xs text-zinc-500 font-light">
            Export offline, favorite, or share securely via Email / SMS
          </span>
        </div>

        {/* Share Modal */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <h3 className="text-xl font-serif font-bold text-zinc-100">Share Experience</h3>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xl font-bold p-1 leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed">
                Send a secure direct link for <span className="text-zinc-200 font-semibold">"{contentObj.title || experience.title}"</span> via email or SMS text message.
              </p>

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
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                      Recipient Email Address
                    </label>
                    <input
                      type="email"
                      value={shareRecipient}
                      onChange={(e) => setShareRecipient(e.target.value)}
                      placeholder="partner@example.com"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3.5 text-zinc-200 focus:outline-none focus:border-red-500 text-sm transition-colors"
                      autoFocus
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                      Recipient Mobile Number (SMS)
                    </label>
                    <input
                      type="tel"
                      value={shareRecipient}
                      onChange={(e) => setShareRecipient(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3.5 text-zinc-200 focus:outline-none focus:border-red-500 text-sm transition-colors"
                      autoFocus
                      required
                    />
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Dispatched directly via our active Twilio SMS integration.
                    </p>
                  </div>
                )}

                {shareError && (
                  <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-xs">
                    {shareError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleCopyDirectLink}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                  >
                    {copiedLink ? '✓ Copied Link' : 'Copy link instead'}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(false)}
                      className="px-4 py-2.5 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSharing || !shareRecipient.trim()}
                      className="px-6 py-2.5 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-md cursor-pointer"
                    >
                      {isSharing ? 'Sending Link...' : 'Send Link'}
                    </button>
                  </div>
                </div>
              </form>
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

        {/* Favorite Toast Feedback */}
        {favoriteToast && (
          <div className="fixed bottom-6 left-6 z-50 bg-zinc-900 border border-rose-800/80 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
            <span className="text-rose-400 text-lg">❤️</span>
            <span className="text-sm font-medium text-zinc-200">{favoriteToast}</span>
          </div>
        )}

        {/* Feedback Loop */}
        <div style={{ overflowAnchor: 'none' }} className="mt-24 pt-16 border-t border-zinc-800/80 space-y-16">
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-zinc-100 mb-2">How was the experience?</h3>
            <p className="text-zinc-500 text-sm mb-6">Your feedback shapes future generations and learns your desires.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <div className="w-full max-w-sm">
                <RatingWidget contentType={isRoleplay ? "roleplay" : "literature"} contentId={storyId || (experience?.id ?? "")} />
              </div>
              <button
                onClick={handleToggleFavorite}
                disabled={isFavoriting}
                className={`inline-flex items-center gap-2.5 px-6 py-5 rounded-xl border text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer ${
                  isFavorite
                    ? "bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                    : "bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850"
                }`}
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <span className="text-2xl">{isFavorite ? '❤️' : '🤍'}</span>
                <span>{isFavorite ? 'In Your Favorites' : 'Add to Favorites'}</span>
              </button>
            </div>
          </div>
          
          <div className="max-w-xl mx-auto">
             <SuggestScenario />
          </div>
        </div>

      </div>
    </div>
  )
}
