'use client';

import React, { useState, useEffect, useCallback, Suspense, Component, type ErrorInfo } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import FlameLoader from "@/components/FlameLoader";
import LiteratureClient from "./LiteratureClient";

// Styled SVG Spinner fallback if FlameLoader fails to load or encounters an issue
function FallbackSpinner({ text = "Loading Romantasy..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <svg
        className="w-10 h-10 text-rose-500 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span className="text-sm font-medium text-zinc-400">{text}</span>
    </div>
  );
}

// Resilient wrapper for FlameLoader
function SafeFlameLoader({ isGenerating = true, progressText }: { isGenerating?: boolean; progressText?: string }) {
  try {
    if (!FlameLoader) {
      return <FallbackSpinner text={progressText} />;
    }
    return <FlameLoader isGenerating={isGenerating} progressText={progressText} />;
  } catch {
    return <FallbackSpinner text={progressText} />;
  }
}

// Defensive Internal Error Boundary to capture rendering errors and prevent page crashes
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RomantasyErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Romantasy page error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl border border-rose-500/40 bg-rose-950/20 text-center space-y-4 my-8">
          <div className="text-3xl">⚠️</div>
          <h3 className="text-lg font-medium text-rose-200">Unable to load reading experience</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            {this.state.error?.message ?? "An unexpected error occurred while rendering the reading experience."}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onRetry) {
                this.props.onRetry();
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
          >
            Retry Experience
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RomantasyContent() {
  const searchParams = useSearchParams();

  // 1. Defensive State Declarations with Safe Initial Defaults
  const [story, setStory] = useState<string>("");
  const [kinks, setKinks] = useState<string[]>([]);
  const [tolerance, setTolerance] = useState<string>('Playful');
  const [mode, setMode] = useState<string>(() => searchParams?.get('mode') ?? 'solo');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [supabase] = useState(() => createClient());

  // Keep mode synchronized with searchParams safely
  useEffect(() => {
    const currentMode = searchParams?.get('mode');
    if (currentMode) {
      setMode(currentMode);
    }
  }, [searchParams]);

  // 2. Defensive Data Retrieval with Optional Chaining & Nullish Coalescing
  const fetchUserData = useCallback(async () => {
    try {
      setPageError(null);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return;
      }
      const user = userData.user;

      // Query profiles table safely
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('base_tolerance')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) {
        console.warn("Profile fetch warning in Romantasy:", profileErr);
      }

      // Safe fallback to 'Playful' using optional chaining and nullish coalescing
      const activeTolerance = profile?.base_tolerance ?? 'Playful';
      setTolerance(activeTolerance);

      // Query intimacy_preferences table safely
      const { data: preferences, error: prefErr } = await supabase
        .from('intimacy_preferences')
        .select('category_tag, preference_level, kinks_override')
        .eq('user_id', user.id)
        .neq('category_tag', 'Guest Pass Config');

      if (prefErr) {
        console.warn("Preferences fetch warning in Romantasy:", prefErr);
      }

      if (!profile?.base_tolerance && Array.isArray(preferences)) {
        const prefRow = preferences.find((p: any) =>
          p?.category_tag === 'Primary Directive' ||
          p?.category_tag === 'Base Tolerance' ||
          p?.category_tag === 'base_tolerance'
        );
        if (prefRow?.preference_level) {
          setTolerance(prefRow.preference_level ?? 'Playful');
        }
      }

      // Extract kinks_override defensively
      const kinkRow = Array.isArray(preferences)
        ? preferences.find((p: any) => p?.category_tag === 'Primary Directive' && p?.kinks_override)
          || preferences.find((p: any) => p?.kinks_override)
        : null;

      const rawKinksOverride = kinkRow?.kinks_override ?? [];
      if (rawKinksOverride) {
        try {
          const parsed = typeof rawKinksOverride === 'string' ? JSON.parse(rawKinksOverride) : rawKinksOverride;
          if (Array.isArray(parsed)) {
            const parsedList = parsed
              .map((k: any) => (typeof k === 'string' ? k : (k?.text ?? '')))
              .filter(Boolean);
            setKinks(parsedList);
          } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed?.kinks)) {
            setKinks(parsed.kinks.filter(Boolean));
          } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
            setKinks([parsed.trim()]);
          }
        } catch {
          if (typeof rawKinksOverride === 'string') {
            const splitKinks = rawKinksOverride.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
            setKinks(splitKinks);
          }
        }
      }
    } catch (err: any) {
      console.error("Error loading Romantasy profile data:", err);
      // Capture error in pageError to display inline warning banner rather than crashing page
      setPageError(err?.message ?? "An unexpected error occurred while loading your profile preferences.");
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-rose-500/30">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        {/* Header Section */}
        <header className="mb-8 border-b border-zinc-800 pb-6">
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-zinc-100">Romantasy</h1>
          <p className="text-zinc-400 text-lg font-light leading-relaxed">
            Generate immersive, highly descriptive romantic fiction centered strictly around your preferences and kinks.
          </p>

          {/* Defensive UI Badges */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Tolerance: <span className="text-rose-400 capitalize">{tolerance ?? 'Playful'}</span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5">
              Mode: <span className="text-zinc-200 capitalize">{mode ?? 'solo'}</span>
            </span>
            {Array.isArray(kinks) && kinks.length > 0 && (
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                ✨ {kinks.length} Custom Kink{kinks.length > 1 ? 's' : ''} Active
              </span>
            )}
          </div>
        </header>

        {/* Inline Warning Banner with Retry Button for Supabase or Network Failures */}
        {pageError && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/50 bg-rose-950/30 flex items-center justify-between text-sm text-rose-200 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-medium">Notice Loading Profile Preferences</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{pageError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchUserData()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shrink-0 ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Reading UI protected by Defensive Internal Error Boundary */}
        <RomantasyErrorBoundary onRetry={fetchUserData}>
          <Suspense fallback={<SafeFlameLoader isGenerating={true} progressText="Reviewing your preferences... Creating your content... This is going to be great!" />}>
            <LiteratureClient
              initialTolerance={tolerance}
              initialKinks={Array.isArray(kinks) ? kinks : []}
              initialMode={mode}
              story={story}
              setStory={setStory}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
            />
          </Suspense>
        </RomantasyErrorBoundary>
      </div>
    </main>
  );
}

export default function RomantasyPage() {
  return (
    <Suspense fallback={<FallbackSpinner text="Loading Romantasy..." />}>
      <RomantasyContent />
    </Suspense>
  );
}
