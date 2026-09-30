const fs = require('fs');
let code = fs.readFileSync('app/dashboard/pass/page.tsx', 'utf8');
code = code.replace(/<button \n\s*onClick=\{\(\) => \}\n\s*className=\{`flex-1 py-2 text-sm font-medium rounded-md transition-colors \$\{false \? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'\}`\}\n\s*>\n\s*SMS\n\s*<\/button>/g, '');
fs.writeFileSync('app/dashboard/pass/page.tsx', code);
