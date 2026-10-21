const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runHeadlessQA() {
  console.log("================================================================================");
  console.log("             AUTOMATED HEADLESS UI & ENDPOINT REGRESSION TEST SUITE            ");
  console.log("================================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = "") {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------------
  // 1. MAGIC LINK ROUTING & AUTH STATE VERIFICATION
  // -------------------------------------------------------------------------
  console.log(">>> Step 1: Auditing Magic Link Routing & Auth Fallbacks...");
  
  const callbackRoutePath = path.join(process.cwd(), 'app', 'auth', 'callback', 'route.ts');
  assert(fs.existsSync(callbackRoutePath), "Auth callback route file exists");
  
  const callbackContent = fs.readFileSync(callbackRoutePath, 'utf8');
  assert(callbackContent.includes('exchangeCodeForSession'), "Auth code exchange logic present in callback");
  assert(callbackContent.includes('onboarding') && callbackContent.includes('dashboard'), "Dynamic redirect logic to onboarding/dashboard present");
  assert(callbackContent.includes('login?error='), "Fallback error redirect present in auth callback");

  // Check login route
  const loginPath = path.join(process.cwd(), 'app', 'login', 'page.tsx');
  assert(fs.existsSync(loginPath), "Login page exists");
  const loginContent = fs.readFileSync(loginPath, 'utf8');
  assert(loginContent.includes('signInWithOtp'), "Magic link OTP authentication wired into Login UI");

  // -------------------------------------------------------------------------
  // 2. DASHBOARD STATE PERSISTENCE & DATA HYDRATION
  // -------------------------------------------------------------------------
  console.log("\n>>> Step 2: Auditing Dashboard State Persistence & Lens Hydration...");

  // Check active profiles
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, nickname, is_active, created_at')
    .eq('is_active', true)
    .limit(5);

  assert(!profileErr && profiles && profiles.length > 0, `Active profile state verified (found ${profiles?.length} profiles)`);

  // Check generated content state persistence
  const { data: contentSample, error: contentErr } = await supabase
    .from('generated_content')
    .select('id, title, content_type, body, pre_experience_tasks, status')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5);

  assert(!contentErr && contentSample && contentSample.length > 0, `Generated content state retrieved (found ${contentSample?.length} items)`);

  // Verify Partner A / Partner B lens extraction from saved roleplay scenario
  const roleplayRow = contentSample.find(c => c.content_type === 'roleplay');
  if (roleplayRow) {
    const parsed = typeof roleplayRow.body === 'string' ? JSON.parse(roleplayRow.body) : roleplayRow.body;
    assert(parsed.overview && typeof parsed.overview === 'string', "Roleplay storyboard overview verified");
    assert(parsed.partnerAPerspective && typeof parsed.partnerAPerspective === 'string', "Partner A perspective lens verified without undefined crash");
    assert(parsed.partnerBPerspective && typeof parsed.partnerBPerspective === 'string', "Partner B perspective lens verified without undefined crash");
    assert(Array.isArray(parsed.preExperienceTasks) && parsed.preExperienceTasks.length > 0, "Pre-experience tasks hydration verified");
  } else {
    console.log("[INFO] No roleplay in top 5 sample, checking query specifically for roleplay...");
    const { data: rpRows } = await supabase.from('generated_content').select('*').eq('content_type', 'roleplay').limit(1);
    assert(rpRows && rpRows.length > 0, "Roleplay scenarios accessible in database");
    const parsed = typeof rpRows[0].body === 'string' ? JSON.parse(rpRows[0].body) : rpRows[0].body;
    assert(parsed.partnerAPerspective && parsed.partnerBPerspective, "Dual perspectives intact");
  }

  // -------------------------------------------------------------------------
  // 3. OPENROUTER & GENERATIVE ENDPOINTS VERIFICATION
  // -------------------------------------------------------------------------
  console.log("\n>>> Step 3: Auditing OpenRouter Generative Architecture & Escalation...");

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  assert(openRouterKey && openRouterKey.startsWith('sk-or-v1-'), "OpenRouter API Key verified in environment");

  const routePath = path.join(process.cwd(), 'app', 'api', 'generate', 'content', 'route.ts');
  const routeContent = fs.readFileSync(routePath, 'utf8');
  
  assert(routeContent.includes('sao10k/l3.1-euryale-70b'), "Target model sao10k/l3.1-euryale-70b verified in generation pipeline");
  assert(routeContent.includes('regenerationCount >= 2'), "3-step escalation threshold verified (2-regen / 3-attempt cycle)");
  assert(routeContent.includes('X-Generation-Source'), "X-Generation-Source header response configured");
  assert(routeContent.includes('extractIntimacyMetaTags'), "Meta-tagging on generation verified");

  // -------------------------------------------------------------------------
  // 4. OPSEC DISARMAMENT & COMMERCIAL CREDENTIALS AUDIT
  // -------------------------------------------------------------------------
  console.log("\n>>> Step 4: Auditing OPSEC Disarmament & Commercial Identity...");

  const flagPath = path.join(process.cwd(), 'OPSEC_CLEARED.flag');
  assert(fs.existsSync(flagPath), "OPSEC_CLEARED.flag is physically present in root");
  assert(process.env.OPSEC_VERIFIED === 'true', "OPSEC_VERIFIED=true is set in environment");

  const footerPath = path.join(process.cwd(), 'src', 'components', 'Footer.tsx');
  const footerContent = fs.readFileSync(footerPath, 'utf8');
  assert(!footerContent.includes('1043 S. Roselle Rd, #1048') && !footerContent.includes('224-223-8077') && !footerContent.includes('(224) 479-1076'), "Physical address and phone numbers removed from Footer.tsx");
  assert(footerContent.includes('support@betweenusapp.io'), "Email-only support active in Footer.tsx");

  const termsPath = path.join(process.cwd(), 'app', 'terms', 'page.tsx');
  const termsContent = fs.readFileSync(termsPath, 'utf8');
  assert(!termsContent.includes('1043 S. Roselle Rd, #1048') && !termsContent.includes('224-223-8077') && !termsContent.includes('(224) 479-1076'), "Physical address and phone numbers removed from Terms of Service");
  assert(termsContent.includes('support@betweenusapp.io'), "Email-only support active in Terms of Service");

  const privacyPath = path.join(process.cwd(), 'app', 'privacy', 'page.tsx');
  const privacyContent = fs.readFileSync(privacyPath, 'utf8');
  assert(!privacyContent.includes('1043 S. Roselle Rd, #1048') && !privacyContent.includes('224-223-8077') && !privacyContent.includes('(224) 479-1076'), "Physical address and phone numbers removed from Privacy Policy");
  assert(privacyContent.includes('support@betweenusapp.io'), "Email-only support active in Privacy Policy");

  // -------------------------------------------------------------------------
  // 5. CMO AGENT DEPLOYMENT ASSETS VERIFICATION
  // -------------------------------------------------------------------------
  console.log("\n>>> Step 5: Auditing CMO Marketing Deployment Assets...");

  const csvPath = path.join(process.cwd(), 'content', 'marketing-drafts', 'canva-bulk-import.csv');
  assert(fs.existsSync(csvPath), "canva-bulk-import.csv generated and present");
  
  const csvData = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  assert(csvData.length === 61, `canva-bulk-import.csv contains all 60 video hooks + header (actual: ${csvData.length} lines)`);
  assert(csvData[0].startsWith('ID,Target Demographic,Perspective,Hook Text'), "Canva Bulk Import CSV header schema verified");

  console.log("\n================================================================================");
  console.log(`[QA SUCCESS] All ${passedTests}/${totalTests} automated headless verifications passed with 0 regressions!`);
  console.log("================================================================================");
}

runHeadlessQA().catch(err => {
  console.error("Headless QA Failure:", err);
  process.exit(1);
});
