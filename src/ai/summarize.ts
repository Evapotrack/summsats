import Anthropic from '@anthropic-ai/sdk';
import type { SummaryTone } from '../types';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;

const BASE_RULES = `Rules:
- Respond with ONLY the updated summary. No preamble, no commentary.
- Between 150 and 500 words. Use fewer words when entries are sparse, more as material grows.
- Draw ONLY from the entries and existing summary. Never add outside knowledge, general facts, or your own opinions.
- Prioritize: connections between entries > recurring themes > recent developments > contradictions > older context that hasn't evolved.
- When the summary is full and new material arrives, compress older patterns to make room for new ones. Nothing is deleted — it is distilled into fewer words.
- If the user's thinking has evolved or reversed on a topic, reflect both the original position and the change.
- Write in third person: 'The project explores...' not 'You said...'`;

const TONE_INSTRUCTIONS: Record<SummaryTone, string> = {
  educational: `You are a silent context processor for a personal project. You receive a current project summary, the last 10 entries, and one new entry. Your job is to produce an updated summary (150-500 words) that captures the most important patterns, connections, contradictions, and conclusions across all the material.

Write in an educational tone: structured, clear, and analytical. Organize ideas by topic. Use precise language. Explain relationships between concepts as a teacher would — connecting cause to effect, distinguishing hypothesis from evidence, and building understanding incrementally.

${BASE_RULES}
- Educational tone: structured and analytical. Organize by topic. Explain relationships clearly.`,

  reflective: `You are a silent context processor for a personal project. You receive a current project summary, the last 10 entries, and one new entry. Your job is to produce an updated summary (150-500 words) that captures the most important patterns, connections, contradictions, and conclusions across all the material.

Write in a reflective tone: introspective, personal, and observant. Focus on how thinking has changed over time. Surface the emotional and intellectual arc of the project — what surprised, what challenged assumptions, what remains unresolved.

${BASE_RULES}
- Reflective tone: introspective and observant. Surface the arc of evolving thought.`,

  philosophical: `You are a silent context processor for a personal project. You receive a current project summary, the last 10 entries, and one new entry. Your job is to produce an updated summary (150-500 words) that captures the most important patterns, connections, contradictions, and conclusions across all the material.

Write in a philosophical tone: abstract, conceptual, and probing. Explore the deeper implications of ideas. Ask what the patterns mean, not just what they are. Surface tensions between competing principles and the assumptions underlying each position.

${BASE_RULES}
- Philosophical tone: abstract and probing. Explore implications and underlying assumptions.`,
};

function getSystemPrompt(tone: SummaryTone): string {
  return TONE_INSTRUCTIONS[tone];
}

// Strip known preamble/postamble patterns
function stripWrappers(text: string): string {
  let cleaned = text.trim();
  const preamblePatterns = [
    /^(?:here\s+is|here's|updated|sure[!,.]?\s*here'?s?)\s+(?:the\s+)?(?:updated\s+)?(?:500[- ]word\s+)?summary[:\s]*/i,
    /^(?:based on|incorporating|reflecting)\s+(?:the\s+)?(?:new\s+)?entry[,:\s]*/i,
    /^(?:here's the updated 500-word summary)[^:]*[:\s]*/i,
    /^(?:the following is|below is)\s+(?:the\s+)?(?:updated\s+)?summary[:\s]*/i,
  ];
  for (const pattern of preamblePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  const postamblePatterns = [
    /\n\n(?:let me know|this summary|i've (?:updated|incorporated)|note:).*/i,
  ];
  for (const pattern of postamblePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.trim();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

export interface SummaryResult {
  summary: string;
  wordCount: number;
  inputTokens: number;
  outputTokens: number;
}

export async function generateSummary(
  apiKey: string,
  currentSummary: string | null,
  recentEntries: string[],
  newEntry: string,
  tone: SummaryTone = 'educational'
): Promise<SummaryResult | null> {
  const client = new Anthropic({ apiKey });
  const systemPrompt = getSystemPrompt(tone);

  let userContent = '';
  if (currentSummary) {
    userContent += `CURRENT SUMMARY:\n${currentSummary}\n\n`;
  }
  if (recentEntries.length > 0) {
    userContent += `RECENT ENTRIES:\n`;
    recentEntries.forEach((entry) => {
      userContent += `--- Entry ---\n${entry}\n\n`;
    });
  }
  userContent += `NEW ENTRY:\n${newEntry}`;

  const attempt = async (): Promise<SummaryResult | null> => {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const rawText = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('');

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    let text = rawText.trim();
    let wc = countWords(text);

    if (wc !== 500) {
      text = stripWrappers(rawText);
      wc = countWords(text);
    }

    if (wc >= 150 && wc <= 500) {
      return { summary: text, wordCount: wc, inputTokens, outputTokens };
    }

    return null;
  };

  let result = await attempt();
  if (result) return result;

  result = await attempt();
  return result;
}
