"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/Card";
import { Clock, Award, BookOpen, Target, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/client/lib/utils";
import { useEffect, useState } from "react";

interface Activity {
    id: string;
    title: string;
    type: "exam" | "study";
    score?: number | null;
    createdAt: string;
    href: string;
}

// Custom time formatting function (Vietnamese)
function formatTimeAgo(dateString: string): string {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);

        if (diffSeconds < 60) return "Vừa xong";
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays === 1) return "Hôm qua";
        if (diffDays < 7) return `${diffDays} ngày trước`;
        if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
        if (diffMonths < 12) return `${diffMonths} tháng trước`;
        return `${Math.floor(diffMonths / 12)} năm trước`;
    } catch {
        return "Vừa xong";
    }
}

export function RecentActivity() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivities() {
            try {
                const res = await fetch("/api/user/activities");
                if (res.ok) {
                    const data = await res.json();
                    setActivities(data);
                }
            } catch (error) {
                console.error("Failed to fetch activities:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchActivities();
    }, []);

    const getTypeConfig = (type: "exam" | "study") => {
        const configs = {
            exam: {
                color: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
                label: "Đề thi",
                icon: Award,
            },
            study: {
                color: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
                label: "Học tập",
                icon: BookOpen,
            },
        };
        return configs[type];
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        if (score >= 6) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
        return "bg-destructive/10 text-destructive border-destructive/20";
    };

    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                    <CardTitle className="text-xl font-bold text-foreground">Hoạt động gần đây</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 flex items-center justify-center min-h-[200px]">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                <CardTitle className="text-xl font-bold text-foreground">Hoạt động gần đây</CardTitle>
                <Link
                    href="/history"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                    Xem tất cả
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            </CardHeader>

            <CardContent className="p-6 pt-2">
                {activities.length > 0 ? (
                    <ul className="space-y-3" role="list" aria-label="Danh sách hoạt động gần đây">
                        {activities.slice(0, 5).map((activity) => {
                            const typeConfig = getTypeConfig(activity.type);
                            const Icon = typeConfig.icon;

                            return (
                                <li key={activity.id}>
                                    <Link
                                        href={activity.href}
                                        className="group flex items-center justify-between rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-border hover:bg-secondary/50"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={cn("rounded-xl p-2.5 transition-colors", typeConfig.color)}
                                                aria-hidden="true"
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                    {activity.title}
                                                </h3>
                                                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                                        <time>{formatTimeAgo(activity.createdAt)}</time>
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                                                        {typeConfig.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {activity.score !== null && activity.score !== undefined && (
                                            <div
                                                className={cn("rounded-lg border px-3 py-1.5", getScoreColor(activity.score))}
                                                aria-label={`Điểm: ${activity.score} trên 10`}
                                            >
                                                <span className="font-bold">{activity.score.toFixed(1)}</span>
                                                <span className="text-sm opacity-70">/10</span>
                                            </div>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="py-12 text-center">
                        <div className="mx-auto mb-4 inline-flex rounded-full bg-secondary p-4">
                            <Clock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <p className="text-muted-foreground">Chưa có hoạt động nào</p>
                        <p className="text-sm text-muted-foreground mt-1">Bắt đầu học để xem lịch sử hoạt động</p>
                        <Link
                            href="/study"
                            className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
                        >
                            <BookOpen className="h-4 w-4" />
                            Bắt đầu học ngay
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
