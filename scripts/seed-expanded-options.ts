import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const expandedSeedList = [
  {
    title: "The Midnight Spa Oasis",
    mode: "Couple",
    boundary_tier: "Sensory",
    description: "A gentle, deeply romantic scenario focused on massage, essential oils, and reconnecting through touch."
  },
  {
    title: "The Blindfolded Taste Test",
    mode: "Couple",
    boundary_tier: "Playful",
    description: "A fun and teasing culinary exploration where one partner is blindfolded and fed different treats, guessing the flavors while being lightly teased."
  },
  {
    title: "Absolute Submission Contract",
    mode: "Couple",
    boundary_tier: "Extreme",
    description: "A hardcore D/s scenario involving a strict contract, heavy rules, and complete surrender of control for the weekend."
  },
  {
    title: "The Anonymous Bar Encounter",
    mode: "Couple",
    boundary_tier: "Intense",
    description: "Public roleplay where partners pretend to be strangers meeting at a bar, escalating into a passionate, secretive hotel hookup."
  },
  {
    title: "Solo Mirror Confessions",
    mode: "Solo",
    boundary_tier: "Sensory",
    description: "A guided solo exploration focusing on body positivity, self-touch, and whispering desires into a mirror."
  },
  {
    title: "The Voyeur's Window",
    mode: "Solo",
    boundary_tier: "Playful",
    description: "A fantasy scenario where the reader imagines watching their ideal partner perform for them through a window."
  },
  {
    title: "Edge of Endurance",
    mode: "Solo",
    boundary_tier: "Intense",
    description: "A demanding solo orgasm control and edging protocol designed to push physical and mental stamina."
  },
  {
    title: "Taboo Awakening",
    mode: "Solo",
    boundary_tier: "Extreme",
    description: "A deep dive into forbidden fantasies and boundary-pushing thoughts, exploring the darkest corners of desire safely."
  },
  {
    title: "The Truth or Dare Cabin",
    mode: "Group",
    boundary_tier: "Playful",
    description: "Four friends stuck in a cabin play an escalating game of truth or dare, leading to unexpected crossing of boundaries."
  },
  {
    title: "The Shared Prize",
    mode: "Group",
    boundary_tier: "Intense",
    description: "A competitive scenario where three people compete for the attention and control of the fourth."
  },
  {
    title: "The Ritual of Four",
    mode: "Group",
    boundary_tier: "Extreme",
    description: "An intense, heavily structured group scene involving elaborate rules, restraint, and synchronized sensory deprivation."
  },
  {
    title: "The Gentle Awakening",
    mode: "Couple",
    boundary_tier: "Sensory",
    description: "Waking up together on a lazy Sunday, focusing on slow, building intimacy without the pressure of climax."
  },
  {
    title: "The High Stakes Wager",
    mode: "Couple",
    boundary_tier: "Playful",
    description: "A game of poker where the currency is clothing and acts of service, keeping the mood light and competitive."
  },
  {
    title: "The Interrogation Room",
    mode: "Couple",
    boundary_tier: "Intense",
    description: "A power-exchange scene featuring light bondage and a demanding interrogation with rewarding 'punishments'."
  },
  {
    title: "The Exhibitionist's Gallery",
    mode: "Couple",
    boundary_tier: "Extreme",
    description: "A highly risky outdoor fantasy scenario focusing on the thrill of being caught and public display."
  },
  {
    title: "The Secret Admirer's Note",
    mode: "Solo",
    boundary_tier: "Sensory",
    description: "A deeply romantic and suspenseful solo journey driven by reading an explicit love letter from an unknown admirer."
  }
];

async function runSeed() {
  console.log('--- Starting Expanded Options Seeding ---');

  for (const item of expandedSeedList) {
    const payload = JSON.stringify(item);
    const { error } = await supabase
      .from('scenario_suggestions')
      .insert({
        suggestion_text: payload,
        status: 'approved' // Auto-approving for seed data
      });

    if (error) {
      console.error(`Error inserting ${item.title}:`, error.message);
    } else {
      console.log(`Successfully seeded: ${item.title}`);
    }
  }

  console.log('--- Seeding Complete ---');
}

runSeed();
