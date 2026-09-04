import os

os.makedirs('app/onboarding', exist_ok=True)

code = '''"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Step = "email" | "profile" | "preferences" | "invite" | "done";
type Preference = "definitely" | "curious" | "off_limits";

const THEMES = [
  "Roleplay",
  "BDSM",
  "Public Intimacy",
  "Sensory Deprivation",
  "Light Bondage"
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const [alias, setAlias] = useState("");
  const [pronouns, setPronouns] = useState("");
  
  const [preferences, setPreferences] = useState<Record<string, Preference>>({});
  
  const [coupleUuid, setCoupleUuid] = useState("");

  const supabase = createClient();

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    // In a real app, this sends an email. 
    // We'll proceed to the next step immediately for demonstration purposes, 
    // assuming the user clicked the link and returned, or we just simulate the flow.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: \\/api/auth/confirm\,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the magic link!");
      // Simulate successful login for the sake of the onboarding flow demo
      // In production, the user leaves the page and returns via the magic link.
      setTimeout(() => setStep("profile"), 1500);
    }
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Attempt to get user. If they aren't actually logged in (because we faked the magic link),
    // we would normally stop here. For this demo we'll just move to the next step.
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        anonymous_alias: alias,
        pronouns,
      });
    }
    
    setStep("preferences");
    setLoading(false);
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Create couple record
      const { data: coupleData } = await supabase
        .from("couples")
        .insert({ status: "active" })
        .select()
        .single();
        
      if (coupleData) {
        setCoupleUuid(coupleData.id);
        
        // Link user to couple
        await supabase.from("couple_members").insert({
          couple_id: coupleData.id,
          user_id: user.id
        });
        
        // Save preferences
        const prefInserts = Object.entries(preferences).map(([tag, level]) => ({
          user_id: user.id,
          couple_id: coupleData.id,
          category_tag: tag,
          preference_level: level
        }));
        
        if (prefInserts.length > 0) {
          await supabase.from("intimacy_preferences").insert(prefInserts);
        }
      }
    }
    
    setStep("invite");
    setLoading(false);
  };
  
  const setPref = (theme: string, level: Preference) => {
    setPreferences(prev => ({ ...prev, [theme]: level }));
  };

  return (
    <main className="flex flex-col min-h-screen p-6 bg-zinc-950 text-zinc-100 max-w-xl mx-auto items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full shadow-lg">
        
        {step === "email" && (
          <form onSubmit={handleSendMagicLink} className="flex flex-col gap-5 animate-in fade-in">
            <h1 className="text-2xl font-bold text-center">Welcome to Between Us</h1>
            <p className="text-zinc-400 text-center">Enter your email to receive a passwordless magic link.</p>
            
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-100"
              required
            />
            
            {message && <p className="text-red-400 text-sm text-center">{message}</p>}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-red-900 text-white hover:bg-red-800 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-5 animate-in fade-in">
            <h1 className="text-2xl font-bold text-center">Create Your Profile</h1>
            <p className="text-zinc-400 text-center">We don't use real names here. Choose an alias.</p>
            
            <input 
              type="text" 
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Anonymous Alias"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-100"
              required
            />
            
            <input 
              type="text" 
              value={pronouns}
              onChange={(e) => setPronouns(e.target.value)}
              placeholder="Pronouns (e.g. they/them)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-100"
            />
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-red-900 text-white hover:bg-red-800 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        )}

        {step === "preferences" && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            <h1 className="text-2xl font-bold text-center">Intimacy Preferences</h1>
            <p className="text-zinc-400 text-center text-sm">Categorize these themes. Your partner will never see your "Off-Limits" selections.</p>
            
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
              {THEMES.map(theme => (
                <div key={theme} className="flex flex-col gap-2 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="font-medium text-zinc-200">{theme}</span>
                  <div className="flex gap-2 text-xs">
                    <button 
                      onClick={() => setPref(theme, "definitely")}
                      className={\lex-1 py-2 rounded-md transition-colors \\}
                    >
                      Definitely
                    </button>
                    <button 
                      onClick={() => setPref(theme, "curious")}
                      className={\lex-1 py-2 rounded-md transition-colors \\}
                    >
                      Curious
                    </button>
                    <button 
                      onClick={() => setPref(theme, "off_limits")}
                      className={\lex-1 py-2 rounded-md transition-colors \\}
                    >
                      Off-Limits
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleSavePreferences}
              disabled={loading || Object.keys(preferences).length < THEMES.length}
              className="w-full py-3 bg-red-900 text-white hover:bg-red-800 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Generate Invite Link"}
            </button>
          </div>
        )}

        {step === "invite" && (
          <div className="flex flex-col gap-5 animate-in fade-in items-center text-center">
            <h1 className="text-2xl font-bold">Invite Your Partner</h1>
            <p className="text-zinc-400">Your profile is ready. Send this invite to your partner to pair your accounts.</p>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 w-full break-all text-sm text-zinc-300">
              {coupleUuid ? \\/join?couple=\\ : 'Generating link...'}
            </div>
            
            <a 
              href={\mailto:?subject=Join me on Between Us&body=Hey! I set up our profile on Between Us. Use this link to join and share your preferences: \/join?couple=\\}
              className="w-full py-3 bg-red-900 text-white hover:bg-red-800 rounded-lg font-medium transition-colors inline-block text-center"
            >
              Open Email App
            </a>
            
            <button 
              onClick={() => location.href = "/role-play"}
              className="mt-4 text-sm text-zinc-500 hover:text-zinc-300 underline"
            >
              Skip and go to Dashboard
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
'''

with open('app/onboarding/page.tsx', 'w') as f:
    f.write(code)
