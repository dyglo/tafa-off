'use client';

import { useRef, useCallback, useState } from 'react';

interface TouchPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

interface TouchGestureCallbacks {
  onSwipe?: (gesture: SwipeGesture) => void;
  onLongPress?: (position: TouchPosition) => void;
  onTap?: (position: TouchPosition) => void;
  onDoubleTap?: (position: TouchPosition) => void;
}

interface TouchGestureOptions {
  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  preventDefault?: boolean;
}

export function useTouch(
  callbacks: TouchGestureCallbacks = {},
  options: TouchGestureOptions = {}
) {
  const {
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    preventDefault: preventDefaultOption = false,
  } = options;

  const touchStart = useRef<TouchPosition | null>(null);
  const touchEnd = useRef<TouchPosition | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTap = useRef<TouchPosition | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const getTouchPosition = useCallback((touch: Touch): TouchPosition => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now(),
  }), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (preventDefaultOption) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const position = getTouchPosition(touch);
    touchStart.current = position;
    touchEnd.current = null;
    setIsLongPressing(false);

    // Start long press timer
    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => {
      if (touchStart.current && !touchEnd.current) {
        setIsLongPressing(true);
        callbacks.onLongPress?.(position);
      }
    }, longPressDelay);
  }, [callbacks, preventDefaultOption, getTouchPosition, longPressDelay, clearLongPressTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventDefaultOption) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    touchEnd.current = getTouchPosition(touch);

    // Cancel long press if moved too much
    if (touchStart.current && touchEnd.current) {
      const moveDistance = Math.sqrt(
        Math.pow(touchEnd.current.x - touchStart.current.x, 2) +
        Math.pow(touchEnd.current.y - touchStart.current.y, 2)
      );

      if (moveDistance > 10) {
        clearLongPressTimer();
        setIsLongPressing(false);
      }
    }
  }, [preventDefaultOption, getTouchPosition, clearLongPressTimer]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (preventDefaultOption) {
      e.preventDefault();
    }

    clearLongPressTimer();

    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const endPosition = getTouchPosition(touch);
    touchEnd.current = endPosition;

    // Don't process tap if it was a long press
    if (isLongPressing) {
      setIsLongPressing(false);
      return;
    }

    // Calculate swipe gesture
    const deltaX = endPosition.x - touchStart.current.x;
    const deltaY = endPosition.y - touchStart.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = endPosition.timestamp - touchStart.current.timestamp;
    const velocity = distance / duration;

    // Check for swipe
    if (distance > swipeThreshold) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      let direction: SwipeGesture['direction'];
      if (absX > absY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      callbacks.onSwipe?.({
        direction,
        distance,
        velocity,
        duration,
      });
      return;
    }

    // Check for tap/double tap
    const now = Date.now();
    if (lastTap.current && 
        now - lastTap.current.timestamp < doubleTapDelay &&
        Math.abs(endPosition.x - lastTap.current.x) < 20 &&
        Math.abs(endPosition.y - lastTap.current.y) < 20) {
      // Double tap
      callbacks.onDoubleTap?.(endPosition);
      lastTap.current = null;
    } else {
      // Single tap
      callbacks.onTap?.(endPosition);
      lastTap.current = endPosition;
    }
  }, [
    callbacks,
    preventDefaultOption,
    getTouchPosition,
    clearLongPressTimer,
    isLongPressing,
    swipeThreshold,
    doubleTapDelay,
  ]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isLongPressing,
  };
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  options: {
    threshold?: number;
    resistance?: number;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 100, resistance = 2.5, enabled = true } = options;
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return;
    
    startY.current = e.touches[0].clientY;
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow pull down when at top of scroll
    if (deltaY > 0 && window.scrollY === 0) {
      const distance = Math.min(deltaY / resistance, threshold * 1.5);
      setPullDistance(distance);
    }
  }, [enabled, isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh]);

  const shouldShowRefreshIndicator = pullDistance > 0 || isRefreshing;
  const refreshProgress = Math.min(pullDistance / threshold, 1);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isRefreshing,
    pullDistance,
    shouldShowRefreshIndicator,
    refreshProgress,
  };
}

// Hook for haptic feedback
export function useHapticFeedback() {
  const triggerImpact = useCallback((style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('navigator' in window && 'vibrate' in navigator) {
      // Simple vibration fallback for Android
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50],
      };
      navigator.vibrate(patterns[style]);
    }
    
    // iOS Haptic Feedback (requires PWA or native app)
    if ('DeviceMotionEvent' in window && typeof (window as any).DeviceMotionEvent.requestPermission === 'function') {
      // iOS haptic feedback would be implemented here if available
    }
  }, []);

  const triggerSelection = useCallback(() => {
    triggerImpact('light');
  }, [triggerImpact]);

  const triggerNotification = useCallback((type: 'success' | 'warning' | 'error' = 'success') => {
    const patterns = {
      success: [10, 50, 10],
      warning: [50, 50],
      error: [100, 50, 100],
    };
    
    if ('navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(patterns[type]);
    }
  }, []);

  return {
    triggerImpact,
    triggerSelection,
    triggerNotification,
  };
}
