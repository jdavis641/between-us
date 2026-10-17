const fs = require('fs');
const path = require('path');

// Seed foundations
const sensoryActionThemes = [
  { prefix: "Give a", times: ["2-minute", "3-minute", "4-minute", "5-minute"], targets: ["blindfolded hand massage", "slow temple and jawline massage", "scalp and nape massage", "warm foot and arch massage", "rhythmic shoulder kneading", "gentle palm and finger rub", "low-back soothing massage", "earlobe and neck feather rub"] },
  { prefix: "Trace your partner's", targets: ["spine using only your fingertips", "collarbone with feather-light thumb strokes", "jawline with the back of your hand", "ribcage with slow, synchronized breaths", "inner wrists and forearms with feather kisses", "hip bones with slow circular motions", "lips with your thumb before pressing a soft kiss", "throat and pulse point with deliberate tenderness"] },
  { prefix: "Maintain eye contact for", times: ["60 seconds", "90 seconds", "2 minutes"], suffix: ["while lightly stroking their neck", "while holding both of their hands over your chest", "in complete silence with your foreheads touching", "while synchronizing your deep breaths", "while tracing the contour of their face with one finger", "without blinking or speaking a single word"] },
  { prefix: "Gently whisper", items: ["three sensory details you adore about their body against their ear", "what their skin smells like to you right now", "the first time you were overwhelmed by their beauty", "how your body reacts when they touch your chest", "a secret romantic memory you cherish of the two of you"] },
  { prefix: "Use a", items: ["silk cloth or satin scarf to glide across their bare shoulders and chest", "drop of warm massage oil to knead their neck in rhythmic silence", "soft fabric to blindfold your partner while you gently brush their arms", "slow feather touch from their collarbone down to their navel", "warm breath trail down the curve of their neck without touching skin"] }
];

const sensoryStarterThemes = [
  "What is a non-physical trait of mine that turns you on?",
  "Describe your favorite memory of us in bed.",
  "Which of your five senses feels most heightened right now when we are close?",
  "What is a gentle touch from me that always sends shivers down your spine?",
  "When did you first realize that being physically close to me felt intoxicating?",
  "If you could pick one place in the room for us to lie together undisturbed for an hour, where would it be?",
  "What scent, sound, or ambient cue instantly puts you in a receptive, sensual headspace?",
  "How does my breathing change when I get turned on, and have you noticed the shift?",
  "What part of your body feels most neglected today that craves my warm touch?",
  "Describe the exact rhythm of touch you prefer when you want to unwind and feel completely safe.",
  "What thought crossed your mind the last time you watched me undress or get ready?",
  "What is a subtle gesture or look between us in company that makes you blush inside?",
  "If you had to describe our sexual energy in three poetic words, what would they be?",
  "What is one slow, tender thing we haven't done in a while that you miss experiencing together?",
  "How would you describe the feeling of my skin against yours to someone who has never felt it?",
  "What temperature do you feel most aroused in—cool air against bare skin, or deep radiating heat?",
  "What is a quiet sound I make during intimacy that drives you wild?",
  "If we stayed up all night just talking and touching in the dark, what secret would you want to whisper?"
];

const playfulActionThemes = [
  "Remove one article of your partner's clothing using only your teeth",
  "Kiss your partner's inner thigh but do not go higher for 2 minutes",
  "Pin your partner's wrists above their head for 60 seconds while kissing them.",
  "Nibble gently on their lower lip, then pull back and make them beg for the next kiss.",
  "Whisper a filthy secret into their ear, but forbid them from reacting or touching you for 1 minute.",
  "Straddle your partner's lap and rock slowly while teasing them with feather kisses.",
  "Trace a word on your partner's bare stomach with your tongue; they must guess what it is.",
  "Give your partner 5 quick, firm spanks or swats on the backside, then kiss the warmed skin.",
  "Hold an ice cube in your mouth and slowly trace a path down their chest, navel, and hips.",
  "Command your partner to stand completely still while you slowly undress them piece by piece.",
  "Run your hands firmly under their waistband without going any further, holding eye contact the whole time.",
  "Pull their hair gently to expose their neck and deliver a firm, lingering kiss.",
  "Bite gently along their collarbone, leaving a faint warm mark that lingers.",
  "Make your partner close their eyes and guess which part of your body is pressing against their lips.",
  "Sit facing each other knee-to-knee; take turns stripping an item of clothing until someone blushes.",
  "Place your hands firmly on their hips, guide their hips against yours with teasing friction for 60 seconds.",
  "Whisper three explicit things you intend to do to them later tonight while maintaining a completely straight face.",
  "Lick slowly from their navel upwards until you reach their lips, pausing just an inch away."
];

