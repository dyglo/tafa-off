import { useEffect, useRef } from 'react';
import { useSocket as useSocketContext } from '@/components/socket-provider';
import { useConversationsStore } from '@/store/conversations';
import { useAuthStore } from '@/store/auth';
import type { Message } from '@toff/shared';

interface TypingUser {
  userId: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

interface UseSocketOptions {
  onMessageReceived?: (message: Message) => void;
  onUserTyping?: (data: TypingUser & { conversationId: string }) => void;
  onUserStoppedTyping?: (data: { userId: string; conversationId: string }) => void;
  onUserOnline?: (data: { userId: string; user: any }) => void;
  onUserOffline?: (data: { userId: string; lastSeen: Date }) => void;
}

export const useSocketEvents = (options: UseSocketOptions = {}) => {
  const { socket, isConnected } = useSocketContext();
  const { user } = useAuthStore();
  const { addMessage, updateMessage, markMessagesAsRead } = useConversationsStore();
  
  const currentConversationId = useRef<string | null>(null);
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Message events
    const handleMessageReceived = (message: Message) => {
      addMessage(message.conversationId, message);
      options.onMessageReceived?.(message);
    };

    const handleMessageDelivered = (data: { messageId: string; deliveredAt: Date }) => {
      // Find which conversation this message belongs to
      const { messages } = useConversationsStore.getState();
      for (const [conversationId, msgs] of Object.entries(messages)) {
        const message = msgs.find(m => m.id === data.messageId);
        if (message) {
          updateMessage(conversationId, data.messageId, {
            deliveredAt: data.deliveredAt
          });
          break;
        }
      }
    };

    const handleMessageRead = (data: { messageId: string; userId: string; readAt: Date }) => {
      // Only update if someone else read our message
      if (data.userId === user.id) return;
      
      const { messages } = useConversationsStore.getState();
      for (const [conversationId, msgs] of Object.entries(messages)) {
        const message = msgs.find(m => m.id === data.messageId);
        if (message && message.senderId === user.id) {
          updateMessage(conversationId, data.messageId, {
            isRead: true,
            readAt: data.readAt
          });
          break;
        }
      }
    };

    // Typing events
    const handleUserTyping = (data: TypingUser & { conversationId: string }) => {
      if (data.userId === user.id) return; // Ignore own typing
      
      options.onUserTyping?.(data);
      
      // Clear existing timeout for this user
      if (typingTimeouts.current[data.userId]) {
        clearTimeout(typingTimeouts.current[data.userId]);
      }
      
      // Auto-stop typing after 3 seconds of inactivity
      typingTimeouts.current[data.userId] = setTimeout(() => {
        options.onUserStoppedTyping?.({
          userId: data.userId,
          conversationId: data.conversationId
        });
        delete typingTimeouts.current[data.userId];
      }, 3000);
    };

    const handleUserStoppedTyping = (data: { userId: string; conversationId: string }) => {
      if (data.userId === user.id) return; // Ignore own typing
      
      if (typingTimeouts.current[data.userId]) {
        clearTimeout(typingTimeouts.current[data.userId]);
        delete typingTimeouts.current[data.userId];
      }
      
      options.onUserStoppedTyping?.(data);
    };

    // Online status events
    const handleFriendOnline = (data: { userId: string; user: any }) => {
      options.onUserOnline?.(data);
    };

    const handleFriendOffline = (data: { userId: string; lastSeen: Date }) => {
      options.onUserOffline?.(data);
    };

    // Register event listeners
    socket.on('message_received', handleMessageReceived);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('friend_online', handleFriendOnline);
    socket.on('friend_offline', handleFriendOffline);

    // Emit user online status
    socket.emit('user_online');

    // Cleanup function
    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('friend_online', handleFriendOnline);
      socket.off('friend_offline', handleFriendOffline);
      
      // Clear all typing timeouts
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      typingTimeouts.current = {};
    };
  }, [socket, isConnected, user, addMessage, updateMessage, options]);

  // Conversation management
  const joinConversation = (conversationId: string) => {
    if (socket && currentConversationId.current !== conversationId) {
      if (currentConversationId.current) {
        socket.emit('leave_conversation', currentConversationId.current);
      }
      socket.emit('join_conversation', conversationId);
      currentConversationId.current = conversationId;
    }
  };

  const leaveConversation = () => {
    if (socket && currentConversationId.current) {
      socket.emit('leave_conversation', currentConversationId.current);
      currentConversationId.current = null;
    }
  };

  // Messaging functions
  const sendMessage = (conversationId: string, data: {
    content?: string;
    messageType: 'text' | 'image' | 'pdf' | 'txt' | 'other_file';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileMimeType?: string;
  }) => {
    if (socket) {
      socket.emit('send_message', {
        conversationId,
        ...data
      });
    }
  };

  const markMessageAsRead = (messageId: string) => {
    if (socket) {
      socket.emit('mark_read', messageId);
    }
  };

  const markConversationAsRead = (conversationId: string) => {
    if (socket) {
      socket.emit('mark_conversation_read', conversationId);
    }
  };

  // Typing indicators
  const startTyping = (conversationId: string) => {
    if (socket) {
      socket.emit('typing_start', conversationId);
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socket) {
      socket.emit('typing_stop', conversationId);
    }
  };

  return {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    markMessageAsRead,
    markConversationAsRead,
    startTyping,
    stopTyping,
  };
};
