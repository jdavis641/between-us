'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface KinkEntry {
  id: string;
  text: string;
}

export default function KinksManagementPage() {
  const [kinks, setKinks] = useState<KinkEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [kinkInput, setKinkInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchKinks() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase
          .from('intimacy_preferences')
          .select('kinks_override')
          .eq('user_id', session.user.id)
          .limit(1)

        const raw = data?.[0]?.kinks_override
        if (raw) {
          try {
            // Try parsing as JSON array
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
              setKinks(parsed)
            } else {
              // Legacy single string
              setKinks([{ id: Date.now().toString(), text: raw }])
            }
          } catch (e) {
            // Legacy single string
            setKinks([{ id: Date.now().toString(), text: raw }])
          }
        }
      }
      setLoading(false)
    }
    fetchKinks()
  }, [])

  const saveToDb = async (newKinks: KinkEntry[]) => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase
        .from('intimacy_preferences')
        .update({ kinks_override: JSON.stringify(newKinks) })
        .eq('user_id', session.user.id)
      
      setKinks(newKinks)
    }
    setSaving(false)
  }

  const handleSave = async () => {
    if (!kinkInput.trim()) return
    
    let newKinks = [...kinks]
    if (editingId) {
      newKinks = newKinks.map(k => k.id === editingId ? { ...k, text: kinkInput } : k)
    } else {
      newKinks.push({ id: Date.now().toString(), text: kinkInput })
    }
    
    await saveToDb(newKinks)
    setIsAdding(false)
    setEditingId(null)
    setKinkInput('')
  }

  const handleDelete = async (id: string) => {
    const newKinks = kinks.filter(k => k.id !== id)
    await saveToDb(newKinks)
  }

  const handleEdit = (kink: KinkEntry) => {
    setEditingId(kink.id)
    setKinkInput(kink.text)
    setIsAdding(true)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="border-b border-zinc-800 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-medium text-zinc-100">Custom Kinks</h1>
            <p className="text-zinc-500 mt-2">Manage specific desires that override AI boundaries.</p>
          </div>
          {!isAdding && (
            <button 
              onClick={() => { setIsAdding(true); setEditingId(null); setKinkInput(''); }}
              className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add Kink
            </button>
          )}
        </header>

        {loading ? (
          <div className="animate-pulse text-zinc-500">Loading kinks...</div>
        ) : (
          <div className="space-y-6">
            
            {isAdding && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
                <h2 className="text-lg font-medium text-zinc-200 mb-4">{editingId ? 'Edit Kink' : 'Add New Kink'}</h2>
                <textarea
                  value={kinkInput}
                  onChange={(e) => setKinkInput(e.target.value)}
                  placeholder="what kinks would you like included in your stories and games? (the more detail the better)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-200 focus:outline-none focus:border-red-500 min-h-[120px] resize-y mb-4"
                />
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => { setIsAdding(false); setEditingId(null); setKinkInput(''); }}
                    className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving || !kinkInput.trim()}
                    className="px-6 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save Kink'}
                  </button>
                </div>
              </div>
            )}

            {!isAdding && kinks.length === 0 && (
              <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed">
                <p className="text-zinc-500 mb-4">You haven't added any custom kinks yet.</p>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  + Add your first kink
                </button>
              </div>
            )}

            <div className="space-y-4">
              {kinks.map(kink => (
                <div key={kink.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row gap-4 justify-between group">
                  <div className="text-zinc-300 text-sm whitespace-pre-wrap flex-1">
                    {kink.text}
                  </div>
                  <div className="flex gap-3 items-start opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(kink)}
                      className="text-xs uppercase tracking-wider font-semibold text-zinc-400 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(kink.id)}
                      className="text-xs uppercase tracking-wider font-semibold text-red-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
