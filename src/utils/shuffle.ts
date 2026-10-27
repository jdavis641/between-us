/**
 * Fisher-Yates Shuffle Utility for Between Us
 * Supports deterministic or session-seeded shuffling for intimacy card games.
 */

export function shuffleArray<T>(array: T[], seed?: string | number): T[] {
  const result = [...array];
  if (result.length <= 1) return result;

  let random = Math.random;

  if (seed !== undefined) {
    let s = typeof seed === 'string'
      ? Array.from(seed).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 123456789)
      : (Math.abs(seed) || 123456789);

    random = () => {
      s = (1664525 * s + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Returns or initializes a session-unique key in browser sessionStorage.
 */
export function getSessionShuffleSeed(storageKey = 'between_us_card_shuffle_seed'): string {
  if (typeof window === 'undefined') {
    return String(Date.now());
  }

  try {
    let stored = sessionStorage.getItem(storageKey);
    if (!stored) {
      stored = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(storageKey, stored);
    }
    return stored;
  } catch {
    return String(Date.now());
  }
}

/**
 * Shuffles card games using session-based ordering.
 * Persists the resulting order in sessionStorage so that navigation within the same
 * session keeps the cards in a stable, fresh order, but each new session reshuffles.
 */
export function getShuffledCardGames<T extends { id: string }>(cards: T[]): T[] {
  if (typeof window === 'undefined' || cards.length <= 1) {
    return cards;
  }

  try {
    const sessionSeed = getSessionShuffleSeed('between_us_card_session_id');
    const storageKey = `between_us_card_order_${sessionSeed}`;
    const savedOrder = sessionStorage.getItem(storageKey);

    if (savedOrder) {
      const orderIds: string[] = JSON.parse(savedOrder);
      const cardMap = new Map<string, T>(cards.map(c => [c.id, c]));
      const sorted: T[] = [];

      for (const id of orderIds) {
        const item = cardMap.get(id);
        if (item) {
          sorted.push(item);
          cardMap.delete(id);
        }
      }

      // Append any new cards that weren't in the saved order
      cardMap.forEach(item => sorted.push(item));
      return sorted;
    }

    // New session: perform Fisher-Yates shuffle
    const shuffled = shuffleArray(cards, sessionSeed);
    const orderIds = shuffled.map(c => c.id);
    sessionStorage.setItem(storageKey, JSON.stringify(orderIds));
    return shuffled;
  } catch (err) {
    console.warn("Session card shuffle warning:", err);
    return shuffleArray(cards);
  }
}
