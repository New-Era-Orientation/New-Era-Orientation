"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        
        return () => clearTimeout(timer);
    }, [value, delay]);
    
    return debouncedValue;
}

/**
 * Hook for intersection observer
 */
export function useIntersectionObserver(
    ref: React.RefObject<Element | null>,
    options: IntersectionObserverInit = {}
): boolean {
    const [isIntersecting, setIsIntersecting] = useState(false);
    
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);
        
        observer.observe(element);
        
        return () => observer.disconnect();
    }, [ref, options.root, options.rootMargin, options.threshold]);
    
    return isIntersecting;
}

/**
 * Hook for lazy loading
 */
export function useLazyLoad(threshold = 0.1): [React.RefObject<HTMLDivElement | null>, boolean] {
    const ref = useRef<HTMLDivElement>(null);
    const isVisible = useIntersectionObserver(ref, { threshold });
    
    return [ref, isVisible];
}

/**
 * Hook for infinite scroll
 */
export function useInfiniteScroll(
    callback: () => void,
    hasMore: boolean
): React.RefObject<HTMLDivElement | null> {
    const observerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const element = observerRef.current;
        if (!element || !hasMore) return;
        
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore) {
                    callback();
                }
            },
            { threshold: 0.1 }
        );
        
        observer.observe(element);
        
        return () => observer.disconnect();
    }, [callback, hasMore]);
    
    return observerRef;
}

/**
 * Hook for local storage with SSR support
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }
        
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });
    
    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {
                console.error("Error saving to localStorage:", error);
            }
        },
        [key, storedValue]
    );
    
    return [storedValue, setValue];
}

/**
 * Hook for media queries
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);
    
    useEffect(() => {
        const media = window.matchMedia(query);
        
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
        media.addEventListener("change", listener);
        
        return () => media.removeEventListener("change", listener);
    }, [query, matches]);
    
    return matches;
}

/**
 * Hook for window size
 */
export function useWindowSize(): { width: number; height: number } {
    const [size, setSize] = useState({ width: 0, height: 0 });
    
    useEffect(() => {
        const handleResize = () => {
            setSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        
        handleResize();
        window.addEventListener("resize", handleResize);
        
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    
    return size;
}

/**
 * Hook for online status
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(true);
    
    useEffect(() => {
        setIsOnline(navigator.onLine);
        
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);
    
    return isOnline;
}

/**
 * Hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined);
    
    useEffect(() => {
        ref.current = value;
    }, [value]);
    
    return ref.current;
}

/**
 * Hook for click outside
 */
export function useClickOutside<T extends HTMLElement>(
    callback: () => void
): React.RefObject<T | null> {
    const ref = useRef<T>(null);
    
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };
        
        document.addEventListener("mousedown", handleClick);
        
        return () => document.removeEventListener("mousedown", handleClick);
    }, [callback]);
    
    return ref;
}

/**
 * Hook for keyboard shortcut
 */
export function useKeyboardShortcut(
    key: string,
    callback: () => void,
    modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
): void {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key.toLowerCase() === key.toLowerCase() &&
                (!modifiers.ctrl || event.ctrlKey || event.metaKey) &&
                (!modifiers.shift || event.shiftKey) &&
                (!modifiers.alt || event.altKey)
            ) {
                event.preventDefault();
                callback();
            }
        };
        
        document.addEventListener("keydown", handleKeyDown);
        
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [key, callback, modifiers]);
}
