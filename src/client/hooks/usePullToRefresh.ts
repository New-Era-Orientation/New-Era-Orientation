"use client";

import { useState, useRef, useCallback, TouchEvent } from "react";

export interface PullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
    maxPull?: number;
}

export interface PullToRefreshState {
    isPulling: boolean;
    isRefreshing: boolean;
    pullDistance: number;
    canRelease: boolean;
}

export function usePullToRefresh(options: PullToRefreshOptions) {
    const { onRefresh, threshold = 80, maxPull = 120 } = options;
    
    const [state, setState] = useState<PullToRefreshState>({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        canRelease: false,
    });
    
    const startY = useRef(0);
    const isAtTop = useRef(false);

    const checkIfAtTop = useCallback(() => {
        return window.scrollY === 0;
    }, []);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (state.isRefreshing) return;
        
        isAtTop.current = checkIfAtTop();
        if (!isAtTop.current) return;
        
        const touch = e.touches[0];
        startY.current = touch.clientY;
        setState(prev => ({ ...prev, isPulling: true }));
    }, [state.isRefreshing, checkIfAtTop]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!state.isPulling || state.isRefreshing) return;
        if (!isAtTop.current) return;
        
        const touch = e.touches[0];
        const deltaY = touch.clientY - startY.current;
        
        // Only track downward pull
        if (deltaY < 0) {
            setState(prev => ({ ...prev, pullDistance: 0 }));
            return;
        }
        
        // Apply resistance
        const resistance = 0.5;
        const pullDistance = Math.min(deltaY * resistance, maxPull);
        const canRelease = pullDistance >= threshold;
        
        if (deltaY > 10) {
            e.preventDefault();
        }
        
        setState(prev => ({ 
            ...prev, 
            pullDistance, 
            canRelease 
        }));
    }, [state.isPulling, state.isRefreshing, threshold, maxPull]);

    const handleTouchEnd = useCallback(async () => {
        if (!state.isPulling || state.isRefreshing) return;
        
        if (state.canRelease) {
            setState(prev => ({ 
                ...prev, 
                isRefreshing: true,
                pullDistance: threshold / 2 
            }));
            
            try {
                await onRefresh();
            } catch (error) {
                console.error("Refresh failed:", error);
            } finally {
                setState({
                    isPulling: false,
                    isRefreshing: false,
                    pullDistance: 0,
                    canRelease: false,
                });
            }
        } else {
            setState({
                isPulling: false,
                isRefreshing: false,
                pullDistance: 0,
                canRelease: false,
            });
        }
    }, [state.isPulling, state.isRefreshing, state.canRelease, threshold, onRefresh]);

    return {
        state,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
    };
}
