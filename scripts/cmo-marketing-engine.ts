import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// CMO Agent Infrastructure & Cost Control
// Uses a separate Gemini API billing account to strictly isolate marketing compute costs
const MARKETING_API_KEY = process.env.GEMINI_MARKETING_API_KEY;

if (!MARKETING_API_KEY) {
  console.error("FATAL: GEMINI_MARKETING_API_KEY is not set. Marketing generation aborted to prevent cross-account billing.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(MARKETING_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const MARKETING_DIR = path.join(process.cwd(), "marketing", "campaigns");

if (!fs.existsSync(MARKETING_DIR)) {
  fs.mkdirSync(MARKETING_DIR, { recursive: true });
}

// Ensure "The Ad Flywheel" tracks the lowest possible CAC
export async function generateAIDAContent(theme: string, perspective: "Masculine" | "Feminine" | "Couple", outputFileName: string) {
  console.log(`Generating AIDA short-form video content for: ${theme} (${perspective} perspective)`);

  const prompt = `
    You are the CMO Agent for "Between Us", an intimate web app that safely guides couples through roleplay, games, and erotic literature.
    We are executing our Launch Testing Phase (10/12/26 - 01/13/27).
    
    Format: AIDA Framework (Attention, Interest, Desire, Action).
    Goal: High "new subscriber" volume, optimized for the lowest possible Customer Acquisition Cost (CAC) on Meta and TikTok.
    Theme: ${theme}
    Perspective: ${perspective}
    
    Generate 3 short-form video hooks/scripts. For each, provide:
    1. Attention (Visual Hook + Text overlay)
    2. Interest (Storyline/Problem framing)
    3. Desire (The "Between Us" solution)
    4. Action (Call to action driving traffic to the PWA)
  `;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text();
    
    const filePath = path.join(MARKETING_DIR, `${outputFileName}.md`);
    fs.writeFileSync(filePath, `# Marketing Campaign Draft: ${theme}\n\n${content}`);
    console.log(`Marketing asset saved to ${filePath}`);
  } catch (error) {
    console.error("Failed to generate marketing content:", error);
  }
}

export async function generateValentinesCampaign() {
  console.log("Architecting Valentine's Day 2027 Bulk Campaign...");

  const prompt = `
    You are the CMO Agent for "Between Us". 
    Create a bulk faceless marketing campaign for Valentine's Day 2027 (Launch: 1/14/27).
    Positioning: "The ultimate tool to safely explore desires and enhance relationship connections."
    
    Generate 7 days worth of cross-platform auto-posting content (TikTok/Reels/Shorts).
    The content must be easily converted to faceless videos (e.g., text over aesthetic background).
    Include viral hooks, audio suggestions, and short, high-intent captions.
  `;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text();
    
    const filePath = path.join(MARKETING_DIR, `valentines-2027-faceless-blitz.md`);
    fs.writeFileSync(filePath, `# Valentine's Day 2027 Auto-Posting Blitz\n\n${content}`);
    console.log(`Valentine's Day campaign saved to ${filePath}`);
  } catch (error) {
    console.error("Failed to generate Valentine's campaign:", error);
  }
}

// CLI Execution Router
const command = process.argv[2];

async function run() {
  if (command === "launch") {
    await generateAIDAContent("Rekindling the Spark", "Couple", "launch-campaign-rekindle");
    await generateAIDAContent("Understanding Her Desires", "Masculine", "launch-campaign-masculine");
    await generateAIDAContent("Communicating Your Boundaries Safely", "Feminine", "launch-campaign-feminine");
  } else if (command === "valentines") {
    await generateValentinesCampaign();
  } else {
    console.log("Usage: ts-node scripts/cmo-marketing-engine.ts [launch | valentines]");
  }
}

run();
