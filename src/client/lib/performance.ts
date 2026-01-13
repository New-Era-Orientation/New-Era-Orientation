// Performance utilities for NEO-EDU

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

/**
 * Throttle function to ensure function is called at most once per interval
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(): void {
    if (typeof window === "undefined") return;
    
    const images = document.querySelectorAll("img[data-src]");
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                img.src = img.dataset.src || "";
                img.removeAttribute("data-src");
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: "50px 0px",
        threshold: 0.01,
    });
    
    images.forEach((img) => observer.observe(img));
}

/**
 * Prefetch data for faster navigation
 */
export async function prefetchData(url: string): Promise<void> {
    try {
        await fetch(url, { method: "GET" });
    } catch {
        // Silently fail prefetch
    }
}

/**
 * Create a cache key from params
 */
export function createCacheKey(base: string, params: Record<string, unknown>): string {
    const sortedParams = Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
    return `${base}?${sortedParams}`;
}

/**
 * Simple in-memory cache with TTL
 */
export class MemoryCache<T> {
    private cache = new Map<string, { data: T; expiry: number }>();
    private defaultTTL: number;
    
    constructor(defaultTTLSeconds = 300) {
        this.defaultTTL = defaultTTLSeconds * 1000;
    }
    
    set(key: string, data: T, ttlSeconds?: number): void {
        const expiry = Date.now() + (ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL);
        this.cache.set(key, { data, expiry });
    }
    
    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.data;
    }
    
    delete(key: string): void {
        this.cache.delete(key);
    }
    
    clear(): void {
        this.cache.clear();
    }
    
    // Clean up expired entries
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// Global API cache instance
export const apiCache = new MemoryCache<unknown>(300);

/**
 * Fetch with caching
 */
export async function fetchWithCache<T>(
    url: string,
    options?: RequestInit,
    cacheSeconds = 300
): Promise<T> {
    const cached = apiCache.get(url);
    if (cached) {
        return cached as T;
    }
    
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    apiCache.set(url, data, cacheSeconds);
    
    return data as T;
}

/**
 * Report Web Vitals metrics
 */
export function reportWebVitals(metric: {
    id: string;
    name: string;
    value: number;
    rating: "good" | "needs-improvement" | "poor";
}): void {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
        console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.rating);
    }
    
    // In production, send to analytics endpoint
    if (process.env.NODE_ENV === "production") {
        // Send to analytics
        fetch("/api/analytics/vitals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(metric),
        }).catch(() => {
            // Silently fail
        });
    }
}
