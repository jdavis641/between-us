'use client';

import { COUNTRY_CODES, formatE164Phone, splitPhone } from "@/utils/phone";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function GuestPassHub() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<{category_tag: string, preference_level: string}[]>([]);
  const [customKinks, setCustomKinks] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedKinks, setSelectedKinks] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [contactMethod, setContactMethod] = useState<'email'|'sms'>('email');
  const [contactInfo, setContactInfo] = useState("");
  const [expirationHours, setExpirationHours] = useState<24 | 48>(24);
  const [consentChecked, setConsentChecked] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  
  // Saved Pass Configurations State
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [saveConfigForLater, setSaveConfigForLater] = useState(false);
  const [configName, setConfigName] = useState("");
  const [countryCode, setCountryCode] = useState("+1");

  const [activePasses, setActivePasses] = useState<any[]>([]);

  const [supabase] = useState(() => createClient());

  useEffect(() => {
    async function fetchPrefs() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch saved pass configurations
        try {
          const { data: configs } = await supabase
            .from('saved_pass_configs')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (configs) {
            setSavedConfigs(configs);
          }
        } catch (e) {
          console.warn("Could not query saved_pass_configs:", e);
        }

        const { data } = await supabase.from('intimacy_preferences')
          .select('category_tag, preference_level, kinks_override')
          .eq('user_id', session.user.id);
          
        if (data) {
          const tags = data.filter((d: any) => 
            d.category_tag !== 'Base' && 
            d.category_tag !== 'Guest Pass Config' &&
            (d.preference_level === 'Definitely' || d.preference_level === 'Curious') && 
            d.category_tag
          );
          setPreferences(tags);
          
          const override = data.find((d: any) => d.kinks_override && d.category_tag !== 'Guest Pass Config')?.kinks_override;
          if (override) {
            try {
              const parsed = JSON.parse(override);
              if (Array.isArray(parsed)) {
                setCustomKinks(parsed.map((k: any) => k.text || String(k)));
              } else {
                setCustomKinks(override.split('\n').filter((k: string) => k.trim() !== ''));
              }
            } catch(e) {
              setCustomKinks(override.split('\n').filter((k: string) => k.trim() !== ''));
            }
          }

          const savedConfig = data.find((d: any) => d.category_tag === 'Guest Pass Config');
          if (savedConfig?.kinks_override) {
            try {
              const parsed = JSON.parse(savedConfig.kinks_override);
              if (parsed.boundaries) setSelectedTags(parsed.boundaries);
              if (parsed.kinks) setSelectedKinks(parsed.kinks);
              if (parsed.instructions) setInstructions(parsed.instructions);
            } catch(e) {}
          }
        }

        const { data: invites } = await supabase
          .from('invitations')
          .select('*')
          .eq('sender_id', session.user.id)
          .order('created_at', { ascending: false });
        if (invites && invites.length > 0) {
          setActivePasses(invites.map((inv: any) => ({
            id: inv.id,
            type: "Guest Pass",
            recipient: inv.recipient_identifier,
            status: inv.status === 'revoked' ? "Revoked" : (new Date(inv.expires_at) > new Date() ? "Active" : "Expired"),
            expires_at: inv.expires_at,
            token: inv.invite_token
          })));
        } else {
          setActivePasses([]);
        }
      }
    }
    fetchPrefs();
  }, [supabase]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleKink = (kink: string) => {
    setSelectedKinks(prev => prev.includes(kink) ? prev.filter(k => k !== kink) : [...prev, kink]);
  };

  const handleSelectSavedConfig = (config: any) => {
    setSelectedConfigId(config.id);

    // Auto-populate boundary checkboxes
    if (config.selected_boundaries) {
      let parsedBoundaries: string[] = [];
      if (Array.isArray(config.selected_boundaries)) {
        parsedBoundaries = config.selected_boundaries;
      } else if (typeof config.selected_boundaries === 'string') {
        try {
          parsedBoundaries = JSON.parse(config.selected_boundaries);
        } catch {
          parsedBoundaries = [config.selected_boundaries];
        }
      }
      setSelectedTags(parsedBoundaries);
    }

    // Auto-populate instructions text box
    if (typeof config.instructions === 'string') {
      setInstructions(config.instructions);
    }
  };

  const handleSendInvite = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Upsert the Guest Pass config for seamless future hydration
        await supabase.from('intimacy_preferences').upsert({
          user_id: session.user.id,
          category_tag: 'Guest Pass Config',
          preference_level: 'System',
          kinks_override: JSON.stringify({
            boundaries: selectedTags,
            kinks: selectedKinks,
            instructions
          }),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, category_tag' });

        // If "Save this configuration for later" is toggled, insert into saved_pass_configs
        if (saveConfigForLater) {
          try {
            const { data: insertedConfig } = await supabase
              .from('saved_pass_configs')
              .insert({
                user_id: session.user.id,
                config_name: configName.trim() || 'Saved Configuration',
                selected_boundaries: selectedTags,
                instructions: instructions.trim() || null
              })
              .select()
              .maybeSingle();

            if (insertedConfig) {
              setSavedConfigs(prev => [insertedConfig, ...prev]);
            }
          } catch (configErr) {
            console.warn("Could not insert saved_pass_configs:", configErr);
          }
        }
      }

      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          selectedBoundaries: selectedTags,
          kinkSummary: selectedKinks.join('\n\n'),
          instructions,
          contactMethod,
          contactInfo: contactMethod === 'sms' ? formatE164Phone(countryCode, contactInfo) : contactInfo.trim(),
          phoneNumber: contactMethod === 'sms' ? formatE164Phone(countryCode, contactInfo) : undefined,
          mobileNumber: contactMethod === 'sms' ? formatE164Phone(countryCode, contactInfo) : undefined,
          expirationHours
        })
      });
      const data = await res.json();
      if (res.ok && (data.success || data.token)) {
        setInviteToken(data.token);
        setInviteSent(true);

        if (session) {
          const { data: refreshedInvites } = await supabase
            .from('invitations')
            .select('*')
            .eq('sender_id', session.user.id)
            .order('created_at', { ascending: false });
          if (refreshedInvites) {
            setActivePasses(refreshedInvites.map((inv: any) => ({
              id: inv.id,
              type: "Guest Pass",
              recipient: inv.recipient_identifier,
              status: inv.status === 'revoked' ? "Revoked" : (new Date(inv.expires_at) > new Date() ? "Active" : "Expired"),
              expires_at: inv.expires_at,
              token: inv.invite_token
            })));
          }
        }
      } else {
        alert(data.error || "Failed to dispatch guest pass. Please try again.");
      }
    } catch (e: any) {
      console.error("Failed to dispatch pass", e);
      alert(e.message || "Failed to dispatch guest pass.");
    }
    setLoading(false);
  };

  const handleRevoke = async (id: string, token?: string) => {
    setActivePasses(prev => prev.map(p => p.id === id ? { ...p, status: "Revoked" } : p));
    try {
      if (token) {
        await fetch(`/api/invite/revoke?token=${token}`);
      }
      await supabase
        .from('invitations')
        .update({ status: 'revoked', expires_at: new Date().toISOString() })
        .eq('id', id);
    } catch (e) {
      console.error("Failed to revoke pass:", e);
    }
  };

  return (
    <main className="p-6 md:p-10 w-full max-w-4xl mx-auto text-zinc-100 min-h-screen">
      <header className="mb-10 border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold mb-2">Between Us Guest Pass</h1>
        <p className="text-zinc-400">Securely invite a partner and selectively share your desires.</p>
      </header>

      {/* Saved Configurations Section */}
      <section className="mb-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Saved Configurations</h2>
            <p className="text-xs text-zinc-400">Select a pre-saved Between Us Pass setup to auto-populate boundaries and instructions.</p>
          </div>
          {selectedConfigId && (
            <button
              type="button"
              onClick={() => setSelectedConfigId(null)}
              className="text-xs text-zinc-400 hover:text-white underline transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>

        {savedConfigs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedConfigs.map((cfg) => {
              const isSelected = selectedConfigId === cfg.id;
              const boundaryCount = Array.isArray(cfg.selected_boundaries)
                ? cfg.selected_boundaries.length
                : 0;
              return (
                <label
                  key={cfg.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-red-950/40 border-red-800 text-white shadow-md shadow-red-950/20"
                      : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="saved_pass_config"
                    checked={isSelected}
                    onChange={() => handleSelectSavedConfig(cfg)}
                    className="mt-1 text-red-600 focus:ring-red-500 bg-zinc-900 border-zinc-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{cfg.config_name || "Untitled Configuration"}</span>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {cfg.created_at ? new Date(cfg.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {boundaryCount} {boundaryCount === 1 ? "boundary" : "boundaries"}
                      {cfg.instructions ? ` • "${cfg.instructions}"` : ""}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-zinc-950/40 border border-dashed border-zinc-800 rounded-xl text-center">
            <p className="text-xs text-zinc-500">No saved configurations yet. Toggle &quot;Save this configuration for later&quot; below to reuse your setup anytime.</p>
          </div>
        )}
      </section>

      {!inviteSent ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
          
          {/* Step 1 */}
          {step === 1 && (
            <div className="animate-in fade-in">
              <h2 className="text-xl font-semibold mb-4">choose the public facing desires to share with a guest</h2>
              <p className="text-sm text-zinc-400 mb-6">Select which of your saved boundaries they can see.</p>
              
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">Boundaries</h3>
                <div className="space-y-3">
                  {preferences.length > 0 ? preferences.map((pref, i) => (
                    <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedTags.includes(pref.category_tag)}
                        onChange={() => toggleTag(pref.category_tag)}
                        className="w-5 h-5 rounded border-zinc-700 text-red-600 focus:ring-red-500 bg-zinc-900"
                      />
                      <span className="text-sm text-zinc-300 flex-1">{pref.category_tag}</span>
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">{pref.preference_level}</span>
                    </label>
                  )) : (
                    <p className="text-zinc-500 text-sm">No boundaries found. Take the quiz first.</p>
                  )}
                </div>
              </div>

              {customKinks.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">Custom Kinks</h3>
                  <div className="space-y-3">
                    {customKinks.map((kink, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={selectedKinks.includes(kink)}
                          onChange={() => toggleKink(kink)}
                          className="w-5 h-5 rounded border-zinc-700 text-red-600 focus:ring-red-500 bg-zinc-900"
                        />
                        <span className="text-sm text-zinc-300 flex-1 whitespace-pre-wrap">{kink}</span>
                      </label>
                    ))}
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

              {/* Save Configuration For Later */}
              <div className="mb-6 p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={saveConfigForLater}
                    onChange={(e) => setSaveConfigForLater(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-red-500 bg-zinc-900"
                  />
                  <span className="text-sm font-medium text-zinc-200">Save this configuration for later</span>
                </label>
                {saveConfigForLater && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Configuration Name</label>
                    <input 
                      type="text"
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                      placeholder="e.g. Mild Date Night, Spicy Boundaries, First Hookup"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={async () => {
                    setLoading(true);
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                      await supabase.from('intimacy_preferences').upsert({
                        user_id: session.user.id,
                        category_tag: 'Guest Pass Config',
                        preference_level: 'System',
                        kinks_override: JSON.stringify({ boundaries: selectedTags, kinks: selectedKinks, instructions })
                      }, { onConflict: 'user_id, category_tag' });

                      if (saveConfigForLater) {
                        try {
                          const { data: inserted } = await supabase
                            .from('saved_pass_configs')
                            .insert({
                              user_id: session.user.id,
                              config_name: configName.trim() || 'Saved Configuration',
                              selected_boundaries: selectedTags,
                              instructions: instructions.trim() || null
                            })
                            .select()
                            .maybeSingle();

                          if (inserted) {
                            setSavedConfigs(prev => [inserted, ...prev]);
                          }
                        } catch (e) {
                          console.warn("Could not insert saved_pass_configs:", e);
                        }
                      }
                      alert("Configuration saved to your profile!");
                    }
                    setLoading(false);
                  }}
                  disabled={loading}
                  className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-red-900 hover:bg-red-800 text-white rounded-lg font-medium transition-colors"
                >
                  submit
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
                  Email or Nickname
                </button>
                <button 
                  onClick={() => setContactMethod('sms')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${contactMethod === 'sms' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  SMS (Mobile Delivery)
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {contactMethod === 'email' ? 'Recipient Nickname or Email Address' : 'Mobile Number (SMS)'}
                </label>
                {contactMethod === 'sms' ? (
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-zinc-200 text-sm focus:outline-none focus:border-red-500 shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-red-500"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="partner@example.com or Nickname"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-red-500"
                  />
                )}
                <p className="mt-1.5 text-xs text-zinc-500">
                  {contactMethod === 'email' 
                    ? 'Enter a registered user nickname or any email address (for new users).' 
                    : "Enter the recipient's mobile number to dispatch the guest pass via SMS."}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Access Expiration</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="expiration" checked={expirationHours === 24} onChange={() => setExpirationHours(24)} className="text-red-500 bg-zinc-900 border-zinc-800" />
                    <span className="text-sm text-zinc-300">24 Hours</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="expiration" checked={expirationHours === 48} onChange={() => setExpirationHours(48)} className="text-red-500 bg-zinc-900 border-zinc-800" />
                    <span className="text-sm text-zinc-300">48 Hours</span>
                  </label>
                </div>
              </div>

              {/* Save Configuration For Later */}
              <div className="mb-6 p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={saveConfigForLater}
                    onChange={(e) => setSaveConfigForLater(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-red-500 bg-zinc-900"
                  />
                  <span className="text-sm font-medium text-zinc-200">Save this configuration for later</span>
                </label>
                {saveConfigForLater && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Configuration Name</label>
                    <input 
                      type="text"
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                      placeholder="e.g. Mild Date Night, Spicy Boundaries, First Hookup"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              {contactInfo.trim() !== '' && (
                <div className="mb-8 p-4 bg-zinc-950/50 border border-zinc-800 rounded-lg flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="liability-consent"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-red-500 bg-zinc-900"
                  />
                  <label htmlFor="liability-consent" className="text-sm text-zinc-400">
                    I understand that I am sharing my public facing information with {contactMethod === 'sms' ? formatE164Phone(countryCode, contactInfo) : contactInfo}.
                  </label>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleSendInvite}
                  disabled={loading || !contactInfo || !consentChecked}
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
                {typeof window !== 'undefined' ? location.origin : ''}/signin?pass={inviteToken}
              </code>
            </div>
          )}

          <div>
            <button 
              onClick={() => { setInviteSent(false); setStep(1); setContactInfo(""); setSelectedTags([]); setInstructions(""); setConsentChecked(false); setSelectedConfigId(null); setSaveConfigForLater(false); setConfigName(""); }}
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
        
        {activePasses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Recipient</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Expires</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {activePasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 text-zinc-200 font-medium">{pass.type}</td>
                    <td className="py-4">{pass.recipient || "Anonymous"}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        pass.status === 'Active' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : pass.status === 'Revoked'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {pass.status}
                      </span>
                    </td>
                    <td className="py-4 text-xs">
                      {new Date(pass.expires_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-4 text-right">
                      {pass.status === 'Active' ? (
                        <button
                          onClick={() => handleRevoke(pass.id, pass.token)}
                          className="px-3 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded text-xs transition-colors"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-600 select-none">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-500 text-sm">
            No active passes generated yet.
          </div>
        )}
      </section>
    </main>
  );
}
