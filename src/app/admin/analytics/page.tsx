"use client";

import { useEffect, useState } from "react";
import { Card } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Badge } from "@/client/components/ui/Badge";
import {
    Users, FileText, BookOpen, TrendingUp, TrendingDown,
    BarChart3, Activity, Clock, Target, Loader2,
    Download, RefreshCw, Calendar
} from "lucide-react";
import { cn } from "@/client/lib/utils";

interface AdminAnalytics {
    userMetrics: {
        total: number;
        new: number;
        active: number;
        growthRate: number;
        byRole: { role: string; count: number }[];
        retentionRate: number;
    };
    contentMetrics: {
        exams: number;
        questions: number;
        subjects: number;
        chapters: number;
        topics: number;
        flashcards: number;
    };
    engagementMetrics: {
        examAttempts: number;
        chatMessages: number;
        flashcardReviews: number;
        avgAttemptsPerUser: number;
        dailyActiveUsers: { date: string; count: number }[];
    };
    performanceMetrics: {
        avgScore: number;
        passRate: number;
        avgTimeSpent: number;
        scoreDistribution: { range: string; count: number }[];
        totalAttempts: number;
    };
    growthTrends: { date: string; users: number; attempts: number }[];
    topPerformers: {
        userId: string;
        name: string;
        email?: string;
        image?: string;
        avgScore: number;
        attempts: number;
    }[];
    popularContent: {
        examId: string;
        title: string;
        subject?: string;
        attempts: number;
        avgScore: number;
    }[];
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AdminAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<"week" | "month" | "quarter">("month");

