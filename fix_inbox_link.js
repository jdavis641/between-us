const fs = require('fs');
let code = fs.readFileSync('app/dashboard/layout.tsx', 'utf8');

const oldAccountBlock = /{[\s\S]*?\/\* Account \*\/}[\s\S]*?<div className="pt-4 mt-4 border-t border-zinc-900">/;
const targetAccountBlockMatch = code.match(/\{\/\* Account \*\/\}[\s\S]*?<div className="pt-4 mt-4 border-t border-zinc-900">/);

if (targetAccountBlockMatch) {
  const newAccountBlock = `{/* Account */}
          <div className="pt-4 mt-4 border-t border-zinc-900">
            <Link href="/dashboard/messages" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors mb-1">
              📬 Inbox
            </Link>`;
  code = code.replace(targetAccountBlockMatch[0], newAccountBlock);
  fs.writeFileSync('app/dashboard/layout.tsx', code);
}
