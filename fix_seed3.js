const fs = require('fs');
let code = fs.readFileSync('scripts/seed-library.ts', 'utf8');

code = code.replace(/let rawResponse = response\?\.choices\?\.\[0\]\?\.message\?\.content \|\| '\[\]';/g, "let rawResponse = response || '[]';");
code = code.replace(/let rawResponse = response\?\.choices\?\.\[0\]\?\.message\?\.content \|\| '\{\}';/g, "let rawResponse = response || '{}';");

fs.writeFileSync('scripts/seed-library.ts', code);
