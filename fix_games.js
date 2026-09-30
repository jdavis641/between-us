const fs = require('fs');
let code = fs.readFileSync('app/dashboard/games/[id]/page.tsx', 'utf8');

code = code.replace(/import Link from 'next\/link'/, "import Link from 'next/link'\nimport MovieGameGenerator from '@/components/MovieGameGenerator'");

const target = /        \{\/\* Rules & Content Section \*\/\}/;
code = code.replace(target, `        {game.category === 'movie' && <MovieGameGenerator gameTitle={game.title} />}\n        \n        {/* Rules & Content Section */}`);

fs.writeFileSync('app/dashboard/games/[id]/page.tsx', code);
