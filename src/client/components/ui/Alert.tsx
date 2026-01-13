"use client";

import { cn } from "@/client/lib/utils";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface AlertProps {
    children: React.ReactNode;
    variant?: "info" | "success" | "warning" | "error";
    title?: string;
    /** Makes alert dismissible with close button */
    dismissible?: boolean;
    /** Callback when alert is dismissed */
    onDismiss?: () => void;
    /** Auto dismiss after specified milliseconds */
    autoDismiss?: number;
    /** Additional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function Alert({ 
    children, 
    variant = "info", 
    title, 
    dismissible, 
    onDismiss,
    autoDismiss,
    action,
    className 
}: AlertProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const alertRef = useRef<HTMLDivElement>(null);

    // Auto dismiss functionality
    useEffect(() => {
        if (autoDismiss && autoDismiss > 0) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, autoDismiss);
            return () => clearTimeout(timer);
        }
    }, [autoDismiss]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onDismiss?.();
        }, 200);
    };

    if (!isVisible) return null;

    const variants = {
        info: {
            container: cn(
                "bg-cyan-500/10 border-cyan-500/20 text-cyan-600",
                "dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-300"
            ),
            icon: Info,
            iconClass: "text-cyan-500",
        },
        success: {
            container: cn(
                "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
                "dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300"
            ),
            icon: CheckCircle,
            iconClass: "text-emerald-500",
        },
        warning: {
            container: cn(
                "bg-amber-500/10 border-amber-500/20 text-amber-600",
                "dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300"
            ),
            icon: AlertTriangle,
            iconClass: "text-amber-500",
        },
        error: {
            container: cn(
                "bg-red-500/10 border-red-500/20 text-red-600",
                "dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300"
            ),
            icon: AlertCircle,
            iconClass: "text-red-500",
        },
    };

    const { container, icon: Icon, iconClass } = variants[variant];

    return (
        <div
            ref={alertRef}
            className={cn(
                "rounded-xl border p-4",
                "transition-all duration-200",
                isExiting && "opacity-0 translate-x-4",
                container,
                className
            )}
            role="alert"
            aria-live={variant === "error" ? "assertive" : "polite"}
            aria-atomic="true"
        >
            <div className="flex items-start gap-3">
                <Icon 
                    className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconClass)} 
                    aria-hidden="true" 
                />
                <div className="flex-1 min-w-0">
                    {title && (
                        <h4 className="mb-1 font-semibold text-current">
                            {title}
                        </h4>
                    )}
                    <div className="text-sm opacity-90">{children}</div>
                    
                    {action && (
                        <button
                            onClick={action.onClick}
                            className={cn(
                                "mt-3 text-sm font-semibold underline-offset-2",
                                "hover:underline focus:outline-none focus:underline",
                                "transition-colors duration-200"
                            )}
                        >
                            {action.label}
                        </button>
                    )}
                </div>
                
                {dismissible && (
                    <button
                        onClick={handleDismiss}
                        className={cn(
                            "flex-shrink-0 rounded-lg p-1.5",
                            "transition-colors duration-200",
                            "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                        )}
                        aria-label="Đóng thông báo"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
}

/** Toast-style alert for notifications */
export function Toast({ 
    message, 
    variant = "info",
    onClose 
}: { 
    message: string; 
    variant?: "info" | "success" | "warning" | "error";
    onClose?: () => void;
}) {
    return (
        <Alert 
            variant={variant} 
            dismissible 
            onDismiss={onClose}
            autoDismiss={5000}
            className="shadow-lg"
        >
            {message}
        </Alert>
    );
}
