'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MobileHeader } from './mobile-header';
import { BottomNavigation } from './bottom-navigation';

interface MobileLayoutProps {
  children: ReactNode;
  header?: {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    onBackClick?: () => void;
    rightAction?: ReactNode;
  };
  showBottomNav?: boolean;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function MobileLayout({
  children,
  header,
  showBottomNav = true,
  activeTab = 'chats',
  onTabChange = () => {},
  className,
}: MobileLayoutProps) {
  return (
    <div className={cn("h-screen flex flex-col bg-black", className)}>
      {/* Mobile Header */}
      {header && (
        <MobileHeader
          title={header.title}
          subtitle={header.subtitle}
          showBackButton={header.showBackButton}
          onBackClick={header.onBackClick}
          rightAction={header.rightAction}
        />
      )}
      
      {/* Content Area with Responsive Container */}
      <div className={cn(
        "flex-1 overflow-hidden",
        showBottomNav && "mb-20" // Account for bottom nav height on all screen sizes
      )}>
        <div className="h-full w-full max-w-none mx-auto px-0">
          {children}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
}

// Desktop Layout Component (for larger screens)
interface DesktopLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
}

export function DesktopLayout({ children, sidebar, className }: DesktopLayoutProps) {
  return (
    <div className={cn(
      "hidden md:flex h-screen bg-black",
      className
    )}>
      {/* Sidebar */}
      <div className="w-80 border-r border-border">
        {sidebar}
      </div>
      
      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

// Responsive Layout Wrapper
interface ResponsiveLayoutProps {
  children: ReactNode;
  mobileLayout: {
    header?: MobileLayoutProps['header'];
    showBottomNav?: boolean;
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
  };
  desktopLayout: {
    sidebar: ReactNode;
  };
  className?: string;
}

export function ResponsiveLayout({
  children,
  mobileLayout,
  desktopLayout,
  className,
}: ResponsiveLayoutProps) {
  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden">
        <MobileLayout
          header={mobileLayout.header}
          showBottomNav={mobileLayout.showBottomNav}
          activeTab={mobileLayout.activeTab}
          onTabChange={mobileLayout.onTabChange}
          className={className}
        >
          {children}
        </MobileLayout>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <DesktopLayout
          sidebar={desktopLayout.sidebar}
          className={className}
        >
          {children}
        </DesktopLayout>
      </div>
    </>
  );
}
