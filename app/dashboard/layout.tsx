'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "./Sidebar";
import TourModal from "./components/TourModal";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient({
    global: {
      fetch: (url: any, opts: any = {}) => fetch(url, { ...opts, cache: 'no-store' })
    }
  }));
  const router = useRouter();
  const [isOnboardingVerified, setIsOnboardingVerified] = useState(false);

  useEffect(() => {
    async function checkProfileOnMount() {
      try {
        let authUser: any = null;
        // Server-side session validation
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (user && !userError) {
          authUser = user;
        } else {
          const { data: { session: cachedSession } } = await supabase.auth.getSession();
          if (cachedSession?.user) {
            authUser = cachedSession.user;
          }
        }

        if (!authUser) {
          router.replace('/login');
          return;
        }
      } catch (err: any) {
        console.error("Error verifying profile authentication:", err);
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
      <Suspense fallback={null}>
        <TourModal />
      </Suspense>
    </div>
  );
}
