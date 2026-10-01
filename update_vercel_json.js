const fs = require('fs');

const path = 'vercel.json';
let data = JSON.parse(fs.readFileSync(path, 'utf8'));

if (!data.crons) {
  data.crons = [];
}

const retentionCron = {
  path: "/api/cron/retention",
  schedule: "0 12 * * *"
};

// Check if it already exists
if (!data.crons.find(c => c.path === retentionCron.path)) {
  data.crons.push(retentionCron);
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('Added retention cron to vercel.json');
} else {
  console.log('Cron already exists in vercel.json');
}
