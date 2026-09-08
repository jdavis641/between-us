import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const sourceDir = 'C:\\Users\\jdavi\\.gemini\\antigravity\\scratch\\between-us';
const destinationDir = 'D:\\Personal Items\\between-us_backup';

console.log('Initiating local backup sequence...');

// 1. Ensure destination exists
if (!existsSync(destinationDir)) {
  mkdirSync(destinationDir, { recursive: true });
}

// 2. Perform the immediate backup using robocopy
try {
  console.log(`Copying files to ${destinationDir}...`);
  // robocopy exit codes 1-7 indicate success. We only throw an error for >= 8.
  execSync(`robocopy "${sourceDir}" "${destinationDir}" /E /XO /XD .git node_modules .next`, { stdio: 'ignore' });
} catch (error) {
  if (error.status >= 8) {
    console.error('Immediate backup failed. Robocopy exit code:', error.status);
    process.exit(1);
  }
}
console.log('Immediate backup completed successfully.');

// 3. Create a permanent batch file for the scheduled task to trigger
const batFilePath = join(sourceDir, 'scripts', 'weekly_backup.bat');
const batContent = `@echo off\nrobocopy "${sourceDir}" "${destinationDir}" /E /XO /XD .git node_modules .next\nexit`;

if (!existsSync(join(sourceDir, 'scripts'))) {
  mkdirSync(join(sourceDir, 'scripts'));
}
writeFileSync(batFilePath, batContent);

// 4. Register the weekly Windows task (Fridays at 16:00 / 4:00 PM)
try {
  console.log('Registering weekly automated task in Windows...');
  execSync(`schtasks /create /tn "BetweenUs_Weekly_Backup" /tr "\\"${batFilePath}\\"" /sc weekly /d FRI /st 16:00 /f`, { stdio: 'inherit' });
  console.log('\nSuccess! Your project is backed up and scheduled for every Friday at 4:00 PM.');
} catch (error) {
  console.error('\nFailed to register Windows scheduled task:', error.message);
}
