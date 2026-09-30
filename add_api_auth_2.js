const fs = require('fs');

let code = fs.readFileSync('app/api/generate/content/route.ts', 'utf8');

const replacement = `      let authHeader = req.headers.get('Authorization'); 
      let explicitToken = authHeader?.replace('Bearer ', '')?.trim();
      
      if (!explicitToken || explicitToken === 'undefined' || explicitToken === 'null') {
        return NextResponse.json({ error: 'Auth Rejected: Token explicitly missing or undefined' }, { status: 401 });
      }`;

const parts = code.split(/      let authHeader = req\.headers\.get\('Authorization'\);[\s\S]*?if \(explicitToken === 'undefined' \|\| explicitToken === 'null'\) explicitToken = undefined;/);

if (parts.length > 1) {
  code = parts[0] + replacement + parts[1];
  fs.writeFileSync('app/api/generate/content/route.ts', code);
}

