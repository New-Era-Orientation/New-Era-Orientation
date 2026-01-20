"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Badge } from "@/client/components/ui/Badge";
import { 
    Trophy, 
    CheckCircle, 
    XCircle, 
    Clock, 
    RotateCcw, 
    Home, 
    ArrowRight,
    Target,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/client/lib/utils";
import type { Exam, Question } from "@/client/lib/exam-data";

interface ExamResult {
    score: number;
    maxScore: number;
    correctCount: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    timeSpent: number;
    answers: Record<string, string>;
}

interface ExamResultClientProps {
    exam: Exam;
    result: ExamResult;
}

export function ExamResultClient({ exam, result }: ExamResultClientProps) {
    const [showDetails, setShowDetails] = useState(false);
    
    // Early return if result is undefined/null
    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">Đang tải kết quả...</p>
            </div>
        );
    }
    
    const parts = exam.parts || [];
    const allQuestions = parts.flatMap((part) => part.questions);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins} phút ${secs} giây`;
    };

    const getGrade = (percentage: number) => {
        if (percentage >= 90) return { label: "Xuất sắc", color: "text-emerald-500", bg: "bg-emerald-500/10" };
        if (percentage >= 80) return { label: "Giỏi", color: "text-blue-500", bg: "bg-blue-500/10" };
        if (percentage >= 70) return { label: "Khá", color: "text-cyan-500", bg: "bg-cyan-500/10" };
        if (percentage >= 50) return { label: "Trung bình", color: "text-amber-500", bg: "bg-amber-500/10" };
        return { label: "Cần cố gắng", color: "text-red-500", bg: "bg-red-500/10" };
    };

    const percentage = result?.percentage ?? 0;
    const passed = result?.passed ?? false;
    const correctCount = result?.correctCount ?? 0;
    const totalQuestions = result?.totalQuestions ?? 0;
    const timeSpent = result?.timeSpent ?? 0;
    const answers = result?.answers ?? {};
    const score = result?.score ?? 0;
    const maxScore = result?.maxScore ?? 10;

    const grade = getGrade(percentage) || { label: "Đang tải", color: "text-muted-foreground", bg: "bg-muted" };

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Result Header */}
                <div className="text-center mb-10">
                    <div className={cn(
                        "mx-auto mb-6 inline-flex rounded-full p-8",
                        passed ? "bg-emerald-500/10" : "bg-red-500/10"
                    )}>
                        {passed ? (
                            <Trophy className="h-16 w-16 text-emerald-500" />
                        ) : (
                            <Target className="h-16 w-16 text-red-500" />
                        )}
                    </div>
                    
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {passed ? "Chúc mừng!" : "Đừng nản chí!"}
                    </h1>
                    <p className="text-muted-foreground mb-4">
                        {passed 
                            ? "Bạn đã hoàn thành bài thi thành công" 
                            : "Hãy ôn tập và thử lại lần nữa nhé"}
                    </p>

                    <Badge variant={passed ? "success" : "warning"} className="text-lg px-4 py-2">
                        {grade.label}
                    </Badge>
                </div>

                {/* Score Display */}
                <div className="max-w-3xl mx-auto mb-10">
                    <Card className="p-8 text-center">
                        <div className="mb-6">
                            <div className="text-6xl font-bold text-primary mb-2">
                                {percentage}%
                            </div>
                            <p className="text-muted-foreground">
                                {Number(score).toFixed(1)} / {maxScore} điểm
                            </p>
                        </div>

                        {/* Progress Ring */}
                        <div className="relative w-40 h-40 mx-auto mb-6">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="none"
                                    className="text-muted"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${percentage * 4.4} 440`}
                                    className={passed ? "text-emerald-500" : "text-amber-500"}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-foreground">{correctCount}</div>
                                    <div className="text-sm text-muted-foreground">/{totalQuestions}</div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-xl bg-emerald-500/10 p-4">
                                <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-foreground">{correctCount}</div>
                                <div className="text-sm text-muted-foreground">Đúng</div>
                            </div>
                            <div className="rounded-xl bg-red-500/10 p-4">
                                <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-foreground">{totalQuestions - correctCount}</div>
                                <div className="text-sm text-muted-foreground">Sai</div>
                            </div>
                            <div className="rounded-xl bg-blue-500/10 p-4">
                                <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                                <div className="text-lg font-bold text-foreground">{formatTime(timeSpent)}</div>
                                <div className="text-sm text-muted-foreground">Thời gian</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-4 mb-10">
                    <Button onClick={() => setShowDetails(!showDetails)} variant="secondary">
                        <TrendingUp className="h-4 w-4" />
                        {showDetails ? "Ẩn chi tiết" : "Xem chi tiết"}
                    </Button>
                    <Link href={`/exam/${exam.slug}/take`}>
                        <Button variant="secondary">
                            <RotateCcw className="h-4 w-4" />
                            Làm lại
                        </Button>
                    </Link>
                    <Link href="/exam">
                        <Button>
                            Đề thi khác
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Question Review */}
                {showDetails && (
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-xl font-bold text-foreground mb-6">Chi tiết bài làm</h2>
                        <div className="space-y-4">
                            {allQuestions.map((q, index) => {
                                const userAnswer = answers[q.id];
                                const isCorrect = userAnswer === q.correctAnswer;
                                
                                return (
                                    <Card key={q.id} className={cn(
                                        "p-4 border-l-4",
                                        isCorrect ? "border-l-emerald-500" : "border-l-red-500"
                                    )}>
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                                                isCorrect ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                            )}>
                                                {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground mb-2">
                                                    Câu {index + 1}: {q.content.substring(0, 100)}...
                                                </p>
                                                <div className="text-sm space-y-1">
                                                    <p className="text-muted-foreground">
                                                        Bạn chọn: <span className={isCorrect ? "text-emerald-500" : "text-red-500"}>{userAnswer || "(Chưa trả lời)"}</span>
                                                    </p>
                                                    {!isCorrect && (
                                                        <p className="text-muted-foreground">
                                                            Đáp án đúng: <span className="text-emerald-500">{q.correctAnswer}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Back to Home */}
                <div className="text-center mt-10">
                    <Link href="/dashboard">
                        <Button variant="ghost">
                            <Home className="h-4 w-4" />
                            Về trang chủ
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
