const fs = require('fs');

let code = fs.readFileSync('app/api/generate/content/route.ts', 'utf8');

const replacement = `      let authHeader = req.headers.get('Authorization'); 
      let explicitToken = authHeader?.replace('Bearer ', '')?.trim();
      
      if (!explicitToken || explicitToken === 'undefined' || explicitToken === 'null') {
        return NextResponse.json({ error: 'Auth Rejected: Token explicitly missing or undefined' }, { status: 401 });
      }`;

code = code.replace(/      let authHeader = req\.headers\.get\('Authorization'\); \n      let explicitToken = authHeader\?\.replace\('Bearer ', ''\)\?\.trim\(\);\n      if \(explicitToken === 'undefined' \|\| explicitToken === 'null'\) explicitToken = undefined;/, replacement);

fs.writeFileSync('app/api/generate/content/route.ts', code);
