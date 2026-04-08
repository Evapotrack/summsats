import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are a silent context processor for a personal project. You receive a current 500-word project summary, the last 10 entries, and one new entry. Your job is to produce an updated 500-word summary that captures the most important patterns, connections, contradictions, and conclusions across all the material.

Rules:
- Respond with ONLY the updated summary. No preamble, no commentary.
- Exactly 500 words. Not 499, not 501.
- Draw ONLY from the entries and existing summary. Never add outside knowledge, general facts, or your own opinions.
- Prioritize: connections between entries > recurring themes > recent developments > contradictions > older context that hasn't evolved.
- When the summary is full and new material arrives, compress older patterns to make room for new ones. Nothing is deleted — it is distilled into fewer words.
- If the user's thinking has evolved or reversed on a topic, reflect both the original position and the change.
- Write in third person: 'The project explores...' not 'You said...'
- Neutral tone. The summary observes the thinking, it does not evaluate it.`;

// Strip known preamble/postamble patterns
function stripWrappers(text: string): string {
  let cleaned = text.trim();
  // Common preambles
  const preamblePatterns = [
    /^(?:here\s+is|here's|updated|sure[!,.]?\s*here'?s?)\s+(?:the\s+)?(?:updated\s+)?(?:500[- ]word\s+)?summary[:\s]*/i,
    /^(?:based on|incorporating|reflecting)\s+(?:the\s+)?(?:new\s+)?entry[,:\s]*/i,
    /^(?:here's the updated 500-word summary)[^:]*[:\s]*/i,
    /^(?:the following is|below is)\s+(?:the\s+)?(?:updated\s+)?summary[:\s]*/i,
  ];
  for (const pattern of preamblePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Common postambles
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
  newEntry: string
): Promise<SummaryResult | null> {
  const client = new Anthropic({ apiKey });

  let userContent = '';
  if (currentSummary) {
    userContent += `CURRENT SUMMARY:\n${currentSummary}\n\n`;
  }
  if (recentEntries.length > 0) {
    userContent += `RECENT ENTRIES:\n`;
    recentEntries.forEach((entry, i) => {
      userContent += `--- Entry ---\n${entry}\n\n`;
    });
  }
  userContent += `NEW ENTRY:\n${newEntry}`;

  const attempt = async (): Promise<SummaryResult | null> => {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const rawText = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('');

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    // Try raw first
    let text = rawText.trim();
    let wc = countWords(text);

    if (wc !== 500) {
      // Try stripping preamble/postamble
      text = stripWrappers(rawText);
      wc = countWords(text);
    }

    if (wc === 500) {
      return { summary: text, wordCount: wc, inputTokens, outputTokens };
    }

    return null; // Rejected
  };

  // First attempt
  let result = await attempt();
  if (result) return result;

  // Retry once
  result = await attempt();
  return result; // null if still rejected — caller will queue
}
