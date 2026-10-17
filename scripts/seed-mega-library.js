const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. INTIMACY TAXONOMY & KEYWORD TAG GENERATOR
// ==========================================
const INTIMACY_TAXONOMY = {
  Sensory: [
    'sensory', 'tactile', 'slow_burn', 'massage', 'breathwork', 'feather_touch',
    'emotional_intimacy', 'vulnerability', 'body_worship', 'candle_light', 'scent',
    'whispers', 'pulse_points', 'eye_contact', 'temperature_warmth', 'grounding'
  ],
  Playful: [
    'playful', 'flirting', 'teasing', 'edging_light', 'strip_challenge', 'lingerie',
    'ice_contrast', 'tickling', 'blindfold_light', 'lap_friction', 'spanking_light',
    'public_thrill', 'secret_whispers', 'oral_tease', 'dares', 'unbuttoning'
  ],
  Intense: [
    'intense', 'power_dynamics', 'dominance', 'submission', 'impact_play', 'strict_control',
    'restraints', 'edge_play', 'sensory_deprivation', 'orgasm_denial', 'praise_kink',
    'breath_control', 'taboo_desire', 'collar_grip', 'wall_pin', 'obedience'
  ],
  Extreme: [
    'extreme', 'total_surrender', 'unconditional_obedience', 'heavy_restraints',
    'sensory_overload', 'deep_taboo', 'primal_urge', 'endurance_challenge',
    'complete_domination', 'erotic_ache', 'unyielding_pace', 'ritual_intimacy'
  ]
};

const SETTINGS = [
  { place: "Rain-Drenched Glass Penthouse", ambiance: "flickering city lights reflected against rain-slicked floor-to-ceiling windows", mood: "luxurious solitude" },
  { place: "Secluded Alpine Cabin", ambiance: "a roaring stone fireplace casting embers across heavy fur rugs", mood: "rustic warmth" },
  { place: "Secret Velvet Speakeasy", ambiance: "deep leather booths, dim amber sconces, and jazz lingering in the air", mood: "nocturnal intrigue" },
  { place: "Mediterranean Clifftop Villa", ambiance: "warm salty sea breeze billowing sheer linen curtains", mood: "sun-warmed desire" },
  { place: "Private Antiquarian Library", ambiance: "towering mahogany shelves, scent of old parchment, and locked oak doors", mood: "quiet intellectual taboo" },
  { place: "Underground Marble Bathhouse", ambiance: "drifting steam, echoing mineral waters, and warm carved stone", mood: "sensory immersion" },
  { place: "Midnight Modernist Loft", ambiance: "minimalist concrete, ambient deep red uplighting, and heavy velvet drapes", mood: "architectural eroticism" },
  { place: "Desert Oasis Sanctuary", ambiance: "starlit desert skies, cooling sandstone patio, and scented jasmine oils", mood: "limitless expanse" },
  { place: "Historic Parisian Apartment", ambiance: "ornate gilded mirrors, creaking hardwood, and sheer balcony curtains", mood: "bohemian romance" },
  { place: "Private Yacht Cabin", ambiance: "rhythmic ocean swells gently rocking the cabin beneath moonlit waters", mood: "isolated surrender" }
];

const TROPES = [
  { name: "Enemies to Unspoken Surrender", tension: "years of intellectual friction dissolving into visceral physical hunger" },
  { name: "The Forbidden Arrangement", tension: "strict rules and boundaries that were never meant to be crossed" },
  { name: "Reigniting the Embers", tension: "long-term familiarity colliding with rediscovered, urgent novelty" },
  { name: "Total Power Exchange", tension: "one partner yielding all control while the other commands every breath" },
  { name: "Strangers at the Hotel Bar", tension: "no names, no past, only the electric charge of anonymous attraction" },
  { name: "The Slow Deliberate Tease", tension: "hours of agonizing proximity where touching was strictly forbidden" },
  { name: "Shared Confession in the Dark", tension: "whispering vulnerabilities that strip away every lingering defense" },
  { name: "The Bodyguard's Claim", tension: "duty, vigilance, and fierce protective possessiveness turning intimate" },
  { name: "The Midnight Wager", tension: "a playful game with escalating stakes that neither player wants to lose" },
  { name: "Sensory Deprivation Protocol", tension: "eyes blinded, ears attuned only to whispers and the rustle of sheets" }
];

