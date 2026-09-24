import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TIERS = ['Sensory', 'Playful', 'Intense', 'Extreme'];
const GAME_CATEGORIES = ['Card Games', 'Movie Night Games', 'Drinking Games', 'Date Night Games'];
const PLAY_MODES = ['Solo', 'Couple', 'Group'];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateWithRetry(prompt: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      return response;
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt === retries) throw error;
      await delay(5000); // Wait 5s before retrying
    }
  }
}

async function generateIntimacyGames() {
  console.log('--- Starting Intimacy Games Generation ---');
  
  for (const tier of TIERS) {
    for (const category of GAME_CATEGORIES) {
      console.log(`Generating 6 games for [${tier}] ${category}...`);
      
      const prompt = `
        You are a creative game designer for a couples' intimacy app.
        Generate 6 distinct intimacy games.
        Category: ${category}
        Intensity Level: ${tier} (Sensory=Mild/Romantic, Playful=Adventurous/Toys, Intense=BDSM/Hardcore, Extreme=Taboo/Boundary-pushing)
        
        Return EXACTLY a JSON array of 6 objects. Each object must have:
        - "title": A catchy string
        - "description": A short summary string
        - "category": "${category}"
        - "intensity": "${tier}"
        - "content": An object containing a "rules" array of strings.
        
        Ensure output is strictly JSON without markdown wrappers if possible, or cleanly parsable.
      `;

      try {
        const response = await generateWithRetry(prompt);
        
        let rawResponse = response?.text || '[]';
        const games = JSON.parse(rawResponse);
        
        for (const game of games) {
          const { error } = await supabase.from('intimacy_games').insert({
            title: game.title,
            description: game.description,
            category: game.category,
            intensity: game.intensity,
            content: game.content
          });
          if (error) {
            console.error(`Error inserting game: ${game.title}`, error.message);
          }
        }
        console.log(`Successfully inserted 6 games for [${tier}] ${category}.`);
      } catch (err: any) {
        console.error(`Generation failed for [${tier}] ${category}:`, err.message);
      }
      
      // Throttle to prevent rate limits
      await delay(2000);
    }
  }
}

async function generateEroticLiterature() {
  console.log('--- Starting Erotic Literature Generation ---');
  
  for (const tier of TIERS) {
    for (const mode of PLAY_MODES) {
      console.log(`Generating 4 stories for [${tier}] ${mode}...`);
      
      for (let i = 0; i < 4; i++) {
        let constraint = '';
        if (mode === 'Solo') {
          constraint = "Write a highly descriptive, first-person romantic fantasy focusing entirely on the reader's internal monologue and solo exploration.";
        } else if (mode === 'Couple') {
          constraint = 'Write a dual-perspective, parallel storyline focusing strictly on 2 main character storylines.';
        } else if (mode === 'Group') {
          constraint = 'Write an interconnected narrative featuring exactly 4 distinct character storylines.';
        }

        const prompt = `
          You are an elite erotic literature author writing for an intimacy app.
          Intensity Level: ${tier} (Sensory=Mild/Romantic, Playful=Adventurous/Toys, Intense=BDSM/Hardcore, Extreme=Taboo/Boundary-pushing)
          Play Mode: ${mode}
          
          Constraint: ${constraint}
          
          Provide the output as a JSON object with:
          - "title": A captivating title
          - "body": The full story text
        `;

        try {
          const response = await generateWithRetry(prompt);
          
          let rawResponse = response?.text || '{}';
          const story = JSON.parse(rawResponse);
          
          const { error } = await supabase.from('generated_content').insert({
            title: story.title,
            body: story.body,
            content_type: 'literature',
            status: 'active', 
          });
          
          if (error) {
             console.error(`Error inserting story: ${story.title}`, error.message);
          } else {
             console.log(`Inserted story ${i + 1}/4 for [${tier}] ${mode}.`);
          }
        } catch (err: any) {
          console.error(`Generation failed for [${tier}] ${mode} story ${i+1}:`, err.message);
        }
        
        // Throttle
        await delay(2000);
      }
    }
  }
}

async function runSeed() {
  await generateIntimacyGames();
  await generateEroticLiterature();
  console.log('--- Seeding Complete ---');
}

runSeed();
