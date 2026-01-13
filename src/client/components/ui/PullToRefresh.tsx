"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/client/lib/utils";
import { PullToRefreshState } from "@/client/hooks/usePullToRefresh";

export interface PullToRefreshIndicatorProps {
    state: PullToRefreshState;
    className?: string;
}

export function PullToRefreshIndicator({ state, className }: PullToRefreshIndicatorProps) {
    const { isPulling, isRefreshing, pullDistance, canRelease } = state;
    
    if (!isPulling && !isRefreshing) return null;
    
    const rotation = Math.min(pullDistance * 4, 360);
    
    return (
        <div
            className={cn(
                "flex items-center justify-center transition-all duration-200",
                className
            )}
            style={{
                height: `${pullDistance}px`,
                opacity: Math.min(pullDistance / 40, 1),
            }}
        >
            {isRefreshing ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
                <div
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
                        canRelease ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                    )}
                >
                    <svg
                        className="h-4 w-4 transition-transform"
                        style={{ transform: `rotate(${rotation}deg)` }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs font-medium">
                        {canRelease ? "Thả để làm mới" : "Kéo để làm mới"}
                    </span>
                </div>
            )}
        </div>
    );
}

// Container that integrates pull-to-refresh
export function PullToRefreshContainer({
    children,
    state,
    handlers,
    className,
}: {
    children: ReactNode;
    state: PullToRefreshState;
    handlers: {
        onTouchStart: (e: React.TouchEvent) => void;
        onTouchMove: (e: React.TouchEvent) => void;
        onTouchEnd: () => void;
    };
    className?: string;
}) {
    return (
        <div
            {...handlers}
            className={cn("relative", className)}
        >
            <PullToRefreshIndicator state={state} className="absolute top-0 left-0 right-0 z-10" />
            <div
                className="transition-transform duration-200"
                style={{
                    transform: `translateY(${state.pullDistance}px)`,
                }}
            >
                {children}
            </div>
        </div>
    );
}