// ==========================================
// 2. GENERATE 500 FULL STORIES
// ==========================================
function generateStory(index) {
  const tierKeys = ['Sensory', 'Playful', 'Intense', 'Extreme'];
  const tier = tierKeys[index % tierKeys.length];
  const modeKeys = ['couple', 'solo', 'group'];
  const mode = modeKeys[index % modeKeys.length];
  
  const setting = SETTINGS[index % SETTINGS.length];
  const trope = TROPES[Math.floor(index / 5) % TROPES.length];
  const tags = INTIMACY_TAXONOMY[tier];
  
  const selectedTags = [
    tier.toLowerCase(),
    mode,
    ...tags.slice((index * 3) % tags.length, ((index * 3) % tags.length) + 4)
  ];

  const titlePrefixes = ["Whispers in", "The Architecture of", "A Study in", "Surrender at", "Echoes of", "Temptation in", "The Anatomy of", "Descent into"];
  const title = `${titlePrefixes[index % titlePrefixes.length]} ${setting.place} #${index + 1}`;

  const storyText = `## Chapter 1: The Prelude & Anticipation

The atmosphere inside the ${setting.place.toLowerCase()} was thick with ${setting.mood}. Outside, ${setting.ambiance}, setting a stage where every heartbeat echoed with unmistakable intention. 

This was a dance of ${trope.name.toLowerCase()}—${trope.tension}. There were no hurried words, only the steady, deliberate awareness of proximity. Every breath drawn felt like an admission, every shifting shadow across the room heightening the anticipation of what was about to unfold.

## Chapter 2: The Physical Escalation

When the first touch finally occurred, the contrast was staggering. Fingers traced along sensitive nerve endings with agonizing slowness, testing boundaries and eliciting soft, involuntary shivers. 

Clothing became an unnecessary barrier, shed slowly with reverent attention to exposed skin. The rhythm oscillated between tender exploration and urgent, breathless hunger. Whispered desires filled the quiet space, breaking through lingering hesitation until only the pure, electric friction of skin on skin remained.

## Chapter 3: The Climax & Sacred Release

All restraint shattered in a crescendo of mutual surrender. The movement became deep, synchronized, and consuming—a culmination of built tension that left no room for doubt or hesitation. 

In the final, breathtaking moments of release, time seemed to suspend completely. Breathing hitched, bodies arched against each other in an ecstatic, all-consuming climax that echoed into the silent room. Tangled in the aftermath, the lingering warmth and heavy peace spoke volumes of a hunger thoroughly, beautifully satisfied.`;

  const structuredPayload = {
    title,
    body: storyText,
    text: storyText,
    content: storyText,
    story: storyText,
    tolerance_tier: tier,
    play_mode: mode,
    theme_tags: selectedTags.join(', '),
    metaTags: selectedTags,
    tier,
    mode
  };

  return {
    title,
    body: JSON.stringify(structuredPayload),
    content_type: 'literature',
    status: 'active',
    user_id: null
  };
}

