export const maxDuration = 300;
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import RolePlayClient, { extractStreamingRoleplay, STREAM_INTERRUPTED_MESSAGE, handleStreamError, RolePlayMarkdown } from "./RolePlayClient";
import FlameLoader from "@/components/FlameLoader";
import ErrorBoundary, { safeMarkdownString } from "@/components/ErrorBoundary";

export { RolePlayClient, RolePlayMarkdown, FlameLoader, ErrorBoundary, extractStreamingRoleplay, STREAM_INTERRUPTED_MESSAGE, handleStreamError };

export const sanitizeContent = (content: string) => safeMarkdownString(content);

export default function RolePlayPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-rose-500/30">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <header className="mb-10 border-b border-zinc-800 pb-6">
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-zinc-100">Roleplay Scenarios</h1>
          <p className="text-zinc-400 text-lg font-light leading-relaxed">
            Generate highly personalized, narrative-driven experiences tailored strictly to your shared boundaries and desires.
          </p>
        </header>

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20">
            <FlameLoader isGenerating={true} progressText="Connecting to experience engine..." />
          </div>
        }>
          <RolePlayClient />
        </Suspense>
      </div>
    </main>
  );
}
