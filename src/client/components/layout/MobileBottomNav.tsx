"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, FileText, Layers, Trophy, type LucideIcon } from "lucide-react";

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { href: "/dashboard", label: "Trang chủ", icon: Home },
    { href: "/study", label: "Học tập", icon: BookOpen },
    { href: "/exam", label: "Thi thử", icon: FileText },
    { href: "/simulation", label: "Luyện tập", icon: Layers },
    { href: "/leaderboard", label: "Xếp hạng", icon: Trophy },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    // Don't show on auth pages or admin
    if (pathname.startsWith("/auth") || pathname.startsWith("/admin")) {
        return null;
    }

    return (
        <nav 
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden"
            role="navigation"
            aria-label="Mobile navigation"
        >
            <div className="
                flex items-center gap-1
                px-3 py-2
                bg-background/90 backdrop-blur-xl
                border border-border/60
                rounded-2xl
                shadow-xl shadow-black/15
            ">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        pathname.startsWith(`${item.href}/`) ||
                        (item.href === "/dashboard" && pathname === "/");
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                relative flex flex-col items-center justify-center 
                                min-w-[52px] px-2 py-1.5
                                rounded-xl transition-all duration-200
                                ${isActive
                                    ? "bg-primary/15 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }
                            `}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <Icon 
                                className={`h-5 w-5 ${isActive ? "scale-105" : ""} transition-transform`}
                                strokeWidth={isActive ? 2.5 : 2}
                                aria-hidden="true"
                            />
                            <span className="text-[10px] font-medium mt-0.5 whitespace-nowrap">
                                {item.label}
                            </span>
                            {isActive && (
                                <span className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