    async function fetchData() {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics/admin?range=${range}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch admin analytics:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [range]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Không thể tải dữ liệu phân tích</p>
                <Button onClick={fetchData} className="mt-4">Thử lại</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">📊 Phân tích hệ thống</h1>
                    <p className="text-muted-foreground">Tổng quan hoạt động và hiệu suất</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-secondary rounded-lg p-1">
                        {(["week", "month", "quarter"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                                    range === r
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {r === "week" ? "Tuần" : r === "month" ? "Tháng" : "Quý"}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng người dùng"
                    value={data.userMetrics.total}
                    icon={Users}
                    trend={data.userMetrics.growthRate}
                    trendLabel="so với kỳ trước"
                />
                <StatCard
                    title="Người dùng mới"
                    value={data.userMetrics.new}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="Hoạt động"
                    value={data.userMetrics.active}
                    icon={Activity}
                    subtext={`${data.userMetrics.retentionRate}% retention`}
                    color="blue"
                />
                <StatCard
                    title="Bài thi đã làm"
                    value={data.engagementMetrics.examAttempts}
                    icon={FileText}
                    color="purple"
                />
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Daily Active Users */}
                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Người dùng hoạt động hàng ngày</h3>
                    <div className="h-48 flex items-end gap-2">
                        {data.engagementMetrics.dailyActiveUsers.map((day, i) => {
                            const maxCount = Math.max(...data.engagementMetrics.dailyActiveUsers.map(d => d.count));
                            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-primary/20 rounded-t-md transition-all duration-300 relative group"
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                    >
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md transition-all"
                                            style={{ height: `${height}%` }}
                                        />
                                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            {day.count}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(day.date).toLocaleDateString("vi-VN", { weekday: "short" })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Score Distribution */}
                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Phân bố điểm số</h3>
                    <div className="space-y-3">
                        {data.performanceMetrics.scoreDistribution.map((item) => {
                            const total = data.performanceMetrics.totalAttempts;
                            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                            const colors: Record<string, string> = {
                                "0-4": "bg-red-500",
                                "4-6": "bg-amber-500",
                                "6-8": "bg-blue-500",
                                "8-10": "bg-green-500",
                            };
                            return (
                                <div key={item.range} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{item.range} điểm</span>
                                        <span className="font-medium">{item.count} ({percentage}%)</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all", colors[item.range])}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* Content & Performance */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Content Stats */}
                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">📚 Nội dung</h3>
                    <div className="space-y-3">
                        <ContentStatRow label="Đề thi" value={data.contentMetrics.exams} />
                        <ContentStatRow label="Câu hỏi" value={data.contentMetrics.questions} />
                        <ContentStatRow label="Môn học" value={data.contentMetrics.subjects} />
                        <ContentStatRow label="Chương" value={data.contentMetrics.chapters} />
                        <ContentStatRow label="Chủ đề" value={data.contentMetrics.topics} />
                        <ContentStatRow label="Thẻ flashcard" value={data.contentMetrics.flashcards} />
                    </div>
                </Card>

                {/* Performance Stats */}
                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">📈 Hiệu suất</h3>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-secondary/50 rounded-lg">
                            <p className="text-3xl font-bold text-foreground">{data.performanceMetrics.avgScore}</p>
                            <p className="text-sm text-muted-foreground">Điểm trung bình</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-500/10 rounded-lg">
                                <p className="text-xl font-bold text-green-600">{data.performanceMetrics.passRate}%</p>
                                <p className="text-xs text-muted-foreground">Tỷ lệ đậu</p>
                            </div>
                            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                                <p className="text-xl font-bold text-blue-600">{Math.round(data.performanceMetrics.avgTimeSpent / 60)}p</p>
                                <p className="text-xs text-muted-foreground">Thời gian TB</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Engagement Stats */}
                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">💬 Tương tác</h3>
                    <div className="space-y-3">
                        <ContentStatRow
                            label="Bài thi đã làm"
                            value={data.engagementMetrics.examAttempts}
                            icon="📝"
                        />
                        <ContentStatRow
                            label="Tin nhắn AI"
                            value={data.engagementMetrics.chatMessages}
                            icon="🤖"
                        />
                        <ContentStatRow
                            label="Flashcard đã ôn"
                            value={data.engagementMetrics.flashcardReviews}
                            icon="🃏"
                        />
                        <div className="pt-2 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                Trung bình <span className="font-semibold text-foreground">{data.engagementMetrics.avgAttemptsPerUser}</span> bài thi/người dùng
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Top Performers & Popular Content */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Top Performers */}
                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">🏆 Top học sinh xuất sắc</h3>
                    <div className="space-y-3">
                        {data.topPerformers.slice(0, 5).map((performer, i) => (
                            <div key={performer.userId} className="flex items-center gap-3">
                                <span className={cn(
                                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                    i === 0 ? "bg-yellow-500 text-white" :
                                        i === 1 ? "bg-gray-400 text-white" :
                                            i === 2 ? "bg-amber-600 text-white" :
                                                "bg-secondary text-muted-foreground"
                                )}>
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-foreground">{performer.name}</p>
                                    <p className="text-xs text-muted-foreground">{performer.attempts} bài thi</p>
                                </div>
                                <Badge variant="success">{performer.avgScore} điểm</Badge>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Popular Exams */}
                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">🔥 Đề thi phổ biến</h3>
                    <div className="space-y-3">
                        {data.popularContent.slice(0, 5).map((exam, i) => (
                            <div key={exam.examId} className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-foreground">{exam.title}</p>
                                    <p className="text-xs text-muted-foreground">{exam.subject}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{exam.attempts} lượt</p>
                                    <p className="text-xs text-muted-foreground">TB: {exam.avgScore}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Growth Trend */}
            <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">📈 Xu hướng tăng trưởng</h3>
                <div className="h-64 flex items-end gap-1">
                    {data.growthTrends.slice(-30).map((day, i) => {
                        const maxAttempts = Math.max(...data.growthTrends.map(d => d.attempts));
                        const height = maxAttempts > 0 ? (day.attempts / maxAttempts) * 100 : 0;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                <div
                                    className="w-full bg-primary rounded-t transition-all relative"
                                    style={{ height: `${Math.max(height, 2)}%` }}
                                >
                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                        {day.attempts}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{data.growthTrends[0]?.date}</span>
                    <span>{data.growthTrends[data.growthTrends.length - 1]?.date}</span>
                </div>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel,
    subtext,
    color = "default",
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    trend?: number;
    trendLabel?: string;
    subtext?: string;
    color?: "default" | "green" | "blue" | "purple";
}) {
    const colorClasses = {
        default: "bg-secondary text-foreground",
        green: "bg-green-500/10 text-green-600",
        blue: "bg-blue-500/10 text-blue-600",
        purple: "bg-purple-500/10 text-purple-600",
    };

    return (
        <Card className="p-4">
            <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-lg", colorClasses[color])}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        trend >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                        {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
                {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                {trendLabel && <p className="text-xs text-muted-foreground">{trendLabel}</p>}
            </div>
        </Card>
    );
}

function ContentStatRow({
    label,
    value,
    icon
}: {
    label: string;
    value: number;
    icon?: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
                {icon && <span className="mr-2">{icon}</span>}
                {label}
            </span>
            <span className="font-semibold text-foreground">{value.toLocaleString()}</span>
        </div>
    );
}
