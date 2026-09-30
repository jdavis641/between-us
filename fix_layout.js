const fs = require('fs');
let code = fs.readFileSync('app/dashboard/layout.tsx', 'utf8');

const newMain = `          {/* Main */}
          <div className="space-y-2">
            <Link href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors">
              Dashboard Home
            </Link>
            <Link href="/dashboard/pass" className="block px-3 py-2 rounded-lg bg-red-950/20 text-red-400 hover:bg-red-950/40 border border-red-900/30 transition-colors">
              🎟️ Between Us Pass
            </Link>
            <Link href="/dashboard/roleplay" className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors">
              🎭 Role Play
            </Link>
            <Link href="/dashboard/literature" className="block px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors">
              📖 Erotic Literature
            </Link>
          </div>`;

code = code.replace(/\{\/\* Main \*\/\}[\s\S]*?<\/div>\s*\{\/\* Intimacy Games \*\/\}/m, newMain + '\n\n          {/* Intimacy Games */}');
code = code.replace(/\s*\{\/\* Role Play \*\/\}[\s\S]*?\{\/\* Community & Feedback \*\/\}/m, '\n          {/* Community & Feedback */}');

fs.writeFileSync('app/dashboard/layout.tsx', code);
