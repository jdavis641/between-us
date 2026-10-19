/**
 * Embedding & Semantic Vector Utility for pgvector & Semantic Inventory Routing
 * Supports 1536-dimensional vector embeddings via OpenAI, OpenRouter, or deterministic local fallback.
 */

const VECTOR_DIMENSION = 1536;

/**
 * Calculates cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Deterministic local semantic embedding generator (1536 dimensions, L2-normalized).
 * Uses character n-grams and token hash projections to preserve semantic proximity.
 */
export function generateLocalSemanticVector(text: string): number[] {
  const vector = new Array(VECTOR_DIMENSION).fill(0);
  const normalized = (text || '').toLowerCase().trim();
  if (!normalized) return vector;

  const tokens = normalized.match(/\b\w+\b/g) || [normalized];
  
  // 1. Hash word tokens with semantic weighting
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % VECTOR_DIMENSION;
    vector[idx] += 1.5;

    // Sub-token bi-grams for morphological similarity
    for (let i = 0; i < token.length - 1; i++) {
      const bi = token.charCodeAt(i) * 31 + token.charCodeAt(i + 1);
      const biIdx = Math.abs(bi) % VECTOR_DIMENSION;
      vector[biIdx] += 0.5;
    }
  }

  // 2. Multi-word phrase skip-grams (for theme similarity)
  for (let i = 0; i < tokens.length - 1; i++) {
    const pair = `${tokens[i]}_${tokens[i + 1]}`;
    let pHash = 0;
    for (let j = 0; j < pair.length; j++) {
      pHash = (pHash << 5) - pHash + pair.charCodeAt(j);
      pHash |= 0;
    }
    const pIdx = Math.abs(pHash) % VECTOR_DIMENSION;
    vector[pIdx] += 2.0;
  }

  // 3. L2 Normalize vector
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    norm += vector[i] * vector[i];
  }
  const sqrtNorm = Math.sqrt(norm) || 1;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    vector[i] = Number((vector[i] / sqrtNorm).toFixed(6));
  }

  return vector;
}

/**
 * Returns a 1536-dimensional semantic embedding vector for a given text.
 * Cascades: OpenAI API -> OpenRouter API -> Deterministic Local Hashing Vector.
 */
export async function getSemanticEmbedding(text: string): Promise<number[]> {
  const cleanText = (text || '').trim();
  if (!cleanText) {
    return generateLocalSemanticVector('sensory romance intimacy');
  }

  // Strategy 1: OpenAI text-embedding-3-small if OPENAI_API_KEY is available
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: cleanText.slice(0, 8000),
          dimensions: VECTOR_DIMENSION
        }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        const embedding = data?.data?.[0]?.embedding;
        if (Array.isArray(embedding) && embedding.length === VECTOR_DIMENSION) {
          return embedding;
        }
      }
    } catch (err) {
      console.warn('OpenAI embedding lookup failed, trying secondary provider:', err);
    }
  }

  // Strategy 2: OpenRouter embeddings if OPENROUTER_API_KEY is available
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/text-embedding-3-small',
          input: cleanText.slice(0, 8000)
        }),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        const embedding = data?.data?.[0]?.embedding;
        if (Array.isArray(embedding) && embedding.length === VECTOR_DIMENSION) {
          return embedding;
        }
      }
    } catch (err) {
      console.warn('OpenRouter embedding lookup failed, utilizing local semantic vector:', err);
    }
  }

  // Strategy 3: Deterministic local semantic vector
  return generateLocalSemanticVector(cleanText);
}

/**
 * Formats a JavaScript number array into a PostgreSQL pgvector literal string: '[0.123, -0.456, ...]'
 */
export function formatVectorForPg(vec: number[]): string {
  return `[${vec.join(',')}]`;
}
