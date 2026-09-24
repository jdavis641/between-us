"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function GuestPassHub() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<{category_tag: string, preference_level: string}[]>([]);
  const [kinkSummary, setKinkSummary] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [contactMethod, setContactMethod] = useState<'email'|'sms'>('email');
  const [contactInfo, setContactInfo] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  
  const [activePasses, setActivePasses] = useState([
    { id: 1, type: "Guest Pass", status: "Active", expires: "2026-10-15 12:00 PM" }
  ]);

  const supabase = createClient();

  useEffect(() => {
    async function fetchPrefs() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('intimacy_preferences')
          .select('category_tag, preference_level, kinks_override')
          .eq('user_id', session.user.id);
          
        if (data) {
          const tags = data.filter(d => d.category_tag !== 'Base' && d.preference_level !== 'Off-Limits' && d.category_tag);
          setPreferences(tags);
          const override = data.find(d => d.kinks_override)?.kinks_override;
          if (override) setKinkSummary(override);
        }
      }
    }
    fetchPrefs();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSendInvite = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invite/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedBoundaries: selectedTags,
          kinkSummary,
          instructions,
          contactMethod,
          contactInfo
        })
      });
      const data = await res.json();
      if (data.success || data.token) {
        setInviteToken(data.token);
        setInviteSent(true);
      } else {
        alert("Error sending invite: " + (data.error || "Unknown"));
      }
    } catch (e) {
      console.error("Failed to dispatch pass", e);
    }
    setLoading(false);
  };

  const handleRevoke = (id: number) => {
    setActivePasses(prev => prev.map(p => p.id === id ? { ...p, status: "Revoked" } : p));
  };

  return (
    <main className="p-6 md:p-10 w-full max-w-4xl mx-auto text-zinc-100 min-h-screen">
      <header className="mb-10 border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold mb-2">Between Us Guest Pass</h1>
        <p className="text-zinc-400">Securely invite a partner and selectively share your desires.</p>
      </header>

      {!inviteSent ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
          
          {/* Step 1 */}
          {step === 1 && (
            <div className="animate-in fade-in">
              <h2 className="text-xl font-semibold mb-4">choose the public facing desires to share with a guest</h2>
              <p className="text-sm text-zinc-400 mb-6">Select which of your saved boundaries they can see.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {preferences.length > 0 ? preferences.map((pref, i) => (
                  <button
                    key={i}
                    onClick={() => toggleTag(pref.category_tag)}
                    className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                      selectedTags.includes(pref.category_tag) 
                        ? 'bg-zinc-800 border-red-500 text-white' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {pref.category_tag}
                  </button>
                )) : (
                  <p className="text-zinc-500 text-sm col-span-3">No boundaries found. Take the quiz first.</p>
                )}
              </div>

              {kinkSummary && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-2">Custom Kinks (Read-Only Summary)</h3>
                  <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-sm text-zinc-300 whitespace-pre-wrap">
                    {kinkSummary}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setStep(2)}
                className="w-full py-3 bg-red-900 hover:bg-red-800 text-white rounded-lg font-medium transition-colors"
              >
                instruct
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold mb-4">Add Guest Instructions</h2>
              <p className="text-sm text-zinc-400 mb-6">Set the tone for your upcoming experience.</p>
              
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="enter instructions or 'cheat codes' for a memorable experience"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-200 focus:border-red-500 focus:outline-none transition-colors min-h-[160px] resize-y mb-6"
              />

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-red-900 hover:bg-red-800 text-white rounded-lg font-medium transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold mb-4">Dispatch Invite</h2>
              <p className="text-sm text-zinc-400 mb-6">Send a secure link to your guest. They will be required to create an account.</p>
              
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-6">
                <button 
                  onClick={() => setContactMethod('email')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${contactMethod === 'email' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Email
                </button>
                <button 
                  onClick={() => setContactMethod('sms')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${contactMethod === 'sms' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  SMS
                </button>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {contactMethod === 'email' ? 'Email Address' : 'Mobile Number'}
                </label>
                <input
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={contactMethod === 'email' ? 'partner@example.com' : '+1 (555) 000-0000'}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleSendInvite}
                  disabled={loading || !contactInfo}
                  className="flex-1 py-3 bg-white text-zinc-950 hover:bg-zinc-200 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Invite Sent!</h2>
          <p className="text-zinc-400 mb-6">Your guest has been sent their secure link.</p>
          
          {inviteToken && (
            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-6 inline-block max-w-full text-left">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-semibold">Fallback Link</p>
              <code className="text-sm text-zinc-300 break-all select-all">
                {typeof window !== 'undefined' ? location.origin : ''}/signup?pass={inviteToken}
              </code>
            </div>
          )}

          <div>
            <button 
              onClick={() => { setInviteSent(false); setStep(1); setContactInfo(""); setSelectedTags([]); setInstructions(""); }}
              className="text-zinc-400 hover:text-white underline text-sm transition-colors"
            >
              Generate another pass
            </button>
          </div>
        </div>
      )}

      {/* Active Passes Management Table */}
      <section className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 overflow-hidden">
        <h2 className="text-xl font-semibold mb-6">Active Passes</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {activePasses.map((pass) => (
                <tr key={pass.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-4 font-medium text-zinc-200">{pass.type}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${
                      pass.status === 'Active' ? 'bg-green-950 text-green-400 border border-green-900/50' : 
                      pass.status === 'Used' ? 'bg-zinc-800 text-zinc-400' : 
                      'bg-red-950 text-red-400 border border-red-900/50'
                    }`}>
                      {pass.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-zinc-400">{pass.expires}</td>
                  <td className="px-4 py-4 text-right">
                    {pass.status === "Active" && (
                      <button 
                        onClick={() => handleRevoke(pass.id)}
                        className="text-red-400 hover:text-red-300 text-xs uppercase tracking-wider font-semibold transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}
