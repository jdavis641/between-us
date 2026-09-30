const fs = require('fs');
let code = fs.readFileSync('app/dashboard/layout.tsx', 'utf8');

const target = `<Link href="/dashboard/suggest" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">dY\\' Suggest an erotic literature scenario for public enjoyment</Link>`;

const newLink = `<Link href="/dashboard/suggest" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">dY\\' Suggest an erotic literature scenario for public enjoyment</Link>
              <Link href="/dashboard/improvements" className="block px-3 py-1.5 text-sm rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200">🛠️ Suggest App Improvements</Link>`;

code = code.replace(target, newLink);
fs.writeFileSync('app/dashboard/layout.tsx', code);
