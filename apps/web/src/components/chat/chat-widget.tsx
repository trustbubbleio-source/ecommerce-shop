import { Button, cn } from '@akknerds/ui';
import { MessageCircle, X } from 'lucide-react';
import { Suspense, lazy, useEffect } from 'react';
import { useChatBot } from '../../hooks/use-chat-bot';

const ChatPanel = lazy(() =>
  import('./chat-panel').then((mod) => ({ default: mod.ChatPanel })),
);

export function ChatWidget() {
  const { open, openChat, closeChat } = useChatBot();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeChat();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeChat]);

  return (
    <>
      {open ? (
        <Suspense fallback={null}>
          <ChatPanel />
        </Suspense>
      ) : null}

      <Button
        type="button"
        size="icon"
        aria-label={open ? 'Close chat' : 'Open chat help'}
        aria-expanded={open}
        onClick={() => {
          if (open) closeChat();
          else openChat();
        }}
        className={cn(
          'fixed right-4 z-40 size-14 rounded-full shadow-lg',
          'bottom-[max(1.25rem,env(safe-area-inset-bottom))]',
          'md:right-6 md:bottom-6',
          'bg-foreground text-background hover:bg-foreground/90',
          'shadow-[0_0_40px_-12px_hsl(0_0%_100%/0.35)]',
          // Full-screen chat already has a close control — hide FAB on phone/tablet while open
          open && 'max-lg:hidden',
        )}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </>
  );
}
