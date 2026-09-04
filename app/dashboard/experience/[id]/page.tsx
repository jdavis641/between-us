'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default function ExperienceReader({ params }: { params: { id: string } }) {
  const [experience, setExperience] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase
        .from('generated_content')
        .select('*')
        .eq('id', params.id)
        .single()

      if (data) setExperience(data)
      setLoading(false)
    }
    fetchContent()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading your custom experience...</p>
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center space-y-4">
        <p className="text-red-500 text-xl font-bold">Content not found.</p>
        <Link href="/dashboard" className="text-blue-500 hover:underline">Return to Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12 pb-32">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors mb-8 inline-block">
        &larr; Back to Dashboard
      </Link>
      
      <article className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <header className="space-y-4 border-b border-gray-800 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-900/30 px-3 py-1 rounded">
            {experience.content_type === 'midweek_story' ? 'Serialized Literature' : 'Weekend Roleplay'}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{experience.title}</h1>
        </header>

        {/* Pre-Experience Tasks (Only renders if it's a weekend roleplay with tasks) */}
        {experience.pre_experience_tasks && (
          <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center">
              <span className="mr-2">📋</span> Pre-Experience Tasks
            </h2>
            <ul className="space-y-3">
              {experience.pre_experience_tasks.map((task: string, index: number) => (
                <li key={index} className="flex space-x-3 text-gray-300">
                  <span className="text-blue-500 font-bold">{index + 1}.</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Main Content Body */}
        <section className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed space-y-6">
          {/* Splits the text by newlines to render proper paragraph spacing */}
          {experience.body.split('\n').map((paragraph: string, index: number) => (
            paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
          ))}
        </section>
      </article>
    </div>
  )
}
