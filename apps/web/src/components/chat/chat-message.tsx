import { Button, cn } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import type { ChatUiMessage } from '../../store/chat';

interface ChatMessageProps {
  message: ChatUiMessage;
  onSuggestion?: (text: string) => void;
  showSuggestions?: boolean;
}

export function ChatMessage({ message, onSuggestion, showSuggestions }: ChatMessageProps) {
  const isBot = message.role === 'bot';

  return (
    <div className={cn('flex flex-col gap-2', isBot ? 'items-start' : 'items-end')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isBot
            ? 'bg-secondary text-secondary-foreground rounded-bl-md'
            : 'bg-primary text-primary-foreground rounded-br-md',
        )}
      >
        {message.text}
      </div>

      {isBot && message.links && message.links.length > 0 ? (
        <div className="flex max-w-[95%] flex-wrap gap-1.5">
          {message.links.map((link) => (
            <Button
              key={`${link.href}-${link.label}`}
              asChild
              variant="outline"
              size="sm"
              className="h-8 max-w-full truncate rounded-full px-3 text-xs"
            >
              <Link to={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      ) : null}

      {isBot && showSuggestions && message.suggestions && message.suggestions.length > 0 ? (
        <div className="flex max-w-[95%] flex-wrap gap-1.5">
          {message.suggestions.map((chip) => (
            <Button
              key={chip}
              type="button"
              variant="ghost"
              size="sm"
              className="border-border h-8 rounded-full border px-3 text-xs"
              onClick={() => onSuggestion?.(chip)}
            >
              {chip}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
