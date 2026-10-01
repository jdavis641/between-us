const fs = require('fs');

const clientPath = 'app/dashboard/literature/LiteratureClient.tsx';
let code = fs.readFileSync(clientPath, 'utf8');

// 1. Update Button Text
code = code.replace(
  /\{loading \? "Drafting Chapter\.\.\." : "Generate Chapter"\}/g,
  '{loading ? "Drafting Story..." : "Generate Story"}'
);

// 2. Fix rendering logic to support scenario.body and remove partner lenses for literature
// We need to replace the rendering of scenario.overview and lenses with scenario.body.
// But wait, the component might be using "activeMode" state. We can just conditionally render body if it exists, or remove the tabs altogether for literature.

const oldRenderBlock = `            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 shadow-inner">
              <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Synopsis</h3>
              <p className="text-zinc-300 leading-relaxed">{scenario.overview}</p>
            </div>
  
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-12">
              <div className="flex bg-zinc-900/80 border-b border-zinc-800">
                <button
                  onClick={() => setActiveMode("partner-a")}
                  className={\`flex-1 py-4 text-sm font-medium transition-all \${
                    activeMode === "partner-a" ? "bg-zinc-800 text-white shadow-sm border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  }\`}
                >
                  Partner A Lens
                </button>
                <button
                  onClick={() => setActiveMode("partner-b")}
                  className={\`flex-1 py-4 text-sm font-medium transition-all \${
                    activeMode === "partner-b" ? "bg-zinc-800 text-white shadow-sm border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  }\`}
                >
                  Partner B Lens
                </button>
              </div>
  
              <div className="p-6 md:p-8">
                {activeMode === "partner-a" && (
                  <div className="animate-in fade-in">
                    <p className="text-zinc-300 leading-loose whitespace-pre-wrap font-serif text-lg">{scenario.partnerAPerspective}</p>
                  </div>
                )}
  
                {activeMode === "partner-b" && (
                  <div className="animate-in fade-in">
                    <p className="text-zinc-300 leading-loose whitespace-pre-wrap font-serif text-lg">{scenario.partnerBPerspective}</p>
                  </div>
                )}
              </div>
            </div>`;

const newRenderBlock = `            {scenario.body ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-10 mb-12 shadow-inner">
                <div className="prose prose-invert prose-red max-w-none prose-p:leading-loose prose-p:font-serif prose-p:text-lg prose-headings:font-serif">
                  <p className="text-zinc-300 leading-loose whitespace-pre-wrap font-serif text-lg">{scenario.body}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 shadow-inner">
                  <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Synopsis</h3>
                  <p className="text-zinc-300 leading-relaxed">{scenario.overview}</p>
                </div>
      
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mb-12">
                  <div className="flex bg-zinc-900/80 border-b border-zinc-800">
                    <button
                      onClick={() => setActiveMode("partner-a")}
                      className={\`flex-1 py-4 text-sm font-medium transition-all \${
                        activeMode === "partner-a" ? "bg-zinc-800 text-white shadow-sm border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                      }\`}
                    >
                      Partner A Lens
                    </button>
                    <button
                      onClick={() => setActiveMode("partner-b")}
                      className={\`flex-1 py-4 text-sm font-medium transition-all \${
                        activeMode === "partner-b" ? "bg-zinc-800 text-white shadow-sm border-b-2 border-red-500" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                      }\`}
                    >
                      Partner B Lens
                    </button>
                  </div>
      
                  <div className="p-6 md:p-8">
                    {activeMode === "partner-a" && (
                      <div className="animate-in fade-in">
                        <p className="text-zinc-300 leading-loose whitespace-pre-wrap font-serif text-lg">{scenario.partnerAPerspective}</p>
                      </div>
                    )}
      
                    {activeMode === "partner-b" && (
                      <div className="animate-in fade-in">
                        <p className="text-zinc-300 leading-loose whitespace-pre-wrap font-serif text-lg">{scenario.partnerBPerspective}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}`;

if (code.includes('scenario.overview')) {
  code = code.replace(oldRenderBlock, newRenderBlock);
  fs.writeFileSync(clientPath, code);
  console.log('Fixed LiteratureClient rendering.');
} else {
  console.log('Could not find the render block');
}
