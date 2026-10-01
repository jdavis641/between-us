const fs = require('fs');

let layoutCode = fs.readFileSync('app/dashboard/layout.tsx', 'utf8');
layoutCode = layoutCode.replace(/href="\/dashboard\/games#date"/, 'href="/dashboard/games#date_night"');
fs.writeFileSync('app/dashboard/layout.tsx', layoutCode);

let gamesCode = fs.readFileSync('app/dashboard/games/page.tsx', 'utf8');
gamesCode = gamesCode.replace(/id: 'date'/, "id: 'date_night'");
fs.writeFileSync('app/dashboard/games/page.tsx', gamesCode);
