import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface GameSeed {
  title: string;
  description: string;
  category: 'card' | 'dice' | 'movie' | 'drinking';
  intensity: 'Sensory' | 'Playful' | 'Intense' | 'Extreme';
  content: {
    rules: string[];
  };
}

const games: GameSeed[] = [
  // ==========================================
  // CARD GAMES (16 variations across 4 tiers)
  // ==========================================

  // 1. The Sensation Suit Matrix
  {
    title: "The Sensation Suit Matrix - Sensory",
    description: "A gentle suit-based card game focused on clothed teasing, light massage, and intimate emotional vulnerability.",
    category: "card",
    intensity: "Sensory",
    content: {
      rules: [
        "Shuffle a standard deck of cards. Partners take turns drawing one card per round.",
        "Hearts: Administer a 60-second gentle temple, hand, or shoulder massage focused on releasing tension.",
        "Diamonds: Whisper a genuine, heartfelt appreciation or secret emotional desire to your partner.",
        "Clubs: Use feather-light fingertips to trace soothing patterns over clothed arms and shoulders.",
        "Spades: Answer a vulnerable intimacy prompt chosen by your partner with complete honesty.",
        "Remain fully clothed throughout the session, prioritizing deep emotional comfort."
      ]
    }
  },
  {
    title: "The Sensation Suit Matrix - Playful",
    description: "An adventurous card matrix incorporating silk blindfolds, ice cubes, warm breath, and shedding layers.",
    category: "card",
    intensity: "Playful",
    content: {
      rules: [
        "Alternate drawing cards from the deck while maintaining playful eye contact.",
        "Hearts: The drawing partner wears a silk blindfold while the other delivers gentle, teasing kisses.",
        "Diamonds: Trace an ice cube slowly along the receiver's neck and collarbone, followed by warm breath.",
        "Clubs: The drawing partner must remove one article of clothing or an accessory.",
        "Spades: The non-drawing partner chooses a playful physical dare involving teasing touches.",
        "Face cards (J, Q, K) double the duration or intensity of the suit action."
      ]
    }
  },
  {
    title: "The Sensation Suit Matrix - Intense",
    description: "Strict power exchange and sensory deprivation dictated by card suits, with demanding physical commands.",
    category: "card",
    intensity: "Intense",
    content: {
      rules: [
        "Designate an initial Dealer (Dominant) and Player (Submissive) for a sequence of 5 draws.",
        "Hearts: Firm, commanding physical touch or massage while the receiver is required to remain completely motionless.",
        "Diamonds: The Player must strip down to undergarments and assume an obedient posture.",
        "Clubs: Silk blindfold with 2 full minutes of sensory deprivation and anticipation.",
        "Spades: Dealer issues an explicit physical obedience command that must be executed without hesitation.",
        "Any speaking or fidgeting without permission results in a strict penalty draw."
      ]
    }
  },
  {
    title: "The Sensation Suit Matrix - Extreme",
    description: "Absolute bodily surrender where each suit transfers total physical control and uncompromising rule enforcement.",
    category: "card",
    intensity: "Extreme",
    content: {
      rules: [
        "Establish absolute power surrender before dealing. Safe words are strictly confirmed beforehand.",
        "Hearts: Complete bodily control—the dominant partner dictates every breath, posture, and physical response.",
        "Diamonds: Total removal of all remaining clothing with uncompromising obedience.",
        "Clubs: Prolonged sensory deprivation and physical restraint under continuous dominant oversight.",
        "Spades: Unconditional physical surrender to the dominant partner's explicit commands and desires.",
        "No resistance, hesitation, or negotiation is permitted once a card is drawn."
      ]
    }
  },

  // 2. High-Stakes Strip Blackjack
  {
    title: "High-Stakes Strip Blackjack - Sensory",
    description: "Classic 21 reimagined with cozy clothed wagers, tension-relief massages, and vulnerability prompts.",
    category: "card",
    intensity: "Sensory",
    content: {
      rules: [
        "Deal standard Blackjack hands. Closest to 21 without busting wins the round.",
        "The loser of each hand delivers a 2-minute targeted tension-relief massage to the winner's neck or feet.",
        "Busting (exceeding 21) requires the player to confess an intimate longing they have never shared.",
        "A natural Blackjack earns the winner a warm, uninterrupted 3-minute clothed embrace.",
        "Keep the energy relaxed, affectionate, and emotionally connected."
      ]
    }
  },
  {
    title: "High-Stakes Strip Blackjack - Playful",
    description: "Classic Blackjack where losing hands forfeit clothing layers and busting triggers blindfolded temperature play.",
    category: "card",
    intensity: "Playful",
    content: {
      rules: [
        "Play head-to-head Blackjack. The lower hand must remove one article of clothing.",
        "Busting results in immediate clothing removal plus wearing a blindfold for the next two rounds.",
        "While blindfolded, the winner traces an ice cube or feather across the loser's collarbone and torso.",
        "A natural Blackjack allows the winner to reclaim an item of clothing or make the loser shed two.",
        "Play continues until one partner reaches their underwear layer."
      ]
    }
  },
  {
    title: "High-Stakes Strip Blackjack - Intense",
    description: "High-stakes cardplay with strict physical penalties, deep physical commands, and sensory restraint.",
    category: "card",
    intensity: "Intense",
    content: {
      rules: [
        "Both players begin down to undergarments. Hands are dealt with absolute seriousness.",
        "Losing a hand forfeits physical autonomy: the loser must assume a submissive posture dictated by the winner.",
        "Busting incurs a mandatory 3-minute blindfolded sensory deprivation penalty with forbidden speech.",
        "The winner issues demanding physical tasks and edging commands for each winning hand.",
        "Flinching or breaking character incurs an immediate double-dare penalty."
      ]
    }
  },
  {
    title: "High-Stakes Strip Blackjack - Extreme",
    description: "Total power surrender Blackjack where every hand loss transfers absolute physical command and enforcement.",
    category: "card",
    intensity: "Extreme",
    content: {
      rules: [
        "Players stake complete bodily control. The dealer/winner holds total authority.",
        "Losing hand results in immediate surrender of all clothing and entry into absolute physical submission.",
        "Busting requires full physical restraint and unconditional obedience to explicit commands.",
        "The winning player dictates total posture, physical denial, and intimate pacing for the duration of the shoe.",
        "Absolute rule enforcement is mandatory with safe words active at all times."
      ]
    }
  },

  // 3. Red or Black Escalation
  {
    title: "Red or Black Escalation - Sensory",
    description: "A gentle prediction card game where streaks earn slow caresses, clothed teasing, and sweet admissions.",
    category: "card",
    intensity: "Sensory",
    content: {
      rules: [
        "Take turns guessing whether the next top card is Red or Black before flipping it.",
        "A correct guess earns a relaxing fingertip trace along your back or scalp from your partner.",
        "An incorrect guess requires you to whisper a sweet compliment or romantic truth into your partner's ear.",
        "Three consecutive correct guesses unlock a 5-minute full back rub with soothing oils.",
        "Maintain a calm, soothing atmosphere with candle-lit closeness throughout."
      ]
    }
  },
  {
    title: "Red or Black Escalation - Playful",
    description: "Fast-paced color predictions where wrong guesses cost clothing and trigger teasing ice and temperature play.",
    category: "card",
    intensity: "Playful",
    content: {
      rules: [
        "Players take turns calling Red or Black before each card reveal.",
        "Each wrong guess requires removing an article of clothing or accessory.",
        "Two consecutive wrong guesses prompt the partner to apply chilled ice followed by warm breath to bare skin.",
        "A correct guess allows the caller to blindfold their partner for the next three turns.",
        "Continue until one player is down to their desired playful boundary."
      ]
    }
  },
  {
    title: "Red or Black Escalation - Intense",
    description: "Escalating penalty matrix with strict dominance rules, blindfolded sensory deprivation, and physical commands.",
    category: "card",
    intensity: "Intense",
    content: {
      rules: [
        "One partner acts as the Inquisitor, drawing cards while the Subject calls Red or Black.",
        "Every incorrect guess mandates an immediate physical obedience command chosen by the Inquisitor.",
        "The Subject must remain blindfolded and perfectly still throughout the interrogation sequence.",
        "Incorrect streaks escalate from deep physical commands to extended edging touches under strict silence.",
        "Any hesitation in following an order adds three additional mandatory cards to the deck."
      ]
    }
  },
  {
    title: "Red or Black Escalation - Extreme",
    description: "High-stakes prediction duel culminating in total power surrender and uncompromising physical discipline.",
    category: "card",
    intensity: "Extreme",
    content: {
      rules: [
        "Full power exchange dynamic. The caller stakes absolute bodily surrender on the outcome of the deck.",
        "Every incorrect call enforces total submission to the dominant partner's explicit physical desires.",
        "Cumulative incorrect cards trigger full physical restraint and prolonged sensory deprivation protocols.",
        "The dominant partner possesses unconditional authority over posture, exposure, and physical release.",
        "Total rule enforcement with no exceptions or second chances."
      ]
    }
  },

  // 4. Build-A-Dare Poker
  {
    title: "Build-A-Dare Poker - Sensory",
    description: "Collaborative card play where winning hands design relaxing, affectionate pampering dares.",
    category: "card",
    intensity: "Sensory",
    content: {
      rules: [
        "Deal 5-card poker hands. Each round, players wager pampering tokens to craft an intimate dare.",
        "Dares are built from three parts: Gentle Action (massage, caress, stroke) + Safe Zone + Time (1-3 mins).",
        "The winning hand decides whether they receive or deliver the crafted pampering dare.",
        "All dares are strictly limited to clothed, affectionate touch and verbal tenderness.",
        "Focus on unwinding, reducing stress, and fostering mutual emotional warmth."
      ]
    }
  },
  {
    title: "Build-A-Dare Poker - Playful",
    description: "Creative poker dares incorporating blindfolds, temperature play, teasing nibbles, and clothing stakes.",
    category: "card",
    intensity: "Playful",
    content: {
      rules: [
        "Play 5-card draw poker. Wager clothing items, blindfolds, and ice tokens in the pot.",
        "The winning hand constructs a teasing dare combining an Action (ice trace, warm nibble, blindfold kiss) and Zone.",
        "The losing hand must perform or submit to the constructed dare immediately.",
        "A pair or better unlocks an additional layer removal for the losing hand.",
        "Keep the interaction spirited, teasing, and filled with playful laughter."
      ]
    }
  },
  {
    title: "Build-A-Dare Poker - Intense",
    description: "High-stakes poker showdowns where winning hands construct demanding dominant commands and sensory control.",
    category: "card",
    intensity: "Intense",
    content: {
      rules: [
        "Play high-stakes poker hands. The winning hand holds absolute command over the loser for that round.",
        "Crafted dares incorporate strict power exchange, kneeling postures, and prolonged sensory deprivation.",
        "The losing player is blindfolded and subjected to firm, commanding physical tasks without speaking.",
        "Three-of-a-kind or better grants the winner full control over the loser's physical sensations for 5 minutes.",
        "Strict discipline and obedience are mandatory during dare execution."
      ]
    }
  },
  {
    title: "Build-A-Dare Poker - Extreme",
    description: "Unconditional surrender poker where the winning hand claims complete physical authority and uncompromising stakes.",
    category: "card",
    intensity: "Extreme",
    content: {
      rules: [
        "Total power stakes poker. Every hand lost yields absolute physical control to the victor.",
        "The winning hand crafts explicit physical commands that must be fulfilled with total surrender.",
        "The losing player submits to complete physical exposure, restraint, and delayed gratification.",
        "Zero hesitation or debate is allowed; the victor's authority is absolute until the session ends.",
        "Strict safety protocols and verified consent maintained throughout."
      ]
    }
  },

  // ==========================================
  // DICE GAMES (16 variations across 4 tiers)
  // ==========================================

  // 5. The Action & Zone Coordinate Matrix
  {
    title: "The Action & Zone Coordinate Matrix - Sensory",
    description: "Two-dice coordinate rolls mapping gentle touch actions to relaxing, fully clothed body zones.",
    category: "dice",
    intensity: "Sensory",
    content: {
      rules: [
        "Roll Die 1 for Action: 1=Light Feather Stroke, 2=Gentle Palm Massage, 3=Warm Hand Press, 4=Soft Whisper, 5=Affectionate Caress, 6=Slow Breath.",
        "Roll Die 2 for Zone: 1=Hands & Fingers, 2=Neck & Shoulders, 3=Lower Arms, 4=Upper Back, 5=Temples & Hair, 6=Feet.",
        "Perform the indicated action on the designated zone for 60 seconds with mindfulness.",
        "Both partners remain clothed, focusing purely on stress relief and emotional resonance.",
        "Take 5 alternating turns each, savoring the peaceful connection."
      ]
    }
  },
  {
    title: "The Action & Zone Coordinate Matrix - Playful",
    description: "Dynamic dice coordinates incorporating blindfolds, ice cubes, warm breath, and teasing garment removal.",
    category: "dice",
    intensity: "Playful",
    content: {
      rules: [
        "Roll Die 1 for Action: 1=Ice Cube Trace, 2=Warm Breath & Nibble, 3=Blindfolded Guess, 4=Feather Tease, 5=Remove Clothing Layer, 6=Passionate Kiss.",
        "Roll Die 2 for Zone: 1=Neck & Nape, 2=Collarbone & Chest, 3=Bare Midriff, 4=Inner Thigh, 5=Lower Back, 6=Lips & Jawline.",
        "The receiving partner wears a silk blindfold while the rolling partner executes the action for 90 seconds.",
        "Rolling doubles allows the roller to command an additional clothing item to be shed.",
        "Alternate rolls until both partners are pleasantly teased and engaged."
      ]
    }
  },
  {
    title: "The Action & Zone Coordinate Matrix - Intense",
    description: "Command-driven dice coordinates featuring dominant touch, sensory deprivation, and strict physical compliance.",
    category: "dice",
    intensity: "Intense",
    content: {
      rules: [
        "One partner assumes the Dominant role and rolls both dice for the Submissive partner.",
        "Die 1 for Action: 1=Firm Dominant Grip, 2=Sensory Deprivation Trace, 3=Edging Stroke, 4=Commanded Posture, 5=Motionless Anticipation, 6=Strict Reprimand.",
        "Die 2 for Zone: 1=Throat & Collarbone, 2=Inner Thighs, 3=Spine & Lower Back, 4=Chest, 5=Hips & Pelvis, 6=Full Body Sweep.",
        "The Submissive remains blindfolded and must not move or speak without permission during execution.",
        "Any movement or breaking posture extends the duration of the command by 2 minutes."
      ]
    }
  },
  {
    title: "The Action & Zone Coordinate Matrix - Extreme",
    description: "Uncompromising dice matrix establishing absolute bodily surrender, intense physical stakes, and deep obedience.",
    category: "dice",
    intensity: "Extreme",
    content: {
      rules: [
        "Total power exchange protocol. The Dominant wields the dice to direct complete bodily surrender.",
        "Die 1 for Action: 1=Absolute Physical Surrender, 2=Complete Release Denial, 3=Intense Physical Command, 4=Restrained Stillness, 5=Total Obedience, 6=Dominant's Choice.",
        "Die 2 for Zone: 1=Pelvic Region, 2=Lower Abdomen, 3=Inner Thighs, 4=Full Bare Skin, 5=Sensory Pressure Points, 6=Total Bodily Control.",
        "The Submissive yields all physical autonomy and complies unconditionally with every roll outcome.",
        "Complete rule enforcement is strictly applied with active safe word safeguards."
      ]
    }
  },

  // 6. Seductive Countdown
  {
    title: "Seductive Countdown - Sensory",
    description: "Countdown dice game from 50 to 0 where milestones trigger slow massages, synchronized breathing, and shared desires.",
    category: "dice",
    intensity: "Sensory",
    content: {
      rules: [
        "Start at 50 points. Partners take turns rolling two dice, subtracting the rolled sum from the score.",
        "Milestone 40: Pause for 2 minutes of synchronized deep breathing with foreheads resting together.",
        "Milestone 30: The roller receives a dedicated slow neck and shoulder massage.",
        "Milestone 20: Whisper three intimate reasons why you adore and desire your partner.",
        "Milestone 10 & 0: Conclude with a long, clothed embrace and a tender, lingering kiss.",
        "Enjoy the gentle anticipation as the number steadily counts down."
      ]
    }
  },
  {
    title: "Seductive Countdown - Playful",
    description: "Playful countdown from 50 to 0 where milestones trigger blindfolds, ice cubes, and shedding clothing layers.",
    category: "dice",
    intensity: "Playful",
    content: {
      rules: [
        "Start at 50 points. Alternate rolling two dice and subtracting the total.",
        "Crossing 40: The player with the lower roll removes one article of clothing.",
        "Crossing 30: Blindfold the non-rolling partner and trace an ice cube along their jawline and chest.",
        "Crossing 20: The roller gets to plant three teasing kisses anywhere on exposed skin.",
        "Crossing 10 & 0: The partner who reaches zero decides on a passionate, playful bedroom finale.",
        "Keep the energy flirtatious and thrilling as the score diminishes."
      ]
    }
  },
  {
    title: "Seductive Countdown - Intense",
    description: "High-tension countdown with dominant power dynamics, physical stillness tests, and commanding obedience.",
    category: "dice",
    intensity: "Intense",
    content: {
      rules: [
        "Count down from 50 under strict dominant supervision. Rolling partner dictates the pacing.",
        "Crossing 40: The Submissive partner is blindfolded and commanded into an attentive kneeling posture.",
        "Crossing 30: Two full minutes of sensory deprivation with strict prohibition on vocalizing.",
        "Crossing 20: Dominant partner administers deep physical edging touches with forced stillness.",
        "Crossing 10 & 0: The Submissive partner must surrender complete control over their physical release.",
        "Any flinching or defiance resets the countdown back up by 10 points."
      ]
    }
  },
  {
    title: "Seductive Countdown - Extreme",
    description: "Total power surrender countdown culminating in unconditional physical submission and absolute rule enforcement.",
    category: "dice",
    intensity: "Extreme",
    content: {
      rules: [
        "A high-stakes countdown from 50 where every subtracted point deepens physical surrender.",
        "Each milestone strips away another layer of physical autonomy and decision-making.",
        "By Milestone 20, the Submissive partner is fully restrained, blindfolded, and under absolute control.",
        "Reaching zero culminates in complete bodily submission to the Dominant's explicit desires.",
        "Uncompromising enforcement of all commands throughout the entire countdown."
      ]
    }
  },

  // 7. High-Stakes Intimacy Farkle/Yahtzee
  {
    title: "High-Stakes Intimacy Farkle/Yahtzee - Sensory",
    description: "Dice combination game where banked points unlock pampering rewards and zero rolls prompt honest confessions.",
    category: "dice",
    intensity: "Sensory",
    content: {
      rules: [
        "Roll 5 dice trying to score combinations (triples, straights, three pairs) to bank points toward 500.",
        "Banked points can be cashed in for 2-minute hand rubs, scalp massages, or tender embraces.",
        "If a roll yields zero scoring dice (Farkle), the rolling partner must answer a deep vulnerability question.",
        "First partner to bank 500 points receives a full, relaxing 15-minute body massage from their partner.",
        "Fully clothed, peaceful, and emotionally centering throughout."
      ]
    }
  },
  {
    title: "High-Stakes Intimacy Farkle/Yahtzee - Playful",
    description: "Lively dice combos where points earn teasing privileges and farkling costs clothing layers or incurs ice dares.",
    category: "dice",
    intensity: "Playful",
    content: {
      rules: [
        "Roll 5 dice for scoring sets. Points can be spent to request playful kisses or blindfold the other partner.",
        "Farkling (scoring zero points on a roll) forces the roller to immediately remove one article of clothing.",
        "Two consecutive Farkles requires enduring 60 seconds of teasing with an ice cube while blindfolded.",
        "Rolling three-of-a-kind allows the roller to deliver three teasing kisses to a zone of their choice.",
        "First player to 500 points wins the right to dictate the night's playful bedroom game."
      ]
    }
  },
  {
    title: "High-Stakes Intimacy Farkle/Yahtzee - Intense",
    description: "Dominant dice duel where farkling incurs submissive penalties, sensory deprivation, and strict physical tasks.",
    category: "dice",
    intensity: "Intense",
    content: {
      rules: [
        "Roll dice for combinations under strict power exchange rules.",
        "Farkling immediately transfers total command to the opposing partner for the remainder of the turn.",
        "The farkling player must put on a blindfold, assume a submissive posture, and remain completely still.",
        "Scoring sets allow the Dominant to enforce demanding physical tasks and edging commands.",
        "Defiance or hesitation adds a 50-point penalty and requires three additional compliance tasks."
      ]
    }
  },
  {
    title: "High-Stakes Intimacy Farkle/Yahtzee - Extreme",
    description: "Total power stakes dice game where farkles strip physical autonomy and enforce absolute physical surrender.",
    category: "dice",
    intensity: "Extreme",
    content: {
      rules: [
        "Full bodily stakes dice competition. Victory grants complete authority over the loser's body.",
        "Farkling triggers immediate full physical exposure, restraint, and complete sensory deprivation.",
        "Winning combinations execute unconditional physical commands with zero room for negotiation.",
        "The loser surrenders all physical release decisions until released by the victor.",
        "Absolute rule enforcement governed strictly by pre-established safe words."
      ]
    }
  },

  // 8. Dice Betting
  {
    title: "Dice Betting - Sensory",
    description: "Cozy roll-off wagering game where higher rolls win affectionate pampering, gentle strokes, and sweet closeness.",
    category: "dice",
    intensity: "Sensory",
    content: {
      rules: [
        "Both partners roll a single die simultaneously. The higher roll wins the wagered pampering task.",
        "Wagers are agreed upon beforehand: gentle foot massage, stroking hair, or sharing an unspoken fantasy.",
        "Ties prompt a shared 60-second close embrace with synchronized deep breaths.",
        "Keep the environment serene with dim lighting and soft music.",
        "Play 5 rounds, focusing on intentional relaxation and deep emotional appreciation."
      ]
    }
  },
  {
    title: "Dice Betting - Playful",
    description: "Flirtatious roll-off betting with clothing removal wagers, blindfolded sensation trials, and ice play.",
    category: "dice",
    intensity: "Playful",
    content: {
      rules: [
        "Partners wager items of clothing or sensory dares before each roll-off.",
        "Lower roll must fulfill the wager immediately—stripping a layer or submitting to a blindfold.",
        "Winning roll gets to apply an ice cube or warm massage oil to the loser's exposed collarbone or shoulders.",
        "Rolling a double-6 gives the winner the privilege of creating any playful dare they choose.",
        "Play until both players have shed their outer clothing and are ready to escalate."
      ]
    }
  },
  {
    title: "Dice Betting - Intense",
    description: "High-stakes roll-offs where losers submit to dominant physical control, blindfolds, and strict obedience commands.",
    category: "dice",
    intensity: "Intense",
    content: {
      rules: [
        "High vs Low dice roll-off with power dynamics on the line.",
        "The loser of each roll surrenders physical control to the winner for the next 3 minutes.",
        "Winner enforces silk blindfold sensory deprivation, obedient postures, and deep physical commands.",
        "The loser must not speak or initiate touch without direct permission from the winner.",
        "Failure to obey immediately doubles the duration of the physical command."
      ]
    }
  },
  {
    title: "Dice Betting - Extreme",
    description: "Ultimate bodily wager roll-off where the losing partner surrenders all physical decision-making and submission.",
    category: "dice",
    intensity: "Extreme",
    content: {
      rules: [
        "Both players roll for total physical authority. The higher roll claims absolute dominance for the evening.",
        "The loser yields complete physical autonomy, clothing control, and physical release decisions.",
        "The victor enforces uncompromising physical stakes, complete restraint, and absolute obedience.",
        "No hesitation or deviation from the victor's explicit directives is permitted.",
        "Strict consent verification and continuous non-verbal check-ins active throughout."
      ]
    }
  },

  // ==========================================
  // MOVIE NIGHT GAMES (16 variations across 4 tiers)
  // ==========================================

  // 9. Secretary (Power Dynamics)
  {
    title: "Secretary: Power Dynamics - Sensory",
    description: "Attentive watch-along paired with mindful posture, gentle shoulder kneading, and affirming verbal appreciation.",
    category: "movie",
    intensity: "Sensory",
    content: {
      rules: [
        "Watch the film *Secretary* together in a quiet, cozy room.",
        "Whenever authority or typing occurs on screen, partners practice attentive posture and gentle breathing.",
        "During quiet dialogue moments, one partner provides a soothing, slow shoulder rub to the other.",
        "When an emotional boundary is crossed on screen, pause and share what emotional security means to you.",
        "Stay fully clothed and deeply centered in emotional trust and communication."
      ]
    }
  },
  {
    title: "Secretary: Power Dynamics - Playful",
    description: "Teasing office roleplay during the movie featuring permission requests, blindfolds, and accessory removal.",
    category: "movie",
    intensity: "Playful",
    content: {
      rules: [
        "One partner plays the 'Boss' and the other plays the 'Secretary' for the first half of the film.",
        "Whenever Mr. Grey issues an order on screen, the Secretary must ask permission before speaking.",
        "Every time a typewriter sounds, the Secretary removes an accessory or article of clothing.",
        "When Mr. Grey checks the Secretary's posture, the Boss delivers an ice trace along the Secretary's neck.",
        "Switch roles halfway through the film to keep the dynamic playful and mutually teasing."
      ]
    }
  },
  {
    title: "Secretary: Power Dynamics - Intense",
    description: "Formal power exchange watch-along with kneeling postures, blindfolded silence, and commanding physical tasks.",
    category: "movie",
    intensity: "Intense",
    content: {
      rules: [
        "Establish a formal dominant/submissive contract for the duration of the movie.",
        "The submissive partner must maintain an attentive kneeling posture during all office scenes.",
        "A silk blindfold is applied during intense dialogue sequences; no movement or speaking without permission.",
        "The dominant partner delivers firm physical reprimands and deep sensory tasks matching the on-screen tension.",
        "Any breach of protocol results in an immediate 5-minute extension of sensory deprivation."
      ]
    }
  },
  {
    title: "Secretary: Power Dynamics - Extreme",
    description: "Total power surrender roleplay matching the film, with complete control over posture, clothing, and physical release.",
    category: "movie",
    intensity: "Extreme",
    content: {
      rules: [
        "Complete surrender of physical autonomy throughout the entire screening of the film.",
        "The dominant partner holds absolute control over the submissive partner's clothing, movement, and touch.",
        "The submissive partner submits unconditionally to all physical commands, restraint, and delayed release.",
        "Scene-for-scene mirror escalation culminates in total physical submission until the final credits roll.",
        "Uncompromising enforcement with pre-agreed safe words strictly maintained."
      ]
    }
  },

  // 10. Basic Instinct (Femme Fatale Sensation)
  {
    title: "Basic Instinct: Femme Fatale - Sensory",
    description: "Suspenseful psychological watch-along focused on uninterrupted eye contact, light caresses, and shared mystery.",
    category: "movie",
    intensity: "Sensory",
    content: {
      rules: [
        "Watch *Basic Instinct* while sitting intimately close together under a warm blanket.",
        "Whenever suspenseful music plays, maintain continuous eye contact without looking away or speaking.",
        "During tense interrogation exchanges, gently trace fingertips over your partner's clothed arms and collarbone.",
        "Pause once during the movie to whisper a seductive, mysterious fantasy you have never spoken aloud.",
        "Keep the mood sophisticated, sensual, and fully clothed."
      ]
    }
  },
  {
    title: "Basic Instinct: Femme Fatale - Playful",
    description: "Interrogation watch-along where on-screen questioning triggers blindfolded ice interrogation and layer shedding.",
    category: "movie",
    intensity: "Playful",
    content: {
      rules: [
        "One partner acts as the Femme Fatale, the other as the Detective.",
        "During interrogation scenes, the Detective is blindfolded while the Femme Fatale extracts 'confessions'.",
        "The interrogator uses an ice cube or warm breath against the Detective's neck to test their composure.",
        "Whenever Catherine crosses her legs on screen, both partners must remove one article of clothing.",
        "If the Detective flinches during questioning, they owe the Femme Fatale three teasing kisses."
      ]
    }
  },
  {
    title: "Basic Instinct: Femme Fatale - Intense",
    description: "Interrogation under physical restraint where reactions incur dominant sensory tasks and physical commands.",
    category: "movie",
    intensity: "Intense",
    content: {
      rules: [
        "The interrogated partner is blindfolded and restrained lightly during the interrogation sequences.",
        "They must answer probing intimacy questions without breaking composure or shifting posture.",
        "Any pulse spike, flinch, or tremor prompts the interrogator to deliver commanding physical discipline.",
        "The interrogator maintains strict control over touching, sensation pacing, and posture throughout.",
        "Obedience must be precise and unwavering until the scene concludes."
      ]
    }
  },
  {
    title: "Basic Instinct: Femme Fatale - Extreme",
    description: "Total psychological and physical surrender to the femme fatale interrogator with uncompromising stakes.",
    category: "movie",
    intensity: "Extreme",
    content: {
      rules: [
        "Total surrender of bodily authority to the Femme Fatale interrogator for the duration of the movie.",
        "The captive partner submits to complete physical restraint, full exposure, and total sensory control.",
        "The interrogator executes explicit physical commands with zero allowance for hesitation or resistance.",
        "Physical release is strictly denied and controlled exclusively at the interrogator's discretion.",
        "Strict adherence to safe words and absolute safety protocols."
      ]
    }
  },

  // 11. Love & Other Drugs (Escalation Countdown)
  {
    title: "Love & Other Drugs: Escalation - Sensory",
    description: "Romantic drama watch-along tracking emotional vulnerability with soothing back rubs and personal storytelling.",
    category: "movie",
    intensity: "Sensory",
    content: {
      rules: [
        "Watch *Love & Other Drugs* while resting comfortably side by side.",
        "Whenever the lead characters share an emotionally tender moment, pause and share a vulnerable personal memory.",
        "Offer your partner a soothing back or neck rub during long dialogue sequences.",
        "Notice and compliment each other's emotional strengths during pivotal character realizations.",
        "A peaceful, heartwarming experience centered entirely around emotional safety."
      ]
    }
  },
  {
    title: "Love & Other Drugs: Escalation - Playful",
    description: "Spirited escalation where on-screen romantic milestones prompt shedding clothes and blindfolded temperature teasing.",
    category: "movie",
    intensity: "Playful",
    content: {
      rules: [
        "Track the romantic beats of the film together.",
        "Every intimate encounter or kiss on screen requires both partners to strip one layer of clothing.",
        "During lighthearted montages, take turns blindfolding each other and administering teasing kisses.",
        "Use chilled ice cubes or warm massage oil to trace on-screen passion onto each other's bare skin.",
        "Continue shedding layers until you reach your comfortable playful boundary."
      ]
    }
  },
  {
    title: "Love & Other Drugs: Escalation - Intense",
    description: "Escalating physical passion governed by strict dominant permissions, sensory deprivation, and edging control.",
    category: "movie",
    intensity: "Intense",
    content: {
      rules: [
        "Match the rising passion on screen with strict dominant pacing rules.",
        "Neither partner may initiate touch without explicit verbal permission from the designated leader.",
        "During passionate love scenes, the receiving partner is blindfolded and subjected to intense edging touches.",
        "Strict stillness and breath control are demanded under dominant physical commands.",
        "Breaking stillness results in physical denial for the following two movie scenes."
      ]
    }
  },
  {
    title: "Love & Other Drugs: Escalation - Extreme",
    description: "Scene-for-scene mirror escalation culminating in absolute power surrender, unrestrained desire, and full submission.",
    category: "movie",
    intensity: "Extreme",
    content: {
      rules: [
        "Complete physical surrender that mirrors the raw emotional and physical intensity of the film.",
        "The dominant partner holds absolute command over clothing removal, posture, and physical touch.",
        "Total sensory deprivation and physical restraint applied during climactic story chapters.",
        "Unconditional surrender to explicit physical commands with zero resistance permitted.",
        "Pre-agreed safe words and continuous comfort monitoring strictly maintained."
      ]
    }
  },

  // 12. Bound (High-Stakes Trust)
  {
    title: "Bound: High-Stakes Trust - Sensory",
    description: "Neo-noir suspense watch-along where tension peaks prompt synchronized breathing and heartfelt trust confessions.",
    category: "movie",
    intensity: "Sensory",
    content: {
      rules: [
        "Watch *Bound* sitting closely intertwined on a comfortable couch.",
        "Whenever suspense peaks during the heist, hold hands firmly and synchronize your breathing.",
        "Whisper three things you trust completely about your partner into their ear during dialogue pauses.",
        "Provide gentle palm and temple rubs to soothe tension during critical plot turns.",
        "Focus on building unwavering emotional safety, fidelity, and connection."
      ]
    }
  },
  {
    title: "Bound: High-Stakes Trust - Playful",
    description: "Playful trust games during the movie featuring silk scarf wrist ties, blindfolds, and temperature teasing.",
    category: "movie",
    intensity: "Playful",
    content: {
      rules: [
        "Take turns having your wrists loosely bound with a soft silk scarf during tense scenes.",
        "The unbound partner blindfolds the bound partner and administers teasing touches with ice and warm breath.",
        "Whenever money is discussed on screen, both partners shed an accessory or article of clothing.",
        "A playful password is required to be unbound at each commercial or chapter break.",
        "Keep the atmosphere exciting, adventurous, and delightfully teasing."
      ]
    }
  },
  {
    title: "Bound: High-Stakes Trust - Intense",
    description: "Firm physical restraint and strict sensory deprivation during noir suspense sequences with mandatory obedience.",
    category: "movie",
    intensity: "Intense",
    content: {
      rules: [
        "One partner is securely restrained and blindfolded during key heist sequences.",
        "The restrained partner must remain completely composed while the Captor issues physical commands.",
        "The Captor uses sensory contrast (ice, firm grip, feather) to test the captive's resolve.",
        "Speaking without permission is strictly prohibited and results in added sensory deprivation time.",
        "Total trust and obedience are reinforced throughout the scene."
      ]
    }
  },
  {
    title: "Bound: High-Stakes Trust - Extreme",
    description: "Complete bondage and power surrender watch-along with absolute control over movement, senses, and release.",
    category: "movie",
    intensity: "Extreme",
    content: {
      rules: [
        "Total physical bondage and sensory deprivation established for the duration of the film.",
        "The captive yields complete physical autonomy and submits unconditionally to the captor's commands.",
        "The captor exercises absolute authority over posture, physical touch, and the timing of physical release.",
        "Uncompromising enforcement of all commands with active safe word protections.",
        "Total surrender and profound trust required from start to finish."
      ]
    }
  },

  // ==========================================
  // DRINKING GAMES (16 variations across 4 tiers)
  // ==========================================

  // 13. 50 Shades of Gray Watch-Along
  {
    title: "50 Shades Watch-Along: Drinking - Sensory",
    description: "Lighthearted sip triggers tied to movie tropes, paired with gentle clothed neck rubs and sweet confessions.",
    category: "drinking",
    intensity: "Sensory",
    content: {
      rules: [
        "Prepare your beverage of choice (wine, cocktail, or sparkling mocktail).",
        "Take a gentle sip whenever Christian says 'Laters, baby', bites his lip, or mentions a contract.",
        "During major romantic scenes, the partner who drank least gives the other a 2-minute soothing shoulder rub.",
        "Pause once to share an intimate desire you have never voiced before.",
        "Remain fully clothed and relaxed in a warm, low-pressure setting."
      ]
    }
  },
  {
    title: "50 Shades Watch-Along: Drinking - Playful",
    description: "Sip triggers paired with shedding clothing layers and blindfolded ice cube tracing down the neck.",
    category: "drinking",
    intensity: "Playful",
    content: {
      rules: [
        "Sip on dialogue triggers: 'Laters baby', lip biting, elevator scenes, or mentions of the Red Room.",
        "Every third sip requires the drinker to remove an article of clothing or accessory.",
        "The lip-biting trigger requires the drinking partner to wear a blindfold while the other traces an ice cube down their collarbone.",
        "Finish your drink if a helicopter or glider appears on screen, and perform a playful physical dare.",
        "Play until both partners are stripped down to their comfortable playful boundary."
      ]
    }
  },
  {
    title: "50 Shades Watch-Along: Drinking - Intense",
    description: "Dominant drink-and-submit rules where sips incur physical penalties, blindfolded stillness, and strict obedience.",
    category: "drinking",
    intensity: "Intense",
    content: {
      rules: [
        "One partner acts as the Master and commands when the Submissive may take a sip.",
        "Whenever a contract or rule is broken on screen, the Submissive must perform a demanding physical task.",
        "The Submissive wears a silk blindfold and must maintain kneeling posture throughout all dialogue scenes.",
        "The Master controls beverage pacing, physical touch, and sensory stimulation with strict authority.",
        "Flinching or speaking without permission adds mandatory disciplinary tasks."
      ]
    }
  },
  {
    title: "50 Shades Watch-Along: Drinking - Extreme",
    description: "Total Red Room surrender drinking game enforcing unconditional physical submission and absolute rule enforcement.",
    category: "drinking",
    intensity: "Extreme",
    content: {
      rules: [
        "Complete submission to the Red Room rules for the entire viewing session.",
        "Every on-screen trigger enforces explicit physical submission and immediate surrender of clothing.",
        "The dominant partner holds total authority over the submissive's body, movement, and physical release.",
        "Unconditional obedience is strictly enforced with zero hesitation permitted.",
        "Safe words are active and verified before starting the game."
      ]
    }
  },

  // 14. The Rhythmic Trace (Music)
  {
    title: "The Rhythmic Trace: Music - Sensory",
    description: "Melodic drinking game where rhythm and chorus drops dictate soothing sips and slow clothed spinal tracing.",
    category: "drinking",
    intensity: "Sensory",
    content: {
      rules: [
        "Put on an intimate playlist of slow, ambient, or R&B music with refreshing drinks in hand.",
        "Take a slow sip on each chorus drop or tempo change.",
        "In sync with the rhythm, trace slow, calming patterns across your partner's clothed arms, spine, and neck.",
        "Between songs, share one memory of how your partner made you feel deeply cherished.",
        "Fully clothed, deeply comforting, and focused on harmonic relaxation."
      ]
    }
  },
  {
    title: "The Rhythmic Trace: Music - Playful",
    description: "Bass-drop sips paired with blindfolded temperature play and rhythmic clothing removal as tracks crescendo.",
    category: "drinking",
    intensity: "Playful",
    content: {
      rules: [
        "The receiving partner wears a silk blindfold with drinks prepared for both.",
        "Each beat drop prompts a sip followed by alternating between chilled ice and warm breath against bare shoulders.",
        "When the track reaches its highest crescendo, the drinking partner must shed an article of clothing.",
        "Alternate who wears the blindfold after every two songs.",
        "Enjoy the sensory anticipation and rhythmic tease as the playlist progresses."
      ]
    }
  },
  {
    title: "The Rhythmic Trace: Music - Intense",
    description: "Dominant music control where track tempo governs sips, blindfolded sensory deprivation, and rhythmic commands.",
    category: "drinking",
    intensity: "Intense",
    content: {
      rules: [
        "The Dominant partner curates the music and dictates when the Submissive must drink or pause.",
        "The Submissive is blindfolded and sensory-deprived, required to follow exact physical rhythm commands.",
        "Touch escalates strictly with the volume and intensity of the music; no moving without command.",
        "The Dominant delivers commanding physical touches and edging control synchronized to the track beats.",
        "Breaking rhythm or composure results in an immediate drink penalty and disciplinary posture."
      ]
    }
  },
  {
    title: "The Rhythmic Trace: Music - Extreme",
    description: "Total auditory and sensory surrender where musical climaxes dictate absolute physical stakes and obedience.",
    category: "drinking",
    intensity: "Extreme",
    content: {
      rules: [
        "Total sensory overload protocol. The Submissive surrenders all control to the Dominant's musical pacing.",
        "Every song climax triggers explicit physical submission and unconditional obedience to dominant commands.",
        "The Submissive is fully restrained and yields complete authority over physical exposure and sensation.",
        "Absolute rule enforcement throughout the entire playlist.",
        "Verified consent and safe word safeguards strictly active."
      ]
    }
  },

  // 15. Spicy High-Card
  {
    title: "Spicy High-Card - Sensory",
    description: "Draw-card drinking game where lower cards sip and deliver gentle, clothed pampering massages.",
    category: "drinking",
    intensity: "Sensory",
    content: {
      rules: [
        "Shuffle a deck of cards and pour relaxing drinks.",
        "Each round, both partners draw one card face-up. The lower card takes a sip of their drink.",
        "The lower card also provides a 90-second tension-relief massage (hands, scalp, or shoulders) to the winner.",
        "Drawing a tie prompts a shared toast and a long, affectionate embrace.",
        "Remain fully clothed and focused on relaxing together after a long day."
      ]
    }
  },
  {
    title: "Spicy High-Card - Playful",
    description: "Low card sips and sheds a layer of clothing; drawing an Ace unlocks blindfolded ice and temperature play.",
    category: "drinking",
    intensity: "Playful",
    content: {
      rules: [
        "Each round, flip cards simultaneously. The lower card takes a sip and removes one article of clothing.",
        "If the winner draws an Ace, they get to blindfold the loser and apply an ice cube to their collarbone.",
        "Drawing a Face Card allows the winner to assign a playful physical dare instead of a clothing penalty.",
        "Ties require both players to take a sip and shed an accessory.",
        "Play until both partners reach their preferred playful boundary."
      ]
    }
  },
  {
    title: "Spicy High-Card - Intense",
    description: "High-card power duel where losers drink and submit to dominant physical commands and blindfolded stillness.",
    category: "drinking",
    intensity: "Intense",
    content: {
      rules: [
        "Flip cards for high-stakes dominance. The lower card must take a drink and submit to the winner's command.",
        "The winning card enforces silk blindfold sensory deprivation and commanding physical tasks for 3 minutes.",
        "The losing player must maintain perfect physical stillness and may not speak without permission.",
        "Drawing an Ace grants the winner absolute control over the loser's physical sensations for 5 minutes.",
        "Flinching or hesitation incurs an immediate double-sip penalty and added compliance tasks."
      ]
    }
  },
  {
    title: "Spicy High-Card - Extreme",
    description: "Total power surrender card-and-sip duel where high cards hold complete bodily authority and enforcement.",
    category: "drinking",
    intensity: "Extreme",
    content: {
      rules: [
        "Every card flipped stakes total bodily control. The loser of each hand takes a drink and yields all autonomy.",
        "The winner exercises absolute command over clothing removal, physical restraint, and explicit commands.",
        "The losing partner submits unconditionally to all physical dictates with zero resistance allowed.",
        "Physical release is strictly denied and determined solely by the high-card winner.",
        "Pre-agreed safe words strictly enforced throughout."
      ]
    }
  },

  // 16. The Chilled Sensation (Dice)
  {
    title: "The Chilled Sensation: Dice - Sensory",
    description: "Refreshing sip-and-roll dice game pairing even rolls with cool sips and odd rolls with warm, clothed embraces.",
    category: "drinking",
    intensity: "Sensory",
    content: {
      rules: [
        "Roll a single die alternately with chilled drinks ready.",
        "Even roll (2, 4, 6): Take a refreshing sip of your beverage and give your partner an appreciative compliment.",
        "Odd roll (1, 3, 5): Place warm hands over your partner's neck or shoulders and deliver a slow, soothing rub.",
        "Rolling a 6 prompts a shared 60-second close embrace with synchronized deep breaths.",
        "Keep the energy peaceful, refreshing, and emotionally centering throughout."
      ]
    }
  },
  {
    title: "The Chilled Sensation: Dice - Playful",
    description: "Dice-and-ice drinking game: even rolls sip and strip; odd rolls melt ice cubes along blindfolded skin.",
    category: "drinking",
    intensity: "Playful",
    content: {
      rules: [
        "Prepare chilled drinks and an ice bowl. Alternate rolling a single die.",
        "Even roll (2, 4, 6): Take a sip and remove one article of clothing or an accessory.",
        "Odd roll (1, 3, 5): The other partner wears a blindfold while you melt an ice cube along their neck and chest.",
        "Rolling a 1 requires melting the ice cube solely using your lips against their skin.",
        "Continue rolling until both partners are pleasantly teased and ready to move closer."
      ]
    }
  },
  {
    title: "The Chilled Sensation: Dice - Intense",
    description: "Strict composure game: sips paired with dominant ice application, blindfolded endurance, and physical commands.",
    category: "drinking",
    intensity: "Intense",
    content: {
      rules: [
        "The Dominant partner rolls the die and commands when the Submissive drinks.",
        "Even roll: Submissive takes a designated drink and maintains an obedient, motionless posture.",
        "Odd roll: Dominant applies ice cubes to sensitive zones under strict sensory deprivation; no flinching allowed.",
        "Any speaking, moving, or breaking composure incurs an immediate disciplinary physical command.",
        "The Dominant maintains unwavering authority over sensory contrast and physical compliance."
      ]
    }
  },
  {
    title: "The Chilled Sensation: Dice - Extreme",
    description: "Sensory overload and total power surrender drinking game with intense ice/heat contrast and absolute control.",
    category: "drinking",
    intensity: "Extreme",
    content: {
      rules: [
        "Complete bodily surrender under sensory overload and strict beverage discipline.",
        "The Submissive yields all physical autonomy, fully restrained and blindfolded throughout.",
        "Ice and intense physical stimulation applied with uncompromising enforcement by the Dominant.",
        "The Submissive must submit unconditionally to all explicit physical commands and sensory dictates.",
        "Safe words active and strictly monitored throughout the entire session."
      ]
    }
  }
];

async function seedIntimacyGames() {
  console.log(`--- Seeding ${games.length} Intimacy Game Variations ---`);

  // Insert in batches of 16 for clean execution
  const batchSize = 16;
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(games.length / batchSize)} (${batch.length} games)...`);

    const { error } = await supabase.from('intimacy_games').insert(batch);

    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      console.log(`Successfully inserted batch ${Math.floor(i / batchSize) + 1}.`);
    }
  }

  console.log(`--- Finished Seeding 64 Intimacy Game Variations ---`);
}

seedIntimacyGames();
