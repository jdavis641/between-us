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

export default function ExperienceReader({ params }: { params: { id: string } }) {
  const [experience, setExperience] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<ReaderMode>("script")
  const [textSize, setTextSize] = useState<"text-lg" | "text-xl" | "text-2xl">("text-lg")

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase
        .from('generated_content')
        .select('*')
        .eq('id', params.id)
        .single()

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
  }, [params.id])

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
