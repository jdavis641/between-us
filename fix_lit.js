const fs = require('fs');
let code = fs.readFileSync('app/dashboard/literature/LiteratureClient.tsx', 'utf8');

const replacement = `            <div className="flex flex-wrap gap-4 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="playMode" 
                  value="solo" 
                  checked={playMode === 'solo'} 
                  onChange={(e) => setPlayMode(e.target.value)}
                  className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700"
                />
                <span className="text-zinc-300">Solo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="playMode" 
                  value="couple" 
                  checked={playMode === 'couple'} 
                  onChange={(e) => setPlayMode(e.target.value)}
                  className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700"
                />
                <span className="text-zinc-300">Couple</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="playMode" 
                  value="group" 
                  checked={playMode === 'group'} 
                  onChange={(e) => setPlayMode(e.target.value)}
                  className="w-4 h-4 text-red-600 bg-zinc-950 border-zinc-700"
                />
                <span className="text-zinc-300">Group</span>
              </label>
            </div>`;

code = code.replace(/<div className="flex flex-wrap gap-4 mb-6">[\s\S]*?<\/div>/, replacement);
fs.writeFileSync('app/dashboard/literature/LiteratureClient.tsx', code);
