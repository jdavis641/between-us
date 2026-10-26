import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getSemanticEmbedding, formatVectorForPg } from './embeddings';

/**
 * Anatomical Reality Filter (Zero Tolerance Programmatic Sanitizer)
 * Strictly catches and replaces biologically erroneous hallucinations (such as female prostate references).
 */
export function enforceAnatomicalReality(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\b(?:her|she\s+felt\s+her)\s+prostate\b/gi, 'her anterior vaginal wall')
    .replace(/\bfemale\s+prostate\b/gi, "Skene's glands")
    .replace(/\bher\s+prostate\s+pulsed?\b/gi, 'her inner walls pulsed')
    .replace(/\bher\s+prostate\s+milked?\b/gi, 'her pelvic muscles tightened')
    .replace(/\bdeep\s+in\s+her\s+prostate\b/gi, 'deep against her G-spot')
    .replace(/\b(?:against|massaging|stroking|pressing|stimulating)\s+(?:her|the\s+female)\s+prostate\b/gi, 'stimulating her G-spot')
    .replace(/\bher\s+(?:prostate|prostatic)\s+(?:fluid|secretions?)\b/gi, 'her natural lubrication')
    .replace(/\bher\s+(?:testicles?|testes|scrotum)\b/gi, 'her labia')
    .replace(/\bher\s+prostate\s+milking\b/gi, 'her pelvic floor contracting')
    .replace(/\bmilking\s+her\s+prostate\b/gi, 'stimulating her G-spot');
}

interface ChapterJobParams {
  storyId: string;
  userId: string;
  title: string;
  chapter1Text: string;
  pacing: string;
  pacingRule: string;
  baseTolerance: string;
  theme?: string;
  systemInstruction: string;
  styleExcerpt?: string;
}

/**
 * Asynchronous background worker that generates Chapters 2 and 3 sequentially
 * while the reader is reading Chapter 1, appending them to Supabase generated_content.
 */
