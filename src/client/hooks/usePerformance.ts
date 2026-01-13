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

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
    LCP?: number;  // Largest Contentful Paint
    FID?: number;  // First Input Delay
    CLS?: number;  // Cumulative Layout Shift
    TTFB?: number; // Time to First Byte
    FCP?: number;  // First Contentful Paint
}

/**
 * Hook for measuring Core Web Vitals
 */
export function useWebVitals(onMetrics?: (metrics: PerformanceMetrics) => void) {
    const metricsRef = useRef<PerformanceMetrics>({});

    useEffect(() => {
        if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
            return;
        }

        const observers: PerformanceObserver[] = [];

        // LCP Observer
        try {
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
                metricsRef.current.LCP = lastEntry.startTime;
            });
            lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
            observers.push(lcpObserver);
        } catch {
            // Not supported
        }

        // FID Observer
        try {
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number };
                metricsRef.current.FID = firstEntry.processingStart - firstEntry.startTime;
            });
            fidObserver.observe({ type: "first-input", buffered: true });
            observers.push(fidObserver);
        } catch {
            // Not supported
        }

        // CLS Observer
        let clsValue = 0;
        try {
            const clsObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
                    if (!layoutShift.hadRecentInput) {
                        clsValue += layoutShift.value;
                    }
                }
                metricsRef.current.CLS = clsValue;
            });
            clsObserver.observe({ type: "layout-shift", buffered: true });
            observers.push(clsObserver);
        } catch {
            // Not supported
        }

        // FCP Observer
        try {
            const paintObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (entry.name === "first-contentful-paint") {
                        metricsRef.current.FCP = entry.startTime;
                    }
                }
            });
            paintObserver.observe({ type: "paint", buffered: true });
            observers.push(paintObserver);
        } catch {
            // Not supported
        }

        // TTFB from Navigation Timing
        const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        if (navEntry) {
            metricsRef.current.TTFB = navEntry.responseStart;
        }

        // Report on page hide
        const reportMetrics = () => {
            onMetrics?.(metricsRef.current);
            if (process.env.NODE_ENV === "development") {
                console.log("📊 Web Vitals:", metricsRef.current);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                reportMetrics();
            }
        };

        window.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            observers.forEach(o => o.disconnect());
            window.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [onMetrics]);

    return metricsRef.current;
}

/**
 * Hook for throttling values
 */
export function useThrottle<T>(value: T, interval: number): T {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastExecuted = useRef<number>(Date.now());

    useEffect(() => {
        const now = Date.now();
        if (now - lastExecuted.current >= interval) {
            lastExecuted.current = now;
            setThrottledValue(value);
        } else {
            const timerId = setTimeout(() => {
                lastExecuted.current = Date.now();
                setThrottledValue(value);
            }, interval);
            return () => clearTimeout(timerId);
        }
    }, [value, interval]);

    return throttledValue;
}

/**
 * Hook for prefetching on hover
 */
export function usePrefetch(prefetchFn: () => void, delay = 100) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const onMouseEnter = useCallback(() => {
        timeoutRef.current = setTimeout(prefetchFn, delay);
    }, [prefetchFn, delay]);

    const onMouseLeave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    return { onMouseEnter, onMouseLeave };
}
