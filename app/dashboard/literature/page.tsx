export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import LiteratureClient from "./LiteratureClient";

export default async function LiteraturePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading experience...</div>
      </div>
    }>
      <LiteratureClient />
    </Suspense>
  );
}
