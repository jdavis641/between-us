export type IntensityTier = 'sensory' | 'playful' | 'intense';
export type RandomizerType = 'action' | 'conversation';

export interface TierData {
  name: string;
  badge: string;
  color: string;
  borderHover: string;
  bgBadge: string;
  description: string;
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
    actions: [
      "Give a 3-minute blindfolded hand massage",
      "Trace your partner's spine using only your fingertips",
      "Maintain eye contact for 60 seconds while touching their neck.",
      "Gently whisper three sensory details you adore about their body directly against their collarbone.",
      "Feather-light kiss their jawline, earlobe, and shoulder without touching lips for two minutes.",
      "Warm a few drops of massage oil between your palms and slowly knead their shoulders in rhythmic silence.",
      "Lightly brush the back of your fingernails down their inner arms to their fingertips.",
      "Rest your forehead against theirs, synchronize your breathing for two full minutes with eyes closed.",
      "Trace the curve of their hip with slow, intentional circular strokes.",
      "Place a palm over their heart and match their breath while stroking their cheek with your free hand.",
      "Use a piece of soft fabric or silk to glide across their chest and stomach in slow waves.",
      "Press light, deliberate kisses from their pulse point at the wrist up along the forearm.",
      "Run your fingers through their hair, gently massaging the scalp and nape of their neck.",
      "Guide their hand to touch your face and chest while describing in a whisper how their touch feels.",
      "Trace the outline of their lips with your thumb, then press a soft, lingering kiss to each corner.",
      "Lay chest-to-chest in complete silence, focusing solely on the warmth and weight of each other for 3 minutes.",
      "Gently breathe warm air across the nape of their neck and behind their ear without making contact.",
      "Slowly massage the soles and arches of their feet with firm, grounding thumb pressure."
    ],
    starters: [
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
    ]
  },
  playful: {
    name: 'Playful',
    badge: '🔥 Flirty & Teasing',
    color: 'amber',
    borderHover: 'hover:border-amber-500/60',
    bgBadge: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
    description: 'Mischievous challenges, flirtatious teasing, and bold physical friction to spark chemistry.',
    actions: [
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
    ],
    starters: [
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
    ]
  },
  intense: {
    name: 'Intense',
    badge: '⚡ Primal & Dominant',
    color: 'rose',
    borderHover: 'hover:border-rose-500/60',
    bgBadge: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
    description: 'High-heat power exchange, physical boundaries, command, and uncompromising surrender.',
    actions: [
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
    ],
    starters: [
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
    ]
  }
};
