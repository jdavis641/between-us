const { exec } = require('child_process');

const CRITICAL_PACKAGES = [
  'next',
  '@supabase/supabase-js',
  '@supabase/ssr',
  '@google/genai'
];

console.log("Running mechanism audit for critical infrastructure dependencies...");

exec('cmd /c npm outdated --json', (error, stdout, stderr) => {
  let outdated = {};
  
  try {
    if (stdout) {
      outdated = JSON.parse(stdout);
    }
  } catch (e) {
    console.error('Failed to parse npm outdated output:', e);
    process.exit(1);
  }

  const flags = [];
  
  for (const pkg of CRITICAL_PACKAGES) {
    if (outdated[pkg]) {
      const current = outdated[pkg].current || outdated[pkg].wanted || '0.0.0';
      const latest = outdated[pkg].latest || current;
      
      const currentMajor = parseInt(current.split('.')[0]);
      const latestMajor = parseInt(latest.split('.')[0]);
      
      if (latestMajor > currentMajor) {
        flags.push(`[MAJOR UPDATE] ${pkg}: ${current} -> ${latest}`);
      } else {
        flags.push(`[MINOR/PATCH UPDATE] ${pkg}: ${current} -> ${latest}`);
      }
    }
  }
  
  if (flags.length > 0) {
    console.log("\n--- MECHANISM AUDIT REPORT ---");
    console.log("Outdated critical infrastructure packages detected:\n");
    flags.forEach(f => console.log(f));
    console.log("\n@ProjectManager: Please review these updates.");
    console.log("If major updates are approved, instruct @Programmer to execute 'npm update' and refactor deprecated routing/middleware/SDK configurations.");
  } else {
    console.log("\n--- MECHANISM AUDIT REPORT ---");
    console.log("All critical infrastructure packages are up to date.");
  }
});
