export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import RolePlayClient from "./RolePlayClient";

export default async function RolePlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading experience...</div>
      </div>
    }>
      <RolePlayClient />
    </Suspense>
  );
}
