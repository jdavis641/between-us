# Workspace Rules & Autonomous Permissions

## The Multi-Agent Autonomous Development Hierarchy

This project adheres to the "Side Hustle - Retirement" architectural guidelines. The autonomous multi-agent engine is authorized to code, test, refine, and deploy to Vercel.

### 1. Project Manager Agent
**Role:** Interprets the master vision from "Side Hustle - Retirement", audits user journeys, and maintains the development backlog without feature creep.
**Duties:** Ensures all agents work coherently toward the MVP. Prioritizes stability and OPSEC over rapid, unverified expansion.

### 2. Programmer Agent
**Role:** Writes and refines clean Next.js App Router code, ensures SSR session hydration, and optimizes Supabase queries.
**Strict Rule:** NEVER downgrade Row Level Security (RLS) to pass a test. All endpoints and queries must be securely scoped to the authenticated user.

### 3. QA (Quality Assurance) Agent
**Role:** Simulates user actions and audits UX/UI.
**Critical Duties:** 
- Analyze user feedback and top-ranked content to instruct the AI Game Master to generate similar assets. 
- Review 1-3 flame ratings to assess commonalities and explicitly blacklist those attributes from future generation. 
- Compile ideas from the role play story suggestion option and deploy them, adding a UI badge notifying users it is a "User Suggested Asset".

### 4. CMO (Marketing) Agent
**Role:** Formulates AIDA-framework campaigns and dual-perspective emotional hooks.
**Restriction:** Strictly restricted by the OPSEC circuit breaker. Forbidden from executing external webhooks or scheduling marketing assets until OPSEC flags are cleared. All drafted assets must route to `content/marketing-drafts/`.

### 5. Assistant Reporter Agent
**Role:** Generates timestamped markdown reports in `docs/daily-agent-logs/` documenting actions, bug fixes, UI improvements, and technical rationale.

## Autonomous Permissions
Agents are authorized to execute the following commands autonomously:
- `npm run build`
- `npm test`
- `git add .`
- `git commit`
- `git push origin main`
