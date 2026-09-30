const fs = require('fs');
let code = fs.readFileSync('app/dashboard/pass/page.tsx', 'utf8');

const regex = /<div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 mb-3">[\s\S]*?<\/div>/;
code = code.replace(regex, '');

code = code.replace(/setContactMethod\('sms'\)/g, '');
code = code.replace(/contactMethod === 'sms'/g, 'false');

fs.writeFileSync('app/dashboard/pass/page.tsx', code);
