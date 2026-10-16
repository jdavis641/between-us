'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function InteractionBar({ contentId, contentType, contentTitle }: { contentId: string, contentType: string, contentTitle?: string }) {
  const [rating, setRating] = useState<number>(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasRated, setHasRated] = useState(false)
  const [copied, setCopied] = useState(false)

  // Share state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareMethod, setShareMethod] = useState<'email' | 'sms'>('email')
  const [emailRecipient, setEmailRecipient] = useState('')
  const [phoneRecipient, setPhoneRecipient] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareToast, setShareToast] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadFavoriteStatus() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
        
        // Only fetch favorite status, as ratings are completely anonymous
        const { data } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('content_id', contentId)
          .maybeSingle()
        
        if (data) setIsFavorite(true)
      }
    }
    loadFavoriteStatus()
  }, [contentId, supabase])

  const handleFavoriteToggle = async () => {
    if (!userId) return
    const newStatus = !isFavorite
    setIsFavorite(newStatus)

    if (newStatus) {
      await supabase.from('user_favorites').insert({ 
        user_id: userId, 
        content_id: contentId, 
        content_type: contentType 
      })
    } else {
      await supabase.from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId)
    }
  }

  const handleAnonymousRating = async (flame: number) => {
    if (hasRated) return // Prevent spamming anonymous ratings
    setRating(flame)
    setHasRated(true)

    try {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType,
          rating: flame
        })
      });
    } catch (e) {
      // Fallback
      await supabase.from('scenario_ratings').insert({ 
        scenario_id: contentId, 
        rating: flame 
      });
    }

    try {
      await supabase.from('anonymous_ratings').insert({ 
        content_id: contentId, 
        content_type: contentType,
        flame_rating: flame
      });
    } catch (e) {}
  }

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' 
      ? `https://betweenusapp.io/dashboard/experience/${contentId}`
      : `https://betweenusapp.io/dashboard/experience/${contentId}`;
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipient = shareMethod === 'email' ? emailRecipient.trim() : phoneRecipient.trim();
    if (!recipient || isSharing) return;

    setIsSharing(true);
    setShareError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          storyId: contentId,
          storyTitle: contentTitle || 'Intimate Experience',
          recipient
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch share');
      }

      setEmailRecipient('');
      setPhoneRecipient('');
      setIsShareModalOpen(false);
      setShareToast(`Shared successfully via ${shareMethod === 'email' ? 'Email' : 'SMS'}!`);
      setTimeout(() => setShareToast(null), 4000);
    } catch (err: any) {
      console.error('Error sharing content:', err);
      setShareError(err.message || 'Failed to dispatch share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-4 bg-zinc-900 p-5 rounded-xl border border-zinc-800 w-full md:w-auto shadow-lg">
        {/* Anonymous Flame Rating System */}
        <div className="flex flex-col">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((flame) => (
              <button 
                key={flame}
                onClick={() => handleAnonymousRating(flame)}
                disabled={hasRated}
                className={`text-2xl transition-transform duration-200 ${hasRated && rating >= flame ? 'opacity-100 scale-110' : 'opacity-40 grayscale'} ${!hasRated && 'hover:scale-125 hover:grayscale-0 hover:opacity-100'}`}
                title={`Rate ${flame} Flames`}
              >
                🔥
              </button>
            ))}
          </div>
          {hasRated && <span className="text-xs text-zinc-500 mt-2 font-medium tracking-wide">Anonymous rating sent</span>}
        </div>

        <div className="hidden sm:block w-px h-10 bg-zinc-800"></div>

        {/* Share Button (Opens Email & SMS Share Modal) */}
        <button 
          onClick={() => { setIsShareModalOpen(true); setShareError(null); }}
          className="text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-300 border bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border-zinc-700 flex items-center space-x-2 cursor-pointer shadow-sm active:scale-95"
          title="Share via Email or SMS"
        >
          <span>Share</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>

        {/* Account-Linked Favorite Toggle */}
        <button 
          onClick={handleFavoriteToggle}
          className={`text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-300 border cursor-pointer ${isFavorite ? 'bg-red-950/30 text-red-500 border-red-900/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border-zinc-700'}`}
        >
          {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
        </button>
      </div>

      {/* Share Modal exposing Email and Mobile Number input fields */}
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
              Send a secure direct link for this experience via email or SMS text message.
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

            <form onSubmit={handleShareSubmit} className="space-y-4">
              {shareMethod === 'email' ? (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
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
                    value={phoneRecipient}
                    onChange={(e) => setPhoneRecipient(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3.5 text-zinc-200 focus:outline-none focus:border-red-500 text-sm transition-colors"
                    autoFocus
                    required
                  />
                  <p className="mt-1.5 text-xs text-zinc-500">
                    We will send a direct SMS link via our Twilio integration.
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
                  onClick={handleCopyLink}
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                >
                  {copied ? '✓ Copied Link' : 'Copy link instead'}
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
                    disabled={isSharing || (shareMethod === 'email' ? !emailRecipient.trim() : !phoneRecipient.trim())}
                    className="px-6 py-2.5 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-md cursor-pointer"
                  >
                    {isSharing ? 'Sending...' : 'Send Link'}
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
    </div>
  )
}
