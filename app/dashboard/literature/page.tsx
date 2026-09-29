import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import LiteratureClient from "./LiteratureClient";

export default async function LiteraturePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading experience...</div>
      </div>
    }>
      <LiteratureClient accessToken={session?.access_token} />
    </Suspense>
  );
}
