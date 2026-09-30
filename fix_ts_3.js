const fs = require('fs');

let pass = fs.readFileSync('app/dashboard/pass/page.tsx', 'utf8');
pass = pass.replace(/d =>/g, '(d: any) =>');
pass = pass.replace(/inv =>/g, '(inv: any) =>');
fs.writeFileSync('app/dashboard/pass/page.tsx', pass);

let cron1 = fs.readFileSync('app/api/cron/mid-week/route.ts', 'utf8');
cron1 = cron1.replace(/authHeader\?.split\(' '\)\[1\]/g, "(authHeader?.split(' ')[1] || '')");
fs.writeFileSync('app/api/cron/mid-week/route.ts', cron1);

let cron2 = fs.readFileSync('app/api/cron/weekend/route.ts', 'utf8');
cron2 = cron2.replace(/authHeader\?.split\(' '\)\[1\]/g, "(authHeader?.split(' ')[1] || '')");
fs.writeFileSync('app/api/cron/weekend/route.ts', cron2);
