import type { ChatLink } from '@akknerds/chat';
import { create } from 'zustand';

export type ChatRole = 'user' | 'bot';

export interface ChatUiMessage {
  id: string;
  role: ChatRole;
  text: string;
  links?: ChatLink[];
  suggestions?: string[];
}

interface ChatState {
  open: boolean;
  messages: ChatUiMessage[];
  pending: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  appendMessage: (message: Omit<ChatUiMessage, 'id'> & { id?: string }) => void;
  setPending: (pending: boolean) => void;
  clearMessages: () => void;
}

let messageSeq = 0;

function nextId(): string {
  messageSeq += 1;
  return `chat-${Date.now()}-${messageSeq}`;
}

export const useChatStore = create<ChatState>((set) => ({
  open: false,
  messages: [],
  pending: false,
  openChat: () => set({ open: true }),
  closeChat: () => set({ open: false }),
  toggleChat: () => set((state) => ({ open: !state.open })),
  appendMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: message.id ?? nextId(),
          role: message.role,
          text: message.text,
          links: message.links,
          suggestions: message.suggestions,
        },
      ],
    })),
  setPending: (pending) => set({ pending }),
  clearMessages: () => set({ messages: [] }),
}));