const playfulStarterThemes = [
  "What is a fantasy you've thought about but never asked for?",
  "If we were in a public place right now, where would you want me to touch you?",
  "What outfit or item of clothing of mine does things to your mind the second you see it?",
  "If you could tell me to do one playful, dirty thing right now without consequence, what would it be?",
  "What was your most mischievous thought about me this past week?",
  "What is the naughtiest text message you've ever drafted to me but hesitated to send?",
  "If we had to start a passionate make-out session in an elevator, how far would you let it go?",
  "Who would win an endurance challenge between us if kissing and light touching were forbidden to stop?",
  "What is a cheeky nickname or title you've secretly wanted to call me during foreplay?",
  "If I gave you complete permission to tease me ruthlessly for 10 minutes, where would you start?",
  "Which room in our home has the highest untapped potential for a spontaneous quickie?",
  "What's a movie or TV scene that made you instantly want to pull me into the bedroom?",
  "If you could pick out lingerie or an outfit for me to wear tonight, what style would it be?",
  "What is your favorite position when you want things to be fast, playful, and breathless?",
  "What would you do if I unexpectedly pulled you into an empty room at a party and locked the door?",
  "Rate your current horniness on a scale from 1 to 10, and explain what would immediately push it to an 11.",
  "What's the best time of day for you to be surprised with seductive, hands-on affection?",
  "If we made a bet right now where the loser has to serve the winner all night in bed, what are the stakes?"
];

const intenseActionThemes = [
  "Blindfold your partner and use a temperature contrast (ice or warm water) on their torso",
  "Dictate a strict physical command your partner must follow for the next 5 minutes",
  "Edge your partner for 3 minutes without allowing them to finish.",
  "Secure your partner's hands behind their back or to the headboard and make them ask permission for every touch.",
  "Command your partner to get on their knees, look up at you, and confess their deepest submissive desire.",
  "Deliver a series of sharp, stinging impacts to their backside, followed immediately by soothing palms.",
  "Press your partner firmly against the nearest wall, gripping their throat gently with just enough pressure to make them shiver.",
  "Strip down completely, climb on top of them, and tease them to the brink while denying them penetration or release.",
  "Use a belt, sash, or tie to bind their thighs together, exploring every exposed area around the restraint.",
  "Demand that your partner keeps their hands flat on the bed at their sides; if they move, they earn a punishment.",
  "Take absolute physical dominance: dictate their posture, their breathing, and when they are allowed to look at you.",
  "Blindfold your partner, stroke their most sensitive zones with unexpected speed and intensity, alternating between torture and bliss.",
  "Hold them down by their shoulders and kiss them with raw, breathless, uninhibited aggression for two solid minutes.",
  "Edge them twice back-to-back, stopping dead the second their hips buckle, forcing them to wait for release.",
  "Whisper their darkest kink directly into their ear while gripping their waist with undeniable force.",
  "Guide their hands to grasp your hips and demand they hold on tightly while you ride and dictate the pace.",
  "Command complete obedience: make them stay in a vulnerable pose while you take your time admiring and claiming them.",
  "Maintain intense, unblinking eye contact while sliding deep inside or bringing them to their knees with your touch."
];

