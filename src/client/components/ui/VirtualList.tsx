"use client";

import { useEffect, useRef, useState, ReactNode, useMemo, useCallback } from "react";
import { cn } from "@/client/lib/utils";

interface VirtualListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
    renderItem: (item: T, index: number) => ReactNode;
    className?: string;
    getKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
    items,
    itemHeight,
    containerHeight,
    overscan = 3,
    renderItem,
    className,
    getKey = (_, index) => index,
}: VirtualListProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            setScrollTop(containerRef.current.scrollTop);
        }
    }, []);

    // Calculate visible range
    const { startIndex, endIndex, offsetY } = useMemo(() => {
        const start = Math.floor(scrollTop / itemHeight);
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        
        return {
            startIndex: Math.max(0, start - overscan),
            endIndex: Math.min(items.length, start + visibleCount + overscan),
            offsetY: Math.max(0, start - overscan) * itemHeight,
        };
    }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

    // Get visible items
    const visibleItems = useMemo(() => {
        return items.slice(startIndex, endIndex);
    }, [items, startIndex, endIndex]);

    const totalHeight = items.length * itemHeight;

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className={cn("overflow-auto", className)}
            style={{ height: containerHeight }}
        >
            <div style={{ height: totalHeight, position: "relative" }}>
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        transform: `translateY(${offsetY}px)`,
                    }}
                >
                    {visibleItems.map((item, index) => (
                        <div
                            key={getKey(item, startIndex + index)}
                            style={{ height: itemHeight }}
                        >
                            {renderItem(item, startIndex + index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Dynamic height virtual list (more complex)
interface DynamicVirtualListProps<T> {
    items: T[];
    estimatedItemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number, measureRef: React.RefObject<HTMLDivElement | null>) => ReactNode;
    className?: string;
}

export function DynamicVirtualList<T>({
    items,
    estimatedItemHeight,
    containerHeight,
    renderItem,
    className,
}: DynamicVirtualListProps<T>) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
    const measureRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // Measure items when they render
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            let hasChanges = false;
            const newHeights = new Map(itemHeights);
            
            entries.forEach((entry) => {
                const index = Number(entry.target.getAttribute("data-index"));
                const height = entry.contentRect.height;
                
                if (!isNaN(index) && newHeights.get(index) !== height) {
                    newHeights.set(index, height);
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                setItemHeights(newHeights);
            }
        });

        measureRefs.current.forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [items.length]);

    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            setScrollTop(containerRef.current.scrollTop);
        }
    }, []);

    // Calculate positions
    const { positions, totalHeight } = useMemo(() => {
        const positions: { top: number; height: number }[] = [];
        let currentTop = 0;
        
        items.forEach((_, index) => {
            const height = itemHeights.get(index) || estimatedItemHeight;
            positions.push({ top: currentTop, height });
            currentTop += height;
        });
        
        return { positions, totalHeight: currentTop };
    }, [items, itemHeights, estimatedItemHeight]);

    // Find visible range
    const { startIndex, endIndex } = useMemo(() => {
        let start = 0;
        let end = items.length;
        
        // Binary search for start
        let low = 0;
        let high = positions.length - 1;
        
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (positions[mid].top + positions[mid].height < scrollTop) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        start = Math.max(0, low - 2);
        
        // Find end
        const viewportBottom = scrollTop + containerHeight;
        for (let i = start; i < positions.length; i++) {
            if (positions[i].top > viewportBottom) {
                end = i + 2;
                break;
            }
        }
        
        return { startIndex: start, endIndex: Math.min(end, items.length) };
    }, [scrollTop, positions, containerHeight, items.length]);

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className={cn("overflow-auto", className)}
            style={{ height: containerHeight }}
        >
            <div style={{ height: totalHeight, position: "relative" }}>
                {items.slice(startIndex, endIndex).map((item, i) => {
                    const index = startIndex + i;
                    const position = positions[index];
                    
                    const measureRef = { current: measureRefs.current.get(index) || null };
                    
                    return (
                        <div
                            key={index}
                            data-index={index}
                            ref={(el) => {
                                if (el) measureRefs.current.set(index, el);
                            }}
                            style={{
                                position: "absolute",
                                top: position.top,
                                left: 0,
                                right: 0,
                            }}
                        >
                            {renderItem(item, index, measureRef)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Simple infinite scroll hook
export function useInfiniteScroll(
    callback: () => void,
    options: {
        threshold?: number;
        rootMargin?: string;
        enabled?: boolean;
    } = {}
) {
    const { threshold = 0.1, rootMargin = "100px", enabled = true } = options;
    const targetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!enabled) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    callback();
                }
            },
            { threshold, rootMargin }
        );

        if (targetRef.current) {
            observer.observe(targetRef.current);
        }

        return () => observer.disconnect();
    }, [callback, threshold, rootMargin, enabled]);

    return targetRef;
}
