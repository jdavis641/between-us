import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

if (!openRouterKey || openRouterKey === '[SENSITIVE]') {
  console.error("❌ Missing or placeholder OPENROUTER_API_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: openRouterKey,
});

// =========================================================================
// 1. INTEREST CLUSTERS & TAXONOMY (Derived from Onboarding Preferences)
// =========================================================================
interface InterestCluster {
  name: string;
  focus: string;
  keywords: string[];
}

const INTEREST_CLUSTERS: Record<string, InterestCluster[]> = {
  Sensory: [
    {
      name: "Romantic Intimacy & Emotional Vulnerability",
      focus: "deep emotional connection, tender whispers, skin-on-skin warmth, and unspoken longing",
      keywords: ["romantic_intimacy", "emotional_vulnerability", "slow_burn", "warmth", "whispers", "sensory"]
    },
    {
      name: "Sensual Massage & Aromatic Warmth",
      focus: "warm scented oils, slow gliding hands over sensitive pulse points, kneading tight muscles, and rhythmic caresses",
      keywords: ["massage", "scented_oil", "tactile_touch", "relaxing", "pulse_points", "sensory"]
    },
    {
      name: "Tension Building & Lingering Gazes",
      focus: "unbroken eye contact, agonizingly slow proximity, breathless pauses, and deferred physical gratification",
      keywords: ["tension_building", "eye_contact", "anticipation", "proximity", "slow_tease", "sensory"]
    },
    {
      name: "Sensory Deprivation & Heightened Touch",
      focus: "soft silk blindfold, heightened auditory and tactile sensitivity, delicate feathers, and velvet touches",
      keywords: ["sensory_deprivation", "blindfold", "heightened_senses", "feather_touch", "whispered_guidance", "sensory"]
    },
    {
      name: "Slow Caresses & Synchronized Breathwork",
      focus: "synchronized chest-to-chest breathing, fingertip tracing over collarbones, lips hovering over sensitive skin",
      keywords: ["slow_caresses", "breathwork", "intimate_touch", "gentle_surrender", "skin_friction", "sensory"]
    }
  ],
  Playful: [
    {
      name: "Flirtatious Teasing & Escalating Desire",
      focus: "witty erotic banter, playful denial, tantalizing proximity, and escalating desire with laughter and heat",
      keywords: ["flirtatious_teasing", "edging", "playful_banter", "anticipation", "laughter", "playful"]
    },
    {
      name: "Costume, Cosplay & Altered Personas",
      focus: "alluring masquerade masks, silky costumes, role-reversal, and assuming uninhibited alter-egos",
      keywords: ["costume_play", "cosplay", "masquerade", "persona_shift", "uninhibited_desire", "playful"]
    },
    {
      name: "Toy Play & Temperature Contrasts",
      focus: "sleek intimate toys, ice cube trails melting against flushed skin, contrasting warm breath and vibrating sensations",
      keywords: ["toy_play", "temperature_contrast", "ice_play", "vibration", "sensory_contrast", "playful"]
    },
    {
      name: "Exhibition, Risk & Stolen Thrills",
      focus: "intimate whispers in semi-secluded spaces, the thrill of being almost caught, and stolen touches",
      keywords: ["exhibition", "risk", "public_thrill", "stolen_moments", "adrenaline", "playful"]
    },
    {
      name: "Strip Games & Provocative Dares",
      focus: "escalating rules, revealing garments shed piece by piece, provocative dares, and playful forfeits",
      keywords: ["strip_games", "dares", "forfeits", "playful_competition", "undressing", "playful"]
    }
  ],
  Intense: [
    {
      name: "Restraints & Sensual Bondage",
      focus: "soft silk and leather bindings, wrists pinned or bound, complete physical surrender, and yielding control",
      keywords: ["restraints", "bondage", "yielding_control", "bound_wrists", "helpless_arousal", "intense"]
    },
    {
      name: "Heavy Sensory Overload & Praise",
      focus: "overwhelming continuous touch, breathless overstimulation, murmured vocal praise, and unsparing physical attention",
      keywords: ["sensory_overload", "praise_kink", "overstimulation", "breathless_ecstasy", "vocal_praise", "intense"]
    },
    {
      name: "Power Dynamics & Confident Dominance",
      focus: "authoritative commands, obedient responses, firm grips, commanding gaze, and consensual power exchange",
      keywords: ["power_dynamics", "dominance_submission", "commanding_presence", "obedience", "power_exchange", "intense"]
    },
    {
      name: "Rough Intensity & Visceral Passion",
      focus: "fierce embraces against walls, tangled hair grips, bruised lips, deep friction, and unbridled animal hunger",
      keywords: ["rough_intensity", "wall_pin", "visceral_passion", "deep_friction", "primal_craving", "intense"]
    },
    {
      name: "Group Dynamics & Multi-Partner Tension",
      focus: "shifting alliances, multiple commanding gazes, shared sensations, and heightened voyeuristic/exhibitionist energy",
      keywords: ["group_dynamics", "threesome", "multi_partner", "voyeurism", "shared_passion", "intense"]
    }
  ],
  Extreme: [
    {
      name: "Taboo Exploration & Dark Fantasies",
      focus: "transgressing standard boundaries, unspoken cravings confessed in darkness, and crossing consensual thresholds",
      keywords: ["taboo_exploration", "dark_desires", "forbidden_fantasy", "unspoken_longing", "threshold_crossing", "extreme"]
    },
    {
      name: "Deep Psychological Dominance & Total Surrender",
      focus: "complete psychological and physical yielding, unconditional trust, commanding presence, and absolute erotic ownership",
      keywords: ["psychological_dominance", "total_surrender", "unconditional_trust", "erotic_ownership", "mind_body_yielding", "extreme"]
    },
    {
      name: "Intense Physical Limits & Breath Control",
      focus: "firm neck and jaw hold, controlled breathing, heavy impact, endurance challenges, and pushing sensory edges to climax",
      keywords: ["physical_limits", "breath_control", "endurance", "sensory_edge", "heavy_impact", "extreme"]
    },
    {
      name: "Total Sensory Immersion & Relentless Pacing",
      focus: "no breaks, waves of unrelenting stimulation, overwhelming physiological response, and ecstatic collapse",
      keywords: ["total_immersion", "relentless_pace", "unrelenting_stimulation", "ecstatic_collapse", "primal_release", "extreme"]
    },
    {
      name: "Primal Possessiveness & Sacred Obsession",
      focus: "feral claiming, bite marks, raw vocalizations, overwhelming passion, and indelible emotional and physical union",
      keywords: ["primal_possessiveness", "sacred_obsession", "feral_claim", "unabashed_passion", "indelible_union", "extreme"]
    }
  ]
};

