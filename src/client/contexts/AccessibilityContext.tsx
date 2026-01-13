"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface AccessibilitySettings {
    // Visual
    fontSize: "normal" | "large" | "x-large";
    highContrast: boolean;
    reduceMotion: boolean;
    
    // Navigation
    focusIndicators: boolean;
    skipLinks: boolean;
    
    // Screen reader
    announcePageChanges: boolean;
    verboseLabels: boolean;
}

const defaultSettings: AccessibilitySettings = {
    fontSize: "normal",
    highContrast: false,
    reduceMotion: false,
    focusIndicators: true,
    skipLinks: true,
    announcePageChanges: true,
    verboseLabels: false,
};

interface AccessibilityContextType {
    settings: AccessibilitySettings;
    updateSetting: <K extends keyof AccessibilitySettings>(
        key: K,
        value: AccessibilitySettings[K]
    ) => void;
    resetSettings: () => void;
    announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

const STORAGE_KEY = "neo-edu-accessibility";

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
    const [mounted, setMounted] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setSettings({ ...defaultSettings, ...parsed });
            }
        } catch (e) {
            console.error("Failed to load accessibility settings:", e);
        }

        // Check system preferences
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) {
            setSettings(prev => ({ ...prev, reduceMotion: true }));
        }
    }, []);

    // Apply settings to document
    useEffect(() => {
        if (!mounted) return;

        const html = document.documentElement;

        // Font size
        html.classList.remove("text-normal", "text-large", "text-x-large");
        html.classList.add(`text-${settings.fontSize}`);

        // High contrast
        html.classList.toggle("high-contrast", settings.highContrast);

        // Reduce motion
        html.classList.toggle("reduce-motion", settings.reduceMotion);

        // Focus indicators
        html.classList.toggle("focus-visible", settings.focusIndicators);

        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save accessibility settings:", e);
        }
    }, [settings, mounted]);

    const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
        key: K,
        value: AccessibilitySettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
    }, []);

    // Screen reader announcements
    const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
        const announcer = document.getElementById(`sr-announcer-${priority}`);
        if (announcer) {
            announcer.textContent = "";
            // Small delay to ensure screen readers pick up the change
            setTimeout(() => {
                announcer.textContent = message;
            }, 100);
        }
    }, []);

    return (
        <AccessibilityContext.Provider
            value={{ settings, updateSetting, resetSettings, announce }}
        >
            {/* Screen reader live regions */}
            <div
                id="sr-announcer-polite"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            />
            <div
                id="sr-announcer-assertive"
                aria-live="assertive"
                aria-atomic="true"
                className="sr-only"
            />
            
            {/* Skip links */}
            {settings.skipLinks && <SkipLinks />}
            
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error("useAccessibility must be used within AccessibilityProvider");
    }
    return context;
}

// Skip navigation links for keyboard users
function SkipLinks() {
    return (
        <div className="skip-links">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg"
            >
                Chuyển đến nội dung chính
            </a>
            <a
                href="#main-navigation"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-48 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg"
            >
                Chuyển đến menu
            </a>
        </div>
    );
}

// Hook for keyboard navigation
export function useKeyboardNavigation(options: {
    onEscape?: () => void;
    onEnter?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    enabled?: boolean;
}) {
    const { enabled = true, ...handlers } = options;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "Escape":
                    handlers.onEscape?.();
                    break;
                case "Enter":
                    handlers.onEnter?.();
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    handlers.onArrowUp?.();
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    handlers.onArrowDown?.();
                    break;
                case "ArrowLeft":
                    handlers.onArrowLeft?.();
                    break;
                case "ArrowRight":
                    handlers.onArrowRight?.();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [enabled, handlers]);
}

// Focus trap for modals
export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, enabled: boolean = true) {
    useEffect(() => {
        if (!enabled || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        // Focus first element
        firstElement?.focus();

        container.addEventListener("keydown", handleKeyDown);
        return () => container.removeEventListener("keydown", handleKeyDown);
    }, [containerRef, enabled]);
}
