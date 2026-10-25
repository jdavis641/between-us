export interface FallbackGame {
  id: string;
  title: string;
  description: string;
  category: string;
  intensity: string;
  content: {
    rules: string[];
  };
}

export const FALLBACK_GAMES: FallbackGame[] = [
  // ==========================================
  // CARD GAMES (Expanded dynamic library across all 4 intensity tiers)
  // ==========================================
  {
    id: "the-sensation-suit-matrix-sensory",
    category: 'card',
    intensity: 'Sensory',
    title: 'The Sensation Suit Matrix - Sensory',
    description: 'A gentle suit-based card game focused on clothed teasing, light massage, and intimate emotional vulnerability.',
    content: {
      rules: [
        'Shuffle a standard deck of cards. Partners take turns drawing one card per round.',
        'Hearts: Administer a 60-second gentle temple, hand, or shoulder massage focused on releasing tension.',
        'Diamonds: Whisper a genuine, heartfelt appreciation or secret emotional desire to your partner.',
        'Clubs: Use feather-light fingertips to trace soothing patterns over clothed arms and shoulders.',
        'Spades: Answer a vulnerable intimacy prompt chosen by your partner with complete honesty.',
        'Remain fully clothed throughout the session, prioritizing deep emotional comfort.'
      ]
    }
  },
  {
    id: "the-sensation-suit-matrix-playful",
    category: 'card',
    intensity: 'Playful',
    title: 'The Sensation Suit Matrix - Playful',
    description: 'An adventurous card matrix incorporating silk blindfolds, ice cubes, warm breath, and shedding layers.',
    content: {
      rules: [
        'Alternate drawing cards from the deck while maintaining playful eye contact.',
        'Hearts: The drawing partner wears a silk blindfold while the other delivers gentle, teasing kisses.',
        'Diamonds: Trace an ice cube slowly along the receiver\'s neck and collarbone, followed by warm breath.',
        'Clubs: The drawing partner must remove one article of clothing or an accessory.',
        'Spades: The non-drawing partner chooses a playful physical dare involving teasing touches.',
        'Face cards (J, Q, K) double the duration or intensity of the suit action.'
      ]
    }
  },
  {
    id: "the-sensation-suit-matrix-intense",
    category: 'card',
    intensity: 'Intense',
    title: 'The Sensation Suit Matrix - Intense',
    description: 'Strict power exchange and sensory deprivation dictated by card suits, with demanding physical commands.',
    content: {
      rules: [
        'Designate an initial Dealer (Dominant) and Player (Submissive) for a sequence of 5 draws.',
        'Hearts: Firm, commanding physical touch or massage while the receiver is required to remain completely motionless.',
        'Diamonds: The Player must strip down to undergarments and assume an obedient posture.',
        'Clubs: Silk blindfold with 2 full minutes of sensory deprivation and anticipation.',
        'Spades: Dealer issues an explicit physical obedience command that must be executed without hesitation.',
        'Any speaking or fidgeting without permission results in a strict penalty draw.'
      ]
    }
  },
  {
    id: "the-sensation-suit-matrix-extreme",
    category: 'card',
    intensity: 'Extreme',
    title: 'The Sensation Suit Matrix - Extreme',
    description: 'Absolute bodily surrender where each suit transfers total physical control and uncompromising rule enforcement.',
    content: {
      rules: [
        'Establish absolute power surrender before dealing. Safe words are strictly confirmed beforehand.',
        'Hearts: Complete bodily control—the dominant partner dictates every breath, posture, and physical response.',
        'Diamonds: Total removal of all remaining clothing with uncompromising obedience.',
        'Clubs: Prolonged sensory deprivation and physical restraint under continuous dominant oversight.',
        'Spades: Unconditional physical surrender to the dominant partner\'s explicit commands and desires.',
        'No resistance, hesitation, or negotiation is permitted once a card is drawn.'
      ]
    }
  },
  {
    id: "high-stakes-strip-blackjack-sensory",
    category: 'card',
    intensity: 'Sensory',
    title: 'High-Stakes Strip Blackjack - Sensory',
    description: 'Classic 21 reimagined with cozy clothed wagers, tension-relief massages, and vulnerability prompts.',
    content: {
      rules: [
        'Deal standard Blackjack hands. Closest to 21 without busting wins the round.',
        'The loser of each hand delivers a 2-minute targeted tension-relief massage to the winner\'s neck or feet.',
        'Busting (exceeding 21) requires the player to confess an intimate longing they have never shared.',
        'A natural Blackjack earns the winner a warm, uninterrupted 3-minute clothed embrace.',
        'Keep the energy relaxed, affectionate, and emotionally connected.'
      ]
    }
  },
  {
    id: "high-stakes-strip-blackjack-playful",
    category: 'card',
    intensity: 'Playful',
    title: 'High-Stakes Strip Blackjack - Playful',
    description: 'Classic Blackjack where losing hands forfeit clothing layers and busting triggers blindfolded temperature play.',
    content: {
      rules: [
        'Play head-to-head Blackjack. The lower hand must remove one article of clothing.',
        'Busting results in immediate clothing removal plus wearing a blindfold for the next two rounds.',
        'While blindfolded, the winner traces an ice cube or feather across the loser\'s collarbone and torso.',
        'A natural Blackjack allows the winner to reclaim an item of clothing or make the loser shed two.',
        'Play continues until one partner reaches their underwear layer.'
      ]
    }
  },
  {
    id: "high-stakes-strip-blackjack-intense",
    category: 'card',
    intensity: 'Intense',
    title: 'High-Stakes Strip Blackjack - Intense',
    description: 'High-stakes cardplay with strict physical penalties, deep physical commands, and sensory restraint.',
    content: {
      rules: [
        'Both players begin down to undergarments. Hands are dealt with absolute seriousness.',
        'Losing a hand forfeits physical autonomy: the loser must assume a submissive posture dictated by the winner.',
        'Busting incurs a mandatory 3-minute blindfolded sensory deprivation penalty with forbidden speech.',
        'The winner issues demanding physical tasks and edging commands for each winning hand.',
        'Flinching or breaking character incurs an immediate double-dare penalty.'
      ]
    }
  },
  {
    id: "high-stakes-strip-blackjack-extreme",
    category: 'card',
    intensity: 'Extreme',
    title: 'High-Stakes Strip Blackjack - Extreme',
    description: 'Total power surrender Blackjack where every hand loss transfers absolute physical command and enforcement.',
    content: {
      rules: [
        'Players stake complete bodily control. The dealer/winner holds total authority.',
        'Losing hand results in immediate surrender of all clothing and entry into absolute physical submission.',
        'Busting requires full physical restraint and unconditional obedience to explicit commands.',
        'The winning player dictates total posture, physical denial, and intimate pacing for the duration of the shoe.',
        'Absolute rule enforcement is mandatory with safe words active at all times.'
      ]
    }
  },
  {
    id: "red-or-black-escalation-sensory",
    category: 'card',
    intensity: 'Sensory',
    title: 'Red or Black Escalation - Sensory',
    description: 'A gentle prediction card game where streaks earn slow caresses, clothed teasing, and sweet admissions.',
    content: {
      rules: [
        'Take turns guessing whether the next top card is Red or Black before flipping it.',
        'A correct guess earns a relaxing fingertip trace along your back or scalp from your partner.',
        'An incorrect guess requires you to whisper a sweet compliment or romantic truth into your partner\'s ear.',
        'Three consecutive correct guesses unlock a 5-minute full back rub with soothing oils.',
        'Maintain a calm, soothing atmosphere with candle-lit closeness throughout.'
      ]
    }
  },
  {
    id: "red-or-black-escalation-playful",
    category: 'card',
    intensity: 'Playful',
    title: 'Red or Black Escalation - Playful',
    description: 'Fast-paced color predictions where wrong guesses cost clothing and trigger teasing ice and temperature play.',
    content: {
      rules: [
        'Players take turns calling Red or Black before each card reveal.',
        'Each wrong guess requires removing an article of clothing or accessory.',
        'Two consecutive wrong guesses prompt the partner to apply chilled ice followed by warm breath to bare skin.',
        'A correct guess allows the caller to blindfold their partner for the next three turns.',
        'Continue until one player is down to their desired playful boundary.'
      ]
    }
  },
  {
    id: "red-or-black-escalation-intense",
    category: 'card',
    intensity: 'Intense',
    title: 'Red or Black Escalation - Intense',
    description: 'Escalating penalty matrix with strict dominance rules, blindfolded sensory deprivation, and physical commands.',
    content: {
      rules: [
        'One partner acts as the Inquisitor, drawing cards while the Subject calls Red or Black.',
        'Every incorrect guess mandates an immediate physical obedience command chosen by the Inquisitor.',
        'The Subject must remain blindfolded and perfectly still throughout the interrogation sequence.',
        'Incorrect streaks escalate from deep physical commands to extended edging touches under strict silence.',
        'Any hesitation in following an order adds three additional mandatory cards to the deck.'
      ]
    }
  },
  {
    id: "red-or-black-escalation-extreme",
    category: 'card',
    intensity: 'Extreme',
    title: 'Red or Black Escalation - Extreme',
    description: 'High-stakes prediction duel culminating in total power surrender and uncompromising physical discipline.',
    content: {
      rules: [
        'Full power exchange dynamic. The caller stakes absolute bodily surrender on the outcome of the deck.',
        'Every incorrect call enforces total submission to the dominant partner\'s explicit physical desires.',
        'Cumulative incorrect cards trigger full physical restraint and prolonged sensory deprivation protocols.',
        'The dominant partner possesses unconditional authority over posture, exposure, and physical release.',
        'Total rule enforcement with no exceptions or second chances.'
      ]
    }
  },
  {
    id: "whispering-deck",
    category: 'card',
    intensity: 'Sensory',
    title: 'Whispering Deck',
    description: 'A gentle card game focused on touch and eye contact.',
    content: {
      rules: [
        'Draw a card and read the sensory prompt.',
        'Maintain eye contact for 10 seconds.',
        'Follow the prompt slowly and deliberately.'
      ]
    }
  },
  {
    id: "truth-or-tease",
    category: 'card',
    intensity: 'Playful',
    title: 'Truth or Tease',
    description: 'A fun game mixing revealing questions with light physical teasing.',
    content: {
      rules: [
        'Draw a card. If red, answer the intimate question honestly. If black, follow the tease prompt.',
        'Winner gets a 5-minute dedicated shoulder or foot massage.'
      ]
    }
  },
  {
    id: "blindfold-blackjack",
    category: 'card',
    intensity: 'Intense',
    title: 'Blindfold Blackjack',
    description: 'High stakes blackjack where the loser loses a piece of clothing or control.',
    content: {
      rules: [
        'Play a hand of blackjack standard rules.',
        'The loser is blindfolded for 5 minutes and must surrender control to whatever the winner desires.'
      ]
    }
  },
  {
    id: "the-boundary-deck",
    category: 'card',
    intensity: 'Extreme',
    title: 'The Boundary Deck',
    description: 'Cards designed to push your psychological and physical limits securely.',
    content: {
      rules: [
        'Each card has an adventurous command.',
        'You must obey or use your agreed safe word.',
        'No hesitations allowed.'
      ]
    }
  },
  {
    id: "build-a-dare-poker-sensory",
    category: 'card',
    intensity: 'Sensory',
    title: 'Build-A-Dare Poker - Sensory',
    description: 'Collaborative card play where winning hands design relaxing, affectionate pampering dares.',
    content: {
      rules: [
        'Deal 5-card poker hands. Each round, players wager pampering tokens to craft an intimate dare.',
        'Dares are built from three parts: Gentle Action (massage, caress, stroke) + Safe Zone + Time (1-3 mins).',
        'The winning hand decides whether they receive or deliver the crafted pampering dare.',
        'All dares are strictly limited to clothed, affectionate touch and verbal tenderness.',
        'Focus on unwinding, reducing stress, and fostering mutual emotional warmth.'
      ]
    }
  },
  {
    id: "build-a-dare-poker-playful",
    category: 'card',
    intensity: 'Playful',
    title: 'Build-A-Dare Poker - Playful',
    description: 'Creative poker dares incorporating blindfolds, temperature play, teasing nibbles, and clothing stakes.',
    content: {
      rules: [
        'Play 5-card draw poker. Wager clothing items, blindfolds, and ice tokens in the pot.',
        'The winning hand constructs a teasing dare combining an Action (ice trace, warm nibble, blindfold kiss) and Zone.',
        'The losing hand must perform or submit to the constructed dare immediately.',
        'A pair or better unlocks an additional layer removal for the losing hand.',
        'Keep the interaction spirited, teasing, and filled with playful laughter.'
      ]
    }
  },
  {
    id: "build-a-dare-poker-intense",
    category: 'card',
    intensity: 'Intense',
    title: 'Build-A-Dare Poker - Intense',
    description: 'High-stakes poker showdowns where winning hands construct demanding dominant commands and sensory control.',
    content: {
      rules: [
        'Play high-stakes poker hands. The winning hand holds absolute command over the loser for that round.',
        'Crafted dares incorporate strict power exchange, kneeling postures, and prolonged sensory deprivation.',
        'The losing player is blindfolded and subjected to firm, commanding physical tasks without speaking.',
        'Three-of-a-kind or better grants the winner full control over the loser\'s physical sensations for 5 minutes.',
        'Strict discipline and obedience are mandatory during dare execution.'
      ]
    }
  },
  {
    id: "build-a-dare-poker-extreme",
    category: 'card',
    intensity: 'Extreme',
    title: 'Build-A-Dare Poker - Extreme',
    description: 'Unconditional surrender poker where the winning hand claims complete physical authority and uncompromising stakes.',
    content: {
      rules: [
        'Total power stakes poker. Every hand lost yields absolute physical control to the victor.',
        'The winning hand crafts explicit physical commands that must be fulfilled with total surrender.',
        'The losing player submits to complete physical exposure, restraint, and delayed gratification.',
        'Zero hesitation or debate is allowed; the victor\'s authority is absolute until the session ends.',
        'Strict safety protocols and verified consent maintained throughout.'
      ]
    }
  },

  // ==========================================
  // MOVIE NIGHT GAMES
  // ==========================================
  {
    id: "cuddle-cinema",
    category: 'movie',
    intensity: 'Sensory',
    title: 'Cuddle Cinema',
    description: 'Focus on closeness during a movie. Every time the scene changes, shift your touch.',
    content: {
      rules: [
        'Start cuddling during the opening credits.',
        'Every scene change, trace a new path on your partner\'s arm or back.',
        'No phones or digital distractions.'
      ]
    }
  },
  {
    id: "rom-com-bingo",
    category: 'movie',
    intensity: 'Playful',
    title: 'Rom-Com Bingo',
    description: 'A playful bingo game based on movie cliches. The winner gets a kiss.',
    content: {
      rules: [
        'Mark your card when a romantic cliche happens on screen.',
        'First to get bingo gets a long, passionate kiss wherever they choose.'
      ]
    }
  },
  {
    id: "tension-thriller",
    category: 'movie',
    intensity: 'Intense',
    title: 'Tension Thriller',
    description: 'Watch a suspenseful movie. When tension rises on screen, so does the physical tension.',
    content: {
      rules: [
        'During suspenseful scenes, one partner is lightly restrained.',
        'Release only when the scene resolves.'
      ]
    }
  },
  {
    id: "sensory-deprivation-cinema",
    category: 'movie',
    intensity: 'Extreme',
    title: 'Sensory Deprivation Cinema',
    description: 'One partner is blindfolded and wears noise-canceling headphones while the other uses the movie as inspiration.',
    content: {
      rules: [
        'Blindfold Partner A with noise cancellation.',
        'Partner B enacts scenes inspired by the movie onto Partner A in real-time.'
      ]
    }
  },

  // ==========================================
  // DRINKING GAMES
  // ==========================================
  {
    id: "sip-and-trace",
    category: 'drinking',
    intensity: 'Sensory',
    title: 'Sip & Trace',
    description: 'A slow drinking game. Every sip is accompanied by a light touch.',
    content: {
      rules: [
        'Take a sip of your drink.',
        'Trace the rim of the glass on your partner\'s collarbone or jawline.'
      ]
    }
  },
  {
    id: "never-have-i-ever-intimate",
    category: 'drinking',
    intensity: 'Playful',
    title: 'Never Have I Ever: Intimate Edition',
    description: 'A classic game with a spicy twist.',
    content: {
      rules: [
        'Take turns saying something intimate you haven\'t done.',
        'If you have, drink and share the full story.'
      ]
    }
  },
  {
    id: "shot-roulette",
    category: 'drinking',
    intensity: 'Intense',
    title: 'Shot Roulette',
    description: 'High stakes. Some shots are water, some are liquor, some come with a dare.',
    content: {
      rules: [
        'Take a mystery shot.',
        'If it\'s liquor, you must perform the assigned intense dare immediately.'
      ]
    }
  },
  {
    id: "the-masters-cup",
    category: 'drinking',
    intensity: 'Extreme',
    title: 'The Master\'s Cup',
    description: 'A dominant/submissive drinking dynamic.',
    content: {
      rules: [
        'The dominant partner controls when and what the submissive drinks.',
        'Disobedience results in physical tease and denial penalties.'
      ]
    }
  },

  // ==========================================
  // DATE NIGHT GAMES
  // ==========================================
  {
    id: "taste-test",
    category: 'date_night',
    intensity: 'Sensory',
    title: 'Taste Test',
    description: 'Blindfolded food tasting focused on texture and flavor.',
    content: {
      rules: [
        'Blindfold your partner.',
        'Feed them different decadent foods and have them guess.',
        'Focus on the sensation on their lips and tongue.'
      ]
    }
  },
  {
    id: "roleplay-restaurant",
    category: 'date_night',
    intensity: 'Playful',
    title: 'Roleplay Restaurant',
    description: 'Pretend to be strangers meeting at a bar or restaurant.',
    content: {
      rules: [
        'Sit separately upon arriving.',
        'One partner approaches the other with an intriguing pickup line.',
        'Stay strictly in character the entire date.'
      ]
    }
  },
  {
    id: "public-secret",
    category: 'date_night',
    intensity: 'Intense',
    title: 'Public Secret',
    description: 'Wear something hidden during a public date.',
    content: {
      rules: [
        'Partner A wears the intimate secret device or lingerie.',
        'Partner B holds the controller or remote during dinner.',
        'Maintain composure while in public.'
      ]
    }
  },
  {
    id: "the-kidnapping-date",
    category: 'date_night',
    intensity: 'Extreme',
    title: 'The Kidnapping Date',
    description: 'A consensual romantic abduction starting from the moment you leave the house.',
    content: {
      rules: [
        'Partner B "abducts" Partner A with zero advance notice.',
        'Follow pre-arranged safe words and boundaries strictly.',
        'Drive to a surprise secluded location.'
      ]
    }
  }
];
