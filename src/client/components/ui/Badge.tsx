"use client";

import { cn } from "@/client/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
    size?: "sm" | "md" | "lg";
    /** Optional icon to display before text */
    icon?: React.ReactNode;
    /** Makes badge dismissible with close button */
    onDismiss?: () => void;
    className?: string;
}

export function Badge({ 
    children, 
    variant = "default", 
    size = "md",
    icon,
    onDismiss,
    className 
}: BadgeProps) {
    const variants = {
        default: "badge-default bg-muted text-muted-foreground border-border",
        primary: "badge-primary bg-primary/10 text-primary border-primary/20",
        success: "badge-success bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        warning: "badge-warning bg-amber-500/10 text-amber-500 border-amber-500/20",
        error: "badge-error bg-destructive/10 text-destructive border-destructive/20",
        info: "badge-info bg-blue-500/10 text-blue-500 border-blue-500/20",
    };

    const sizes = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
    };

    return (
        <span
            className={cn(
                "badge inline-flex items-center gap-1.5 rounded-full border font-semibold",
                "transition-colors duration-200",
                variants[variant],
                sizes[size],
                className
            )}
        >
            {icon && (
                <span className="flex-shrink-0" aria-hidden="true">
                    {icon}
                </span>
            )}
            {children}
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="ml-1 flex-shrink-0 rounded-full p-0.5 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                    aria-label="Xóa badge"
                >
                    <svg 
                        className="h-3 w-3" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                    >
                        <path 
                            fillRule="evenodd" 
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                            clipRule="evenodd" 
                        />
                    </svg>
                </button>
            )}
        </span>
    );
}

/** Difficulty badge for exams */
export function DifficultyBadge({ level }: { level: "easy" | "medium" | "hard" }) {
    const config = {
        easy: { label: "Dễ", variant: "success" as const },
        medium: { label: "Trung bình", variant: "warning" as const },
        hard: { label: "Khó", variant: "error" as const },
    };

    const { label, variant } = config[level];

    return (
        <Badge variant={variant} size="sm">
            {label}
        </Badge>
    );
}

/** Status badge for progress */
export function StatusBadge({ status }: { status: "pending" | "in-progress" | "completed" }) {
    const config = {
        pending: { label: "Chưa làm", variant: "default" as const },
        "in-progress": { label: "Đang làm", variant: "primary" as const },
        completed: { label: "Hoàn thành", variant: "success" as const },
    };

    const { label, variant } = config[status];

    return (
        <Badge variant={variant} size="sm">
            {label}
        </Badge>
    );
}
