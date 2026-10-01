const fs = require('fs');

let inviteCode = fs.readFileSync('app/api/invite/route.ts', 'utf8');
inviteCode = inviteCode.replace(/created_by: user\.id/, 'sender_id: user.id');
fs.writeFileSync('app/api/invite/route.ts', inviteCode);
