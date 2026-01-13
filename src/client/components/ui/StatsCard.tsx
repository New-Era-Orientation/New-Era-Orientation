"use client";

import { cn } from "@/client/lib/utils";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsCardProps {
    title: string;
    value: number | string;
    suffix?: string;
    prefix?: string;
    description?: string;
    icon?: LucideIcon;
    iconColor?: "blue" | "green" | "purple" | "amber" | "red" | "pink";
    trend?: {
        value: number;
        isPositive: boolean;
    };
    animate?: boolean;
    className?: string;
}

export function StatsCard({
    title,
    value,
    suffix,
    prefix,
    description,
    icon: Icon,
    iconColor = "blue",
    trend,
    animate = true,
    className,
}: StatsCardProps) {
    const [displayValue, setDisplayValue] = useState<number | string>(typeof value === "number" && animate ? 0 : value);

    const colorMap = {
        blue: {
            bg: "bg-blue-500/10",
            text: "text-blue-500",
        },
        green: {
            bg: "bg-emerald-500/10",
            text: "text-emerald-500",
        },
        purple: {
            bg: "bg-purple-500/10",
            text: "text-purple-500",
        },
        amber: {
            bg: "bg-amber-500/10",
            text: "text-amber-500",
        },
        red: {
            bg: "bg-red-500/10",
            text: "text-red-500",
        },
        pink: {
            bg: "bg-pink-500/10",
            text: "text-pink-500",
        },
    };

    useEffect(() => {
        if (typeof value !== "number" || !animate) {
            setDisplayValue(value);
            return;
        }

        const duration = 1000;
        const steps = 60;
        const stepTime = duration / steps;
        const increment = value / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current = Math.min(value, Math.round(increment * step));
            setDisplayValue(current);

            if (step >= steps) {
                clearInterval(timer);
                setDisplayValue(value);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [value, animate]);

    const colors = colorMap[iconColor];

    return (
        <div className={cn(
            "rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-lg hover:border-primary/20",
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                        {prefix && (
                            <span className="text-lg text-muted-foreground">{prefix}</span>
                        )}
                        <span className="text-3xl font-bold text-foreground">
                            {displayValue}
                        </span>
                        {suffix && (
                            <span className="text-lg text-muted-foreground">{suffix}</span>
                        )}
                    </div>
                    {description && (
                        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    )}
                    {trend && (
                        <div className={cn(
                            "mt-2 flex items-center gap-1 text-xs font-medium",
                            trend.isPositive ? "text-emerald-500" : "text-red-500"
                        )}>
                            <span>{trend.isPositive ? "↑" : "↓"}</span>
                            <span>{Math.abs(trend.value)}%</span>
                            <span className="text-muted-foreground">so với tuần trước</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={cn("rounded-xl p-3", colors.bg)}>
                        <Icon className={cn("h-6 w-6", colors.text)} />
                    </div>
                )}
            </div>
        </div>
    );
}