export async function computeAndAppendChaptersAsync(params: ChapterJobParams): Promise<void> {
  const {
    storyId,
    title,
    chapter1Text,
    pacing,
    pacingRule,
    theme,
    systemInstruction
  } = params;

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[Async Chunking] Missing OPENROUTER_API_KEY, skipping background chapters.");
    return;
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  try {
    console.log(`[Async Chunking] Generating Chapter 2 for story: ${title} (${storyId})`);

    // ==========================================
    // STEP 1: Generate Chapter 2: The Escalation
    // ==========================================
    const chapter2Prompt = `PREVIOUS TEXT (Chapter 1):\n${chapter1Text}\n\nCONTINUATION DIRECTIVE:
You are generating Chapter 2 of an expansive 20-chapter serialized novella (~1,500 words per chapter).
Markdown header: '## Chapter 2: The Escalation'
Pacing: ${pacing} (${pacingRule}).
Target length: 1,200 - 1,500 words.
Continue seamlessly from the exact moment Chapter 1 ended.
Escalate physical touches, intimate sensory dialogue, mounting tension, and micro-reactions with anatomical precision.
Do not conclude the entire novella yet; advance the Phase 1 narrative toward deeper intimacy.
Return a valid JSON object matching:
{
  "chapter": 2,
  "totalChapters": 20,
  "title": "${title.replace(/"/g, '\\"')}",
  "continuation": "## Chapter 2: The Escalation\\n\\n[Full Chapter 2 text...]"
}`;

    const ch2Completion = await openai.chat.completions.create({
      model: "sao10k/l3.1-euryale-70b",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: chapter2Prompt }
      ],
      temperature: 0.85,
      top_p: 0.9,
      max_tokens: 2500,
      response_format: { type: "json_object" },
      extra_body: {
        models: [
          "sao10k/l3.1-euryale-70b",
          "neversleep/llama-3.1-lumimaid-70b",
          "cognitivecomputations/dolphin-mistral-24b-venice-edition"
        ]
      }
    } as any);

    const ch2Raw = ch2Completion.choices[0]?.message?.content || "";
    let ch2Text = "";
    try {
      const parsed = JSON.parse(ch2Raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim());
      ch2Text = parsed.continuation || parsed.body || parsed.text || "";
    } catch {
      ch2Text = ch2Raw.trim();
    }

    ch2Text = enforceAnatomicalReality(ch2Text);

    if (!ch2Text.includes('## Chapter 2')) {
      ch2Text = `## Chapter 2: The Escalation\n\n${ch2Text}`;
    }

    const twoChaptersBody = `${chapter1Text.trim()}\n\n${ch2Text.trim()}`;

    // Update database with Chapter 2 appended
    await supabaseAdmin
      .from('generated_content')
      .update({
        body: JSON.stringify({
          title,
          chapter: 2,
          totalChapters: 20,
          body: twoChaptersBody,
          text: twoChaptersBody,
          word_count: twoChaptersBody.trim().split(/\s+/).length,
          status: 'chapter_2_ready'
        })
      })
      .eq('id', storyId);

    console.log(`[Async Chunking] Chapter 2 appended for story: ${title} (${storyId})`);

    // ==========================================
    // STEP 2: Generate Chapter 3: The Climax
    // ==========================================
    console.log(`[Async Chunking] Generating Chapter 3 for story: ${title} (${storyId})`);

    const chapter3Prompt = `PREVIOUS TEXT (Chapters 1 & 2):\n${twoChaptersBody}\n\nCONTINUATION DIRECTIVE:
You are generating Chapter 3 of an expansive 20-chapter serialized novella (~1,500 words per chapter).
Markdown header: '## Chapter 3: The Climax'
Pacing: ${pacing} (${pacingRule}).
Target length: 1,200 - 1,500 words.
Deliver an intense physical and emotional escalation for Chapter 3.
Culminate in a breathtaking, visceral encounter with granular physiological detail, anatomical accuracy, and emotional intensity.
Do not rush or summarize the scene; make the prose rich, unhurried, and evocative.
Return a valid JSON object matching:
{
  "chapter": 3,
  "totalChapters": 20,
  "title": "${title.replace(/"/g, '\\"')}",
  "continuation": "## Chapter 3: The Climax\\n\\n[Full Chapter 3 text...]"
}`;

    const ch3Completion = await openai.chat.completions.create({
      model: "sao10k/l3.1-euryale-70b",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: chapter3Prompt }
      ],
      temperature: 0.85,
      top_p: 0.9,
      max_tokens: 2500,
      response_format: { type: "json_object" },
      extra_body: {
        models: [
          "sao10k/l3.1-euryale-70b",
          "neversleep/llama-3.1-lumimaid-70b",
          "cognitivecomputations/dolphin-mistral-24b-venice-edition"
        ]
      }
    } as any);

    const ch3Raw = ch3Completion.choices[0]?.message?.content || "";
    let ch3Text = "";
    try {
      const parsed = JSON.parse(ch3Raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim());
      ch3Text = parsed.continuation || parsed.body || parsed.text || "";
    } catch {
      ch3Text = ch3Raw.trim();
    }

    ch3Text = enforceAnatomicalReality(ch3Text);

    if (!ch3Text.includes('## Chapter 3')) {
      ch3Text = `## Chapter 3: The Climax\n\n${ch3Text}`;
    }

    const fullStoryBody = `${twoChaptersBody.trim()}\n\n${ch3Text.trim()}`;
    const totalWordCount = fullStoryBody.trim().split(/\s+/).length;

    // Compute updated semantic embedding for the complete 3-chapter masterpiece
    const fullEmbedding = await getSemanticEmbedding(`${title} ${theme || ''} ${fullStoryBody.slice(0, 3000)}`);

    // Final update: mark with all 3 chapters ready and full vector embedding
    await supabaseAdmin
      .from('generated_content')
      .update({
        body: JSON.stringify({
          title,
          chapter: 3,
          totalChapters: 20,
          body: fullStoryBody,
          text: fullStoryBody,
          word_count: totalWordCount,
          status: 'completed'
        }),
        theme_embedding: formatVectorForPg(fullEmbedding)
      })
      .eq('id', storyId);

    console.log(`[Async Chunking] All 3 chapters successfully generated and indexed for story: ${title} (${storyId})`);
  } catch (err) {
    console.error("[Async Chunking Error] Failed to generate background chapters:", err);
  }
}
