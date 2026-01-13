"use client";

import { cn } from "@/client/lib/utils";

interface SkeletonProps {
    className?: string;
    /** Animation style */
    animation?: "pulse" | "shimmer" | "none";
}

export function Skeleton({ className, animation = "pulse" }: SkeletonProps) {
    const animations = {
        pulse: "animate-pulse",
        shimmer: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        none: "",
    };

    return (
        <div
            className={cn(
                "rounded-lg bg-slate-800",
                animations[animation],
                className
            )}
            aria-label="Đang tải..."
            aria-busy="true"
            role="status"
        >
            <span className="sr-only">Đang tải...</span>
        </div>
    );
}

/** Skeleton for cards */
export function SkeletonCard() {
    return (
        <div 
            className="card rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6"
            aria-label="Đang tải thẻ..."
            role="status"
        >
            <div className="flex items-start justify-between">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-6 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-4 h-10 w-full rounded-xl" />
            <span className="sr-only">Đang tải thẻ...</span>
        </div>
    );
}

/** Skeleton for text blocks */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2" role="status" aria-label="Đang tải văn bản...">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-2/3" : "w-full"
                    )}
                />
            ))}
            <span className="sr-only">Đang tải văn bản...</span>
        </div>
    );
}

/** Skeleton for avatar */
export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const sizes = {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-16 w-16",
    };

    return (
        <Skeleton 
            className={cn("rounded-full", sizes[size])} 
        />
    );
}

/** Skeleton for list items */
export function SkeletonList({ items = 3 }: { items?: number }) {
    return (
        <div className="space-y-4" role="status" aria-label="Đang tải danh sách...">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <SkeletonAvatar size="md" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                    </div>
                </div>
            ))}
            <span className="sr-only">Đang tải danh sách...</span>
        </div>
    );
}

/** Skeleton for stats grid */
export function SkeletonStats({ count = 4 }: { count?: number }) {
    return (
        <div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" 
            role="status" 
            aria-label="Đang tải thống kê..."
        >
            {Array.from({ length: count }).map((_, i) => (
                <div 
                    key={i} 
                    className="card rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6"
                >
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="mt-4 h-8 w-1/2" />
                    <Skeleton className="mt-2 h-4 w-3/4" />
                </div>
            ))}
            <span className="sr-only">Đang tải thống kê...</span>
        </div>
    );
}

/** Loading spinner */
export function Spinner({ 
    size = "md", 
    className 
}: { 
    size?: "sm" | "md" | "lg"; 
    className?: string;
}) {
    const sizes = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
    };

    return (
        <svg
            className={cn(
                "animate-spin text-primary",
                sizes[size],
                className
            )}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Đang tải..."
            role="status"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
            <span className="sr-only">Đang tải...</span>
        </svg>
    );
}

/** Full page loading state */
export function LoadingScreen({ message = "Đang tải..." }: { message?: string }) {
    return (
        <div 
            className="flex min-h-[400px] flex-col items-center justify-center gap-4"
            role="status"
            aria-live="polite"
        >
            <Spinner size="lg" />
            <p className="text-slate-400">{message}</p>
        </div>
    );
}
