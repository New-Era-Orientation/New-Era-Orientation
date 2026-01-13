"use client";

import { cn } from "@/client/lib/utils";
import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;

        return (
            <div className="w-full space-y-2">
                {label && (
                    <label
                        htmlFor={inputId}
                        className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                            error ? "text-destructive" : "text-foreground"
                        )}
                    >
                        {label}
                        {props.required && <span className="ml-1 text-destructive">*</span>}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        type={type}
                        id={inputId}
                        className={cn(
                            "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            error && "border-destructive focus-visible:ring-destructive",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />

                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-sm font-medium text-destructive animate-accordion-down">
                        {error}
                    </p>
                )}

                {helperText && !error && (
                    <p className="text-sm text-muted-foreground">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