const intenseStarterThemes = [
  "What is the most taboo power dynamic you want to explore with me?",
  "Tell me exactly how you want me to take control tonight.",
  "What is a boundary you've always wondered about testing or pushing in a safe, intense space?",
  "Do you crave surrender and helplessness with me, or do you crave absolute command and dominance?",
  "What is the filthiest, most degrading or intoxicating sentence you want whispered in your ear while we fuck?",
  "When was the last time you felt overwhelmed by pure, unbridled lust for me?",
  "What would push you over the edge into completely losing control tonight?",
  "How does the idea of physical restraints, blindfolds, or complete sensory deprivation make you feel right now?",
  "What is an intense fetish, kink, or desire that you've kept locked away out of fear of judgment?",
  "If I tied you down and told you that you were entirely at my mercy for the next hour, what would your body do?",
  "Describe the physical sensations of your most intense orgasm with me—what pushed you there?",
  "What kind of praise or discipline hits the deepest psychological nerve for you during sex?",
  "If tonight was our last chance to unleash our darkest, most primal desires together, what would we do?",
  "Tell me your explicit rules of engagement: what makes an intense scene feel utterly electric yet completely safe?",
  "Have you ever fantasized about being watched, recorded, or sharing a voyeuristic thrill with me?",
  "What is the threshold between pleasure and delicious, breathtaking ache for you?",
  "If I commanded you to beg for your pleasure on your knees right now, would you obey or resist?",
  "What is the most intense, primal sound you want to pull out of my chest before tonight is over?"
];

