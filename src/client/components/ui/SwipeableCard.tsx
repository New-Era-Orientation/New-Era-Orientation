"use client";

import { useState, ReactNode, useCallback } from "react";
import { useSwipe } from "@/client/hooks/useSwipe";
import { cn } from "@/client/lib/utils";

export interface SwipeableCardProps {
    children: ReactNode;
    className?: string;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    leftIndicator?: ReactNode;
    rightIndicator?: ReactNode;
    threshold?: number;
    maxRotation?: number;
}

export function SwipeableCard({
    children,
    className,
    onSwipeLeft,
    onSwipeRight,
    leftIndicator,
    rightIndicator,
    threshold = 100,
    maxRotation = 15,
}: SwipeableCardProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [swipeComplete, setSwipeComplete] = useState<"left" | "right" | null>(null);

    const handleSwipeLeft = useCallback(() => {
        setSwipeComplete("left");
        setIsAnimating(true);
        setTimeout(() => {
            onSwipeLeft?.();
            setIsAnimating(false);
            setSwipeComplete(null);
        }, 200);
    }, [onSwipeLeft]);

    const handleSwipeRight = useCallback(() => {
        setSwipeComplete("right");
        setIsAnimating(true);
        setTimeout(() => {
            onSwipeRight?.();
            setIsAnimating(false);
            setSwipeComplete(null);
        }, 200);
    }, [onSwipeRight]);

    const { state, handlers } = useSwipe(
        {
            onSwipeLeft: handleSwipeLeft,
            onSwipeRight: handleSwipeRight,
        },
        { threshold }
    );

    // Calculate transform based on swipe state
    const getTransform = () => {
        if (swipeComplete === "left") {
            return "translateX(-120%)";
        }
        if (swipeComplete === "right") {
            return "translateX(120%)";
        }
        if (state.isSwiping && state.direction) {
            const rotation = (state.deltaX / threshold) * maxRotation;
            const clampedRotation = Math.max(-maxRotation, Math.min(maxRotation, rotation));
            return `translateX(${state.deltaX}px) rotate(${clampedRotation}deg)`;
        }
        return "none";
    };

    // Calculate indicator opacity
    const getIndicatorOpacity = (side: "left" | "right") => {
        if (!state.isSwiping) return 0;
        const delta = side === "right" ? state.deltaX : -state.deltaX;
        return Math.min(1, Math.max(0, delta / threshold));
    };

    return (
        <div className="relative">
            {/* Swipe indicators */}
            {leftIndicator && (
                <div
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-opacity"
                    style={{ opacity: getIndicatorOpacity("left") }}
                >
                    {leftIndicator}
                </div>
            )}
            {rightIndicator && (
                <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 transition-opacity"
                    style={{ opacity: getIndicatorOpacity("right") }}
                >
                    {rightIndicator}
                </div>
            )}

            {/* Card */}
            <div
                {...handlers}
                className={cn(
                    "touch-pan-y select-none",
                    isAnimating && "transition-transform duration-200 ease-out",
                    className
                )}
                style={{ transform: getTransform() }}
            >
                {children}
            </div>
        </div>
    );
}

// Flashcard-specific swipeable component
export function SwipeableFlashcard({
    front,
    back,
    isFlipped,
    onFlip,
    onSwipeLeft,
    onSwipeRight,
    className,
}: {
    front: ReactNode;
    back: ReactNode;
    isFlipped: boolean;
    onFlip: () => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    className?: string;
}) {
    return (
        <SwipeableCard
            onSwipeLeft={onSwipeLeft}
            onSwipeRight={onSwipeRight}
            leftIndicator={
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/90 text-white shadow-lg">
                    <span className="text-2xl">✗</span>
                </div>
            }
            rightIndicator={
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/90 text-white shadow-lg">
                    <span className="text-2xl">✓</span>
                </div>
            }
            className={className}
        >
            <div
                className="perspective-1000 cursor-pointer"
                onClick={onFlip}
            >
                <div
                    className={cn(
                        "relative w-full min-h-[300px] transition-transform duration-500 transform-style-3d",
                        isFlipped && "rotate-y-180"
                    )}
                    style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                >
                    {/* Front */}
                    <div
                        className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-card border border-border p-6 flex items-center justify-center"
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        {front}
                    </div>

                    {/* Back */}
                    <div
                        className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-card border border-primary/30 p-6 flex items-center justify-center"
                        style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                        }}
                    >
                        {back}
                    </div>
                </div>
            </div>
        </SwipeableCard>
    );
}
