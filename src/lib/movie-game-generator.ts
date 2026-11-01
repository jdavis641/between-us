import OpenAI from 'openai';

export type DrinkingPace = 'light' | 'medium' | 'heavy';

export interface StructuredMovieRules {
  take_1_sip: string[];
  take_2_sips: string[];
  physical_intermission_cues: string[];
}

export interface MovieDrinkingGame {
  id: string;
  title: string;
  description: string;
  category: 'movie';
  intensity: 'Playful';
  drinking_pace?: DrinkingPace;
  content: {
    rules: string[];
    structured_rules?: StructuredMovieRules;
    movie_title?: string;
    drinking_pace?: DrinkingPace;
  };
  created_at?: string;
}

export function normalizeDrinkingPace(pace?: string | null): DrinkingPace {
  const p = (pace || '').toLowerCase().trim();
  if (p === 'light') return 'light';
  if (p === 'heavy') return 'heavy';
  return 'medium';
}

/**
 * Dynamically adapts any drinking game rule text or sip counts based on the active Drinking Pace.
 * - Light: Sips are conservative (1 sip for major triggers, 2 for rare; hydration breaks encouraged).
 * - Medium: Balanced party pace (1 sip for common tropes, 2 for standout moments, finish drink for climaxes).
 * - Heavy: High-frequency escalation (2 sips for common cues, shots/chugs on reveals, heavy penalties).
 */
export function adaptRuleForPace(rule: string, pace: DrinkingPace = 'medium'): string {
  if (!rule) return rule;
  const p = normalizeDrinkingPace(pace);
  if (p === 'medium') return rule;

  if (p === 'light') {
    return rule
      .replace(/take a shot|take\s+\d+\s+shots/gi, 'take 1 conservative sip (or hydration water break)')
      .replace(/take\s+([2-9]|\d{2,})\s+sips/gi, 'take 1 gentle sip')
      .replace(/finish\s+(your|the|remaining)?\s*drink/gi, 'take 2 conservative sips')
      .replace(/chug\s+(your|the|remaining)?\s*drink/gi, 'take 1 gentle sip')
      .replace(/3\s+deep\s+chugs/gi, '1 gentle sip')
      .replace(/double\s+shot/gi, '1 small sip')
      .replace(/penalty\s+shot/gi, 'hydration water sip')
      .replace(/full\s+shot/gi, '1 gentle sip');
  }

  // heavy
  return rule
    .replace(/take\s+1\s+sip/gi, 'take 2 deep sips')
    .replace(/take\s+a\s+sip/gi, 'take 2 deep sips')
    .replace(/take\s+2\s+sips/gi, 'take a full shot or 3 deep chugs')
    .replace(/take\s+a\s+shot/gi, 'take a double shot')
    .replace(/take\s+a\s+mystery\s+shot/gi, 'take a double mystery shot or chug')
    .replace(/gentle\s+sip/gi, 'deep gulp')
    .replace(/conservative\s+sip/gi, 'heavy chug')
    .replace(/pass\s+with\s+a\s+sip/gi, 'down a full shot');
}

/**
 * Curated fallback generator that generates custom-tailored drinking & watch-along rules
 * for any movie title calibrated to the selected drinking pace (light, medium, heavy).
 */
