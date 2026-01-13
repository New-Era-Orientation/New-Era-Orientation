"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Badge } from "@/client/components/ui/Badge";
import { 
    TrendingUp, 
    Target, 
    Clock, 
    Award,
    Calendar,
    BarChart3,
    PieChart,
    Activity,
    ArrowUp,
    ArrowDown,
    Loader2
} from "lucide-react";
import { cn } from "@/client/lib/utils";

interface AnalyticsData {
    overview: {
        totalExams: number;
        avgScore: number;
        totalTime: number;
        bestScore: number;
        worstScore: number;
        passRate: number;
    };
    weeklyProgress: {
        day: string;
        exams: number;
        score: number;
    }[];
    subjectBreakdown: {
        subject: string;
        exams: number;
        avgScore: number;
    }[];
    recentExams: {
        title: string;
        date: string;
        score: number;
        maxScore: number;
        passed: boolean;
    }[];
    streakData: {
        current: number;
        longest: number;
        thisMonth: number;
    };
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const res = await fetch(`/api/user/analytics?range=${timeRange}`);
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, [timeRange]);

    // Mock data for display
    const mockData: AnalyticsData = {
        overview: {
            totalExams: data?.overview?.totalExams ?? 0,
            avgScore: data?.overview?.avgScore ?? 0,
            totalTime: data?.overview?.totalTime ?? 0,
            bestScore: data?.overview?.bestScore ?? 0,
            worstScore: data?.overview?.worstScore ?? 0,
            passRate: data?.overview?.passRate ?? 0,
        },
        weeklyProgress: [
            { day: "T2", exams: 2, score: 7.5 },
            { day: "T3", exams: 1, score: 8.0 },
            { day: "T4", exams: 3, score: 7.8 },
            { day: "T5", exams: 0, score: 0 },
            { day: "T6", exams: 2, score: 8.5 },
            { day: "T7", exams: 4, score: 9.0 },
            { day: "CN", exams: 1, score: 7.0 },
        ],
        subjectBreakdown: [
            { subject: "Tin học 12", exams: 8, avgScore: 8.2 },
            { subject: "HSG Tỉnh", exams: 3, avgScore: 7.5 },
            { subject: "Đề thi thử", exams: 4, avgScore: 8.0 },
        ],
        recentExams: data?.recentExams ?? [],
        streakData: {
            current: data?.streakData?.current ?? 0,
            longest: data?.streakData?.longest ?? 0,
            thisMonth: data?.streakData?.thisMonth ?? 0,
        },
    };

    const displayData = data || mockData;

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Phân tích học tập</h1>
                        <p className="text-muted-foreground mt-1">Theo dõi tiến độ và hiệu suất của bạn</p>
                    </div>
                    
                    {/* Time Range Selector */}
                    <div className="flex gap-2 mt-4 md:mt-0">
                        {(["week", "month", "all"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    timeRange === range
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {range === "week" ? "Tuần này" : range === "month" ? "Tháng này" : "Tất cả"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-blue-500/10 p-3">
                                <Target className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Đề thi đã làm</p>
                                <p className="text-2xl font-bold text-foreground">{displayData.overview.totalExams}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-emerald-500/10 p-3">
                                <Award className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Điểm trung bình</p>
                                <p className="text-2xl font-bold text-foreground">{displayData.overview.avgScore.toFixed(1)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-purple-500/10 p-3">
                                <Clock className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng thời gian</p>
                                <p className="text-2xl font-bold text-foreground">{displayData.overview.totalTime}h</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-amber-500/10 p-3">
                                <TrendingUp className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tỷ lệ đạt</p>
                                <p className="text-2xl font-bold text-foreground">{displayData.overview.passRate}%</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3 mb-8">
                    {/* Weekly Progress Chart */}
                    <Card className="lg:col-span-2 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-foreground">Tiến độ tuần này</h2>
                            <Badge variant="info" icon={<BarChart3 className="h-3 w-3" />}>
                                Biểu đồ
                            </Badge>
                        </div>
                        
                        {/* Simple Bar Chart */}
                        <div className="flex items-end justify-between h-48 gap-2">
                            {displayData.weeklyProgress.map((day, index) => {
                                const maxExams = Math.max(...displayData.weeklyProgress.map(d => d.exams), 1);
                                const height = day.exams > 0 ? (day.exams / maxExams) * 100 : 5;
                                
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full flex flex-col items-center">
                                            {day.exams > 0 && (
                                                <span className="text-xs font-medium text-foreground mb-1">
                                                    {day.score.toFixed(1)}
                                                </span>
                                            )}
                                            <div 
                                                className={cn(
                                                    "w-full rounded-t-lg transition-all duration-300",
                                                    day.exams > 0 
                                                        ? "bg-gradient-to-t from-primary to-blue-400" 
                                                        : "bg-muted"
                                                )}
                                                style={{ height: `${height}%`, minHeight: "8px" }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">{day.day}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded bg-primary" />
                                <span className="text-muted-foreground">Số đề thi</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Số trên cột = Điểm TB</span>
                            </div>
                        </div>
                    </Card>

                    {/* Streak Stats */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-foreground">Chuỗi ngày học</h2>
                            <Activity className="h-5 w-5 text-orange-500" />
                        </div>
                        
                        <div className="space-y-6">
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
                                <p className="text-5xl font-bold text-orange-500">{displayData.streakData.current}</p>
                                <p className="text-sm text-muted-foreground mt-2">ngày liên tiếp</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-xl bg-secondary">
                                    <p className="text-2xl font-bold text-foreground">{displayData.streakData.longest}</p>
                                    <p className="text-xs text-muted-foreground">Kỷ lục</p>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-secondary">
                                    <p className="text-2xl font-bold text-foreground">{displayData.streakData.thisMonth}</p>
                                    <p className="text-xs text-muted-foreground">Tháng này</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Subject Breakdown & Score Range */}
                <div className="grid gap-6 lg:grid-cols-2 mb-8">
                    {/* Subject Performance */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-foreground">Theo loại đề</h2>
                            <PieChart className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        <div className="space-y-4">
                            {displayData.subjectBreakdown.map((subject, index) => {
                                const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500"];
                                const bgColors = ["bg-blue-500/10", "bg-emerald-500/10", "bg-purple-500/10", "bg-amber-500/10"];
                                
                                return (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bgColors[index % 4])}>
                                            <div className={cn("h-4 w-4 rounded", colors[index % 4])} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-foreground">{subject.subject}</span>
                                                <span className="text-sm text-muted-foreground">{subject.exams} đề</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div 
                                                    className={cn("h-full rounded-full", colors[index % 4])}
                                                    style={{ width: `${(subject.avgScore / 10) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="font-bold text-foreground">{subject.avgScore.toFixed(1)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Score Distribution */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-foreground">Phân bố điểm số</h2>
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-emerald-500/10 text-center">
                                <ArrowUp className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-emerald-500">{displayData.overview.bestScore.toFixed(1)}</p>
                                <p className="text-sm text-muted-foreground">Điểm cao nhất</p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/10 text-center">
                                <ArrowDown className="h-6 w-6 text-red-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-red-500">{displayData.overview.worstScore.toFixed(1)}</p>
                                <p className="text-sm text-muted-foreground">Điểm thấp nhất</p>
                            </div>
                        </div>

                        {/* Score Range Visualization */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                <span>0</span>
                                <span>5</span>
                                <span>10</span>
                            </div>
                            <div className="h-4 rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 relative">
                                {displayData.overview.avgScore > 0 && (
                                    <div 
                                        className="absolute top-1/2 -translate-y-1/2 h-6 w-1 bg-foreground rounded"
                                        style={{ left: `${(displayData.overview.avgScore / 10) * 100}%` }}
                                    />
                                )}
                            </div>
                            <p className="text-center text-sm text-muted-foreground mt-2">
                                Điểm trung bình: <span className="font-semibold text-foreground">{displayData.overview.avgScore.toFixed(1)}</span>
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-foreground">Hoạt động gần đây</h2>
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    {displayData.recentExams.length > 0 ? (
                        <div className="space-y-4">
                            {displayData.recentExams.map((exam, index) => (
                                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center",
                                            exam.passed ? "bg-emerald-500/10" : "bg-red-500/10"
                                        )}>
                                            {exam.passed ? (
                                                <Award className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                                <Target className="h-5 w-5 text-red-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{exam.title}</p>
                                            <p className="text-sm text-muted-foreground">{exam.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-lg font-bold",
                                            exam.passed ? "text-emerald-500" : "text-red-500"
                                        )}>
                                            {exam.score}/{exam.maxScore}
                                        </p>
                                        <Badge variant={exam.passed ? "success" : "warning"}>
                                            {exam.passed ? "Đạt" : "Chưa đạt"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Chưa có hoạt động nào</p>
                            <p className="text-sm text-muted-foreground mt-1">Bắt đầu làm đề thi để xem thống kê</p>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
}
