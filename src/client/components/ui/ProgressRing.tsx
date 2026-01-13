"use client";

import { cn } from "@/client/lib/utils";

interface ProgressRingProps {
    progress: number; // 0-100
    size?: "sm" | "md" | "lg" | "xl";
    strokeWidth?: number;
    className?: string;
    showPercentage?: boolean;
    color?: "primary" | "success" | "warning" | "danger";
    label?: string;
    children?: React.ReactNode;
}

export function ProgressRing({
    progress,
    size = "md",
    strokeWidth,
    className,
    showPercentage = true,
    color = "primary",
    label,
    children,
}: ProgressRingProps) {
    const sizeMap = {
        sm: { width: 60, stroke: 4, textSize: "text-sm" },
        md: { width: 80, stroke: 6, textSize: "text-lg" },
        lg: { width: 120, stroke: 8, textSize: "text-2xl" },
        xl: { width: 160, stroke: 10, textSize: "text-3xl" },
    };

    const colorMap = {
        primary: "stroke-primary",
        success: "stroke-emerald-500",
        warning: "stroke-amber-500",
        danger: "stroke-red-500",
    };

    const bgColorMap = {
        primary: "stroke-primary/20",
        success: "stroke-emerald-500/20",
        warning: "stroke-amber-500/20",
        danger: "stroke-red-500/20",
    };

    const { width, stroke, textSize } = sizeMap[size];
    const actualStroke = strokeWidth || stroke;
    const radius = (width - actualStroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)}>
            <svg
                width={width}
                height={width}
                viewBox={`0 0 ${width} ${width}`}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={width / 2}
                    cy={width / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={actualStroke}
                    className={bgColorMap[color]}
                />
                {/* Progress circle */}
                <circle
                    cx={width / 2}
                    cy={width / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={actualStroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn(colorMap[color], "transition-all duration-500 ease-out")}
                />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {children ? (
                    children
                ) : (
                    <>
                        {showPercentage && (
                            <span className={cn("font-bold text-foreground", textSize)}>
                                {Math.round(progress)}%
                            </span>
                        )}
                        {label && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                                {label}
                            </span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
