export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import LiteratureClient from "./LiteratureClient";

export default async function LiteraturePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return <div className="p-12 text-center text-red-500 font-bold">Authentication dropped by server. Please log out and log back in.</div>;
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading experience...</div>
      </div>
    }>
      <LiteratureClient accessToken={session.access_token} />
    </Suspense>
  );
}
