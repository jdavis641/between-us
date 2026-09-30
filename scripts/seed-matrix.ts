import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const matrix = [
  // Card Games
  { category: 'card', intensity: 'Sensory', title: 'Whispering Deck', description: 'A gentle card game focused on touch and eye contact.', content: { rules: ['Draw a card and read the sensory prompt.', 'Maintain eye contact for 10 seconds.', 'Follow the prompt slowly.'] } },
  { category: 'card', intensity: 'Playful', title: 'Truth or Tease', description: 'A fun game mixing revealing questions with light physical teasing.', content: { rules: ['Draw a card. If red, answer the question. If black, follow the tease prompt.', 'Winner gets a 5-minute massage.'] } },
  { category: 'card', intensity: 'Intense', title: 'Blindfold Blackjack', description: 'High stakes blackjack where the loser loses a piece of clothing or control.', content: { rules: ['Play a hand of blackjack.', 'The loser is blindfolded for 5 minutes and must endure whatever the winner desires.'] } },
  { category: 'card', intensity: 'Extreme', title: 'The Boundary Deck', description: 'Cards designed to push your psychological and physical limits securely.', content: { rules: ['Each card has a command.', 'You must obey or use your safe word.', 'No hesitations.'] } },

  // Movie Night Games
  { category: 'movie', intensity: 'Sensory', title: 'Cuddle Cinema', description: 'Focus on closeness during a movie. Every time the scene changes, shift your touch.', content: { rules: ['Start cuddling during the opening credits.', 'Every scene change, trace a new path on your partner\'s arm or back.'] } },
  { category: 'movie', intensity: 'Playful', title: 'Rom-Com Bingo', description: 'A playful bingo game based on movie cliches. The winner gets a kiss.', content: { rules: ['Mark your card when a cliche happens.', 'First to get bingo gets a long, passionate kiss.'] } },
  { category: 'movie', intensity: 'Intense', title: 'Tension Thriller', description: 'Watch a suspenseful movie. When tension rises on screen, so does the physical tension.', content: { rules: ['During suspenseful scenes, one partner is tied or restricted.', 'Release only when the scene resolves.'] } },
  { category: 'movie', intensity: 'Extreme', title: 'Sensory Deprivation Cinema', description: 'One partner is blindfolded and wears noise-canceling headphones while the other uses the movie as inspiration.', content: { rules: ['Blindfold Partner A.', 'Partner B enacts scenes inspired by the movie onto Partner A.'] } },

  // Drinking Games
  { category: 'drinking', intensity: 'Sensory', title: 'Sip & Trace', description: 'A slow drinking game. Every sip is accompanied by a light touch.', content: { rules: ['Take a sip.', 'Trace the rim of the glass on your partner\'s collarbone.'] } },
  { category: 'drinking', intensity: 'Playful', title: 'Never Have I Ever: Intimate Edition', description: 'A classic game with a spicy twist.', content: { rules: ['Take turns saying something intimate you haven\'t done.', 'If you have, drink and share the story.'] } },
  { category: 'drinking', intensity: 'Intense', title: 'Shot Roulette', description: 'High stakes. Some shots are water, some are liquor, some come with a dare.', content: { rules: ['Take a shot.', 'If it\'s liquor, you must perform the assigned intense dare.'] } },
  { category: 'drinking', intensity: 'Extreme', title: 'The Master\'s Cup', description: 'A dominant/submissive drinking dynamic.', content: { rules: ['The dominant partner controls when and what the submissive drinks.', 'Disobedience results in punishment.'] } },

  // Date Night Games
  { category: 'date_night', intensity: 'Sensory', title: 'Taste Test', description: 'Blindfolded food tasting focused on texture and flavor.', content: { rules: ['Blindfold your partner.', 'Feed them different foods and have them guess.', 'Focus on the sensation on their lips.'] } },
  { category: 'date_night', intensity: 'Playful', title: 'Roleplay Restaurant', description: 'Pretend to be strangers meeting at a bar or restaurant.', content: { rules: ['Sit separately.', 'One partner approaches the other with a cheesy pickup line.', 'Stay in character all night.'] } },
  { category: 'date_night', intensity: 'Intense', title: 'Public Secret', description: 'Wear something hidden (like a vibrating toy) during a public date.', content: { rules: ['Partner A wears the device.', 'Partner B holds the remote during dinner.', 'Maintain composure.'] } },
  { category: 'date_night', intensity: 'Extreme', title: 'The Kidnapping Date', description: 'A consensual non-consent scenario starting from the moment you leave the house.', content: { rules: ['Partner B "kidnaps" Partner A.', 'Follow pre-arranged safe words and boundaries strictly.', 'Drive to a secluded location.'] } },
];

async function seedMatrix() {
  console.log("Truncating intimacy_games table...");
  // Use RPC if available, or just delete all rows
  const { error: deleteError } = await supabase.from('intimacy_games').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (deleteError) {
    console.error("Failed to delete existing games:", deleteError);
  } else {
    console.log("Table cleared.");
  }

  console.log("Inserting 16 balanced games...");
  const { data, error } = await supabase.from('intimacy_games').insert(matrix);

  if (error) {
    console.error("Seeding failed:", error);
  } else {
    console.log("Successfully seeded 16 games!");
  }
}

seedMatrix();