export function getCuratedMovieDrinkingGame(
  movieTitle: string,
  paceInput: DrinkingPace = 'medium'
): MovieDrinkingGame {
  const cleanTitle = (movieTitle || 'Movie Night').trim();
  const lower = cleanTitle.toLowerCase();
  const drinkingPace = normalizeDrinkingPace(paceInput);
  const gameId = `movie-${lower.replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

  let take1Sip: string[] = [];
  let take2Sips: string[] = [];
  let intermissionCues: string[] = [];
  let customDescription = '';

  const paceDescSuffix = drinkingPace === 'light'
    ? ' (Calibrated to Light Drinking: conservative sips & hydration breaks).'
    : drinkingPace === 'heavy'
      ? ' (Calibrated to Heavy Drinking: high-frequency sips, shots, and chugs).'
      : ' (Calibrated to Medium Drinking: balanced party pace).';

  if (lower.includes('50 shades') || lower.includes('fifty shades') || lower.includes('grey')) {
    customDescription = `An intoxicating watch-along drinking game tailored for Fifty Shades. Trace Christian's smoldering commands and Anastasia's glances while navigating playful couple penalties${paceDescSuffix}`;

    if (drinkingPace === 'light') {
      take1Sip = [
        "Christian gives an intense brooding smolder without speaking for over 3 seconds (take 1 small sip or water sip).",
        "Anastasia bites her lip, gasps softly, or nervously tucks hair behind her ear (take 1 small sip).",
        "A billionaire lifestyle flex appears on screen (helicopter, penthouse, Audi, or piano) — take 1 light sip.",
        "An elevator door slides shut with unspoken sexual tension (take 1 sip).",
        "Christian delivers a formal command or mentions 'my rules' (take 1 sip or hydrate)."
      ];
      take2Sips = [
        "The Red Room key turns in the lock or the door swings open (take 2 gentle sips).",
        "Christian and Anastasia negotiate or review the terms of the contract (take 2 gentle sips).",
        "A provocative pop ballad begins playing over an escalating montage (take 2 sips).",
        "An extravagant luxury gift or contract proposal is presented (take 2 sips)."
      ];
      intermissionCues = [
        "Pause at the 30-minute mark: Partner A blindfolds Partner B for 90 seconds while delivering feather-light touch along the neck and collarbones. Hydration check: share a glass of water.",
        "Pause at the 60-minute mark: Partner B sets one playful whisper dare that Partner A must obey for the next 20 minutes.",
        "Pause before the climactic scene: Alternate confessing one secret fantasy. If either hesitates, take 1 small sip and share a kiss."
      ];
    } else if (drinkingPace === 'heavy') {
      take1Sip = [
        "Christian gives an intense brooding smolder (take 2 big sips).",
        "Anastasia bites her lip, gasps softly, or tucks hair (take 2 big sips).",
        "A billionaire lifestyle flex appears on screen (take 2 heavy sips).",
        "An elevator door slides shut with sexual tension (take 2 big sips).",
        "Christian delivers a formal command or mentions 'my rules' (down 2 big sips)."
      ];
      take2Sips = [
        "The Red Room key turns or the door swings open — TAKE A FULL SHOT or 3 deep chugs!",
        "Christian and Anastasia argue or negotiate terms of the contract — take a shot or finish half your drink!",
        "A provocative pop ballad begins playing over a steamy montage — continuous chug for 5 seconds!",
        "Christian drops an unexpected dominant rule or luxury gift — take a shot!"
      ];
      intermissionCues = [
        "Pause at the 30-minute mark: Sensory forfeit dare — Partner B must submit to an intense ice-cube or sensation dare. Any refusal results in taking a full penalty shot!",
        "Pause at the 60-minute mark: Uncompromising command session — partner who drank less commands a physical dare; refusal means finishing your remaining drink!",
        "Climax Intermission: Alternate confessing your most forbidden kink. Refuse or stall over 3 seconds = take a shot and surrender to a physical dare."
      ];
    } else {
      // medium (standard)
      take1Sip = [
        "Christian gives an intense, brooding smolder without saying a word for over 3 seconds.",
        "Anastasia bites her lip, gasps softly, or nervously tucks hair behind her ear.",
        "A billionaire lifestyle flex appears on screen (private helicopter, Seattle penthouse skyline, Audi, or grand piano).",
        "An elevator door slides shut with palpable, unspoken sexual tension.",
        "Christian delivers a formal, authoritative command or mentions 'my rules'."
      ];
      take2Sips = [
        "The Red Room key turns in the lock or the door slowly swings open.",
        "Christian and Anastasia negotiate, review, or debate the terms of the nondisclosure/contract.",
        "A provocative, breathy pop ballad begins playing over an escalating romantic montage.",
        "An unexpected luxury gift or extravagant contract proposal is presented."
      ];
      intermissionCues = [
        "Pause at the 30-minute mark: Partner A blindfolds Partner B for 90 seconds while delivering feather-light sensory touch along the neck and collarbones. Partner B must guess which object or touch was used.",
        "Pause at the 60-minute mark: Partner B sets one playful rule or whisper dare that Partner A must obey for the next 20 minutes of the film.",
        "Pause before the climactic scene: Alternate confessing one secret fantasy you've never shared. If either partner hesitates for more than 5 seconds, take 2 sips and surrender to a kiss."
      ];
    }
  } else if (lower.includes('odyssey') || lower.includes('iliad') || lower.includes('troy') || lower.includes('greek')) {
    customDescription = `An epic mythical watch-along drinking game for The Odyssey. Journey through sirens, monsters, and divine wrath with heroic sips and couple dares${paceDescSuffix}`;

    if (drinkingPace === 'light') {
      take1Sip = [
        "Odysseus boasts about Ithaca or his cunning intellect (take 1 small sip or water sip).",
        "A mythical monster, siren, or obstacle appears on screen (take 1 gentle sip).",
        "An offering of dark wine or feast is poured on screen (take 1 sip).",
        "A crew member makes a questionable decision (take 1 gentle sip)."
      ];
      take2Sips = [
        "Athena, Zeus, or Poseidon dramatically intervenes from Olympus (take 2 small sips).",
        "Odysseus reveals his true identity from beneath a traveler's disguise (take 2 sips).",
        "The cinematic score swells with heroic choral chanting (take 2 sips)."
      ];
      intermissionCues = [
        "Siren Song Intermission: Pause film. Partner A whispers a tempting secret into Partner B's ear; Partner B must maintain eye contact without smiling for 45 seconds.",
        "Olympian Decree Intermission: Pause film. Hydration break together, followed by the partner who drank fewer sips requesting a 2-minute foot or neck massage."
      ];
    } else if (drinkingPace === 'heavy') {
      take1Sip = [
        "Odysseus boasts about his intellect or Ithaca (take 2 big sips).",
        "A mythical creature or sea beast attacks (take 2 deep sips).",
        "Wine or an offering to the gods is poured (clink glasses and take 2 sips).",
        "A crew member disobeys Odysseus (take 2 big sips)."
      ];
      take2Sips = [
        "A god dramatically intervenes with thunder or wrath — TAKE A FULL SHOT!",
        "Odysseus fights the Cyclops or executes an epic battle — finish half your drink!",
        "A disguise is revealed or heroic confrontation peaks — take 3 deep chugs or a shot!"
      ];
      intermissionCues = [
        "Siren Forfeit Intermission: Pause film. Partner A gives an erotic sensation dare to Partner B. Any flinch or refusal means taking a full penalty shot!",
        "Olympian Surrender Intermission: Pause film. The partner who drank less commands absolute physical obedience for 3 minutes; refusal penalty is finishing your drink."
      ];
    } else {
      // medium
      take1Sip = [
        "Odysseus boasts about his legendary cunning intellect, bravery, or his beloved Ithaca.",
        "A mythical creature, sea monster, or monstrous obstacle blocks the crew's voyage.",
        "An offering of dark wine, a sacrificial banquet, or a plea to Olympus is poured on screen.",
        "A crew member makes a questionable decision or disregards Odysseus's explicit warnings.",
        "A wave crashes dramatically over the wooden bow in slow motion."
      ];
      take2Sips = [
        "Athena, Zeus, or Poseidon dramatically intervenes from the heavens with thunder or visions.",
        "Odysseus reveals his true identity from beneath a ragged traveler's disguise.",
        "A hero gives a grand theatrical speech about honor, mortality, and destiny before combat.",
        "The cinematic score swells with choral chanting or ominous brass instruments."
      ];
      intermissionCues = [
        "Siren Song Intermission: Pause the film. Partner A must hum or whisper a tempting dare into Partner B's ear; Partner B must maintain eye contact without laughing or flinching for 60 seconds.",
        "Olympian Decree Intermission: Pause the film. The partner who has taken fewer sips is crowned the Olympian Ruler and assigns a playful physical massage or dare challenge to the mortal partner.",
        "The Journey Home Intermission: Pause the film before the finale. Take turns naming 3 things you love about each other's touch, sealing each with a lingering sip and embrace."
      ];
    }
  } else {
    // Dynamic cinematic trope engine for any title calibrated to pace
    customDescription = `A custom-crafted couple's watch-along drinking game for "${cleanTitle}". Features film-specific trope sips, cinematic milestone drinks, and playful physical intermission cues${paceDescSuffix}`;

    if (drinkingPace === 'light') {
      take1Sip = [
        `A signature catchphrase, dramatic sigh, or intense gaze happens in "${cleanTitle}" (take 1 small sip or water sip).`,
        `A classic cinematic trope occurs (slow motion, phone call, or mirror gaze) — take 1 gentle sip.`,
        `A character takes a drink, lights a cigarette, or sits at a bar (take 1 sip).`,
        `Romantic tension or lingering eye contact lasts for over 3 seconds (take 1 small sip).`
      ];
      take2Sips = [
        `A pivotal cinematic moment, first kiss, or confrontation takes place (take 2 gentle sips).`,
        `The soundtrack hits a high-emotion romantic or orchestral crescendo (take 2 sips).`,
        `A high-stakes gamble or dramatic confession is made (take 2 sips).`
      ];
      intermissionCues = [
        `Hydration & Touch Intermission: Pause the film. Drink a glass of water together, then Partner A gives Partner B a gentle 2-minute shoulder massage.`,
        `Whisper Dare Intermission: Pause during the highest drama beat. Alternate whispering one sweet or spicy secret in your partner's ear.`
      ];
    } else if (drinkingPace === 'heavy') {
      take1Sip = [
        `A signature catchphrase, dramatic sigh, or intense gaze happens in "${cleanTitle}" (take 2 heavy sips).`,
        `A classic cinematic trope occurs (slow motion, mirror gaze, or phone call) — take 2 deep sips.`,
        `A character takes a drink on screen — drink along with 2 full sips!`,
        `Romantic tension or eye contact lingers between two characters (take 2 heavy sips).`
      ];
      take2Sips = [
        `A pivotal cinematic moment, first kiss, or explosive confrontation takes place — TAKE A SHOT!`,
        `The soundtrack hits a high-emotion crescendo — chug for 3 seconds!`,
        `An iconic one-liner or climactic turning point occurs — take a full shot or finish half your glass!`,
        `A high-stakes gamble or dramatic confession is made — both partners take 3 deep gulps.`
      ];
      intermissionCues = [
        `Heavy Stakes Intermission: Pause film. Alternate giving an escalating sensual dare. Refusal penalty is taking a full shot and losing control of the next pause!`,
        `Climax Finish: At the highest drama climax, both partners clink glasses and finish their entire drink before resuming the film.`
      ];
    } else {
      // medium
      take1Sip = [
        `A signature catchphrase, dramatic sigh, or intense gaze happens on screen in "${cleanTitle}".`,
        `A classic cinematic trope occurs (dramatic slow motion, mirror reflection, or phone call).`,
        `A character takes a drink, lights a cigarette, or pours a glass on screen.`,
        `Romantic tension or lingering eye contact lingers between two characters for over 3 seconds.`,
        `A sudden plot twist or unexpected character entry changes the mood of the scene.`
      ];
      take2Sips = [
        `A pivotal cinematic moment, first kiss, or explosive confrontation takes place.`,
        `The soundtrack hits a high-emotion orchestral or romantic crescendo.`,
        `An iconic one-liner or climactic turning point occurs in the story.`,
        `A high-stakes gamble or dramatic confession of feelings is made.`
      ];
      intermissionCues = [
        `Halfway Mark Intermission: Pause the film. Partner A closes their eyes while Partner B uses 3 different speeds of touch (feather-light, firm massage, warm breath) along their arms and shoulders.`,
        `Tension Climax Intermission: Pause during the highest drama scene. Alternate sharing one playful truth or dare. Whichever partner refuses must take 2 sips and submit to a 60-second sensory challenge.`,
        `Closing Credits Intermission: When the credits roll, clink glasses, finish your remaining drink together, and let the non-choosing partner pick tonight's next intimate activity.`
      ];
    }
  }

  const flattenedRules: string[] = [
    ...take1Sip.map(r => `🍺 Take 1 Sip: ${r}`),
    ...take2Sips.map(r => `🍻 Take 2 Sips: ${r}`),
    ...intermissionCues.map(r => `⏸️ Physical Intermission Cue: ${r}`)
  ];

  return {
    id: gameId,
    title: `${cleanTitle}: The Watch-Along Drinking Game`,
    description: customDescription,
    category: 'movie',
    intensity: 'Playful',
    drinking_pace: drinkingPace,
    content: {
      movie_title: cleanTitle,
      drinking_pace: drinkingPace,
      rules: flattenedRules,
      structured_rules: {
        take_1_sip: take1Sip,
        take_2_sips: take2Sips,
        physical_intermission_cues: intermissionCues
      }
    },
    created_at: new Date().toISOString()
  };
}

