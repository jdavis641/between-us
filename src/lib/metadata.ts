export interface DetailedStoryMetadata {
  tags: string[];
  sexual_orientation: string;
  kink_categories: string[];
  genre_topic: string;
  tropes: string[];
  word_count: number;
}

export function extractDetailedMetaTags({
  theme,
  targetBoundary,
  playMode,
  contentType,
  rawText = '',
  customKinks = [],
  activeTrope
}: {
  theme?: string;
  targetBoundary?: string;
  playMode?: string;
  contentType: string;
  rawText?: string;
  customKinks?: string[];
  activeTrope?: any;
}): DetailedStoryMetadata {
  const tags = new Set<string>();
  tags.add(contentType);
  if (playMode) tags.add(playMode.toLowerCase());
  
  const tier = (targetBoundary || 'Moderate').toLowerCase();
  tags.add(tier);

  const keywordsByTier: Record<string, string[]> = {
    sensory: ['slow_burn', 'massage', 'breathwork', 'feather_touch', 'emotional_intimacy', 'vulnerability', 'candle_light', 'body_worship'],
    playful: ['flirting', 'teasing', 'edging_light', 'strip_challenge', 'lingerie', 'ice_contrast', 'public_thrill', 'spanking_light'],
    intense: ['power_dynamics', 'dominance', 'submission', 'strict_control', 'restraints', 'sensory_deprivation', 'orgasm_denial'],
    extreme: ['total_surrender', 'unconditional_obedience', 'heavy_restraints', 'sensory_overload', 'deep_taboo', 'complete_domination']
  };

  const pool = keywordsByTier[tier] || keywordsByTier['playful'];
  pool.slice(0, 4).forEach(k => tags.add(k));

  if (theme) {
    const cleanTheme = theme.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    cleanTheme.split(/\s+/).filter(w => w.length > 3).slice(0, 3).forEach(w => tags.add(w));
  }

  const kinkCategories: string[] = [];
  if (customKinks && Array.isArray(customKinks)) {
    customKinks.forEach(k => {
      const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
      if (clean) {
        tags.add(clean);
        kinkCategories.push(clean);
      }
    });
  }

  // Infer Sexual Orientation from prompt/text/perspective
  const lowerText = `${theme || ''} ${rawText || ''}`.toLowerCase();
  let orientation = 'heterosexual';
  if (lowerText.includes('wlw') || lowerText.includes('lesbian') || lowerText.includes('two women') || lowerText.includes('sapphic')) {
    orientation = 'lesbian';
  } else if (lowerText.includes('mlm') || lowerText.includes('gay') || lowerText.includes('two men') || lowerText.includes('achillean')) {
    orientation = 'gay';
  } else if (lowerText.includes('bisexual') || lowerText.includes('bi ') || playMode === 'group' || lowerText.includes('threesome')) {
    orientation = 'bisexual';
  } else if (lowerText.includes('queer') || lowerText.includes('non-binary') || lowerText.includes('trans')) {
    orientation = 'queer';
  }
  tags.add(orientation);

  // Infer Genre / Topic
  let genreTopic = 'contemporary_romance';
  if (lowerText.includes('gothic') || lowerText.includes('vampire') || lowerText.includes('shadows') || lowerText.includes('masquerade') || lowerText.includes('manor')) {
    genreTopic = 'gothic_romance';
  } else if (lowerText.includes('fantasy') || lowerText.includes('court') || lowerText.includes('magic') || lowerText.includes('fae')) {
    genreTopic = 'romantic_fantasy';
  } else if (lowerText.includes('taboo') || lowerText.includes('forbidden') || lowerText.includes('secret')) {
    genreTopic = 'taboo_erotica';
  } else if (lowerText.includes('holiday') || lowerText.includes('halloween') || lowerText.includes('valentine')) {
    genreTopic = 'holiday_seasonal';
  }
  tags.add(genreTopic);

  // Tropes
  const tropeList: string[] = [];
  if (activeTrope) {
    const tName = typeof activeTrope === 'object' ? activeTrope.trope || activeTrope.title : String(activeTrope);
    if (tName) tropeList.push(tName.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  }
  if (lowerText.includes('enemies to lovers') || lowerText.includes('rival')) tropeList.push('enemies_to_lovers');
  if (lowerText.includes('forced proximity') || lowerText.includes('snowed in') || lowerText.includes('stranded')) tropeList.push('forced_proximity');
  if (lowerText.includes('second chance') || lowerText.includes('reunited')) tropeList.push('second_chance');
  if (lowerText.includes('slow burn')) tropeList.push('slow_burn');
  if (lowerText.includes('power dynamic') || lowerText.includes('boss')) tropeList.push('power_imbalance');
  tropeList.forEach(t => tags.add(t));

  const wordCount = rawText ? rawText.trim().split(/\s+/).filter(Boolean).length : 0;

  return {
    tags: Array.from(tags),
    sexual_orientation: orientation,
    kink_categories: kinkCategories.length > 0 ? kinkCategories : pool.slice(0, 3),
    genre_topic: genreTopic,
    tropes: tropeList.length > 0 ? tropeList : ['intimate_connection'],
    word_count: wordCount
  };
}

export function extractIntimacyMetaTags(params: any): string[] {
  return extractDetailedMetaTags(params).tags;
}