// =========================================================================
// 2. DIVERSE SETTINGS
// =========================================================================
interface Setting {
  name: string;
  desc: string;
  keywords: string[];
}

const SETTINGS: Setting[] = [
  {
    name: "Penthouse terrace overlooking a glittering midnight city skyline",
    desc: "A high-rise luxury penthouse terrace with floor-to-ceiling glass, cool night air, and distant neon reflections",
    keywords: ["penthouse_terrace", "city_skyline", "midnight_luxury", "high_rise"]
  },
  {
    name: "Secluded mountain cabin surrounded by snow and a roaring stone fireplace",
    desc: "An alpine mountain retreat cut off by snow, thick fur rugs before a stone fireplace casting amber embers",
    keywords: ["mountain_cabin", "fireplace", "snowbound", "rustic_warmth"]
  },
  {
    name: "Private yacht anchored in a warm, moonlit Mediterranean cove",
    desc: "A luxury yacht swaying gently on dark Aegean waters, warm sea breezes fluttering linen drapes on the deck",
    keywords: ["private_yacht", "mediterranean_cove", "ocean_breeze", "moonlit_deck"]
  },
  {
    name: "Rain-slicked balcony during a thunderstorm with shadows cast across the floor",
    desc: "A sprawling private balcony slick with summer rain, lightning illuminating flushed skin and rhythmic thunder shaking the glass",
    keywords: ["rain_slicked_balcony", "thunderstorm", "summer_rain", "dramatic_shadows"]
  },
  {
    name: "Luxury dressing room lit with soft amber sconces and antique mirrors",
    desc: "A velvet-lined private dressing chamber with antique bevelled mirrors, gilded sconces, and deep chaise lounges",
    keywords: ["luxury_dressing_room", "velvet_walls", "gilded_mirrors", "amber_lighting"]
  },
  {
    name: "Hidden thermal spa surrounded by mist and warm carved stone",
    desc: "A subterranean private hot spring pool carved into warm dark granite, scented steam rising into candlelight",
    keywords: ["hidden_thermal_spa", "mineral_springs", "carved_stone", "steam_and_candlelight"]
  }
];

// =========================================================================
// 3. PLAY MODES & SPECIFICATIONS
// =========================================================================
interface PlayModeSpec {
  mode: string;
  label: string;
  instruction: string;
  tags: string[];
}

