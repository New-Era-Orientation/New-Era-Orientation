"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, FileText, MessageSquare, Trophy } from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: Home, label: "Trang chủ" },
    { href: "/study", icon: BookOpen, label: "Học" },
    { href: "/exam", icon: FileText, label: "Đề thi" },
    { href: "/chat", icon: MessageSquare, label: "AI Tutor" },
    { href: "/leaderboard", icon: Trophy, label: "Xếp hạng" },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    // Don't show on landing page or auth pages
    if (pathname === "/" || pathname.startsWith("/auth")) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2" suppressHydrationWarning>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                            {isActive && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
