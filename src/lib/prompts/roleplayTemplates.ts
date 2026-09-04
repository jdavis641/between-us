export const roleplayTemplates = [
  {
    id: 'masquerade',
    name: 'The Masquerade Ball',
    description: 'A mysterious evening at a high-society masquerade ball where true identities are hidden, allowing hidden desires to surface.',
    tone: 'Elegant, suspenseful, romantic.',
  },
  {
    id: 'undercover',
    name: 'Undercover Agents',
    description: 'Two rival spies are forced to share a single hotel room to maintain their cover during a dangerous mission.',
    tone: 'Playful, competitive, thrilling.',
  },
  {
    id: 'coffee_shop',
    name: 'The Coffee Shop Encounter',
    description: 'A seemingly chance encounter at a busy cafe leads to a deep, unexpected connection.',
    tone: 'Sweet, serendipitous, cozy.',
  },
  {
    id: 'royal_court',
    name: 'Forbidden Royal Court',
    description: 'A secret rendezvous in the royal gardens between two people whose stations in life should keep them apart.',
    tone: 'Passionate, dramatic, formal.',
  },
  {
    id: 'stranded',
    name: 'Stranded Together',
    description: 'A sudden storm forces two travelers to take shelter in a remote cabin, relying on each other to stay warm.',
    tone: 'Intimate, protective, comforting.',
  }
];

export function getPromptBuilder(context: {
  timingContext: string;
  soloMode: boolean;
  pronouns: string[];
  intensity: number;
  toys: string[];
  definitely: string[];
  curious: string[];
  offLimits: string[];
}) {
  const intensityMap: Record<number, string> = {
    1: 'Mild: Focus entirely on romantic tension, emotional connection, and sensory details.',
    2: 'Medium: Focus on playful suggestions, flirtatious dialogue, and escalating romantic tension.',
    3: 'Spicy: Focus on deep passion, uninhibited emotional vulnerability, and intense romantic intimacy.'
  };

  const intensityGuidance = intensityMap[context.intensity] || intensityMap[1];

  return `
    You are an expert intimacy guide creating a customized romantic fantasy script.
    
    Context: ${context.timingContext}
    Solo Mode: ${context.soloMode}
    Pronouns: ${context.pronouns.join(', ')}
    Intensity Level (${context.intensity}/3): ${intensityGuidance}
    Incorporate (if applicable): ${context.toys.join(', ')}
    
    Themes to focus on: ${context.definitely.join(', ')} and optionally ${context.curious.join(', ')}.
    
    STRICT EXCLUSIONS: You must completely exclude any mention of these topics: ${context.offLimits.join(', ')}.
    CRITICAL RULE: The content must remain a "romantic fantasy script" focusing on emotional engagement and intimacy. Do not generate highly explicit or purely erotic sexual content.
    
    Keep the tone emotionally engaging and structurally immersive. If this is a weekend script, include (a) Context & Setting, (b) Optional Pre-Experience Tasks, and (c) A theatrical script with dialogue and stage directions.
  `;
}
