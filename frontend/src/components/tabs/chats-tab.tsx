'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Search, Plus, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePullToRefresh, useHapticFeedback, useTouch } from '@/hooks/useTouch';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
}

// Mock data - will be replaced with real API calls
const mockChats: ChatItem[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    lastMessage: 'Hey, how are you doing?',
    timestamp: '2 min ago',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Bob Smith',
    lastMessage: 'Thanks for the help earlier!',
    timestamp: '1 hour ago',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '3',
    name: 'Charlie Brown',
    lastMessage: 'See you tomorrow at the meeting',
    timestamp: '3 hours ago',
    unreadCount: 1,
    isOnline: true,
  },
];

interface ChatsTabProps {
  onChatSelect?: (chatId: string) => void;
  onFindFriends?: () => void;
}

export function ChatsTab({ onChatSelect, onFindFriends }: ChatsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatItem[]>(mockChats);
  const { user } = useAuthStore();
  const { triggerSelection, triggerImpact } = useHapticFeedback();

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    // Simulate API call to refresh chats
    await new Promise(resolve => setTimeout(resolve, 1000));
    setChats([...mockChats]); // Refresh with mock data
    triggerImpact('light');
  };

  const pullToRefreshProps = usePullToRefresh(handleRefresh);

  // Extract only the touch handlers for DOM spreading
  const touchHandlers = {
    onTouchStart: pullToRefreshProps.onTouchStart,
    onTouchMove: pullToRefreshProps.onTouchMove,
    onTouchEnd: pullToRefreshProps.onTouchEnd,
  };

  const handleChatClick = (chatId: string) => {
    triggerSelection();
    onChatSelect?.(chatId);
  };

  // Empty state when no chats
  if (chats.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/20 border-secondary/30"
            />
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <MessageCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Start Messaging</h3>
            <p className="text-secondary mb-6">
              Your messaging platform is ready! Connect with friends and start conversations.
            </p>
            <Button 
              onClick={onFindFriends}
              className="bg-accent hover:bg-accent/90 text-black"
            >
              Find Friends
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Pull to Refresh Indicator */}
      {pullToRefreshProps.shouldShowRefreshIndicator && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center p-2 bg-black/90 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-accent">
            <RefreshCw className={cn(
              "w-4 h-4",
              pullToRefreshProps.isRefreshing && "animate-spin"
            )} />
            <span className="text-sm">
              {pullToRefreshProps.isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 md:p-6 lg:p-8 border-b border-border">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/20 border-secondary/30"
          />
        </div>
      </div>

      {/* Chat List */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain"
        {...touchHandlers}
      >
        <div className="max-w-4xl mx-auto">
          {filteredChats.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-secondary">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  className={cn(
                    "flex items-center p-4 md:p-6 lg:px-8 lg:py-4 hover:bg-secondary/20",
                    "active:bg-secondary/30 transition-colors",
                    "cursor-pointer touch-action-manipulation"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                      <span className="text-accent font-medium text-lg">
                        {chat.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* Online indicator */}
                    {chat.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-black rounded-full" />
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white truncate">
                        {chat.name}
                      </h4>
                      <span className="text-xs text-secondary flex-shrink-0">
                        {chat.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-secondary truncate">
                      {chat.lastMessage}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {chat.unreadCount > 0 && (
                    <div className="ml-2 bg-accent text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4 md:p-6 lg:p-8 border-t border-border">
        <div className="max-w-md mx-auto">
          <Button
            onClick={onFindFriends}
            className="w-full bg-accent hover:bg-accent/90 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