function generate170(seedList, categoryName, type) {
  const set = new Set(seedList);
  
  // Variations generator to create high-quality, articulate, differentiated entries
  const sensoryModifiers = [
    "with total attentiveness to their breathing",
    "using slow, measured movements in dim candlelight",
    "while whispering words of deep emotional appreciation",
    "with feather-light touches that barely graze the skin",
    "focusing completely on their physical response",
    "alternating between firm warmth and gentle gliding strokes",
    "with their eyes closed in complete ambient stillness",
    "matching the rhythm of their heartbeat with every touch",
    "whispering how much their scent and presence excites you",
    "drawing out the anticipation with deliberate pauses"
  ];

  const sensoryActionsExtra = [
    "Trace their collarbone with warm, slow kisses while synchronizing your breath.",
    "Feather-touch their inner wrists and pulse points for 90 seconds in silence.",
    "Gently cup their face in both hands and gaze into their eyes without speaking for two minutes.",
    "Warm your hands with essential oils and slowly release the tension in their neck and shoulder blades.",
    "Rest your chest against their back, wrapping both arms around them, whispering three things you adore.",
    "Glide the back of your fingertips from their jawline down to their sternum with agonizing slowness.",
    "Kiss their eyelids, forehead, and temples with soft, unhurried tenderness.",
    "Brush their hair away from the nape of their neck and breathe softly against their skin.",
    "Hold both of their hands against your heart, closing your eyes and feeling the pulse together.",
    "Trace the outline of their ribcage with deliberate, tender finger strokes.",
    "Blindfold your partner and let them focus solely on the texture and warmth of your fingertips on their skin.",
    "Gently massage the arches of their feet while asking them to release all the tension of the day.",
    "Lightly drag a satin fabric across their bare arms and shoulders in wave-like motions.",
    "Place one hand flat on their lower belly and one on their upper chest, breathing together for 3 minutes.",
    "Press slow, lingering kisses down the side of their neck, lingering on the hollow above their collarbone.",
    "Feather-kiss their knuckles and fingers one by one while holding unbroken eye contact.",
    "Trace the line of their spine with a smooth, warm stone or warmed lotion.",
    "Whisper three sensory fantasies you have about waking up entangled with them tomorrow morning.",
    "Slowly undress their shoulders and collarbone, kissing every exposed inch before pulling back.",
    "Gently stroke the sides of their waist and hips in rhythmic circles while lying face-to-face.",
    "Breathe warm air against their earlobe and jawline without letting your lips make contact for 60 seconds.",
    "Trace the curve of their lower lip with your thumb, then kiss them with deep, languid tenderness.",
    "Lie side-by-side in the dark and explore each other's hands, memorizing every line and contour.",
    "Massage their temples with slow circular strokes while they close their eyes and focus on your scent."
  ];

  const sensoryStartersExtra = [
    "What is the most romantic memory you have of us that still makes your heart flutter?",
    "When you imagine us being intimate, what is the very first sensory detail that comes to mind?",
    "What is a subtle look or touch from me that makes you feel completely safe and cherished?",
    "If we spent an entire evening without any rush or goal, how would you want it to unfold?",
    "What scent or perfume of mine triggers an immediate feeling of desire for you?",
    "Describe the exact moment you realized you wanted to be physically close to me.",
    "What is an insecurity of yours that you feel completely safe letting me adore?",
    "How does my touch change when I am feeling particularly loving versus playful?",
    "What part of your body do you feel most confident about when you're with me?",
    "If you could whisper one wish into my ear before we fell asleep tonight, what would it be?",
    "What kind of touch helps you turn off your mental stress the fastest?",
    "When was the last time a simple glance from me sent a wave of heat through your body?",
    "What is your favorite way for us to wake up together on a lazy weekend morning?",
    "How does it feel when we maintain prolonged eye contact in silence?",
    "What is something tender you secretly hope I will do more often during foreplay?",
    "Which season or weather makes you crave physical closeness and skin-to-skin contact the most?",
    "What is a compliment from me that lingered with you long after I said it?",
    "If we spent 20 minutes just touching hands and breathing in the dark, what would you feel?"
  ];

  const playfulActionsExtra = [
    "Whisper a naughty dare into their ear, then tease them with a feather kiss and walk away for 30 seconds.",
    "Hold an ice cube between your lips and trace a cold, electric line down their throat and chest.",
    "Pull them into your lap and tease their lower lip with gentle nibbles until they reach for you.",
    "Give their backside three playful, stinging swats, then immediately soothe the skin with warm palms.",
    "Undo their top buttons using only your mouth while they are forbidden from touching you.",
    "Straddle their hips and tease them with slow, rhythmic friction without allowing full contact.",
    "Blindfold them with a silk tie and tell them they must guess what you are wearing purely by touch.",
    "Trace a line of kisses down their stomach, stopping just an inch above their waistband.",
    "Pin their wrists gently to the bed and whisper three explicit things you want to do tonight.",
    "Take an article of clothing from them, put it on yourself, and tease them into coming to take it back.",
    "Slide your hands under their shirt and explore their ribs and back with teasing fingernails.",
    "Make them close their eyes and feed them a piece of fruit or chocolate with teasing lips.",
    "Challenge them to a 60-second staring contest; the first one to smile or blink loses a layer of clothing.",
    "Tuck your hands into their back pockets and pull their hips flush against yours for a lingering kiss.",
    "Bite their shoulder with just enough pressure to leave a warm, tingling blush.",
    "Command them to sit on their hands while you slowly kiss down their neck, chest, and stomach.",
    "Tease their ears and neck with playful whispers about what awaits them in the bedroom.",
    "Slow-dance together in underwear to a slow song, keeping your bodies completely pressed together.",
    "Use your fingertips to tease along the waistband of their underwear without going underneath for 2 minutes.",
    "Run your tongue along the curve of their throat, then suddenly pull away with a mischievous smile."
  ];

  const playfulStartersExtra = [
    "What is the boldest, naughtiest outfit you've ever imagined me wearing for your eyes only?",
    "If we had a secret signal for 'I want you right now' in public, what would you want it to be?",
    "What was the dirtiest thought you had about me while you were supposed to be working this week?",
    "If we had a spontaneous make-out session in a semi-public location, where would you choose?",
    "What's the cheekiest dare you've ever secretly wanted to challenge me to in bed?",
    "If I let you dictate three playful rules for our bedroom tonight, what would rule number one be?",
    "What is a playful foreplay tease that makes you completely lose your composure?",
    "Who is the bigger instigator of spontaneous intimacy between us, and do you want that to change?",
    "If you could secretly record a video of us together, what scene would you want to replay the most?",
    "What kind of dirty talk instantly makes you laugh versus instantly makes you soaking or hard?",
    "What is your favorite part of my body to tease and torture with slow anticipation?",
    "If we made a wager where the winner gets breakfast in bed and the loser is entirely at their command, what game are we playing?",
    "What is a naughty text message you've wanted to send me during an important meeting?",
    "If I pulled you into a secluded corner at a fancy dinner party, what would you let me get away with?",
    "What is something playful we tried once that you've been craving to repeat?",
    "Rate how mischievous you feel right now from 1 to 10, and tell me what would make it a 10."
  ];

  const intenseActionsExtra = [
    "Press your partner firmly against the nearest wall, gripping their waist with undeniable dominance.",
    "Blindfold your partner and place your hand around their throat with gentle, breathless possessiveness.",
    "Command them to strip down, kneel before you, and state their complete surrender for tonight.",
    "Edge your partner to the absolute brink of release, then command them to freeze and wait.",
    "Deliver five firm, stinging impacts to their backside, followed immediately by your firm, claiming grip.",
    "Tie their wrists securely to the bedposts and take your time admiring every vulnerable inch of their body.",
    "Dictate every breath and movement: they may not touch, look, or speak without explicit permission.",
    "Climb on top of them, pin their arms above their head, and kiss them with breathless, unbridled hunger.",
    "Slide your hand between their thighs, teasing them aggressively while commanding them to look into your eyes.",
    "Hold them down by their shoulders and whisper the exact details of how you are going to take them.",
    "Edge them twice in a row, stopping the exact moment they lose control, leaving them aching and breathless.",
    "Command them to hold a vulnerable posture on the bed and maintain it without moving for three minutes.",
    "Use a leather or silk restraint to secure their thighs together, exploring only what they are forced to expose.",
    "Demand they confess their most taboo craving out loud before granting them a single kiss.",
    "Grip their hair firmly to tilt their head back, exposing their throat for a fierce, claiming bite.",
    "Dictate the pace with absolute authority: slow, deep, and relentless with zero room for negotiation.",
    "Blindfold them, apply cold ice followed immediately by hot breath and heavy, demanding friction.",
    "Command them to beg for their orgasm, making them ask three times before allowing release.",
    "Press your body heavily over theirs, restricting their movement and whispering your complete claim.",
    "Hold their hips in an unyielding grip, setting a punishing, intoxicating rhythm they cannot escape."
  ];

  const intenseStartersExtra = [
    "What is the most taboo power dynamic you've ever fantasized about exploring with me in private?",
    "How does the idea of complete physical surrender and helplessness make you feel right now?",
    "What is a strict physical rule or command you would love for me to enforce on you for an entire weekend?",
    "When do you feel most aroused: when you are taking total command, or when you are completely taken?",
    "What is the filthiest, most explicit sentence you want growled into your ear while I fuck you?",
    "What is a dark or boundary-pushing fantasy you've hidden because you worried it was too intense?",
    "How do you feel about sensory deprivation—being completely blindfolded and restrained at my mercy?",
    "What is the threshold for you between delicious, overwhelming intensity and needing to tap out?",
    "Have you ever wanted me to inspect, evaluate, and command your body with uncompromising dominance?",
    "What kind of impact play, spanking, or marks turn your mind into a purely primal headspace?",
    "What is the most intense, uninhibited orgasm you've ever had with me, and what pushed you over?",
    "If I took total control of your pleasure tonight and denied you release until tomorrow, how would your body react?",
    "What makes an intense D/s dynamic feel thrilling and deeply intimate rather than intimidating for you?",
    "What is a word or title you secretly want to be called when we are in the throes of passionate aggression?",
    "Do you want me to be gentle with you tonight, or do you want to be thoroughly claimed and ruined for anyone else?"
  ];

  let pool = [];
  if (categoryName === 'sensory' && type === 'action') pool = sensoryActionsExtra;
  if (categoryName === 'sensory' && type === 'starter') pool = sensoryStartersExtra;
  if (categoryName === 'playful' && type === 'action') pool = playfulActionsExtra;
  if (categoryName === 'playful' && type === 'starter') pool = playfulStarterThemes.concat(playfulStartersExtra);
  if (categoryName === 'intense' && type === 'action') pool = intenseActionsExtra;
  if (categoryName === 'intense' && type === 'starter') pool = intenseStartersExtra;

  for (const item of pool) {
    set.add(item);
  }

  const prefixes = [
    "In dim light,", "With slow, electric precision,", "Focusing on pure anticipation,", "Without breaking physical contact,",
    "Closing your eyes,", "Taking all the time in the world,", "Whispering intimately,", "In complete, heavy silence,",
    "Breathing in unison,", "With deliberate, hypnotic slowness,", "Holding unwavering focus,", "Tracing every nerve ending,",
    "For the next 90 seconds,", "Without rushing a single motion,", "Letting the heat build steadily,", "With deep, grounding presence,"
  ];

  const intros = [
    "Be completely honest: ", "If there were zero judgment between us: ", "Looking directly into my eyes: ",
    "Thinking about tonight: ", "In your deepest thoughts: ", "When you let your inhibitions down: ",
    "Whisper this to me: ", "Without overthinking: ", "Tell me candidly: ", "If you had total permission: "
  ];

  const baseItems = Array.from(set);
  const modifiers = type === 'action' ? prefixes : intros;

  for (const mod of modifiers) {
    for (const base of baseItems) {
      if (set.size >= 170) break;
      const cleanBase = base.charAt(0).toLowerCase() + base.slice(1);
      const variant = type === 'action' ? `${mod} ${cleanBase}` : `${mod}${cleanBase}`;
      set.add(variant);
    }
    if (set.size >= 170) break;
  }

  return Array.from(set).slice(0, 170);
}

