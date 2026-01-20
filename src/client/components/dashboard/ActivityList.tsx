"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/Card";
import { Clock, Award, BookOpen, Target, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/client/lib/utils";

export function ActivityList() {
    const activities = [
        {
            id: "1",
            title: "Hoàn thành đề thi HSG Ninh Bình",
            time: "2 giờ trước",
            score: "9.0",
            type: "exam" as const,
            icon: Award,
            href: "/exam/hsg-ninh-binh-2024",
        },
        {
            id: "2",
            title: "Học xong chương Cấu trúc dữ liệu",
            time: "1 ngày trước",
            type: "study" as const,
            icon: BookOpen,
            href: "/study/cau-truc-du-lieu",
        },
        {
            id: "3",
            title: "Làm bài Simulation - Thuật toán",
            time: "3 ngày trước",
            score: "8.5",
            type: "practice" as const,
            icon: Target,
            href: "/simulation",
            typeLabel: "Luyện tập",
        },
        {
            id: "4",
            title: "Hoàn thành bài kiểm tra nhanh",
            time: "4 ngày trước",
            score: "7.5",
            type: "exam" as const,
            icon: Award,
            href: "/exam",
        },
    ];

    const getTypeConfig = (type: "exam" | "study" | "practice") => {
        const configs = {
            exam: {
                color: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
                label: "Đề thi"
            },
            study: {
                color: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
                label: "Học tập"
            },
            practice: {
                color: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
                label: "Luyện tập"
            },
        };
        return configs[type];
    };

    const getScoreColor = (score: string) => {
        const numScore = parseFloat(score);
        if (numScore >= 8) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        if (numScore >= 6) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
        return "bg-destructive/10 text-destructive border-destructive/20";
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                <CardTitle className="text-xl font-bold text-foreground">Hoạt động gần đây</CardTitle>
                <Link
                    href="/profile"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                    Xem tất cả
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            </CardHeader>

            <CardContent className="p-6 pt-2">
                <ul className="space-y-3" role="list" aria-label="Danh sách hoạt động gần đây">
                    {activities.map((activity) => {
                        const typeConfig = getTypeConfig(activity.type);

                        return (
                            <li key={activity.id}>
                                <Link
                                    href={activity.href}
                                    className="group flex items-center justify-between rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-border hover:bg-secondary/50"
                                >
                                    <div className="flex items-start gap-4" suppressHydrationWarning>
                                        <div
                                            className={cn("rounded-xl p-2.5 transition-colors", typeConfig.color)}
                                            aria-hidden="true"
                                            suppressHydrationWarning
                                        >
                                            <activity.icon className="h-5 w-5" />
                                        </div>
                                        <div suppressHydrationWarning>
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                {activity.title}
                                            </h3>
                                            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground" suppressHydrationWarning>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                                    <time>{activity.time}</time>
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                                                    {typeConfig.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {activity.score && (
                                        <div
                                            className={cn("rounded-lg border px-3 py-1.5", getScoreColor(activity.score))}
                                            aria-label={`Điểm: ${activity.score} trên 10`}
                                            suppressHydrationWarning
                                        >
                                            <span className="font-bold">{activity.score}</span>
                                            <span className="text-sm opacity-70">/10</span>
                                        </div>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {activities.length === 0 && (
                    <div className="py-12 text-center">
                        <div className="mx-auto mb-4 inline-flex rounded-full bg-secondary p-4">
                            <Clock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <p className="text-muted-foreground">Chưa có hoạt động nào</p>
                        <p className="text-sm text-muted-foreground">Bắt đầu học để xem lịch sử hoạt động</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
