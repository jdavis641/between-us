import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import RolePlayClient from "./RolePlayClient";

export default async function RolePlayPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading experience...</div>
      </div>
    }>
      <RolePlayClient accessToken={session?.access_token} />
    </Suspense>
  );
}
