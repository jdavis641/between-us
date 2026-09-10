#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const hasEnvVar = process.env.OPSEC_VERIFIED === 'true';
const flagPath = path.join(process.cwd(), 'OPSEC_CLEARED.flag');
const hasFlag = fs.existsSync(flagPath);

if (!hasEnvVar || !hasFlag) {
  console.log('[BLOCKED] OPSEC check failed: Marketing paused until business address and VoIP support phone number are provisioned.');
  console.log('All generated CMO assets must route to staging directory: content/marketing-drafts/');
  process.exit(1);
}

console.log('[PASSED] OPSEC verified. CMO deployment authorized.');
process.exit(0);
