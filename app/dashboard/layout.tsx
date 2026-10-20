'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "./Sidebar";
import TolerancePromptManager from "../components/TolerancePromptManager";
import TourModal from "./components/TourModal";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { redirect, useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [isOnboardingVerified, setIsOnboardingVerified] = useState(false);

  useEffect(() => {
    async function checkProfileOnMount() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace('/login');
          redirect('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active, nickname, literature_prompt_status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const isActive = Boolean(profile.is_active);
          const isNicknameMissing = !profile.nickname || profile.nickname.trim().length === 0;
          const isPromptPending = !profile.literature_prompt_status || profile.literature_prompt_status === 'pending';

          if (isActive && (isNicknameMissing || isPromptPending)) {
            router.replace('/onboarding');
            redirect('/onboarding');
            return;
          }
        }
      } catch (err: any) {
        if (err?.digest?.startsWith('NEXT_REDIRECT')) {
          throw err;
        }
        console.error("Error verifying profile onboarding status:", err);
      } finally {
        setIsOnboardingVerified(true);
      }
    }

    checkProfileOnMount();
  }, [supabase, router]);

  if (!isOnboardingVerified) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Between Us...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500/30">
      
      {/* Sidebar Navigation */}
      <Sidebar
        logo={
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/brand-logo.webp" alt="Between Us Logo" width={32} height={32} priority className="rounded-md" />
            <h2 className="text-xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Between Us
            </h2>
          </Link>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden flex flex-col relative w-full">
        {children}
      </div>
      <TolerancePromptManager />
      <Suspense fallback={null}>
        <TourModal />
      </Suspense>
    </div>
  );
}
