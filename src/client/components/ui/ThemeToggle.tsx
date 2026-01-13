"use client";

import { useTheme } from "@/client/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/client/lib/utils";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "relative rounded-lg p-2 transition-colors duration-200 cursor-pointer",
                theme === 'dark' 
                    ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20" 
                    : "text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20"
            )}
            aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
            title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
        >
            {theme === "dark" ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
            )}
        </button>
    );
}
