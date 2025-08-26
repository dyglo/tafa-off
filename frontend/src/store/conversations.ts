import { create } from 'zustand';
import type { Conversation, Message } from '@toff/shared';
import { apiClient } from '@/lib/api';

interface ConversationsState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  markMessagesAsRead: (conversationId: string, messageIds: string[]) => void;
  createConversation: (participantId: string) => Promise<Conversation>;
  clearError: () => void;
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isLoading: false,
  error: null,

  loadConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      const conversations = await apiClient.getConversations();
      set({ conversations, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to load conversations',
        isLoading: false 
      });
    }
  },

  loadMessages: async (conversationId: string, page = 1) => {
    try {
      const response = await apiClient.getMessages(conversationId, page);
      const { messages: newMessages } = response;
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: page === 1 
            ? newMessages 
            : [...(state.messages[conversationId] || []), ...newMessages]
        }
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to load messages'
      });
    }
  },

  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
  },

  addMessage: (conversationId: string, message: Message) => {
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message]
      }
    }));

    // Update conversation's last message
    set(state => ({
      conversations: state.conversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
          : conv
      )
    }));
  },

  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      }
    }));
  },

  markMessagesAsRead: (conversationId: string, messageIds: string[]) => {
    const readAt = new Date();
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map(msg =>
          messageIds.includes(msg.id) 
            ? { ...msg, isRead: true, readAt }
            : msg
        )
      }
    }));

    // Update conversation unread count
    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadCount: Math.max(0, (conv.unreadCount || 0) - messageIds.length) }
          : conv
      )
    }));
  },

  createConversation: async (participantId: string) => {
    try {
      const conversation = await apiClient.createConversation(participantId);
      
      set(state => ({
        conversations: [conversation, ...state.conversations]
      }));

      return conversation;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to create conversation'
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
