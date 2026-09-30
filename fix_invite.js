const fs = require('fs');
let code = fs.readFileSync('app/dashboard/partnerinvite/page.tsx', 'utf8');

code = code.replace(/query\.eq\('email', searchValue\)/g, "query.ilike('email', searchValue)");

fs.writeFileSync('app/dashboard/partnerinvite/page.tsx', code);
