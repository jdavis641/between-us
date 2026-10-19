-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add vector embedding column to generated_content table for semantic routing
ALTER TABLE public.generated_content 
ADD COLUMN IF NOT EXISTS theme_embedding vector(1536);

-- Index for fast cosine similarity lookups on generated_content
CREATE INDEX IF NOT EXISTS idx_generated_content_theme_embedding 
ON public.generated_content 
USING ivfflat (theme_embedding vector_cosine_ops)
WITH (lists = 100);

-- 3. Create style_references table to house curated, top-rated literature style references
CREATE TABLE IF NOT EXISTS public.style_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT DEFAULT 'Literotica Master',
    excerpt TEXT NOT NULL,
    pacing TEXT DEFAULT 'Medium Burn',
    boundary_level TEXT DEFAULT 'Intense',
    rating NUMERIC DEFAULT 4.9,
    theme_embedding vector(1536),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on style_references
ALTER TABLE public.style_references ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users and service_role
CREATE POLICY "Allow read access to style_references" 
ON public.style_references FOR SELECT 
USING (true);

-- Index for fast cosine similarity lookups on style_references
CREATE INDEX IF NOT EXISTS idx_style_references_theme_embedding 
ON public.style_references 
USING ivfflat (theme_embedding vector_cosine_ops)
WITH (lists = 50);

-- 4. RPC function: match_generated_content (Semantic Inventory Retrieval)
-- Returns cached stories with cosine similarity score above the specified threshold
CREATE OR REPLACE FUNCTION match_generated_content (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.85,
  match_count int DEFAULT 5,
  filter_content_type text DEFAULT 'literature'
)
RETURNS TABLE (
  id uuid,
  content_type text,
  title text,
  body text,
  tolerance_tier text,
  play_mode text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id,
    gc.content_type,
    gc.title,
    gc.body,
    gc.tolerance_tier,
    gc.play_mode,
    (1 - (gc.theme_embedding <=> query_embedding))::float AS similarity
  FROM public.generated_content gc
  WHERE gc.status = 'active'
    AND gc.theme_embedding IS NOT NULL
    AND (filter_content_type IS NULL OR gc.content_type = filter_content_type)
    AND (1 - (gc.theme_embedding <=> query_embedding)) >= match_threshold
  ORDER BY (gc.theme_embedding <=> query_embedding) ASC
  LIMIT match_count;
END;
$$;

-- 5. RPC function: match_style_references (Literotica RAG Retrieval)
-- Returns top-rated excerpts matching pacing and boundary level, ranked by rating and vector similarity
CREATE OR REPLACE FUNCTION match_style_references (
  query_embedding vector(1536) DEFAULT NULL,
  match_count int DEFAULT 3,
  filter_pacing text DEFAULT NULL,
  filter_boundary text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  excerpt text,
  pacing text,
  boundary_level text,
  rating numeric,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.id,
    sr.title,
    sr.author,
    sr.excerpt,
    sr.pacing,
    sr.boundary_level,
    sr.rating,
    CASE 
      WHEN query_embedding IS NOT NULL AND sr.theme_embedding IS NOT NULL 
      THEN (1 - (sr.theme_embedding <=> query_embedding))::float 
      ELSE 1.0::float 
    END AS similarity
  FROM public.style_references sr
  WHERE (filter_pacing IS NULL OR sr.pacing ILIKE '%' || filter_pacing || '%')
    AND (filter_boundary IS NULL OR sr.boundary_level ILIKE '%' || filter_boundary || '%')
  ORDER BY 
    sr.rating DESC,
    CASE 
      WHEN query_embedding IS NOT NULL AND sr.theme_embedding IS NOT NULL 
      THEN (sr.theme_embedding <=> query_embedding) 
      ELSE 0 
    END ASC
  LIMIT match_count;
END;
$$;

-- 6. Seed top-tier master literature style references for RAG Few-Shot injection
INSERT INTO public.style_references (title, author, pacing, boundary_level, rating, tags, excerpt)
VALUES 
(
  'Velvet and Embers',
  'Literotica Master',
  'Slow Burn',
  'Sensory',
  4.95,
  ARRAY['slow burn', 'sensory', 'touch', 'romantic', 'intimacy'],
  'The candlelight flickered against the dark wainscoting, casting elongated amber shadows across her collarbone. He did not rush. Every movement was agonizingly measured, a deliberate exploration that tested the fragile boundaries of their restraint. His thumb traced the fragile ridge of her jawline, resting just beneath the frantic flutter of her pulse. She let out a shuddering breath that broke the quiet room, her fingers curling into the heavy wool of his jacket as if anchoring herself against a rising tide. "Look at me," he murmured, his voice low, gravel-rough with weeks of deferred desire. When her eyes met his, the unspoken tension between them snapped into sharp, incandescent focus.'
),
(
  'Unspoken Coordinates',
  'Literotica Master',
  'Medium Burn',
  'Playful',
  4.92,
  ARRAY['teasing', 'power dynamic', 'sensory', 'anticipation'],
  'Her laughter was breathless, muffled against the curve of his neck as he pinned both of her wrists above the velvet headboard. She tried to squirm free, only for his thigh to press firmly between hers, pinning her with effortless weight. "You thought you had control tonight," he whispered, lips brushing the sensitive hollow behind her ear until goosebumps bloomed down her throat. "Every touch belongs to me until I say otherwise." Her hips arched involuntarily, chasing the friction she pretended to resist. A sharp gasp caught in her throat as his free hand slid down her ribcage, tracing the curve of her waist before settling with possessive warmth over the exposed curve of her hip.'
),
(
  'Iron and Velvet',
  'Literotica Master',
  'Medium Burn',
  'Intense',
  4.98,
  ARRAY['intense', 'explicit', 'climax', 'anatomical', 'visceral'],
  'The room dissolved into sensory extremes: the cool night air through the open terrace contrasting sharply with the fever-heat radiating between their slick bodies. There was no hesitation left between them. His hands gripped her hips, pulling her flush against him with an intoxicating, heavy momentum. Every stroke was deep, deliberate, and devastatingly precise, drawing a ragged moan from her chest that she was powerless to swallow. Her core clenched around him in tight, rhythmic ripples, her nails digging crescent moons into his shoulder blades as the crest of the climax broke over them both—relentless, blinding, and visceral.'
),
(
  'Bound by Midnight',
  'Literotica Master',
  'Quick Burn',
  'Extreme',
  4.94,
  ARRAY['quick burn', 'power exchange', 'intense', 'explicit', 'sensory'],
  'The door clicked shut, and within seconds the distance between them evaporated. He backed her against the heavy mahogany door, his mouth crashing over hers with unbridled hunger. His fingers tangled into her hair, angling her head back to expose the delicate line of her throat. "No more waiting," he growled against her skin, tearing away the silk barrier with a sharp tug that sent her heart racing into her throat. The heat between her thighs was immediate and drenched, a desperate ache meeting an uncompromising command that commanded complete surrender from the first touch.'
)
ON CONFLICT DO NOTHING;
