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
  // Card Games
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

  // Movie Night Games
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

  // Drinking Games
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

  // Date Night Games
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
