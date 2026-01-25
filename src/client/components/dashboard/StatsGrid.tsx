"use client";

import { useEffect, useState } from "react";
import { Card } from "@/client/components/ui/Card";
import { Target, Award, Clock, TrendingUp, ArrowUp, ArrowDown, Loader2 } from "lucide-react";

interface DashboardStats {
    examsCompleted: number;
    averageScore: number;
    studyTime: number;
    progress: number;
    streak: number;
}

export function StatsGrid() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/user/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    // Default/fallback stats
    const displayStats = [
        {
            label: "Đề thi đã làm",
            value: stats?.examsCompleted?.toString() || "0",
            icon: Target,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            change: "+0",
            changeLabel: "tuần này",
            trend: "up" as const,
        },
        {
            label: "Điểm trung bình",
            value: stats?.averageScore?.toFixed(1) || "0",
            icon: Award,
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10",
            change: "+0",
            changeLabel: "điểm",
            trend: "up" as const,
        },
        {
            label: "Thời gian học",
            value: stats?.studyTime ? `${stats.studyTime}h` : "0h",
            icon: Clock,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            change: "+0h",
            changeLabel: "tuần này",
            trend: "up" as const,
        },
        {
            label: "Tiến độ",
            value: `${stats?.progress || 0}%`,
            icon: TrendingUp,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            change: "+0%",
            changeLabel: "tháng này",
            trend: "up" as const,
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-3 md:p-6">
                        <div className="flex items-center justify-center h-14 md:h-20">
                            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-muted-foreground" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4" role="list" aria-label="Thống kê học tập">
            {displayStats.map((stat, index) => (
                <Card
                    key={index}
                    className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20"
                    role="listitem"
                >
                    <div className="flex items-start justify-between p-3 md:p-6">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">{stat.label}</p>
                            <p className="mt-1 md:mt-2 text-xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                            <div className="mt-1 md:mt-2 flex items-center gap-1 flex-wrap">
                                {stat.trend === "up" ? (
                                    <ArrowUp className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                                ) : (
                                    <ArrowDown className="h-3 w-3 text-destructive" aria-hidden="true" />
                                )}
                                <span className={`text-[10px] md:text-xs font-medium ${stat.trend === "up" ? "text-emerald-500" : "text-destructive"}`}>
                                    {stat.change}
                                </span>
                                <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">{stat.changeLabel}</span>
                            </div>
                        </div>
                        <div
                            className={`rounded-lg md:rounded-xl ${stat.bgColor} p-2 md:p-3 ${stat.color} transition-colors group-hover:brightness-110`}
                            aria-hidden="true"
                        >
                            <stat.icon className="h-4 w-4 md:h-6 md:w-6" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
