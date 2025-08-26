'use client';

import { useState } from 'react';
import { Search, UserPlus, MessageCircle, UserMinus, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Friend {
  id: string;
  name: string;
  username: string;
  email: string;
  isOnline: boolean;
  avatar?: string;
}

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  mutualFriends: number;
  avatar?: string;
}

// Mock data - will be replaced with real API calls
const mockFriends: Friend[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    username: 'alice_j',
    email: 'alice@example.com',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Bob Smith',
    username: 'bob_smith',
    email: 'bob@example.com',
    isOnline: false,
  },
];

const mockSuggestions: SuggestedUser[] = [
  {
    id: '3',
    name: 'Charlie Brown',
    username: 'charlie_b',
    mutualFriends: 3,
  },
  {
    id: '4',
    name: 'Diana Prince',
    username: 'diana_p',
    mutualFriends: 1,
  },
];

interface FriendsTabProps {
  onMessageFriend?: (friendId: string) => void;
  onSearchUsers?: (query: string) => void;
}

export function FriendsTab({ onMessageFriend, onSearchUsers }: FriendsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'find' | 'friends' | 'suggestions'>('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>(mockSuggestions);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearchUsers?.(query);
  };

  const handleAddFriend = (userId: string) => {
    console.log('Adding friend:', userId);
    // TODO: Implement add friend API call
  };

  const handleRemoveFriend = (friendId: string) => {
    console.log('Removing friend:', friendId);
    setFriends(friends.filter(f => f.id !== friendId));
  };

  const handleMessageFriend = (friendId: string) => {
    onMessageFriend?.(friendId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sub-tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {[
            { id: 'find', label: 'Find Friends', icon: Search },
            { id: 'friends', label: 'My Friends', icon: Users },
            { id: 'suggestions', label: 'Suggestions', icon: Heart },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center",
                  "py-3 px-2 text-sm font-medium",
                  "border-b-2 transition-colors",
                  activeSubTab === tab.id
                    ? "text-accent border-accent"
                    : "text-secondary border-transparent hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on active sub-tab */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'find' && (
          <FindFriendsContent
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onAddFriend={handleAddFriend}
          />
        )}
        
        {activeSubTab === 'friends' && (
          <MyFriendsContent
            friends={friends}
            onMessageFriend={handleMessageFriend}
            onRemoveFriend={handleRemoveFriend}
          />
        )}
        
        {activeSubTab === 'suggestions' && (
          <SuggestionsContent
            suggestions={suggestions}
            onAddFriend={handleAddFriend}
          />
        )}
      </div>
    </div>
  );
}

// Find Friends Sub-component
function FindFriendsContent({ 
  searchQuery, 
  onSearch, 
  onAddFriend 
}: {
  searchQuery: string;
  onSearch: (query: string) => void;
  onAddFriend: (userId: string) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
          <Input
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 bg-secondary/20 border-secondary/30"
          />
        </div>
      </div>

      {/* Search Results or Instructions */}
      <div className="flex-1 overflow-y-auto">
        {!searchQuery ? (
          <div className="p-6 text-center">
            <Search className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Find Friends</h3>
            <p className="text-secondary">
              Search for friends by their username or email address to connect with them.
            </p>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-secondary mb-4">
              Search results for "{searchQuery}"
            </p>
            {/* TODO: Replace with actual search results */}
            <div className="text-center py-8">
              <p className="text-secondary">No users found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// My Friends Sub-component
function MyFriendsContent({ 
  friends, 
  onMessageFriend, 
  onRemoveFriend 
}: {
  friends: Friend[];
  onMessageFriend: (friendId: string) => void;
  onRemoveFriend: (friendId: string) => void;
}) {
  if (friends.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Friends Yet</h3>
          <p className="text-secondary">
            Start by finding and adding friends to your network.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="divide-y divide-border">
        {friends.map((friend) => (
          <div key={friend.id} className="p-4">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-accent font-medium text-lg">
                    {friend.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {friend.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-black rounded-full" />
                )}
              </div>

              {/* Friend Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white">{friend.name}</h4>
                <p className="text-sm text-secondary">@{friend.username}</p>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => onMessageFriend(friend.id)}
                  className="bg-accent hover:bg-accent/90 text-black"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveFriend(friend.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Suggestions Sub-component
function SuggestionsContent({ 
  suggestions, 
  onAddFriend 
}: {
  suggestions: SuggestedUser[];
  onAddFriend: (userId: string) => void;
}) {
  if (suggestions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Heart className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Suggestions</h3>
          <p className="text-secondary">
            We'll suggest people you might know as more users join.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <p className="text-sm text-secondary mb-4">People you might know</p>
        <div className="space-y-4">
          {suggestions.map((user) => (
            <div key={user.id} className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <span className="text-accent font-medium text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white">{user.name}</h4>
                <p className="text-sm text-secondary">@{user.username}</p>
                <p className="text-xs text-secondary">
                  {user.mutualFriends} mutual friend{user.mutualFriends !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Add Button */}
              <Button
                size="sm"
                onClick={() => onAddFriend(user.id)}
                className="bg-accent hover:bg-accent/90 text-black"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
