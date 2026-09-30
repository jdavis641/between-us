const fs = require('fs');

let ib = fs.readFileSync('app/components/InteractionBar.tsx', 'utf8');
ib = ib.replace(/\.catch\(\(\) => \{\}\)/g, '');
fs.writeFileSync('app/components/InteractionBar.tsx', ib);

let pass = fs.readFileSync('app/dashboard/pass/page.tsx', 'utf8');
pass = pass.replace(/\(d\) =>/g, '(d: any) =>');
pass = pass.replace(/\(inv\) =>/g, '(inv: any) =>');
fs.writeFileSync('app/dashboard/pass/page.tsx', pass);

let cron1 = fs.readFileSync('app/api/cron/mid-week/route.ts', 'utf8');
cron1 = cron1.replace(/Buffer\.from\((.*?), 'base64'\)/g, 'Buffer.from($1 || "", "base64")');
fs.writeFileSync('app/api/cron/mid-week/route.ts', cron1);

let cron2 = fs.readFileSync('app/api/cron/weekend/route.ts', 'utf8');
cron2 = cron2.replace(/Buffer\.from\((.*?), 'base64'\)/g, 'Buffer.from($1 || "", "base64")');
fs.writeFileSync('app/api/cron/weekend/route.ts', cron2);
