"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Custom hook to manage page state in session storage
 * Automatically saves state when it changes and restores it on mount or navigation back
 * 
 * @param storageKey - Unique key for this page's state in session storage
 * @param initialState - Default state values
 * @param options - Configuration options
 * @returns [state, setState, clearState] - State getter/setter and clear function
 */
export function usePageState<T extends Record<string, any>>(
  storageKey: string,
  initialState: T,
  options?: {
    // Debounce save operations (ms)
    debounceMs?: number;
    // Keys to exclude from storage
    excludeKeys?: (keyof T)[];
  }
) {
  const pathname = usePathname();
  const fullKey = `${pathname}:${storageKey}`;
  
  // Initialize state from session storage if available, otherwise use initial state
  const getInitialState = (): T => {
    if (typeof window === "undefined") return initialState;
    try {
      const savedState = sessionStorage.getItem(fullKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        return { ...initialState, ...parsed };
      }
    } catch (error) {
      console.error(`Error reading initial state for ${fullKey}:`, error);
    }
    return initialState;
  };

  const [state, setState] = useState<T>(getInitialState);
  const isInitialMount = useRef(true);
  const isRestoring = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceMs = options?.debounceMs ?? 300;

  // Restore state from session storage when pathname changes (navigation)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    try {
      const savedState = sessionStorage.getItem(fullKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        isRestoring.current = true;
        setState((prev) => ({ ...initialState, ...parsed }));
        // Reset flag after state is set
        setTimeout(() => {
          isRestoring.current = false;
        }, 0);
      } else {
        // If no saved state, reset to initial
        setState(initialState);
      }
    } catch (error) {
      console.error(`Error restoring state for ${fullKey}:`, error);
    }
  }, [pathname, fullKey]);

  // Handle browser back/forward navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      // Small delay to ensure pathname has updated
      setTimeout(() => {
        try {
          const currentKey = `${window.location.pathname}:${storageKey}`;
          const savedState = sessionStorage.getItem(currentKey);
          if (savedState) {
            const parsed = JSON.parse(savedState);
            isRestoring.current = true;
            setState((prev) => ({ ...initialState, ...parsed }));
            setTimeout(() => {
              isRestoring.current = false;
            }, 0);
          } else {
            setState(initialState);
          }
        } catch (error) {
          console.error(`Error restoring state on navigation for ${fullKey}:`, error);
        }
      }, 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [fullKey, storageKey, initialState]);

  // Save state to session storage when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isRestoring.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save operation
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Filter out excluded keys
        const stateToSave = { ...state };
        if (options?.excludeKeys) {
          options.excludeKeys.forEach((key) => {
            delete stateToSave[key];
          });
        }

        sessionStorage.setItem(fullKey, JSON.stringify(stateToSave));
      } catch (error) {
        console.error(`Error saving state for ${fullKey}:`, error);
      }
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, fullKey, debounceMs, options]);

  // Clear state from session storage
  const clearState = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(fullKey);
      setState(initialState);
    } catch (error) {
      console.error(`Error clearing state for ${fullKey}:`, error);
    }
  }, [fullKey, initialState]);

  return [state, setState, clearState] as const;
}

/**
 * Helper function to create a state setter that works with usePageState
 */
export function createStateSetter<T extends Record<string, any>>(
  setState: React.Dispatch<React.SetStateAction<T>>,
  key: keyof T
) {
  return (value: T[typeof key]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };
}
