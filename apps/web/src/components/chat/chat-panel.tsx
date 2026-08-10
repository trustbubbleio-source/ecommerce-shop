import { Button, Input, cn } from '@akknerds/ui';
import { MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { SITE } from '../../config/site';
import { useChatBot } from '../../hooks/use-chat-bot';
import { ChatMessage } from './chat-message';

export function ChatPanel() {
  const { messages, pending, closeChat, send } = useChatBot();
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setDraft('');
    await send(text);
  }

  const lastBotId = [...messages].reverse().find((m) => m.role === 'bot')?.id;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn(
        'border-border bg-card text-card-foreground flex flex-col overflow-hidden border shadow-2xl',
        'fixed inset-x-0 bottom-0 z-40 h-[min(85dvh,32rem)] rounded-t-2xl',
        'md:inset-auto md:right-6 md:bottom-24 md:h-[min(85dvh,32rem)] md:w-[380px] md:rounded-2xl',
      )}
    >
      <header className="border-border flex items-center gap-3 border-b px-4 py-3">
        <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full">
          <MessageCircle className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="truncate text-sm font-semibold">
            {SITE.name} help
          </h2>
          <p className="text-muted-foreground truncate text-xs">Shipping, returns, stock & more</p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Close chat" onClick={closeChat}>
          <X />
        </Button>
      </header>

      <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            showSuggestions={message.id === lastBotId && !pending}
            onSuggestion={(text) => {
              void send(text);
            }}
          />
        ))}

        {pending ? (
          <div className="text-muted-foreground flex items-center gap-1 px-1 text-xs" aria-live="polite">
            <span className="bg-muted-foreground/70 size-1.5 animate-pulse rounded-full" />
            <span className="bg-muted-foreground/70 size-1.5 animate-pulse rounded-full [animation-delay:120ms]" />
            <span className="bg-muted-foreground/70 size-1.5 animate-pulse rounded-full [animation-delay:240ms]" />
            <span className="sr-only">Assistant is typing</span>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="border-border flex gap-2 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about shipping, stock…"
          aria-label="Chat message"
          disabled={pending}
          autoComplete="off"
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={pending || !draft.trim()}>
          <Send />
        </Button>
      </form>
    </section>
  );
}