const sensoryActions = generate170(sensoryActionThemes.flatMap(t => t.targets ? t.targets.map(tar => `${t.prefix} ${tar}`) : [t.prefix]), 'sensory', 'action');
const sensoryStarters = generate170(sensoryStarterThemes, 'sensory', 'starter');

const playfulActions = generate170(playfulActionThemes, 'playful', 'action');
const playfulStarters = generate170(playfulStarterThemes, 'playful', 'starter');

const intenseActions = generate170(intenseActionThemes, 'intense', 'action');
const intenseStarters = generate170(intenseStarterThemes, 'intense', 'starter');

console.log(`Generated counts:
Sensory Actions: ${sensoryActions.length}
Sensory Starters: ${sensoryStarters.length}
Playful Actions: ${playfulActions.length}
Playful Starters: ${playfulStarters.length}
Intense Actions: ${intenseActions.length}
Intense Starters: ${intenseStarters.length}
TOTAL: ${sensoryActions.length + sensoryStarters.length + playfulActions.length + playfulStarters.length + intenseActions.length + intenseStarters.length}
`);

const fileContent = `export type IntensityTier = 'sensory' | 'playful' | 'intense';
export type RandomizerType = 'action' | 'conversation';

export interface TierData {
  name: string;
  badge: string;
  color: string;
  borderHover: string;
  bgBadge: string;
  description: string;
  metaTags: string[];
  actions: string[];
  starters: string[];
}

export const RANDOMIZER_DATA: Record<IntensityTier, TierData> = {
  sensory: {
    name: 'Sensory',
    badge: '🌿 Gentle & Romantic',
    color: 'emerald',
    borderHover: 'hover:border-emerald-500/60',
    bgBadge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
    description: 'Slow, tactile anticipation and vulnerable emotional presence designed to heighten every nerve.',
    metaTags: ['sensory', 'tactile', 'massage', 'breathwork', 'feather_touch', 'emotional_intimacy', 'slow_burn', 'vulnerability', 'body_worship'],
    actions: ${JSON.stringify(sensoryActions, null, 2)},
    starters: ${JSON.stringify(sensoryStarters, null, 2)}
  },
  playful: {
    name: 'Playful',
    badge: '🔥 Flirty & Teasing',
    color: 'amber',
    borderHover: 'hover:border-amber-500/60',
    bgBadge: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
    description: 'Mischievous challenges, flirtatious teasing, and bold physical friction to spark chemistry.',
    metaTags: ['playful', 'flirting', 'teasing', 'edging_light', 'strip_game', 'ice_contrast', 'lingerie', 'public_thrill', 'spanking_light'],
    actions: ${JSON.stringify(playfulActions, null, 2)},
    starters: ${JSON.stringify(playfulStarters, null, 2)}
  },
  intense: {
    name: 'Intense',
    badge: '⚡ Primal & Dominant',
    color: 'rose',
    borderHover: 'hover:border-rose-500/60',
    bgBadge: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
    description: 'High-heat power exchange, physical boundaries, command, and uncompromising surrender.',
    metaTags: ['intense', 'power_dynamics', 'dominance', 'submission', 'impact_play', 'strict_control', 'restraints', 'sensory_deprivation', 'orgasm_denial'],
    actions: ${JSON.stringify(intenseActions, null, 2)},
    starters: ${JSON.stringify(intenseStarters, null, 2)}
  }
};

export const TOTAL_RANDOMIZER_PROMPTS = ${sensoryActions.length + sensoryStarters.length + playfulActions.length + playfulStarters.length + intenseActions.length + intenseStarters.length};
`;

fs.writeFileSync(path.resolve(__dirname, '..', 'app', 'lib', 'randomizer-data.ts'), fileContent, 'utf8');
console.log('Successfully wrote app/lib/randomizer-data.ts with 1,020 prompts!');
