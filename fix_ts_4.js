const fs = require('fs');

let cron1 = fs.readFileSync('app/api/cron/mid-week/route.ts', 'utf8');
cron1 = cron1.replace(/JSON\.parse\(result\.choices\[0\]\.message\.content\)/g, "JSON.parse(result.choices[0].message.content || '{}')");
fs.writeFileSync('app/api/cron/mid-week/route.ts', cron1);

let cron2 = fs.readFileSync('app/api/cron/weekend/route.ts', 'utf8');
cron2 = cron2.replace(/JSON\.parse\(result\.choices\[0\]\.message\.content\)/g, "JSON.parse(result.choices[0].message.content || '{}')");
fs.writeFileSync('app/api/cron/weekend/route.ts', cron2);
