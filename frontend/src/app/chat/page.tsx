'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Settings, LogOut } from 'lucide-react';
import { MobileLayout } from '@/components/ui/mobile-layout';
import { useBottomNavigation } from '@/components/ui/bottom-navigation';
import { ConnectionStatus } from '@/components/ui/mobile-header';
import { ChatsTab } from '@/components/tabs/chats-tab';
import { FriendsTab } from '@/components/tabs/friends-tab';
import { DiscoverTab } from '@/components/tabs/discover-tab';
import { RequestsTab } from '@/components/tabs/requests-tab';
import { SettingsTab } from '@/components/tabs/settings-tab';

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isConnected } = useSocket();
  const { activeTab, setActiveTab } = useBottomNavigation('chats');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleFindFriends = () => {
    setActiveTab('discover');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  // Get tab title for mobile header
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'chats': return 'Messages';
      case 'friends': return 'Friends';
      case 'discover': return 'Discover';
      case 'requests': return 'Requests';
      case 'settings': return 'Settings';
      default: return 'TOff';
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chats':
        return <ChatsTab onFindFriends={handleFindFriends} />;
      case 'friends':
        return <FriendsTab />;
      case 'discover':
        return <DiscoverTab />;
      case 'requests':
        return <RequestsTab />;
      case 'settings':
        return <SettingsTab onLogout={handleLogout} />;
      default:
        return <ChatsTab onFindFriends={handleFindFriends} />;
    }
  };



  return (
    <MobileLayout
      header={{
        title: getTabTitle(activeTab),
        subtitle: activeTab === 'chats' ? (isConnected ? 'Connected' : 'Disconnected') : undefined,
      }}
      showBottomNav={true}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      className="w-full max-w-none"
    >
      {/* Content for all screen sizes */}
      <div className="h-full w-full">
        {renderTabContent()}
      </div>
    </MobileLayout>
  );
}
