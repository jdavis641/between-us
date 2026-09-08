@echo off
robocopy "C:\Users\jdavi\.gemini\antigravity\scratch\between-us" "D:\Personal Items\between-us_backup" /E /XO /XD .git node_modules .next
exit