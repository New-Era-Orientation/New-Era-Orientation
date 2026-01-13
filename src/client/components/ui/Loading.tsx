"use client";

import { Card, CardContent } from "@/client/components/ui/Card";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
    const sizes = {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-2",
        lg: "h-12 w-12 border-3",
    };
    
    return (
        <div
            className={`animate-spin rounded-full border-primary border-t-transparent ${sizes[size]} ${className}`}
        />
    );
}

interface LoadingCardProps {
    message?: string;
}

export function LoadingCard({ message = "Đang tải..." }: LoadingCardProps) {
    return (
        <Card className="animate-pulse">
            <CardContent className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-muted-foreground">{message}</p>
            </CardContent>
        </Card>
    );
}

interface LoadingPageProps {
    message?: string;
}

export function LoadingPage({ message = "Đang tải..." }: LoadingPageProps) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="lg" className="mx-auto" />
                <p className="mt-4 text-lg text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}

interface LoadingSkeletonProps {
    count?: number;
    className?: string;
}

export function LoadingSkeleton({ count = 3, className = "" }: LoadingSkeletonProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

interface LoadingGridProps {
    count?: number;
    columns?: 2 | 3 | 4;
}

export function LoadingGrid({ count = 6, columns = 3 }: LoadingGridProps) {
    const gridCols = {
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    };
    
    return (
        <div className={`grid gap-4 ${gridCols[columns]}`}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                        <div className="aspect-video rounded bg-muted" />
                        <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
                        <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
