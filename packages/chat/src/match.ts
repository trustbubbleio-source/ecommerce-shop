import type { ChatContext } from './context.js';
import {
  CHAT_INTENTS,
  FALLBACK_INTENT,
  type ChatIntent,
  type ChatMatchResult,
} from './intents.js';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveReply(intent: ChatIntent, ctx: ChatContext): string {
  if (!intent.reply) return '';
  return typeof intent.reply === 'function' ? intent.reply(ctx) : intent.reply;
}

function scoreIntent(normalized: string, intent: ChatIntent): number {
  let score = 0;
  for (const keyword of intent.keywords) {
    if (!keyword) continue;
    if (normalized.includes(keyword)) {
      // Longer phrases beat short tokens.
      score += keyword.split(' ').length * (intent.weight ?? 1);
    }
  }
  return score;
}

/** Pull a search query from common “do you have X” style messages. */
export function extractProductSearchQuery(message: string): string | null {
  const raw = message.trim();
  if (!raw) return null;

  const patterns = [
    /(?:do you (?:have|sell)|have you got|looking for|search(?:ing)? for|find(?: me)?|got any|in stock[:\s]+)\s+(.+)/i,
    /(?:any|stock of)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    const captured = match?.[1]?.trim();
    if (captured && captured.length >= 2) {
      return captured.replace(/[?.!]+$/, '').trim();
    }
  }

  return null;
}

function toResult(intent: ChatIntent, ctx: ChatContext, searchQuery?: string): ChatMatchResult {
  const isProductSearch = Boolean(intent.productSearch && searchQuery);
  return {
    intentId: intent.id,
    kind: isProductSearch ? 'product_search' : 'reply',
    reply: resolveReply(intent, ctx),
    suggestions: intent.suggestions ?? [],
    links: intent.links ?? [],
    searchQuery: isProductSearch ? searchQuery : undefined,
  };
}

/**
 * Match a user message to the best canned intent.
 * Product-search intents include an extracted `searchQuery` for the caller to fetch live stock.
 */
export function matchIntent(message: string, ctx: ChatContext): ChatMatchResult {
  const normalized = normalize(message);
  if (!normalized) {
    return toResult(
      {
        ...FALLBACK_INTENT,
        reply: (c) =>
          `Say hi, or ask about shipping, returns, or a card you are hunting at ${c.brandName}.`,
      },
      ctx,
    );
  }

  let best: { intent: ChatIntent; score: number } | null = null;
  for (const intent of CHAT_INTENTS) {
    const score = scoreIntent(normalized, intent);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { intent, score };
  }

  if (best?.intent.productSearch) {
    const query =
      extractProductSearchQuery(message) ??
      normalized
        .replace(
          /^(looking for|do you have|have you got|search(?:ing)? for|find(?: me)?|got any|in stock)\s+/i,
          '',
        )
        .trim();
    if (query.length >= 2) {
      return toResult(best.intent, ctx, query);
    }
  }

  // Trigger-phrase product search even if another weak intent tied.
  const searchQuery = extractProductSearchQuery(message);
  if (searchQuery && (!best || best.score < 2)) {
    const productIntent = CHAT_INTENTS.find((i) => i.id === 'product_search')!;
    return toResult(productIntent, ctx, searchQuery);
  }

  if (!best) {
    return toResult(FALLBACK_INTENT, ctx);
  }

  // Product-search keyword matched but no usable query — treat as shop help.
  if (best.intent.productSearch) {
    return toResult(
      CHAT_INTENTS.find((i) => i.id === 'shop') ?? FALLBACK_INTENT,
      ctx,
    );
  }

  return toResult(best.intent, ctx);
}