/**
 * Generate a dynamic couples watch-along movie drinking game using OpenRouter LLM,
 * calibrated strictly to the requested drinking pace (light, medium, heavy).
 */
export async function generateMovieDrinkingGame(
  movieTitle: string,
  paceInput: DrinkingPace = 'medium'
): Promise<MovieDrinkingGame> {
  const cleanTitle = (movieTitle || '').trim();
  const drinkingPace = normalizeDrinkingPace(paceInput);

  if (!cleanTitle) {
    return getCuratedMovieDrinkingGame('Movie Night', drinkingPace);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    console.warn('[MovieGameGenerator] No OPENROUTER_API_KEY present; using curated engine.');
    return getCuratedMovieDrinkingGame(cleanTitle, drinkingPace);
  }

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://between-us.app',
        'X-Title': 'Between Us Movie Drinking Game Generator'
      }
    });

    const paceDirectives = {
      light: `SELECTED DRINKING PACE: LIGHT DRINKING (Conservative Pace)
- Frequency & Volume: Sips must be conservative and restrained (1 sip for major triggers, 2 sips for rare moments). Explicitly suggest non-alcoholic sips, water, or hydration breaks between rounds.
- Focus: Focus more on physical cues, eye contact, and sensory touch rituals rather than heavy drinking.`,
      medium: `SELECTED DRINKING PACE: MEDIUM DRINKING (Balanced Party Pace)
- Frequency & Volume: Balanced party watch-along pace (1 sip for common tropes, 2 sips for standout moments, finish drink for critical plot climaxes).
- Balance: Seamless balance between fun drinking triggers and alternating physical touch dares.`,
      heavy: `SELECTED DRINKING PACE: HEAVY DRINKING (High-Frequency Escalation)
- Frequency & Volume: High-frequency escalation (frequent 1-2 sip cues, shots or chugs on dramatic reveals, heavy penalties for skipped questions/dares).
- Penalties: Aggressive drinking triggers and shot/chug consequences on refusal or hesitation.`
    };

    const systemPrompt = `You are a master party game architect and cinema aficionado specializing in couple's watch-along drinking games.
Generate an interactive couple's watch-along drinking game for the movie '${cleanTitle}'.

${paceDirectives[drinkingPace]}

CRITICAL DIRECTIVE ON DRINKING PACE:
Calibrate the drinking volume strictly to the selected pace: '${drinkingPace}'.
- If Light: Focus more on physical cues and occasional single sips. Suggest hydration breaks.
- If Medium: Standard watch-along sips for tropes and alternating physical dares.
- If Heavy: Aggressive drinking triggers, shots/finish-the-drink consequences, and high-frequency cues.

Structure rules into three distinct tiers:
1. Take 1 Sip (frequent tropes/cues): 4-5 recurring cinematic tropes, dialogue quirks, character mannerisms, or subtle romantic/visual cues tailored specifically to '${cleanTitle}' calibrated to '${drinkingPace}' pace.
2. Take 2 Sips (major cinematic moments): 3-4 pivotal scenes, iconic high-impact lines, dramatic twists, or passionate moments in '${cleanTitle}' calibrated to '${drinkingPace}' pace (or shots/chugs if heavy).
3. Physical Intermission Cues: 2-3 specific moments (or scene cues) to pause the film for alternating truth/dare/sensation touch challenges between the couple.

OUTPUT FORMAT REQUIREMENTS:
You MUST return a valid JSON object matching this schema exactly:
{
  "title": "${cleanTitle}: The Watch-Along Drinking Game",
  "description": "A tailored couple's watch-along drinking game for ${cleanTitle} featuring trope sips and spicy intermission touch dares (${drinkingPace} pace).",
  "category": "movie",
  "intensity": "Playful",
  "drinking_pace": "${drinkingPace}",
  "content": {
    "drinking_pace": "${drinkingPace}",
    "rules": [
      "🍺 Take 1 Sip: [specific trope 1 for ${cleanTitle}]",
      "🍺 Take 1 Sip: [specific trope 2 for ${cleanTitle}]",
      "🍻 Take 2 Sips: [major moment 1 for ${cleanTitle}]",
      "🍻 Take 2 Sips: [major moment 2 for ${cleanTitle}]",
      "⏸️ Physical Intermission Cue: [pause film cue 1 for touch/dare challenge]"
    ],
    "structured_rules": {
      "take_1_sip": [
        "Take 1 Sip whenever...",
        "Take 1 Sip every time..."
      ],
      "take_2_sips": [
        "Take 2 Sips when...",
        "Take 2 Sips if..."
      ],
      "physical_intermission_cues": [
        "Pause the film when... to complete an alternating sensation touch challenge..."
      ]
    }
  }
}
Never include markdown backticks or commentary outside of the JSON object. Output strictly valid JSON.`;

    const userPrompt = `Generate an interactive couple's watch-along drinking game for the movie '${cleanTitle}' with drinking pace '${drinkingPace}'.
Calibrate the drinking volume strictly to the selected pace: ${drinkingPace}.
- If Light: Focus more on physical cues and occasional single sips.
- If Medium: Standard watch-along sips for tropes and alternating physical dares.
- If Heavy: Aggressive drinking triggers, shots/finish-the-drink consequences, and high-frequency cues.
Structure rules into:
1. Take 1 Sip (frequent tropes/cues)
2. Take 2 Sips (major cinematic moments)
3. Physical Intermission Cues (pause film for alternating truth/dare/sensation touch challenges).`;

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 25000);

    const completion = await openai.chat.completions.create({
      model: "sao10k/l3.1-euryale-70b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
      extra_body: {
        models: [
          "sao10k/l3.1-euryale-70b",
          "cognitivecomputations/dolphin-mistral-24b-venice-edition",
          "neversleep/llama-3.1-lumimaid-70b",
          "meta-llama/llama-3.3-70b-instruct"
        ]
      }
    } as any, { signal: abortController.signal });

    clearTimeout(timeoutId);

    const rawContent = completion.choices[0]?.message?.content || "";
    const cleaned = rawContent.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const rules: string[] = Array.isArray(parsed?.content?.rules)
      ? parsed.content.rules
      : Array.isArray(parsed?.rules)
        ? parsed.rules
        : [];

    const structuredRules: StructuredMovieRules = {
      take_1_sip: Array.isArray(parsed?.content?.structured_rules?.take_1_sip)
        ? parsed.content.structured_rules.take_1_sip
        : rules.filter((r: string) => r.toLowerCase().includes('1 sip') || r.includes('🍺')).map((r: string) => r.replace(/^🍺?\s*Take 1 Sip:\s*/i, '')),
      take_2_sips: Array.isArray(parsed?.content?.structured_rules?.take_2_sips)
        ? parsed.content.structured_rules.take_2_sips
        : rules.filter((r: string) => r.toLowerCase().includes('2 sip') || r.includes('🍻')).map((r: string) => r.replace(/^🍻?\s*Take 2 Sips:\s*/i, '')),
      physical_intermission_cues: Array.isArray(parsed?.content?.structured_rules?.physical_intermission_cues)
        ? parsed.content.structured_rules.physical_intermission_cues
        : rules.filter((r: string) => r.toLowerCase().includes('intermission') || r.includes('⏸️')).map((r: string) => r.replace(/^⏸️?\s*Physical Intermission Cue:\s*/i, ''))
    };

    const fallback = getCuratedMovieDrinkingGame(cleanTitle, drinkingPace);
    const finalTake1 = structuredRules.take_1_sip.length > 0 ? structuredRules.take_1_sip : fallback.content.structured_rules!.take_1_sip;
    const finalTake2 = structuredRules.take_2_sips.length > 0 ? structuredRules.take_2_sips : fallback.content.structured_rules!.take_2_sips;
    const finalIntermissions = structuredRules.physical_intermission_cues.length > 0 ? structuredRules.physical_intermission_cues : fallback.content.structured_rules!.physical_intermission_cues;

    const consolidatedRules: string[] = rules.length >= 5 ? rules : [
      ...finalTake1.map(r => `🍺 Take 1 Sip: ${r}`),
      ...finalTake2.map(r => `🍻 Take 2 Sips: ${r}`),
      ...finalIntermissions.map(r => `⏸️ Physical Intermission Cue: ${r}`)
    ];

    const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return {
      id: `movie-${slug}-${Date.now().toString(36)}`,
      title: parsed?.title || `${cleanTitle}: The Watch-Along Drinking Game`,
      description: parsed?.description || fallback.description,
      category: 'movie',
      intensity: 'Playful',
      drinking_pace: drinkingPace,
      content: {
        movie_title: cleanTitle,
        drinking_pace: drinkingPace,
        rules: consolidatedRules,
        structured_rules: {
          take_1_sip: finalTake1,
          take_2_sips: finalTake2,
          physical_intermission_cues: finalIntermissions
        }
      },
      created_at: new Date().toISOString()
    };
  } catch (err) {
    console.warn('[MovieGameGenerator] OpenRouter generation failed, falling back to curated engine:', err);
    return getCuratedMovieDrinkingGame(cleanTitle, drinkingPace);
  }
}
