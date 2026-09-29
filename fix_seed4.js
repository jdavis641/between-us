const fs = require('fs');
let code = fs.readFileSync('scripts/seed-library.ts', 'utf8');

code = code.replace(/const GAME_CATEGORIES = \['Card Games', 'Movie Night Games', 'Drinking Games', 'Date Night Games'\];/, "const GAME_CATEGORIES = ['card', 'movie', 'drinking', 'date_night'];");
code = code.replace(/const PLAY_MODES = \['Solo', 'Couple', 'Group'\];/, "const PLAY_MODES = ['solo', 'couple', 'group', 'roleplay'];");

fs.writeFileSync('scripts/seed-library.ts', code);
