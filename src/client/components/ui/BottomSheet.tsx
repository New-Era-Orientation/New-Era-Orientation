"use client";

import { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/client/lib/utils";

export interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    snapPoints?: number[]; // percentages, e.g., [25, 50, 90]
    initialSnap?: number;
    className?: string;
}

export function BottomSheet({
    isOpen,
    onClose,
    children,
    title,
    snapPoints = [50, 90],
    initialSnap = 0,
    className,
}: BottomSheetProps) {
    const [mounted, setMounted] = useState(false);
    const [currentSnap, setCurrentSnap] = useState(initialSnap);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    
    const sheetRef = useRef<HTMLDivElement>(null);
    const dragStartY = useRef(0);
    const currentHeight = useRef(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            setCurrentSnap(initialSnap);
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen, initialSnap]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        dragStartY.current = touch.clientY;
        currentHeight.current = snapPoints[currentSnap];
        setIsDragging(true);
    }, [snapPoints, currentSnap]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        
        const touch = e.touches[0];
        const deltaY = touch.clientY - dragStartY.current;
        const windowHeight = window.innerHeight;
        const deltaPercent = (deltaY / windowHeight) * 100;
        
        setDragOffset(deltaPercent);
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return;
        
        setIsDragging(false);
        
        const effectiveHeight = currentHeight.current - dragOffset;
        
        // Close if dragged down past threshold
        if (effectiveHeight < 20) {
            onClose();
            setDragOffset(0);
            return;
        }
        
        // Find closest snap point
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        snapPoints.forEach((point, index) => {
            const distance = Math.abs(point - effectiveHeight);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });
        
        setCurrentSnap(closestIndex);
        setDragOffset(0);
    }, [isDragging, dragOffset, snapPoints, onClose]);

    const handleBackdropClick = useCallback(() => {
        onClose();
    }, [onClose]);

    if (!mounted || !isOpen) return null;

    const height = snapPoints[currentSnap] - (isDragging ? dragOffset : 0);

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />
            
            {/* Sheet */}
            <div
                ref={sheetRef}
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-xl",
                    !isDragging && "transition-[height] duration-300 ease-out",
                    className
                )}
                style={{ height: `${Math.max(height, 0)}vh` }}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                {/* Handle */}
                <div
                    className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                </div>
                
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            aria-label="Đóng"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                    {children}
                </div>
            </div>
        </>,
        document.body
    );
}

// Mobile-optimized navigation sheet
export function MobileNavSheet({
    isOpen,
    onClose,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}) {
    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            snapPoints={[60, 90]}
            initialSnap={0}
        >
            <nav className="space-y-2" role="navigation" aria-label="Mobile navigation">
                {children}
            </nav>
        </BottomSheet>
    );
}
