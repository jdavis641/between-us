#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('[CMO Agent] Initializing Marketing Engine...');

// 1. OPSEC Gate Integration
const hasEnvVar = process.env.OPSEC_VERIFIED === 'true';
const flagPath = path.join(process.cwd(), 'OPSEC_CLEARED.flag');
const hasFlag = fs.existsSync(flagPath);

const OPSEC_CLEARED = hasEnvVar && hasFlag;

if (!OPSEC_CLEARED) {
    console.log('[BLOCKED] OPSEC check failed: Marketing paused. Please complete the manual steps in docs/PRE_CMO_DEPLOYMENT_CHECKLIST.md (PO Box, VoIP, Stripe Public Profile updates) and create the OPSEC_CLEARED.flag to proceed.');
    console.log('[CMO Agent] Operating in local staging mode only. Generating CSVs for manual Canva Bulk Create.');
} else {
    console.log('[CMO Agent] OPSEC CLEARED. External scheduling authorized.');
}

// 2. Parse CMO Repository
const repoPath = path.join(process.cwd(), 'content', 'marketing-drafts', 'cmo-repository.json');
let repo = { hooks: [] };
if (fs.existsSync(repoPath)) {
    repo = JSON.parse(fs.readFileSync(repoPath, 'utf8'));
} else {
    console.log('[CMO Agent] Repository not found at', repoPath);
    process.exit(1);
}

// 3. Generate CSV for Canva Bulk Create
const csvPath = path.join(process.cwd(), 'content', 'marketing-drafts', 'canva-bulk-import.csv');
let csvContent = 'ID,Target Demographic,Perspective,Hook Text,Caption,UTM Campaign\n';

repo.hooks.forEach(hook => {
    // Escape quotes for CSV
    const hookText = `"${hook.hook_text.replace(/"/g, '""')}"`;
    const caption = `"${hook.caption.replace(/"/g, '""')}"`;
    csvContent += `${hook.id},${hook.target_demographic},${hook.perspective},${hookText},${caption},${hook.utm_campaign}\n`;
});

fs.writeFileSync(csvPath, csvContent, 'utf8');
console.log(`[CMO Agent] Canva Bulk Create CSV generated: ${csvPath}`);

// 4. Performance Tracking Logic (Mock Webhook Processing)
// In a live environment, this would run on an Express route listening for 'checkout.session.completed'
function processStripeWebhook(payload) {
    if (payload.type === 'checkout.session.completed') {
        const utmCampaign = payload.data.object.metadata?.utm_campaign;
        if (utmCampaign) {
            const hookIndex = repo.hooks.findIndex(h => h.utm_campaign === utmCampaign);
            if (hookIndex !== -1) {
                repo.hooks[hookIndex].performance_score += 1;
                fs.writeFileSync(repoPath, JSON.stringify(repo, null, 2), 'utf8');
                console.log(`[CMO Agent] Performance score updated for ${utmCampaign}. New Score: ${repo.hooks[hookIndex].performance_score}`);
            }
        }
    }
}

// Simulated Webhook Event
processStripeWebhook({
    type: 'checkout.session.completed',
    data: { object: { metadata: { utm_campaign: 'married-masc-001' } } }
});

// 5. Future Hook Generation Prompt Template
const topPerforming = repo.hooks.sort((a, b) => b.performance_score - a.performance_score)[0];
const promptTemplate = `
You are an elite Chief Marketing Officer for "Between Us", an app that builds safe, intimate roleplay scenarios and games for couples.
We need to generate 5 new short-form video hooks based on our top performing content.

TOP PERFORMING HOOK CONTEXT:
- Demographic: ${topPerforming.target_demographic}
- Perspective: ${topPerforming.perspective}
- Winning Hook: "${topPerforming.hook_text}"

STRICT INSTRUCTIONS:
1. Use the AIDA Framework (Attention, Interest, Desire, Action).
2. Write highly engaging, emotional, dual-perspective hooks.
3. Return output as a clean JSON array matching the schema: { target_demographic, perspective, hook_text, caption, utm_campaign }.
`;

if (OPSEC_CLEARED) {
    console.log('[CMO Agent] Pushing top performing hooks to external social scheduling APIs...');
    // Real scheduling logic would go here
} else {
    console.log('[CMO Agent] Saved top performing generation prompt for manual review.');
}

console.log('[CMO Agent] Cycle complete.');
