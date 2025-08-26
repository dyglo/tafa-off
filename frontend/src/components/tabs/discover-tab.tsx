'use client';

import { useState, useEffect } from 'react';
import { Search, Grid3X3, List, UserPlus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDebounce, useVirtualScrolling, useNetworkStatus } from '@/hooks/usePerformance';
import { useHapticFeedback } from '@/hooks/useTouch';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  isOnline: boolean;
  avatar?: string;
  isFriend?: boolean;
  requestSent?: boolean;
}

// Mock data - will be replaced with real API calls
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Emma Wilson',
    username: 'emma_w',
    email: 'emma@example.com',
    bio: 'Frontend developer who loves React and TypeScript',
    isOnline: true,
    isFriend: false,
    requestSent: false,
  },
  {
    id: '2',
    name: 'James Miller',
    username: 'james_m',
    email: 'james@example.com',
    bio: 'Product designer with a passion for user experience',
    isOnline: false,
    isFriend: false,
    requestSent: true,
  },
  {
    id: '3',
    name: 'Sarah Chen',
    username: 'sarah_c',
    email: 'sarah@example.com',
    bio: 'Data scientist and machine learning enthusiast',
    isOnline: true,
    isFriend: true,
    requestSent: false,
  },
  {
    id: '4',
    name: 'Michael Brown',
    username: 'mike_b',
    email: 'mike@example.com',
    bio: 'Backend engineer specializing in distributed systems',
    isOnline: false,
    isFriend: false,
    requestSent: false,
  },
];

interface DiscoverTabProps {
  onAddFriend?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export function DiscoverTab({ onAddFriend, onViewProfile }: DiscoverTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isLoading, setIsLoading] = useState(false);
  const { triggerSelection, triggerImpact } = useHapticFeedback();
  const { isOnline, isSlowConnection } = useNetworkStatus();

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  // Filter out current user and existing friends for discovery
  const discoverableUsers = filteredUsers.filter(user => !user.isFriend);

  // Virtual scrolling for performance with large user lists
  const itemHeight = viewMode === 'grid' ? 200 : 80;
  const containerHeight = 600; // Approximate container height
  const virtualScrolling = useVirtualScrolling(
    discoverableUsers,
    itemHeight,
    containerHeight,
    5
  );

  const handleAddFriend = (userId: string) => {
    triggerSelection();
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, requestSent: true }
        : user
    ));
    onAddFriend?.(userId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (isSlowConnection) {
      // Reduce search frequency on slow connections
      return;
    }
    // TODO: Implement real search API call
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    triggerImpact('light');
    setViewMode(mode);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter Bar */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
          <Input
            placeholder="Search users by name, username, or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-secondary/20 border-secondary/30"
          />
        </div>

        {/* View Mode and Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-secondary">
              {discoverableUsers.length} users found
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Network Status Indicator */}
            {!isOnline && (
              <div className="text-xs text-red-400 mr-2">Offline</div>
            )}
            {isSlowConnection && (
              <div className="text-xs text-yellow-400 mr-2">Slow connection</div>
            )}

            {/* View Mode Toggle */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => handleViewModeChange('list')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'list'
                    ? "bg-accent text-black"
                    : "bg-secondary/20 text-secondary hover:text-white"
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'grid'
                    ? "bg-accent text-black"
                    : "bg-secondary/20 text-secondary hover:text-white"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-secondary hover:text-white"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* User List/Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-secondary">Loading users...</div>
          </div>
        ) : discoverableUsers.length === 0 ? (
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <Search className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Users Found</h3>
              <p className="text-secondary">
                {searchQuery 
                  ? `No users match "${searchQuery}"`
                  : "No new users to discover right now"
                }
              </p>
            </div>
          </div>
        ) : (
          <div className={cn(
            "p-4",
            viewMode === 'grid' 
              ? "grid grid-cols-2 gap-4" 
              : "space-y-4"
          )}>
            {discoverableUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                viewMode={viewMode}
                onAddFriend={handleAddFriend}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// User Card Component
interface UserCardProps {
  user: User;
  viewMode: 'grid' | 'list';
  onAddFriend: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}

function UserCard({ user, viewMode, onAddFriend, onViewProfile }: UserCardProps) {
  const handleViewProfile = () => {
    onViewProfile?.(user.id);
  };

  if (viewMode === 'grid') {
    return (
      <div className="bg-secondary/10 rounded-lg p-4 border border-border">
        {/* Avatar */}
        <div className="relative mx-auto w-16 h-16 mb-3">
          <div className="w-full h-full bg-accent/20 rounded-full flex items-center justify-center">
            <span className="text-accent font-medium text-xl">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {user.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-black rounded-full" />
          )}
        </div>

        {/* User Info */}
        <div className="text-center mb-3">
          <h4 className="font-medium text-white text-sm truncate">
            {user.name}
          </h4>
          <p className="text-xs text-secondary truncate">
            @{user.username}
          </p>
          {user.bio && (
            <p className="text-xs text-secondary mt-1 line-clamp-2">
              {user.bio}
            </p>
          )}
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          onClick={() => onAddFriend(user.id)}
          disabled={user.requestSent}
          className={cn(
            "w-full text-xs",
            user.requestSent
              ? "bg-secondary/50 text-secondary cursor-not-allowed"
              : "bg-accent hover:bg-accent/90 text-black"
          )}
        >
          {user.requestSent ? (
            "Request Sent"
          ) : (
            <>
              <UserPlus className="w-3 h-3 mr-1" />
              Add Friend
            </>
          )}
        </Button>
      </div>
    );
  }

  // List view
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/10 transition-colors">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
          <span className="text-accent font-medium text-lg">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        {user.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-black rounded-full" />
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h4 className="font-medium text-white truncate">
            {user.name}
          </h4>
          <span className="text-xs text-secondary">
            @{user.username}
          </span>
        </div>
        <p className="text-sm text-secondary truncate">
          {user.email}
        </p>
        {user.bio && (
          <p className="text-xs text-secondary mt-1 line-clamp-1">
            {user.bio}
          </p>
        )}
      </div>

      {/* Action Button */}
      <Button
        size="sm"
        onClick={() => onAddFriend(user.id)}
        disabled={user.requestSent}
        className={cn(
          user.requestSent
            ? "bg-secondary/50 text-secondary cursor-not-allowed"
            : "bg-accent hover:bg-accent/90 text-black"
        )}
      >
        {user.requestSent ? (
          "Sent"
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-1" />
            Add
          </>
        )}
      </Button>
    </div>
  );
}