const PLAY_MODES: PlayModeSpec[] = [
  {
    mode: "Solo",
    label: "solo",
    instruction: "First-person intimate exploration and internal monologue. Focus deeply on personal arousal, tactile discovery, solo fantasy, and private emotional release.",
    tags: ["solo", "first_person", "internal_monologue", "self_discovery"]
  },
  {
    mode: "Couple",
    label: "couple",
    instruction: "Dual-perspective, parallel storyline between 2 main partners. Capture mutual desires, mounting friction, reciprocal sensory feedback, and unified climactic release.",
    tags: ["couple", "dual_perspective", "mutual_passion", "partner_intimacy"]
  },
  {
    mode: "Group",
    label: "group",
    instruction: "Multi-character dynamic balancing group tension and encounters. Capture shifting alliances, shared sensations, voyeuristic electricity, and multi-partner physical harmony.",
    tags: ["group", "multi_character", "group_dynamics", "shared_tension"]
  }
];

const TIERS = ['Sensory', 'Playful', 'Intense', 'Extreme'];

// Rate limit helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// =========================================================================
// 4. ROBUST JSON / NARRATIVE EXTRACTOR
// =========================================================================
function cleanAndExtractStory(raw: string): { title: string; body: string; pre_experience_tasks: string[] } {
  // 1. Standard JSON parse attempt
  try {
    const cleaned = raw.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
    const parsed = JSON.parse(cleaned);
    const bodyText = parsed.body || parsed.text || parsed.content || parsed.story || '';
    if (parsed.title && bodyText && String(bodyText).trim().length > 50) {
      return {
        title: String(parsed.title).trim(),
        body: String(bodyText).trim().replace(/\n{4,}/g, '\n\n'),
        pre_experience_tasks: Array.isArray(parsed.pre_experience_tasks) && parsed.pre_experience_tasks.length > 0
          ? parsed.pre_experience_tasks
          : [
              "Dim the room lights and set a warm, ambient glow.",
              "Take several deep breaths to clear outside distractions.",
              "Immerse yourself fully into the opening atmosphere."
            ]
      };
    }
  } catch (e) {}

  // 2. Fallback regex extraction for unterminated JSON string (e.g. cut off by token limit or trailing newlines)
  const titleMatch = raw.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const title = titleMatch ? titleMatch[1].replace(/\\"/g, '"').trim() : "Intimate Novella";

  let body = "";
  const bodyStartMatch = raw.match(/"(?:body|text|content|story)"\s*:\s*"/);
  if (bodyStartMatch && bodyStartMatch.index !== undefined) {
    const startIdx = bodyStartMatch.index + bodyStartMatch[0].length;
    const remainder = raw.slice(startIdx);
    const tasksMarker = remainder.match(/"\s*,\s*"pre_experience_tasks"/);
    if (tasksMarker && tasksMarker.index !== undefined) {
      body = remainder.slice(0, tasksMarker.index);
    } else {
      body = remainder.replace(/"\s*}\s*$/, '').replace(/"\s*$/, '');
    }
    body = body
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\t/g, '\t')
      .replace(/\n{4,}/g, '\n\n')
      .trim();
  }

  // Extract tasks
  const tasksMatch = raw.match(/"pre_experience_tasks"\s*:\s*\[([\s\S]*?)\]/);
  let tasks: string[] = [];
  if (tasksMatch) {
    try {
      tasks = JSON.parse(`[${tasksMatch[1]}]`);
    } catch {
      tasks = tasksMatch[1]
        .split(/",\s*"/)
        .map(t => t.replace(/["\[\]]/g, '').trim())
        .filter(Boolean);
    }
  }
  if (!tasks || tasks.length === 0) {
    tasks = [
      "Dim the room lights and set a warm, ambient glow.",
      "Take several deep breaths together to clear outside distractions.",
      "Immerse yourself fully into the opening atmosphere."
    ];
  }

  if (!body || body.trim().length < 50) {
    throw new Error("Unable to extract valid story narrative body from model response.");
  }

  return { title, body, pre_experience_tasks: tasks };
}

// =========================================================================
// 5. GENERATION ENGINE WITH EXPONENTIAL RETRY
// =========================================================================
async function generateStoryWithRetry(
  tier: string,
  modeSpec: PlayModeSpec,
  cluster: InterestCluster,
  setting: Setting,
  retries = 3
): Promise<{ title: string; body: string; pre_experience_tasks: string[] }> {
  const systemPrompt = `You are a world-class author of adult romance, romantasy, and boundary-pushing fiction writing for consenting adult partners.
Your prose must be visceral, evocative, and hyper-descriptive. You master the slow build of tension, emotional friction, and raw physical passion.
Never use repetitive introductory tropes like speakeasies. Jump directly into immediate character sensory reality.

Intensity Directive: Write visceral, highly explicit, raw, and descriptive prose matching the assigned tier (${tier}). For Intense and Extreme tiers, eliminate euphemisms and describe physical sensations, breath, mechanics, and climax in detail. Forbid repetitive introductory tropes like speakeasies. Jump directly into immediate character sensory reality.

All characters are consenting adults.

Required JSON Structure:
Return EXACTLY a valid JSON object matching this schema:
{
  "title": "A captivating, evocative title",
  "body": "## Chapter 1: [Subtitle]\\n\\n[Detailed narrative prose...]\\n\\n## Chapter 2: [Subtitle]\\n\\n[Detailed escalation prose...]\\n\\n## Chapter 3: [Subtitle]\\n\\n[Detailed climax and release prose...]",
  "pre_experience_tasks": [
    "Task 1: An atmospheric or sensory preparation step...",
    "Task 2: A tactile or mindset preparation step...",
    "Task 3: A connection or focus preparation step..."
  ]
}
Do NOT output trailing empty newlines. Immediately close the JSON object after completing the narrative and tasks.`;

  const userPrompt = `Write an immersive 3-chapter romantic novella according to these exact parameters:
- Tier: ${tier}
- Play Mode: ${modeSpec.mode} (${modeSpec.instruction})
- Setting: ${setting.name} (${setting.desc})
- Core Intimacy Interest & Sensation: ${cluster.name} (${cluster.focus})

Requirements:
1. Deliver rich, granular narrative across the 3 chapters (~800-1,200 words total).
2. Structure with '## Chapter 1: [Subtitle]', '## Chapter 2: [Subtitle]', and '## Chapter 3: [Subtitle]'.
3. Culminate in an explicit, expansive physical and emotional climax appropriate to the ${tier} intensity tier.
4. Include 2-3 immersive pre-experience tasks.`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'sao10k/l3.1-euryale-70b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.85,
        presence_penalty: 0.6,
        frequency_penalty: 0.5,
        max_tokens: 3000,
        extra_body: {
          presence_penalty: 0.6,
          frequency_penalty: 0.5,
          models: [
            'sao10k/l3.1-euryale-70b',
            'cognitivecomputations/dolphin-mistral-24b-venice-edition',
            'neversleep/llama-3.1-lumimaid-70b'
          ]
        }
      } as any);

      const rawContent = response.choices[0]?.message?.content || '{}';
      const extracted = cleanAndExtractStory(rawContent);

      return extracted;
    } catch (err: any) {
      console.warn(`⚠️ [Attempt ${attempt}/${retries}] Generation issue for [${tier} | ${modeSpec.mode}]: ${err.message}`);
      if (attempt === retries) throw err;
      await delay(4000); // 4s backoff before retry
    }
  }

  throw new Error("All retry attempts exhausted.");
}

// =========================================================================
// 6. MAIN SEEDING CONTROLLER
// =========================================================================
async function runInterestSeeding() {
  console.log("==================================================================");
  console.log("🌟 BETWEEN US: Interest-Mapped Literature Library Seeding");
  console.log("🎯 Model: sao10k/l3.1-euryale-70b (OpenRouter)");
  console.log("📦 Target: Supabase public.generated_content");
  console.log("==================================================================\n");

  // Read optional CLI arguments: e.g. --count=2, --tier=Sensory, --force
  const args = process.argv.slice(2);
  let countPerPermutation = 1;
  let targetTierFilter: string | null = null;
  let targetModeFilter: string | null = null;
  const isForce = args.includes('--force');

  for (const arg of args) {
    if (arg.startsWith('--count=')) {
      countPerPermutation = Math.max(1, parseInt(arg.split('=')[1], 10) || 1);
    } else if (arg.startsWith('--tier=')) {
      targetTierFilter = arg.split('=')[1];
    } else if (arg.startsWith('--mode=')) {
      targetModeFilter = arg.split('=')[1];
    }
  }

  // Check already existing ready stories in Supabase so we skip completed permutations unless --force
  const { data: existingRows } = await supabase
    .from('generated_content')
    .select('body')
    .eq('content_type', 'literature')
    .eq('status', 'ready');

  const existingPermutations = new Set<string>();
  if (existingRows) {
    for (const row of existingRows) {
      try {
        const parsed = JSON.parse(row.body);
        if (parsed.tolerance_tier && parsed.play_mode) {
          existingPermutations.add(`${parsed.tolerance_tier.toLowerCase()}_${parsed.play_mode.toLowerCase()}`);
        }
      } catch {}
    }
  }
  console.log(`🔍 Existing seeded permutations in Supabase: [${Array.from(existingPermutations).join(', ') || 'none'}]\n`);

  const activeTiers = targetTierFilter ? [targetTierFilter] : TIERS;
  const activeModes = targetModeFilter ? PLAY_MODES.filter(m => m.mode.toLowerCase() === targetModeFilter.toLowerCase()) : PLAY_MODES;

  const totalStories = activeTiers.length * activeModes.length * countPerPermutation;
  console.log(`📋 Seeding Matrix: ${activeTiers.length} Tiers x ${activeModes.length} Modes x ${countPerPermutation} story/iteration = ${totalStories} Total Target Stories\n`);

  let successCount = 0;
  let failCount = 0;
  let storyIndex = 0;

  for (const tier of activeTiers) {
    const tierClusters = INTEREST_CLUSTERS[tier] || INTEREST_CLUSTERS.Sensory;

    for (let mIdx = 0; mIdx < activeModes.length; mIdx++) {
      const modeSpec = activeModes[mIdx];

      for (let c = 0; c < countPerPermutation; c++) {
        storyIndex++;
        const permKey = `${tier.toLowerCase()}_${modeSpec.label.toLowerCase()}`;

        if (!isForce && countPerPermutation === 1 && existingPermutations.has(permKey)) {
          console.log(`⏩ [${storyIndex}/${totalStories}] Already seeded in Supabase: [${tier} | ${modeSpec.mode}]. Skipping.`);
          successCount++;
          continue;
        }

        // Cycle deterministically through clusters and settings
        const clusterIndex = (mIdx * countPerPermutation + c) % tierClusters.length;
        const cluster = tierClusters[clusterIndex];
        const setting = SETTINGS[(storyIndex - 1) % SETTINGS.length];

        console.log(`------------------------------------------------------------------`);
        console.log(`[${storyIndex}/${totalStories}] Generating Story:`);
        console.log(`  Tier:    ${tier}`);
        console.log(`  Mode:    ${modeSpec.mode}`);
        console.log(`  Cluster: ${cluster.name}`);
        console.log(`  Setting: ${setting.name}`);

        const startTime = Date.now();

        try {
          const generated = await generateStoryWithRetry(tier, modeSpec, cluster, setting);
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          const wordCount = generated.body.split(/\s+/).length;

          // Assemble comprehensive metadata tags
          const metaTags = Array.from(new Set([
            tier.toLowerCase(),
            modeSpec.label,
            ...cluster.keywords,
            ...setting.keywords,
            'literature',
            'seeded_library',
            'high_intensity'
          ]));

          // Assemble structured body JSON matching generated_content expectations
          const structuredPayload = {
            title: generated.title,
            body: generated.body,
            text: generated.body,
            content: generated.body,
            story: generated.body,
            tolerance_tier: tier,
            tier: tier,
            play_mode: modeSpec.label,
            mode: modeSpec.label,
            theme_tags: metaTags.join(', '),
            metaTags: metaTags,
            kink_categories: cluster.keywords,
            pre_experience_tasks: generated.pre_experience_tasks,
            chapter: 3,
            totalChapters: 3,
            status: 'ready'
          };

          // Insert into Supabase generated_content
          const { error: insertErr } = await supabase
            .from('generated_content')
            .insert({
              content_type: 'literature',
              title: generated.title,
              body: JSON.stringify(structuredPayload),
              status: 'ready',
              pre_experience_tasks: generated.pre_experience_tasks,
              user_id: null
            });

          if (insertErr) {
            console.error(`❌ Database insert failed for "${generated.title}":`, insertErr.message);
            failCount++;
          } else {
            console.log(`✅ Inserted into Supabase in ${duration}s:`);
            console.log(`   Title: "${generated.title}" (~${wordCount} words)`);
            console.log(`   Status: ready | Tasks: ${generated.pre_experience_tasks.length}`);
            existingPermutations.add(permKey);
            successCount++;
          }
        } catch (genErr: any) {
          console.error(`❌ Generation pipeline failed:`, genErr.message);
          failCount++;
        }

        // Mandatory 2-second rate-limit throttle between requests
        console.log(`⏳ Throttling for 2000ms (rate-limit safety)...`);
        await delay(2000);
      }
    }
  }

  console.log("\n==================================================================");
  console.log(`🎉 Seeding Complete!`);
  console.log(`   Successful / Ready: ${successCount}`);
  console.log(`   Failed:             ${failCount}`);
  console.log(`   Total:              ${totalStories}`);
  console.log("==================================================================");
}

runInterestSeeding().catch(err => {
  console.error("Fatal error running interest seeding script:", err);
  process.exit(1);
});
