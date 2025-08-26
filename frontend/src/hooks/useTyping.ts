import { useState, useRef, useCallback } from 'react';
import { debounce } from '@/lib/utils';

interface UseTypingOptions {
  onStartTyping: () => void;
  onStopTyping: () => void;
  delay?: number; // Delay before stopping typing (default: 1000ms)
}

export const useTyping = ({ 
  onStartTyping, 
  onStopTyping, 
  delay = 1000 
}: UseTypingOptions) => {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced function to stop typing
  const debouncedStopTyping = useCallback(
    debounce(() => {
      setIsTyping(false);
      onStopTyping();
    }, delay),
    [onStopTyping, delay]
  );

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onStartTyping();
    }
    
    // Reset the stop typing timer
    debouncedStopTyping();
  }, [isTyping, onStartTyping, debouncedStopTyping]);

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      onStopTyping();
    }
    
    // Clear any pending debounced calls
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isTyping, onStopTyping]);

  // Force stop typing (useful for cleanup)
  const forceStopTyping = useCallback(() => {
    debouncedStopTyping.cancel?.();
    stopTyping();
  }, [debouncedStopTyping, stopTyping]);

  return {
    isTyping,
    startTyping,
    stopTyping,
    forceStopTyping,
  };
};
