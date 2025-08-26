'use client';

import { useState } from 'react';
import { MessageCircle, Users, Search, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  badge?: number;
  onClick: () => void;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const defaultTabs: TabItem[] = [
  {
    id: 'chats',
    icon: MessageCircle,
    label: 'Chats',
    onClick: () => {},
  },
  {
    id: 'friends',
    icon: Users,
    label: 'Friends',
    onClick: () => {},
  },
  {
    id: 'discover',
    icon: Search,
    label: 'Discover',
    onClick: () => {},
  },
  {
    id: 'requests',
    icon: Bell,
    label: 'Requests',
    onClick: () => {},
  },
  {
    id: 'settings',
    icon: Settings,
    label: 'Settings',
    onClick: () => {},
  },
];

export function BottomNavigation({ 
  activeTab, 
  onTabChange, 
  className 
}: BottomNavigationProps) {
  const tabs = defaultTabs.map(tab => ({
    ...tab,
    onClick: () => onTabChange(tab.id),
  }));

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-black border-t border-border",
      "h-20 px-2 pb-safe-bottom",
      "flex items-center justify-center",
      // Removed md:hidden to show on all screen sizes
      className
    )}>
      <div className="w-full max-w-4xl mx-auto flex items-center justify-around px-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={tab.onClick}
            className={cn(
              "flex flex-col items-center justify-center",
              "min-w-[44px] h-14 px-2 py-1",
              "rounded-lg transition-all duration-200",
              "relative",
              isActive 
                ? "text-accent" 
                : "text-secondary hover:text-white"
            )}
          >
            <div className="relative">
              <Icon className={cn(
                "w-6 h-6 mb-1",
                isActive && "drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
              )} />
              
              {/* Badge */}
              {tab.badge && tab.badge > 0 && (
                <div className={cn(
                  "absolute -top-1 -right-1",
                  "bg-red-500 text-white",
                  "text-xs font-medium",
                  "w-5 h-5 rounded-full",
                  "flex items-center justify-center",
                  "min-w-[20px]"
                )}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </div>
              )}
            </div>
            
            <span className={cn(
              "text-xs font-medium leading-none",
              "max-w-[60px] truncate"
            )}>
              {tab.label}
            </span>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}

// Hook for managing bottom navigation state
export function useBottomNavigation(initialTab: string = 'chats') {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  return {
    activeTab,
    setActiveTab: handleTabChange,
  };
}
