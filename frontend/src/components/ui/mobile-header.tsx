'use client';

import { ArrowLeft, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  rightAction,
  className,
}: MobileHeaderProps) {
  return (
    <div className={cn(
      "flex items-center justify-between",
      "h-16 px-4 border-b border-border",
      "bg-black/95 backdrop-blur-sm",
      "sticky top-0 z-40",
      "md:hidden", // Only show on mobile
      className
    )}>
      {/* Left side */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackClick}
            className="p-2 hover:bg-secondary/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-secondary truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* Right side */}
      <div className="flex items-center space-x-2">
        {rightAction || (
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-secondary/50"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Connection status indicator for headers
export function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center space-x-2">
      <div className={cn(
        "w-2 h-2 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500"
      )} />
      <span className="text-xs text-secondary">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}
