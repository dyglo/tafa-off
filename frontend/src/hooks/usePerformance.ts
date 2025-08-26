'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// Hook for virtual scrolling to handle large lists efficiently
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    onScroll: handleScroll,
  };
}

// Hook for intersection observer to lazy load content
export function useLazyLoading(options: IntersectionObserverInit = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [options]);

  return {
    elementRef,
    isVisible,
    hasBeenVisible,
  };
}

// Hook for debouncing to optimize search and input performance
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttling to optimize scroll and resize events
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return callback(...args);
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [callback, delay]
  );
}

// Hook for image optimization and lazy loading
export function useImageOptimization(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setHasError(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoaded(false);
    };
    
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return {
    imageRef,
    imageSrc,
    isLoaded,
    hasError,
  };
}

// Hook for memory management and cleanup
export function useMemoryOptimization() {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  const runCleanup = useCallback(() => {
    cleanupFunctions.current.forEach(cleanup => cleanup());
    cleanupFunctions.current = [];
  }, []);

  useEffect(() => {
    return () => {
      runCleanup();
    };
  }, [runCleanup]);

  return {
    addCleanup,
    runCleanup,
  };
}

// Hook for network status and offline detection
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g',
  };
}

// Hook for battery optimization
export function useBatteryOptimization() {
  const [batteryLevel, setBatteryLevel] = useState<number>(1);
  const [isCharging, setIsCharging] = useState<boolean>(true);
  const [shouldOptimize, setShouldOptimize] = useState<boolean>(false);

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);
        setShouldOptimize(battery.level < 0.2 && !battery.charging);

        const handleLevelChange = () => {
          setBatteryLevel(battery.level);
          setShouldOptimize(battery.level < 0.2 && !battery.charging);
        };

        const handleChargingChange = () => {
          setIsCharging(battery.charging);
          setShouldOptimize(battery.level < 0.2 && !battery.charging);
        };

        battery.addEventListener('levelchange', handleLevelChange);
        battery.addEventListener('chargingchange', handleChargingChange);

        return () => {
          battery.removeEventListener('levelchange', handleLevelChange);
          battery.removeEventListener('chargingchange', handleChargingChange);
        };
      });
    }
  }, []);

  return {
    batteryLevel,
    isCharging,
    shouldOptimize,
    isLowBattery: batteryLevel < 0.2,
  };
}

// Hook for frame rate monitoring and performance metrics
export function usePerformanceMetrics() {
  const [fps, setFps] = useState<number>(60);
  const [isPerformanceGood, setIsPerformanceGood] = useState<boolean>(true);
  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(Date.now());

  useEffect(() => {
    let animationId: number;
    
    const measureFps = () => {
      frameCount.current++;
      const currentTime = Date.now();
      
      if (currentTime - lastTime.current >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        setFps(currentFps);
        setIsPerformanceGood(currentFps >= 30);
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFps);
    };
    
    animationId = requestAnimationFrame(measureFps);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return {
    fps,
    isPerformanceGood,
    shouldReduceAnimations: fps < 30,
  };
}
