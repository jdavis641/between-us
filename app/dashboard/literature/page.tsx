export const maxDuration = 300;
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import LiteratureClient, { extractStreamingMarkdown, STREAM_INTERRUPTED_MESSAGE, handleStreamError, LiteratureMarkdown } from "./LiteratureClient";
import FlameLoader from "@/components/FlameLoader";
import ErrorBoundary, { safeMarkdownString } from "@/components/ErrorBoundary";

export { LiteratureClient, LiteratureMarkdown, FlameLoader, ErrorBoundary, extractStreamingMarkdown, STREAM_INTERRUPTED_MESSAGE, handleStreamError };

export const sanitizeContent = (content: string) => safeMarkdownString(content);

export default function LiteraturePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-rose-500/30">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <header className="mb-10 border-b border-zinc-800 pb-6">
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 text-zinc-100">Erotic Literature</h1>
          <p className="text-zinc-400 text-lg font-light leading-relaxed">
            Generate immersive, highly descriptive romantic fiction centered strictly around your preferences and kinks.
          </p>
        </header>

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20">
            <FlameLoader isGenerating={true} progressText="Connecting to literature engine..." />
          </div>
        }>
          <LiteratureClient />
        </Suspense>
      </div>
    </main>
  );
}
