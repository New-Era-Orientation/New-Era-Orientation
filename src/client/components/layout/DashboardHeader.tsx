"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, BookOpen, FileText, Settings as SettingsIcon, LogOut, Trophy, Layers } from "lucide-react";
import { ThemeToggle } from "@/client/components/ui/ThemeToggle";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { cn } from "@/client/lib/utils";

export function DashboardHeader() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const user = session?.user;
    const isLoading = status === "loading";

    const getInitials = (name?: string | null) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const navItems = [
        { href: "/dashboard", label: "Trang chủ", icon: Home },
        { href: "/study", label: "Học tập", icon: BookOpen },
        { href: "/exam", label: "Thi thử", icon: FileText },
        { href: "/simulation", label: "Luyện tập", icon: Layers },
        { href: "/leaderboard", label: "Xếp hạng", icon: Trophy },
    ];

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md transition-colors duration-200">
            <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                        <span className="text-sm font-bold text-white">N</span>
                    </div>
                    <span className="text-lg md:text-xl font-bold text-foreground">NEO Edu</span>
                </Link>

                {/* Desktop Navigation - Centered */}
                <nav className="hidden md:flex items-center justify-center flex-1 mx-4" role="navigation" aria-label="Main navigation">
                    <div className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg px-3 lg:px-4 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    )}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <item.icon className="h-4 w-4" aria-hidden="true" />
                                    <span className="hidden lg:inline">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Right Section */}
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <ThemeToggle />

                    {/* Notifications */}
                    <Link
                        href="/notifications"
                        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
                        aria-label="Thông báo"
                    >
                        <Bell className="h-5 w-5" aria-hidden="true" />
                    </Link>

                    {/* Settings */}
                    <Link
                        href="/settings"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
                        aria-label="Cài đặt"
                    >
                        <SettingsIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>

                    {/* Profile */}
                    <div className="relative">
                        {isLoading ? (
                            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                        ) : user ? (
                            <>
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-2 rounded-lg p-1.5 bg-secondary transition-colors cursor-pointer"
                                    aria-label="Menu tài khoản"
                                    aria-expanded={showProfileMenu}
                                >
                                    {user.image ? (
                                        <Image
                                            src={user.image}
                                            alt={user.name || "Avatar"}
                                            width={32}
                                            height={32}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                                            {getInitials(user.name)}
                                        </div>
                                    )}
                                </button>

                                {/* Profile Dropdown */}
                                {showProfileMenu && (
                                    <div className="absolute right-0 top-12 w-56 rounded-xl border border-border bg-card shadow-lg z-50">
                                        <div className="p-3 border-b border-border">
                                            <p className="font-medium truncate text-foreground">
                                                {user.name}
                                            </p>
                                            <p className="text-sm truncate text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                        <div className="p-2">
                                            <Link
                                                href="/profile"
                                                onClick={() => setShowProfileMenu(false)}
                                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
                                            >
                                                Hồ sơ cá nhân
                                            </Link>
                                            <Link
                                                href="/settings"
                                                onClick={() => setShowProfileMenu(false)}
                                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
                                            >
                                                Cài đặt
                                            </Link>
                                            <button
                                                onClick={() => signOut({ callbackUrl: "/" })}
                                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-500 transition-colors hover:bg-red-500/10 cursor-pointer"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link
                                href="/auth/login"
                                className="whitespace-nowrap shrink-0 rounded-lg bg-primary px-3 md:px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
