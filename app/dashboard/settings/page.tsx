'use client';

import { COUNTRY_CODES, formatE164Phone, splitPhone } from "@/utils/phone";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import LogoutButton from '../../components/LogoutButton';

type SettingsTab = 'account' | 'billing' | 'kinks' | 'contributions';

export default function SettingsPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient({
    global: {
      fetch: (url: any, opts: any = {}) => fetch(url, { ...opts, cache: 'no-store' })
    }
  }));
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab State - defaults cleanly to 'account'
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Username Modification State
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [pronouns, setPronouns] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileSaved, setMobileSaved] = useState(false);
  const [savingMobile, setSavingMobile] = useState(false);

  // Intimacy Preference Level State
  const [baseTolerance, setBaseTolerance] = useState("");

  // Custom Kinks State
  const [kinkInput, setKinkInput] = useState('');
  const [savingKinks, setSavingKinks] = useState(false);
  const [kinksSaved, setKinksSaved] = useState(false);
  const [kinksError, setKinksError] = useState<string | null>(null);
  const [primaryPrefId, setPrimaryPrefId] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [savingUsername, setSavingUsername] = useState(false);
  const [contributions, setContributions] = useState<any[]>([]);
  const [contributionsLoading, setContributionsLoading] = useState(true);
  const [pronounsSaved, setPronounsSaved] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Sync hash routing if user deep-links into settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#billing') {
        setActiveTab('billing');
      } else if (hash === '#kinks-settings' || hash === '#kinks') {
        setActiveTab('kinks');
      } else if (hash === '#contributions') {
        setActiveTab('contributions');
      } else {
        setActiveTab('account');
      }
    }
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        let profileData: any = null;
        try {
          const res = await fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            },
            cache: 'no-store'
          });
          if (res.ok) {
            const json = await res.json();
            profileData = json.profile;
          }
        } catch (e) {
          console.warn('[Settings] Failed to fetch profile from /api/profile, falling back:', e);
        }

        if (!profileData) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .setHeader('Cache-Control', 'no-cache, no-store')
            .eq('id', session.user.id)
            .single();
          profileData = data;
        }

        const { data: prefData } = await supabase
          .from('intimacy_preferences')
          .select('id, preference_level, kinks_override')
          .eq('user_id', session.user.id)
          .eq('category_tag', 'Primary Directive')
          .maybeSingle();

        if (prefData?.id) {
          setPrimaryPrefId(prefData.id);
        }

        const rawKinks = prefData?.kinks_override;
        if (rawKinks) {
          try {
            const parsed = JSON.parse(rawKinks);
            if (Array.isArray(parsed)) {
              setKinkInput(parsed.map((k: any) => k.text || k).join('\n'));
            } else if (typeof parsed === 'object' && parsed !== null && parsed.kinks) {
              setKinkInput(Array.isArray(parsed.kinks) ? parsed.kinks.join('\n') : String(parsed.kinks));
            } else {
              setKinkInput(typeof parsed === 'string' ? parsed : rawKinks);
            }
          } catch {
            setKinkInput(rawKinks);
          }
        }

        const tolerance = prefData?.preference_level || profileData?.base_tolerance || '';

        setProfile({
          ...profileData,
          base_tolerance: tolerance || 'Not set'
        });
        setPronouns(profileData?.pronouns || '');
        setBaseTolerance(tolerance);
        const splitMobile = splitPhone(profileData?.mobile_number);
        setCountryCode(splitMobile.countryCode);
        setMobileNumber(splitMobile.nationalNumber);

        // Fetch user contributions
        try {
          const { data: userContributions } = await supabase
            .from('scenario_suggestions')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          setContributions(userContributions || []);
        } catch (err) {
          console.warn('Error fetching contributions:', err);
        } finally {
          setContributionsLoading(false);
        }
      } else {
        setContributionsLoading(false);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [supabase]);

  // Handle Save Mobile with explicit payload through /api/profile service role pipeline
  const handleSaveMobile = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      alert('Please log in to save settings.');
      return;
    }

    setSavingMobile(true);
    const formPhone = formatE164Phone(countryCode, mobileNumber) || (mobileNumber.trim() ? mobileNumber.trim() : null);
    console.log("[Settings] Updating mobile_number payload via /api/profile:", { mobile_number: formPhone });

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ mobile_number: formPhone })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[Settings] API rejected mobile_number commit:", data);
        alert('Error saving mobile number: ' + (data.error || 'Server error'));
      } else {
        console.log("[Settings] API committed mobile_number successfully:", data);
        const committedNumber = data.profile?.mobile_number ?? formPhone;
        setProfile((prev: any) => ({ ...prev, mobile_number: committedNumber }));
        const split = splitPhone(committedNumber);
        setCountryCode(split.countryCode);
        setMobileNumber(split.nationalNumber);
        setMobileSaved(true);
        setTimeout(() => setMobileSaved(false), 3000);
      }
    } catch (err: any) {
      console.error("[Settings] Network exception saving mobile_number:", err);
      alert('Error saving mobile number: ' + (err.message || 'Network error'));
    } finally {
      setSavingMobile(false);
    }
  };

  const handleSavePronouns = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      try {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ pronouns })
        });

        const data = await res.json();
        if (res.ok) {
          setProfile((prev: any) => ({ ...prev, pronouns, ...(data.profile || {}) }));
          setPronounsSaved(true);
          setTimeout(() => setPronounsSaved(false), 3000);
        } else {
          alert('Error saving pronouns: ' + (data.error || 'Server error'));
        }
      } catch (err: any) {
        alert('Error saving pronouns: ' + (err.message || 'Network error'));
      }
    }
  };

  const handleSaveKinks = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSavingKinks(true);
    setKinksError(null);
    setKinksSaved(false);

    try {
      let userId: string | null = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        userId = session.user.id;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      }

      if (!userId) {
        throw new Error("Please log in to save your kinks.");
      }

      const lines = kinkInput.split('\n').map(l => l.trim()).filter(Boolean);
      const newKinksList = lines.length > 0
        ? lines.map((line, idx) => ({ id: `${Date.now()}-${idx}`, text: line }))
        : (kinkInput.trim() ? [{ id: Date.now().toString(), text: kinkInput.trim() }] : []);

      const payload = JSON.stringify(newKinksList);

      const { data: existingRows } = await supabase
        .from('intimacy_preferences')
        .select('id')
        .eq('user_id', userId)
        .eq('category_tag', 'Primary Directive')
        .maybeSingle();

      const existingId = existingRows?.id || primaryPrefId;

      const upsertRecord: any = {
        user_id: userId,
        category_tag: 'Primary Directive',
        preference_level: baseTolerance || 'Moderate',
        kinks_override: payload
      };

      if (existingId) {
        upsertRecord.id = existingId;
      }

      const { error: upsertErr } = await supabase
        .from('intimacy_preferences')
        .upsert(upsertRecord);

      if (upsertErr) throw upsertErr;

      setKinksSaved(true);
      setTimeout(() => setKinksSaved(false), 3500);
    } catch (err: any) {
      console.error("Error saving kinks in Settings:", err);
      setKinksError(err.message || "Failed to save kinks.");
    } finally {
      setSavingKinks(false);
    }
  };

  // Debounced Username Availability Check
  useEffect(() => {
    const currentName = profile?.anonymous_alias || profile?.nickname;
    if (!newUsername || newUsername.trim() === '' || newUsername.trim() === currentName) {
      setUsernameStatus('idle');
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const res = await fetch('/api/check-nickname', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: newUsername.trim() })
        });
        const data = await res.json();
        if (data.available) {
          setUsernameStatus('available');
          setSuggestions([]);
        } else {
          setUsernameStatus('taken');
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error(err);
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newUsername, profile]);

  const handleSaveUsername = async (e: React.MouseEvent | React.FormEvent, usernameToSave: string) => {
    if (e) e.preventDefault();
    if (!usernameToSave || usernameToSave.trim() === '') return;
    setSavingUsername(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const cleanNickname = usernameToSave.trim();

      try {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ 
            nickname: cleanNickname, 
            anonymous_alias: cleanNickname
          })
        });

        const data = await res.json();
        if (res.ok) {
          setProfile((prev: any) => ({ 
            ...prev, 
            nickname: cleanNickname, 
            anonymous_alias: cleanNickname,
            ...(data.profile || {})
          }));
          setIsEditingUsername(false);
          setNewUsername('');
        } else {
          alert("Error saving username: " + (data.error || 'Server error'));
        }
      } catch (err: any) {
        alert("Error saving username: " + (err.message || 'Network error'));
      }
    }
    setSavingUsername(false);
  };

  const handleManageBilling = async () => {
    try {
      setIsRedirecting(true);
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Could not generate billing portal link: " + (data.error || "Unknown error"));
        setIsRedirecting(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load billing portal.");
      setIsRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-zinc-500 animate-pulse">
        Loading settings...
      </div>
    );
  }

  // Safe tab fallback - guaranteed never to render null
  const currentTab: SettingsTab = ['account', 'billing', 'kinks', 'contributions'].includes(activeTab)
    ? activeTab
    : 'account';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-serif font-medium text-zinc-100">Account Settings</h1>
          <p className="text-zinc-500 mt-2">Manage your profile, billing, and custom preferences securely.</p>
        </header>

        {/* Tab Navigation Header */}
        <div className="flex border-b border-zinc-800 space-x-2 overflow-x-auto pb-2 scrollbar-none" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={currentTab === 'account'}
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              currentTab === 'account'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
            }`}
          >
            <span>👤</span>
            <span>Account / Profile</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentTab === 'billing'}
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              currentTab === 'billing'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
            }`}
          >
            <span>💳</span>
            <span>Billing</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentTab === 'kinks'}
            onClick={() => setActiveTab('kinks')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              currentTab === 'kinks'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
            }`}
          >
            <span>🔥</span>
            <span>Custom Kinks</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentTab === 'contributions'}
            onClick={() => setActiveTab('contributions')}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              currentTab === 'contributions'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
            }`}
          >
            <span>💡</span>
            <span>Contributions</span>
          </button>
        </div>

        {/* Tab 1: Account / Profile View */}
        {currentTab === 'account' && (
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-zinc-800/80 pb-4">
              <h2 className="text-xl font-medium text-zinc-200">Account &amp; Profile</h2>
              <p className="text-zinc-500 text-sm mt-1">Manage your anonymous identity, pronouns, and contact details.</p>
            </div>

            <div className="space-y-6">
              {/* Nickname / Anonymous Alias */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-zinc-500">Nickname / Anonymous Alias</p>
                  {!isEditingUsername && (
                    <button 
                      onClick={() => {
                        setIsEditingUsername(true);
                        setNewUsername(profile?.anonymous_alias || profile?.nickname || '');
                      }}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wide"
                    >
                      Change Username
                    </button>
                  )}
                </div>
                
                {!isEditingUsername ? (
                  <p className="text-zinc-300 font-medium text-lg">{profile?.anonymous_alias || profile?.nickname || 'Not set'}</p>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className={`flex-1 bg-zinc-950 border rounded-lg px-4 py-2 text-zinc-200 focus:outline-none transition-colors ${
                          usernameStatus === 'taken' ? 'border-red-500/50 focus:border-red-500' :
                          usernameStatus === 'available' ? 'border-green-500/50 focus:border-green-500' :
                          'border-zinc-800 focus:border-blue-500'
                        }`}
                        placeholder="Enter new username"
                      />
                      <button
                        onClick={(e) => handleSaveUsername(e, newUsername.trim())}
                        disabled={savingUsername || usernameStatus !== 'available'}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white disabled:text-zinc-500 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {savingUsername ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingUsername(false);
                          setNewUsername('');
                        }}
                        className="text-zinc-400 hover:text-zinc-300 px-2 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="text-sm">
                      {usernameStatus === 'checking' && <span className="text-zinc-500">Checking availability...</span>}
                      {usernameStatus === 'available' && <span className="text-green-400">Username is available!</span>}
                      {usernameStatus === 'taken' && (
                        <div className="text-red-400 space-y-2">
                          <p>This username is already taken.</p>
                          {suggestions.length > 0 && (
                            <div>
                              <p className="text-zinc-400 text-xs uppercase mb-1">Available Suggestions:</p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.map((sug) => (
                                  <button
                                    key={sug}
                                    onClick={() => setNewUsername(sug)}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded border border-zinc-700 text-sm transition-colors"
                                  >
                                    {sug}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Pronouns */}
              <div>
                <p className="text-sm text-zinc-500 mb-1">Pronouns</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:border-zinc-500"
                    placeholder="e.g., they/them, she/her"
                  />
                  <button onClick={handleSavePronouns} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 uppercase px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded transition-colors">Save</button>
                </div>
                {pronounsSaved && <p className="text-green-500 text-xs mt-2 font-medium">Pronouns saved!</p>}
              </div>

              {/* Mobile Number with Explicit Payload & DB Logger */}
              <div>
                <p className="text-sm text-zinc-500 mb-1">Mobile Number (SMS)</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-zinc-500 shrink-0"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 text-sm focus:outline-none focus:border-zinc-500"
                  />
                  <button 
                    onClick={handleSaveMobile} 
                    disabled={savingMobile}
                    className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 uppercase px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded transition-colors disabled:opacity-50"
                  >
                    {savingMobile ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {mobileSaved && <p className="text-green-500 text-xs mt-2 font-medium">Mobile number saved!</p>}
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Billing View */}
        {currentTab === 'billing' && (
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-zinc-800/80 pb-4">
              <h2 className="text-xl font-medium text-zinc-200">Subscription &amp; Billing</h2>
              <p className="text-zinc-500 text-sm mt-1">Review your plan tier and securely manage your subscription or payment methods.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 gap-4">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Active Plan</p>
                <p className="text-lg text-zinc-200 mt-1">
                  {profile?.is_active ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Premium Member
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-600"></span> Inactive Trial
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Full access to AI serialized novellas, custom roleplays, and card decks.</p>
              </div>
              
              <button 
                onClick={handleManageBilling}
                disabled={isRedirecting}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-medium px-6 py-3 rounded-xl transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                {isRedirecting ? 'Redirecting...' : 'Unsubscribe / Manage Billing'}
              </button>
            </div>
          </section>
        )}

        {/* Tab 3: Custom Kinks View */}
        {currentTab === 'kinks' && (
          <section id="kinks-settings" className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 scroll-mt-8">
            <div className="border-b border-zinc-800/80 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-red-500 font-bold">Preferences &amp; Desires</span>
              </div>
              <h2 className="text-2xl font-serif font-medium text-zinc-100 mt-1">Custom Kinks &amp; Specific Interests</h2>
              <p className="text-zinc-400 text-sm mt-1 leading-relaxed font-light">
                Add specific kinks, themes, or interests (one per line). Our matching engine will incorporate these directly into your generated stories, roleplays, and card game decks.
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                value={kinkInput}
                onChange={(e) => setKinkInput(e.target.value)}
                placeholder={"e.g.\nBondage & light restraint\nPraise and sensory deprivation\nRole reversal\nTemperature play (ice / candle wax)"}
                rows={5}
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 transition-colors font-mono leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <span className="text-xs text-zinc-500">
                  {kinkInput.split('\n').filter(l => l.trim()).length} preference(s) entered
                </span>
                <button
                  type="button"
                  onClick={handleSaveKinks}
                  disabled={savingKinks}
                  className="py-2.5 px-6 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-950"
                >
                  {savingKinks ? 'Saving Kinks...' : 'Save Kink Preferences'}
                </button>
              </div>
              {kinksSaved && <p className="text-green-500 text-xs font-medium">Kink preferences saved successfully!</p>}
              {kinksError && <p className="text-red-500 text-xs font-medium">{kinksError}</p>}
            </div>
          </section>
        )}

        {/* Tab 4: My Contributions View */}
        {currentTab === 'contributions' && (
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div>
                <h2 className="text-xl font-medium text-zinc-200">My Contributions</h2>
                <p className="text-zinc-500 text-sm mt-1">Track the status and community ratings of your submitted scenarios.</p>
              </div>
              <Link 
                href="/dashboard/suggest" 
                className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-900/30 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider"
              >
                + Suggest Idea
              </Link>
            </div>

            {contributionsLoading ? (
              <div className="p-6 text-center text-zinc-500 text-sm animate-pulse">Loading contributions...</div>
            ) : contributions.length === 0 ? (
              <div className="p-8 text-center bg-zinc-950/40 rounded-xl border border-zinc-800/60">
                <span className="text-3xl block mb-2">💡</span>
                <p className="text-zinc-400 font-medium">No contributions submitted yet.</p>
                <p className="text-zinc-500 text-sm mt-1 mb-4">Have an intimate story or roleplay idea? Share it with the community.</p>
                <Link 
                  href="/dashboard/suggest" 
                  className="inline-block text-xs font-semibold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg border border-zinc-700 transition-colors"
                >
                  Submit Your First Idea
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {contributions.map((item: any) => {
                  let title = item.suggestion_text;
                  let description = '';
                  try {
                    const parsed = JSON.parse(item.suggestion_text);
                    title = parsed.title || item.suggestion_text;
                    description = parsed.description || '';
                  } catch {}

                  const status = item.status || 'pending';
                  const avgRating = item.average_rating ? Number(item.average_rating) : 0;
                  const timesTested = item.times_tested ?? 0;

                  return (
                    <div key={item.id} className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-zinc-200 font-medium text-base truncate">{title}</h3>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider ${
                            status === 'approved' ? 'bg-green-950/60 text-green-400 border border-green-800/40' :
                            status === 'archived' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' :
                            'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          }`}>
                            {status}
                          </span>
                        </div>
                        {description && (
                          <p className="text-zinc-400 text-xs line-clamp-1">{description}</p>
                        )}
                        <p className="text-zinc-600 text-[11px]">
                          Submitted on {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center sm:flex-col sm:items-end justify-between shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/50">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Community Score</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {timesTested > 0 ? (
                            <span className="text-sm font-semibold text-amber-400 flex items-center gap-1">
                              <span>★</span> {avgRating.toFixed(1)} <span className="text-xs text-zinc-500 font-normal">({timesTested} tests)</span>
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400 italic">Untested (New)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="mt-8 border-t border-zinc-800 pt-6">
          <LogoutButton className="w-full md:w-auto px-6 py-3 bg-red-950/20 text-red-500 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors font-medium" />
        </section>

      </div>
    </div>
  );
}
