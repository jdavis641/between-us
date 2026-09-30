const fs = require('fs');
let code = fs.readFileSync('app/dashboard/layout.tsx', 'utf8');
code = code.replace(/Suggest Scenario/g, 'Suggest an erotic literature scenario for public enjoyment');
fs.writeFileSync('app/dashboard/layout.tsx', code);
