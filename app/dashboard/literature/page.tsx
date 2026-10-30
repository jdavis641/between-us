export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import LiteratureClient from "./LiteratureClient";
import FlameLoader from "@/components/FlameLoader";
import { createClient as createServerClient } from "@/utils/supabase/server";

export default async function LiteraturePage() {
  const supabase = await createServerClient();
  let initialTolerance = 'Playful';
  let initialKinks: string[] = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('base_tolerance')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.base_tolerance) {
        initialTolerance = profile.base_tolerance;
      }

      const { data: preferences } = await supabase
        .from('intimacy_preferences')
        .select('category_tag, preference_level, kinks_override')
        .eq('user_id', user.id)
        .neq('category_tag', 'Guest Pass Config');

      if (!profile?.base_tolerance && preferences) {
        const prefRow = preferences.find((p: any) =>
          p.category_tag === 'Primary Directive' ||
          p.category_tag === 'Base Tolerance' ||
          p.category_tag === 'base_tolerance'
        );
        if (prefRow?.preference_level) {
          initialTolerance = prefRow.preference_level;
        }
      }

      const kinkRow = preferences?.find((p: any) => p.category_tag === 'Primary Directive' && p.kinks_override)
        || preferences?.find((p: any) => p.kinks_override);

      if (kinkRow?.kinks_override) {
        try {
          const parsed = JSON.parse(kinkRow.kinks_override);
          if (Array.isArray(parsed)) {
            initialKinks = parsed.map((k: any) => typeof k === 'string' ? k : (k?.text || '')).filter(Boolean);
          } else if (parsed && typeof parsed === 'object' && parsed.kinks) {
            initialKinks = Array.isArray(parsed.kinks) ? parsed.kinks : [String(parsed.kinks)];
          } else if (typeof parsed === 'string') {
            initialKinks = [parsed];
          }
        } catch {
          initialKinks = kinkRow.kinks_override.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
        }
      }
    }
  } catch (err) {
    console.warn("Could not pre-fetch literature preferences:", err);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-rose-500/30">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <header className="mb-10 border-b border-zinc-800 pb-6">
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-zinc-100">Romantasy</h1>
          <p className="text-zinc-400 text-lg font-light leading-relaxed">
            Generate immersive, highly descriptive romantic fiction centered strictly around your preferences and kinks.
          </p>
        </header>

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20">
            <FlameLoader isGenerating={true} progressText="Reviewing your preferences... Creating your content... This is going to be great!" />
          </div>
        }>
          <LiteratureClient initialTolerance={initialTolerance} initialKinks={initialKinks} />
        </Suspense>
      </div>
    </main>
  );
}
