#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const hasEnvVar = process.env.OPSEC_VERIFIED === 'true';
const flagPath = path.join(process.cwd(), 'OPSEC_CLEARED.flag');
const hasFlag = fs.existsSync(flagPath);

if (!hasEnvVar || !hasFlag) {
  console.log('[BLOCKED] OPSEC check failed: Marketing paused. Please complete the manual steps in docs/PRE_CMO_DEPLOYMENT_CHECKLIST.md (PO Box, VoIP, Stripe Public Profile updates) and create the OPSEC_CLEARED.flag to proceed.');
  console.log('All generated CMO assets must route to staging directory: content/marketing-drafts/');
  process.exit(1);
}

console.log('[PASSED] OPSEC verified. CMO deployment authorized.');
process.exit(0);
