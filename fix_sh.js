const fs = require('fs');
let code = fs.readFileSync('scripts/autonomous-cycle.sh', 'utf8');

const buildStep = `# 3. Next.js Compilation
echo "[Programmer Agent] Running Next.js build..."
export CI=true # Ensure non-interactive CI mode
if ! npm run build > build_output.log 2>&1; then
    cat build_output.log
    echo "[Programmer Agent] Build failed. Feeding error trace back for immediate self-healing."
    exit 1
fi

echo "[Programmer Agent] Running Vercel CLI build for Vercel-specific feedback loop..."
if ! npx vercel build --yes > vercel_build_output.log 2>&1; then
    cat vercel_build_output.log
    echo "[Programmer Agent] Vercel build failed. Feeding error trace back for immediate self-healing."
    exit 1
fi`;

code = code.replace(/# 3\. Next\.js Compilation[\s\S]*?fi\n/, buildStep + '\n');
fs.writeFileSync('scripts/autonomous-cycle.sh', code);
