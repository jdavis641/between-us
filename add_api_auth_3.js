const fs = require('fs');

let code = fs.readFileSync('app/api/generate/content/route.ts', 'utf8');

const targetStr = "if (explicitToken === 'undefined' || explicitToken === 'null') explicitToken = undefined;";
const replacement = `if (!explicitToken || explicitToken === 'undefined' || explicitToken === 'null') {
        return NextResponse.json({ error: 'Auth Rejected: Token explicitly missing or undefined' }, { status: 401 });
      }`;

const idx = code.indexOf(targetStr);
if (idx !== -1) {
  code = code.substring(0, idx) + replacement + code.substring(idx + targetStr.length);
  fs.writeFileSync('app/api/generate/content/route.ts', code);
}
