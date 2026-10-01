import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tropes = [
  "Enemies to Lovers: Forced to share a small cabin during a snowstorm, two bitter rivals slowly realize their hatred was actually thinly veiled passion.",
  "Fated Mates: A rogue supernatural being discovers their soulmate is a seemingly ordinary human, triggering a dangerous claiming instinct.",
  "Only One Bed: Stranded at a mysterious roadside inn with only one room and one very small bed left.",
  "Fake Dating: A pretend relationship to fool a jealous ex spirals out of control when the fake kisses start feeling entirely too real.",
  "Grumpy x Sunshine: A brooding, isolated warrior is forced to escort a relentlessly optimistic healer, melting his icy exterior.",
  "Touch Her and You Die: A dangerously protective anti-hero unleashes his full wrath when his beloved is threatened by an enemy faction.",
  "Forced Proximity: Shackled together by magic, two opposing mages must learn to work in perfect synchronization to survive.",
  "Marriage of Convenience: A political alliance forces a prince and a rebel leader to wed, but the wedding night reveals unexpected chemistry.",
  "The Villain Gets the Girl: The dark lord captures the chosen one, not to destroy her, but to make her his dark queen.",
  "Secret Identity: A masked vigilante repeatedly rescues a noble, unaware that the noble is actually their sworn nemesis by day.",
  "Royal Bodyguard: A stoic knight sworn to protect the princess struggles against his forbidden desires for her.",
  "Soulbond: A rare, ancient magic links two strangers' minds, forcing them to feel each other's deepest emotions and arousing sensations.",
  "Slow Burn: Years of lingering glances and missed connections culminate in one explosive, undeniable confession.",
  "The Betrayal: A spy falls in love with their target, forcing them to choose between their mission and their heart.",
  "Found Family: A group of outcasts forms an unbreakable bond, and two of them discover their platonic love has evolved into something deeper.",
  "Rescue Mission: Captured by a rival court, a hero waits for death, only to be saved by the one person they thought hated them most.",
  "Forbidden Magic: A puritanical sorcerer discovers that practicing dark magic with a dangerous witch is the only way to save their realm.",
  "Academic Rivals: Two fiercely competitive scholars vying for the same prestigious fellowship end up studying a very different kind of anatomy.",
  "He Falls First: He's been secretly pining for her for years, but she only just noticed the intensity in his gaze.",
  "Demon Pact: A desperate human sells their soul for revenge, but the demon demands a much more intimate form of payment.",
  "Dark Prince: Abducted to the Underworld, a mortal finds themselves drawn to the terrifying but captivating ruler of the dead.",
  "Second Chance Romance: Reunited after a decade, old wounds are reopened alongside a passion that never actually died.",
  "Size Difference: A towering, monstrous brute treats their tiny, delicate partner with unexpected, worshipping gentleness.",
  "Morally Grey Hero: He will burn the world to the ground to keep her safe, and she loves him for it.",
  "The Awakening: An innocent protagonist discovers a hidden world of dark fantasy and their own latent, powerful desires.",
  "Billionaire Beast: A modern retelling of Beauty and the Beast featuring a reclusive tech mogul and a brilliant, uncompromising auditor.",
  "Vampire's Thrall: A centuries-old vampire becomes obsessed with a human whose blood smells like the only thing that can quench his eternal thirst.",
  "Werewolf Alpha: The ruthless leader of the pack finds his true mate in a lone wolf who refuses to submit.",
  "Fae Court Intrigue: A human dragged into the treacherous politics of the Seelie court must rely on a seductive, untrustworthy Fae trickster.",
  "Time Travel Romance: Flung into the past, a modern historian falls for a doomed Scottish Highlander and tries to change history to save him.",
  "Pirate Captain: Kidnapped by a notorious pirate, a governor's child discovers freedom and fierce passion on the high seas.",
  "Gladiator's Prize: A fearsome arena champion claims a defiant noble as his prize, only to be tamed by their unbreakable spirit.",
  "Teacher/Student: A forbidden, scandalous romance in a magical academy where the stakes are life, death, and expulsion.",
  "Childhood Friends to Lovers: After years of platonic affection, a shared, unexpected kiss changes the entire dynamic of their relationship.",
  "Amnesia: He loses all memory of their bitter divorce, waking up believing they are still madly, passionately in love.",
  "The Bargain: To save her family, she agrees to spend one month in the castle of the mysterious, cursed lord.",
  "Beauty and the Beast: A classic retelling where the 'beast' is a scarred, reclusive war hero who needs a gentle touch to heal.",
  "Hades and Persephone: The Lord of the Dead abducts the Goddess of Spring, but she discovers she prefers the darkness to the light.",
  "Bodyguard/Client: The pop star and the ex-military security detail who is strictly professional—until the threat gets too close.",
  "Reincarnation: Two souls bound by a tragic past life find each other again in the modern world, drawn together by an inexplicable magnetic pull.",
  "The Bet: It started as a cruel wager to seduce the ice queen, but the seducer ended up falling hopelessly in love.",
  "Good Girl / Bad Boy: The preacher's daughter sneaks out to meet the town delinquent, discovering a wild side she never knew she had.",
  "Enemies with Benefits: They absolutely loathe each other's personalities, but their physical chemistry is an addiction neither can break.",
  "The Arrangement: A sugar daddy arrangement evolves into a deeply emotional, fiercely protective possessive romance.",
  "Monster Romance: A human scientist falls in love with the terrifying, misunderstood creature they were hired to study.",
  "Cyborg/Alien: In a bleak sci-fi future, a captive human teaches a emotionless cyborg what it means to feel.",
  "The Prophecy: Destined to destroy each other, two chosen ones decide to defy fate and rule the world together instead.",
  "Mythological Retelling: A passionate, modern reimagining of Medusa and Poseidon, where she is the predator and he is the willing prey.",
  "Dark Academia: Secret societies, forbidden rituals, and a dangerous romance brewing in the shadowy halls of an elite university.",
  "The Escort: Hired for a single weekend event, the fake relationship quickly blurs the lines of professionalism and deeply buried desire."
];

async function seedTropes() {
  console.log('--- Seeding 50 Romantasy Tropes ---');
  
  const formattedTropes = tropes.map(trope => {
    return {
      suggestion_text: JSON.stringify({
        title: trope.split(':')[0],
        description: trope.split(':').slice(1).join(':').trim(),
        category: 'literature'
      }),
      status: 'active'
    };
  });

  const { data, error } = await supabase.from('scenario_suggestions').insert(formattedTropes);

  if (error) {
    console.error('Error seeding tropes:', error.message);
  } else {
    console.log('Successfully seeded 50 romantasy tropes into scenario_suggestions!');
  }
}

seedTropes();
