'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import RatingWidget from '@/components/RatingWidget'
import SuggestScenario from '@/components/SuggestScenario'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ReaderMode = "partner-a" | "partner-b" | "script";

export default function ExperienceReader({ params }: { params: any }) {
  const [experience, setExperience] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<ReaderMode>("script")
  const [textSize, setTextSize] = useState<"text-lg" | "text-xl" | "text-2xl">("text-lg")
  const [storyId, setStoryId] = useState<string>("")

  useEffect(() => {
    async function fetchContent() {
      const resolved = await params;
      const id = resolved?.id || params?.id;
      if (!id) return;
      setStoryId(id);

      const { data } = await supabase
        .from('generated_content')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (data) {
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
    const scriptBody = contentObj.body || contentObj.fullScript || experience.body;
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

    const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = title.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
    link.href = url;
    link.download = `${safeTitle || 'story'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  const isRoleplay = experience.content_type !== 'midweek_story';
  const contentObj = experience.parsedData || {};
  
  const partnerA = contentObj.partnerAPerspective || contentObj.partner_a_perspective || "Your partner is eagerly anticipating what comes next. Lean into the mystery and excitement.";
  const partnerB = contentObj.partnerBPerspective || contentObj.partner_b_perspective || "The tension is building. Focus on the sensory details and let the moment guide you.";
  const preTasks = contentObj.tasks || contentObj.preExperienceTasks || experience.pre_experience_tasks || [];
  const storyboard = contentObj.overview || contentObj.storyboard || "The stage is set for an intimate encounter.";
  const scriptBody = contentObj.body || contentObj.fullScript || experience.body;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 lg:p-12 pb-32 font-sans selection:bg-red-900/50">
      
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Top Controls & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-6 gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center">
            &larr; Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800/50 self-start sm:self-auto">
             <button onClick={() => setTextSize("text-lg")} className={`px-3 py-1 rounded text-sm transition-colors ${textSize === 'text-lg' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>A</button>
             <button onClick={() => setTextSize("text-xl")} className={`px-3 py-1 rounded text-base transition-colors ${textSize === 'text-xl' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>A</button>
             <button onClick={() => setTextSize("text-2xl")} className={`px-3 py-1 rounded text-lg font-bold transition-colors ${textSize === 'text-2xl' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>A</button>
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
              Partner A Lens
            </button>
            <button
              onClick={() => setActiveMode("partner-b")}
              className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-lg transition-all duration-300 ${
                activeMode === "partner-b"
                  ? "bg-zinc-800 text-white shadow-md border border-zinc-700"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
              }`}
            >
              Partner B Lens
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

        <article className={`prose prose-invert prose-zinc max-w-none ${textSize} leading-loose space-y-12 transition-all duration-300`}>
          
          {/* Partner Lenses */}
          {activeMode === "partner-a" && isRoleplay && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl shadow-xl">
               <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-500 mb-6 font-sans">Psychological Profile: Partner A</h2>
               <p className="text-zinc-300 font-serif whitespace-pre-wrap">{partnerA}</p>
             </div>
          )}

          {activeMode === "partner-b" && isRoleplay && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl shadow-xl">
               <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-500 mb-6 font-sans">Psychological Profile: Partner B</h2>
               <p className="text-zinc-300 font-serif whitespace-pre-wrap">{partnerB}</p>
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
                  <p className="text-zinc-300 font-serif whitespace-pre-wrap italic leading-relaxed">{storyboard}</p>
                </section>
              )}

              <section className="space-y-6 pt-4">
                {isRoleplay && <h3 className="text-sm font-bold font-sans uppercase tracking-widest text-zinc-500 mb-8 border-b border-zinc-800 pb-4">The Script</h3>}
                <div className="font-serif text-zinc-200">
                  {typeof scriptBody === 'string' ? scriptBody.split('\n').map((paragraph: string, index: number) => (
                    paragraph.trim() ? <p key={index} className="mb-6">{paragraph}</p> : <br key={index} />
                  )) : JSON.stringify(scriptBody, null, 2)}
                </div>
              </section>

            </div>
          )}

        </article>

        {/* Story Download Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-zinc-800/80">
          <button
            onClick={handleDownloadStory}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-red-900/50 rounded-xl font-medium transition-all shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95 group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">📥</span>
            Download Story
          </button>
          <span className="text-xs text-zinc-500 font-light">
            Export story as Markdown for offline reading
          </span>
        </div>

        {/* Feedback Loop */}
        <div className="mt-24 pt-16 border-t border-zinc-800/80 space-y-16">
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-zinc-100 mb-2">How was the experience?</h3>
            <p className="text-zinc-500 text-sm mb-8">Your feedback shapes future generations and learns your desires.</p>
            <div className="max-w-sm mx-auto">
               <RatingWidget contentType={isRoleplay ? "roleplay" : "literature"} contentId={params.id} />
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
