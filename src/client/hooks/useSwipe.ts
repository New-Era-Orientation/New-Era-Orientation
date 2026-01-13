"use client";

import { useState, useRef, useCallback, TouchEvent } from "react";

export interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

export interface SwipeState {
    isSwiping: boolean;
    direction: "left" | "right" | "up" | "down" | null;
    deltaX: number;
    deltaY: number;
}

export interface UseSwipeOptions {
    threshold?: number; // Minimum distance for a swipe
    preventDefaultOnSwipe?: boolean;
}

export function useSwipe(
    handlers: SwipeHandlers,
    options: UseSwipeOptions = {}
) {
    const { threshold = 50, preventDefaultOnSwipe = true } = options;
    
    const [state, setState] = useState<SwipeState>({
        isSwiping: false,
        direction: null,
        deltaX: 0,
        deltaY: 0,
    });
    
    const startX = useRef(0);
    const startY = useRef(0);
    const isTracking = useRef(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const touch = e.touches[0];
        startX.current = touch.clientX;
        startY.current = touch.clientY;
        isTracking.current = true;
        setState({
            isSwiping: true,
            direction: null,
            deltaX: 0,
            deltaY: 0,
        });
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isTracking.current) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX.current;
        const deltaY = touch.clientY - startY.current;
        
        // Determine direction
        let direction: SwipeState["direction"] = null;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? "right" : "left";
        } else {
            direction = deltaY > 0 ? "down" : "up";
        }
        
        setState({
            isSwiping: true,
            direction,
            deltaX,
            deltaY,
        });
    }, []);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (!isTracking.current) return;
        
        const deltaX = state.deltaX;
        const deltaY = state.deltaY;
        
        // Check if swipe distance exceeds threshold
        if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
            if (preventDefaultOnSwipe && e.cancelable) {
                e.preventDefault();
            }
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    handlers.onSwipeRight?.();
                } else {
                    handlers.onSwipeLeft?.();
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    handlers.onSwipeDown?.();
                } else {
                    handlers.onSwipeUp?.();
                }
            }
        }
        
        isTracking.current = false;
        setState({
            isSwiping: false,
            direction: null,
            deltaX: 0,
            deltaY: 0,
        });
    }, [state.deltaX, state.deltaY, threshold, preventDefaultOnSwipe, handlers]);

    const handleTouchCancel = useCallback(() => {
        isTracking.current = false;
        setState({
            isSwiping: false,
            direction: null,
            deltaX: 0,
            deltaY: 0,
        });
    }, []);

    return {
        state,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onTouchCancel: handleTouchCancel,
        },
    };
}
