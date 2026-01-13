"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Badge } from "@/client/components/ui/Badge";
import { Button } from "@/client/components/ui/Button";
import { 
    History, 
    Clock, 
    Target,
    Award,
    Calendar,
    ChevronRight,
    Loader2,
    Search,
    Filter,
    ArrowUpDown,
    CheckCircle,
    XCircle,
    Eye
} from "lucide-react";
import { cn } from "@/client/lib/utils";
import Link from "next/link";

interface ExamAttempt {
    id: string;
    examId: string;
    examSlug: string;
    examTitle: string;
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    timeLimit: number;
    completedAt: string;
    passed: boolean;
}

interface HistoryData {
    attempts: ExamAttempt[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    stats: {
        totalAttempts: number;
        avgScore: number;
        passRate: number;
        totalTime: number;
    };
}

export default function HistoryPage() {
    const [data, setData] = useState<HistoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "score">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [filterPassed, setFilterPassed] = useState<"all" | "passed" | "failed">("all");

    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: "10",
                    sortBy,
                    sortOrder,
                    ...(search && { search }),
                    ...(filterPassed !== "all" && { passed: filterPassed }),
                });
                
                const res = await fetch(`/api/user/history?${params}`);
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [page, search, sortBy, sortOrder, filterPassed]);

    const formatTime = (minutes: number) => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins} phút`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const toggleSort = (field: "date" | "score") => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-4">
                            <History className="h-8 w-8 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Lịch sử thi</h1>
                            <p className="text-muted-foreground mt-1">Xem lại các bài thi đã hoàn thành</p>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                {data?.stats && (
                    <div className="grid gap-4 md:grid-cols-4 mb-8">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-500/10 p-2">
                                    <Target className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Tổng số lần thi</p>
                                    <p className="text-xl font-bold text-foreground">{data.stats.totalAttempts}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-emerald-500/10 p-2">
                                    <Award className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Điểm trung bình</p>
                                    <p className="text-xl font-bold text-foreground">{data.stats.avgScore.toFixed(1)}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-purple-500/10 p-2">
                                    <CheckCircle className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Tỷ lệ đạt</p>
                                    <p className="text-xl font-bold text-foreground">{data.stats.passRate}%</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-amber-500/10 p-2">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Tổng thời gian</p>
                                    <p className="text-xl font-bold text-foreground">{formatTime(data.stats.totalTime)}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card className="p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm đề thi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Filter by status */}
                        <div className="flex gap-2">
                            <div className="flex gap-1 p-1 rounded-lg bg-secondary">
                                {(["all", "passed", "failed"] as const).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setFilterPassed(filter)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                                            filterPassed === filter
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {filter === "all" && <Filter className="h-3 w-3" />}
                                        {filter === "passed" && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                                        {filter === "failed" && <XCircle className="h-3 w-3 text-red-500" />}
                                        {filter === "all" ? "Tất cả" : filter === "passed" ? "Đạt" : "Chưa đạt"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => toggleSort("date")}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
                                    sortBy === "date" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Calendar className="h-4 w-4" />
                                Ngày
                                {sortBy === "date" && <ArrowUpDown className="h-3 w-3" />}
                            </button>
                            <button
                                onClick={() => toggleSort("score")}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
                                    sortBy === "score" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Award className="h-4 w-4" />
                                Điểm
                                {sortBy === "score" && <ArrowUpDown className="h-3 w-3" />}
                            </button>
                        </div>
                    </div>
                </Card>

                {/* History List */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : data && data.attempts.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {data.attempts.map((attempt) => (
                                <Card key={attempt.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Score Badge */}
                                        <div className={cn(
                                            "flex items-center justify-center p-6 md:w-32",
                                            attempt.passed 
                                                ? "bg-gradient-to-br from-emerald-500/10 to-green-500/10"
                                                : "bg-gradient-to-br from-red-500/10 to-orange-500/10"
                                        )}>
                                            <div className="text-center">
                                                <p className={cn(
                                                    "text-3xl font-bold",
                                                    attempt.passed ? "text-emerald-500" : "text-red-500"
                                                )}>
                                                    {attempt.score.toFixed(1)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">/{attempt.maxScore}</p>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-4 md:p-6">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-foreground">
                                                        {attempt.examTitle}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            {formatDate(attempt.completedAt)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {formatTime(attempt.timeSpent)} / {formatTime(attempt.timeLimit)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Target className="h-4 w-4" />
                                                            {attempt.correctAnswers}/{attempt.totalQuestions} câu đúng
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Badge variant={attempt.passed ? "success" : "warning"}>
                                                        {attempt.passed ? "Đạt" : "Chưa đạt"}
                                                    </Badge>
                                                    <Link href={`/exam/${attempt.examSlug}/result/${attempt.id}`}>
                                                        <Button variant="outline" size="sm" className="gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            Xem chi tiết
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/exam/${attempt.examSlug}`}>
                                                        <Button size="sm" className="gap-2">
                                                            Thi lại
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-4">
                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full rounded-full transition-all",
                                                            attempt.passed ? "bg-emerald-500" : "bg-red-500"
                                                        )}
                                                        style={{ width: `${(attempt.correctAnswers / attempt.totalQuestions) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {data.pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Trước
                                </Button>
                                
                                <div className="flex gap-1">
                                    {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === data.pagination.totalPages || Math.abs(p - page) <= 1)
                                        .map((p, idx, arr) => (
                                            <div key={p} className="flex items-center">
                                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                    <span className="px-2 text-muted-foreground">...</span>
                                                )}
                                                <button
                                                    onClick={() => setPage(p)}
                                                    className={cn(
                                                        "h-8 w-8 rounded-lg text-sm font-medium transition-colors",
                                                        p === page
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-secondary text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            </div>
                                        ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === data.pagination.totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Sau
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <Card className="p-12 text-center">
                        <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">Chưa có lịch sử thi</h3>
                        <p className="text-muted-foreground mb-6">Bắt đầu làm đề thi để lưu lại kết quả</p>
                        <Link href="/exam">
                            <Button className="gap-2">
                                <Target className="h-4 w-4" />
                                Xem đề thi
                            </Button>
                        </Link>
                    </Card>
                )}
            </main>
        </div>
    );
}