// ==========================================
// 3. GENERATE 500 FULL ROLEPLAY SCENARIOS
// ==========================================
function generateRoleplay(index) {
  const tierKeys = ['Sensory', 'Playful', 'Intense', 'Extreme'];
  const tier = tierKeys[index % tierKeys.length];
  const mode = index % 5 === 0 ? 'group' : 'couple';
  
  const setting = SETTINGS[(index + 3) % SETTINGS.length];
  const trope = TROPES[(index + 7) % TROPES.length];
  const tags = INTIMACY_TAXONOMY[tier];
  
  const selectedTags = [
    'roleplay',
    tier.toLowerCase(),
    mode,
    'dual_lens',
    'scripted',
    ...tags.slice((index * 2) % tags.length, ((index * 2) % tags.length) + 4)
  ];

  const title = `Roleplay: ${trope.name} in ${setting.place} #${index + 1}`;

  const storyboard = `The scene takes place in a ${setting.place.toLowerCase()}, characterized by ${setting.ambiance}. Partners enter the space exploring ${trope.name.toLowerCase()}, leaning into ${trope.tension}. The objective is to build escalating tension through scripted cues and distinct internal perspectives before reaching a passionate, boundary-affirming climax.`;

  const partnerAPerspective = `You hold the initiative in setting the pace. Your partner is receptive, watchful, and yearning for your undivided guidance. Do not rush the physical contact; use slow, deliberate commands and lingering eye contact to build tension. Your inner desire is to feel completely in tune with their physical reactions while asserting confident presence.`;

  const partnerBPerspective = `Allow yourself to let go of daily responsibilities and sink completely into the sensory experience. Focus on your breathing and the physical warmth of your partner. Your inner desire is to be observed, desired, and guided into surrender without feeling the pressure to dictate what happens next.`;

  const fullScript = `Partner A: "Look at me. Leave everything else from today outside this room."
Partner B: "I've been thinking about this all day. What do you want me to do?"
Partner A: "Take a slow breath. Stand completely still while I decide where to touch you first."
Partner B: "You're taking all the time in the world, aren't you?"
Partner A: "Every single second. Close your eyes and don't open them until I give you permission."
Partner B: "My heart is already racing."
Partner A: "Good. That means your body knows exactly who you belong to tonight."`;

  const preExperienceTasks = [
    "Dim the lighting to a warm, candlelit glow.",
    "Place all phones and notifications in another room.",
    "Pour a favorite beverage and take three synchronized deep breaths together.",
    "Establish the active safe-word or check-in signal before stepping into character."
  ];

  const structuredPayload = {
    title,
    overview: storyboard,
    storyboard,
    partnerA: {
      name: "Partner A",
      perspective: partnerAPerspective
    },
    partnerB: {
      name: "Partner B",
      perspective: partnerBPerspective
    },
    partnerAPerspective,
    partnerBPerspective,
    fullScript,
    tasks: preExperienceTasks,
    preExperienceTasks,
    tolerance_tier: tier,
    play_mode: mode,
    theme_tags: selectedTags.join(', '),
    metaTags: selectedTags,
    tier,
    mode
  };

  return {
    title,
    body: JSON.stringify(structuredPayload),
    content_type: 'roleplay',
    pre_experience_tasks: preExperienceTasks,
    status: 'active',
    user_id: null
  };
}

// ==========================================
// 4. MAIN SEEDING RUNNER (BATCHED INSERTS)
// ==========================================
async function runMegaSeed() {
  console.log("=== STARTING MEGA-SEED TO SUPABASE LIBRARY ===");

  // Batch insert 500 stories in chunks of 50
  console.log("\n--- Seeding 500 Erotic Stories ---");
  const storyBatchSize = 50;
  for (let i = 0; i < 500; i += storyBatchSize) {
    const batch = [];
    for (let j = i; j < i + storyBatchSize && j < 500; j++) {
      batch.push(generateStory(j));
    }
    const { error } = await supabase.from('generated_content').insert(batch);
    if (error) {
      console.error(`Error inserting story batch ${i}-${i + storyBatchSize}:`, error.message);
    } else {
      console.log(`Inserted stories ${i + 1} to ${Math.min(i + storyBatchSize, 500)}`);
    }
  }

  // Batch insert 500 roleplay scenarios in chunks of 50
  console.log("\n--- Seeding 500 Roleplay Scenarios with A/B Lenses & Scripts ---");
  const rpBatchSize = 50;
  for (let i = 0; i < 500; i += rpBatchSize) {
    const batch = [];
    for (let j = i; j < i + rpBatchSize && j < 500; j++) {
      batch.push(generateRoleplay(j));
    }
    const { error } = await supabase.from('generated_content').insert(batch);
    if (error) {
      console.error(`Error inserting roleplay batch ${i}-${i + rpBatchSize}:`, error.message);
    } else {
      console.log(`Inserted roleplays ${i + 1} to ${Math.min(i + rpBatchSize, 500)}`);
    }
  }

  // Verify total count in database
  const { count: finalCount } = await supabase
    .from('generated_content')
    .select('*', { count: 'exact', head: true });
    
  console.log(`\n=== SEEDING COMPLETE! Total items in generated_content: ${finalCount} ===`);
}

runMegaSeed().catch(err => {
  console.error("Mega-seed error:", err);
  process.exit(1);
});
