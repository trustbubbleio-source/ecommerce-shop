import {
  CHAT_STARTER_CHIPS,
  createChatContext,
  matchIntent,
  type ChatLink,
  type ChatMatchResult,
} from '@akknerds/chat';
import { formatPrice } from '@akknerds/shared';
import { useCallback, useRef } from 'react';
import { PRELAUNCH } from '../config/launch';
import { SITE } from '../config/site';
import { api } from '../lib/api';
import { useChatStore } from '../store/chat';

const launchDateLabel = PRELAUNCH.description.replace(/^Purchases open\s+/i, '').replace(/\.$/, '');

const chatContext = createChatContext({
  brandName: SITE.name,
  supportEmail: SITE.email.support,
  contactEmail: SITE.email.contact,
  ordersEmail: SITE.email.orders,
  returnsEmail: SITE.email.returns,
  privacyEmail: SITE.email.privacy,
  partnerEmail: SITE.email.partner,
  tradeEmail: SITE.email.trade,
  storeLine: SITE.store.line,
  launchDateLabel,
  supportHours: SITE.supportHours,
});

function typingDelayMs(): number {
  return 200 + Math.floor(Math.random() * 200);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function resolveBotReply(result: ChatMatchResult): Promise<{
  text: string;
  links: ChatLink[];
  suggestions: string[];
}> {
  if (result.kind !== 'product_search' || !result.searchQuery) {
    return {
      text: result.reply,
      links: result.links,
      suggestions: result.suggestions,
    };
  }

  const query = result.searchQuery;
  try {
    const { products } = await api.listProducts({ search: query, limit: 5 });
    if (products.length === 0) {
      return {
        text: `I could not find anything matching “${query}”. Try another name, or browse the Buy filters.`,
        links: [
          { label: 'Buy', href: '/shop' },
          { label: 'FAQ', href: '/faq' },
        ],
        suggestions: ['Singles', 'Graded slabs', 'Shipping times'],
      };
    }

    const lines = products.map(
      (product) => `• ${product.name} — ${formatPrice(product.price, product.currency)}`,
    );
    return {
      text: `Here’s what I found for “${query}”:\n${lines.join('\n')}`,
      links: [
        ...products.map((product) => ({
          label: product.name,
          href: `/product/${product.slug}`,
        })),
        { label: 'Buy all', href: `/shop?search=${encodeURIComponent(query)}` },
      ],
      suggestions: result.suggestions.length > 0 ? result.suggestions : CHAT_STARTER_CHIPS,
    };
  } catch {
    return {
      text: `I hit a snag checking stock for “${query}”. You can search Buy directly, or try again in a moment.`,
      links: [
        { label: 'Buy', href: `/shop?search=${encodeURIComponent(query)}` },
        { label: 'Contact', href: '/contact' },
      ],
      suggestions: ['Contact', 'Shipping times'],
    };
  }
}

/** Welcome bubble seeded once when the panel first opens. */
export function ensureWelcomeMessage(): void {
  const { messages, appendMessage } = useChatStore.getState();
  if (messages.length > 0) return;

  const greeting = matchIntent('hello', chatContext);
  appendMessage({
    role: 'bot',
    text: greeting.reply,
    links: greeting.links,
    suggestions: greeting.suggestions.length > 0 ? greeting.suggestions : CHAT_STARTER_CHIPS,
  });
}

export function useChatBot() {
  const open = useChatStore((s) => s.open);
  const messages = useChatStore((s) => s.messages);
  const pending = useChatStore((s) => s.pending);
  const openChat = useChatStore((s) => s.openChat);
  const closeChat = useChatStore((s) => s.closeChat);
  const toggleChat = useChatStore((s) => s.toggleChat);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const setPending = useChatStore((s) => s.setPending);
  const inFlight = useRef(false);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || inFlight.current) return;

      inFlight.current = true;
      appendMessage({ role: 'user', text });
      setPending(true);

      try {
        const matched = matchIntent(text, chatContext);
        const reply = await resolveBotReply(matched);
        await sleep(typingDelayMs());
        appendMessage({
          role: 'bot',
          text: reply.text,
          links: reply.links,
          suggestions: reply.suggestions,
        });
      } finally {
        setPending(false);
        inFlight.current = false;
      }
    },
    [appendMessage, setPending],
  );

  const openWithWelcome = useCallback(() => {
    openChat();
    ensureWelcomeMessage();
  }, [openChat]);

  return {
    open,
    messages,
    pending,
    openChat: openWithWelcome,
    closeChat,
    toggleChat: () => {
      const next = !useChatStore.getState().open;
      toggleChat();
      if (next) ensureWelcomeMessage();
    },
    send,
    starterChips: CHAT_STARTER_CHIPS,
  };
}
