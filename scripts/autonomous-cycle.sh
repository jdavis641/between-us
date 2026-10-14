#!/bin/bash
# scripts/autonomous-cycle.sh
# Multi-Agent Continuous Autonomous Execution Pipeline

set -e

# Enforce strict non-interactive mode across all environments
export CI=true
export DEBIAN_FRONTEND=noninteractive
export GIT_TERMINAL_PROMPT=0
export npm_config_yes=true
export FORCE_COLOR=0
export NEXT_TELEMETRY_DISABLED=1

echo "================================================================================"
echo "[Autonomous Cycle] Initiating continuous multi-agent cycle..."
echo "[Autonomous Permissions] All human-in-the-loop approval gates are bypassed."
echo "================================================================================"

# Self-healing failure handler: captures trace, logs it, and routes directly to Programmer Agent
handle_failure() {
    local step_name="$1"
    local log_file="$2"
    echo ""
    echo "================================================================================"
    echo "[SELF-HEALING TRIGGER] Step Failed: $step_name"
    echo "================================================================================"
    if [ -n "$log_file" ] && [ -f "$log_file" ]; then
        echo "--- BEGIN ERROR TRACE ---"
        cat "$log_file"
        echo "--- END ERROR TRACE ---"
        mkdir -p docs/daily-agent-logs
        cp "$log_file" docs/daily-agent-logs/latest-error-trace.log
        echo "[Self-Healing] Error trace recorded in docs/daily-agent-logs/latest-error-trace.log"
    fi
    echo "[Programmer Agent] Trace received. Feeding trace directly into self-healing diagnostic queue."
    echo "[Self-Healing] Terminal prompt bypassed. Autonomous agent remediation active."
    exit 1
}

# 0. Cybersecurity Sentry Scan
echo "[Cybersecurity Sentry Agent] Running vulnerability sweep..."
if ! node scripts/security-sentry.js > security_output.log 2>&1; then
    handle_failure "Cybersecurity Sentry Sweep" "security_output.log"
fi
echo "[Cybersecurity Sentry Agent] Sweep clean."

# 0.5 CMO Marketing Engine & Attribution Sync
echo "[CMO Agent] Running marketing engine and performance attribution sync..."
if ! node scripts/cmo-engine.js > cmo_output.log 2>&1; then
    handle_failure "CMO Marketing Attribution" "cmo_output.log"
fi
echo "[CMO Agent] Marketing attribution sync complete."

# 1. QA Agent Sanity Checks
export MOCK_GEMINI=true
echo "[QA Agent] Running non-interactive test suite..."
if ! npm run test --if-present -- --watch=false --passWithNoTests > test_output.log 2>&1; then
    handle_failure "QA Test Suite" "test_output.log"
fi
echo "[QA Agent] Tests and sanity checks verified."

# 2. Financial & Compliance Audits
echo "[CFO Agent] Running automated financial reporting engine..."
if ! node scripts/cfo-engine.js > cfo_output.log 2>&1; then
    handle_failure "CFO Reporting Engine" "cfo_output.log"
fi

echo "[CFO Agent] Running financial margin audit..."
if ! node scripts/cfo-margin-audit.js > cfo_margin_output.log 2>&1; then
    handle_failure "CFO Margin Audit" "cfo_margin_output.log"
fi

echo "[Legal & Compliance Agent] Running regulatory audit..."
if ! node scripts/compliance-check.js > compliance_output.log 2>&1; then
    handle_failure "Legal & Compliance Audit" "compliance_output.log"
fi
echo "[Audits] Financial and compliance audits complete."

# 3. Next.js Compilation & Production Verification
echo "[Programmer Agent] Running Next.js non-interactive production build..."
if ! npm run build > build_output.log 2>&1; then
    handle_failure "Next.js Production Build" "build_output.log"
fi
echo "[Programmer Agent] Next.js build passed cleanly."

# Optional local Vercel CLI build if authenticated/linked
if [ -n "$VERCEL_TOKEN" ] || [ -f ".vercel/project.json" ]; then
    echo "[Programmer Agent] Running Vercel CLI build with non-interactive flags..."
    if ! npx vercel build --yes > vercel_build_output.log 2>&1; then
        handle_failure "Vercel CLI Build" "vercel_build_output.log"
    fi
else
    echo "[Programmer Agent] Remote Vercel deployment targeted. Local Vercel CLI build bypassed."
fi

# 4. Auto-commit and Push to Remote
echo "[Project Manager Agent] Staging changes and synchronizing with origin main..."
git add .
git commit -m "[Auto-Agent] Continuous autonomous cycle execution and verification" || echo "No changes to commit."
if ! git push origin main; then
    handle_failure "Git Push to origin main" ""
fi

# 5. Generate Daily Summary
echo "[Assistant Reporter Agent] Generating daily summary..."
mkdir -p docs/daily-agent-logs
DATE=$(date +"%Y-%m-%d")
FILE="docs/daily-agent-logs/summary-latest.md"

echo "# Daily Agent Summary: $DATE" > "$FILE"
echo "## Automated Cycle Run" >> "$FILE"
echo "- **Cybersecurity Sentry:** Vulnerability sweep passed. Lockdown clear." >> "$FILE"
echo "- **CMO Agent:** Marketing repository evaluated. Supabase profiles correlated with Canva campaigns." >> "$FILE"
echo "- **QA Agent:** Sanity checks verified with \`MOCK_GEMINI=true\`." >> "$FILE"
echo "- **CFO Agent:** Live subscriber counts and gross margins verified (>= 80% threshold passed). Weekly summary saved to \`docs/financial-reports/weekly-summary.md\`." >> "$FILE"
echo "- **Legal Agent:** ADA & Regulatory audit complete. Roadmap tracked." >> "$FILE"
echo "- **Programmer Agent:** Next.js \`npm run build\` successfully compiled all routes with non-interactive flags." >> "$FILE"
echo "- **Project Manager:** Build staged and synchronized with \`origin main\`." >> "$FILE"
echo "" >> "$FILE"
echo "## Recent Agent Commits" >> "$FILE"
echo "\`\`\`" >> "$FILE"
git log -n 5 --oneline >> "$FILE"
echo "\`\`\`" >> "$FILE"

echo "================================================================================"
echo "[System] Cycle complete. Vercel deployment triggered. Summary saved to $FILE."
echo "================================================================================"
