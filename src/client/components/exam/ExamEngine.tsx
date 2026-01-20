"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Badge } from "@/client/components/ui/Badge";
import { Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Flag, Loader2 } from "lucide-react";
import { cn } from "@/client/lib/utils";
import { submitExam } from "@/client/lib/exam-data";
import type { Exam } from "@/client/lib/exam-data";

interface ExamEngineProps {
    exam: Exam;
}

export function ExamEngine({ exam }: ExamEngineProps) {
    const router = useRouter();
    const parts = exam.parts || [];
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
    const [startTime] = useState(Date.now());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Auto submit when time is up
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const allQuestions = parts.flatMap((part) => part.questions);
    const question = allQuestions[currentQuestion];

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const toggleFlag = useCallback((questionId: string) => {
        setFlagged(prev => {
            const newFlagged = new Set(prev);
            if (newFlagged.has(questionId)) {
                newFlagged.delete(questionId);
            } else {
                newFlagged.add(questionId);
            }
            return newFlagged;
        });
    }, []);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        try {
            const response = await submitExam(exam.slug, {
                answers,
                timeSpent,
            });

            // API returns { success: true, data: {...} } so we need to extract data
            const result = (response as any).data || response;

            // Calculate correctCount and totalQuestions if not provided
            let correctCount = result.correctCount;
            let totalQuestions = result.totalQuestions;
            
            if (correctCount === undefined || totalQuestions === undefined) {
                totalQuestions = allQuestions.length;
                correctCount = 0;
                for (const q of allQuestions) {
                    if (q.correctAnswer && answers[q.id] === q.correctAnswer) {
                        correctCount++;
                    }
                }
            }

            const percentage = result.percentage ?? Math.round((correctCount / totalQuestions) * 100);
            const passed = result.passed ?? percentage >= 50;

            // Store result in sessionStorage for result page
            sessionStorage.setItem(`exam-result-${exam.slug}`, JSON.stringify({
                score: result.score ?? correctCount,
                maxScore: result.maxScore ?? totalQuestions,
                correctCount,
                totalQuestions,
                percentage,
                passed,
                timeSpent: result.timeSpent ?? timeSpent,
                answers,
            }));

            router.push(`/exam/${exam.slug}/result`);
        } catch (error) {
            console.error("Submit error:", error);
            // Fallback: calculate locally
            let correctCount = 0;
            for (const q of allQuestions) {
                if (q.correctAnswer && answers[q.id] === q.correctAnswer) {
                    correctCount++;
                }
            }
            
            const percentage = Math.round((correctCount / allQuestions.length) * 100);
            
            sessionStorage.setItem(`exam-result-${exam.slug}`, JSON.stringify({
                score: correctCount,
                maxScore: allQuestions.length,
                correctCount,
                totalQuestions: allQuestions.length,
                percentage,
                passed: percentage >= 50,
                timeSpent,
                answers,
            }));

            router.push(`/exam/${exam.slug}/result`);
        }
    };

    const getTimeColor = () => {
        if (timeLeft <= 60) return "text-red-500 bg-red-500/10 border-red-500/30";
        if (timeLeft <= 300) return "text-amber-500 bg-amber-500/10 border-amber-500/30";
        return "text-foreground bg-secondary border-border";
    };

    const answeredCount = Object.keys(answers).length;
    const progressPercentage = Math.round((answeredCount / allQuestions.length) * 100);

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header with Timer */}
                <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" aria-label="Thông tin đề thi">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {answeredCount}/{allQuestions.length} câu đã làm
                        </p>
                    </div>
                    <div 
                        className={cn("flex items-center gap-2 rounded-xl border px-4 py-3 font-mono text-lg font-bold", getTimeColor())}
                        role="timer"
                        aria-live="polite"
                        aria-label={`Thời gian còn lại: ${formatTime(timeLeft)}`}
                    >
                        <Clock className="h-5 w-5" aria-hidden="true" />
                        <span>{formatTime(timeLeft)}</span>
                        {timeLeft <= 300 && timeLeft > 0 && (
                            <AlertTriangle className="h-4 w-4 ml-1" aria-hidden="true" />
                        )}
                    </div>
                </section>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div 
                        className="h-2 w-full overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={progressPercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Tiến độ: ${progressPercentage}%`}
                    >
                        <div 
                            className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Question Area */}
                    <div className="lg:col-span-3">
                        <Card className="relative p-6">
                            {/* Question Header */}
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Badge variant="primary">
                                        Câu {currentQuestion + 1}/{allQuestions.length}
                                    </Badge>
                                    {flagged.has(question?.id) && (
                                        <Badge variant="warning" icon={<Flag className="h-3 w-3" />}>
                                            Đã đánh dấu
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => question && toggleFlag(question.id)}
                                    className={flagged.has(question?.id) ? 'text-amber-500' : 'text-muted-foreground'}
                                    aria-pressed={flagged.has(question?.id)}
                                    aria-label={flagged.has(question?.id) ? "Bỏ đánh dấu câu hỏi" : "Đánh dấu câu hỏi"}
                                >
                                    <Flag className="h-4 w-4" aria-hidden="true" />
                                    {flagged.has(question?.id) ? "Bỏ đánh dấu" : "Đánh dấu"}
                                </Button>
                            </div>

                            {/* Question Content */}
                            <h2 className="mb-8 text-xl font-semibold text-foreground leading-relaxed">
                                {question?.content}
                            </h2>

                            {/* Answer Choices */}
                            {question?.type === "MULTIPLE_CHOICE" && question.choices && (
                                <fieldset>
                                    <legend className="sr-only">Chọn câu trả lời</legend>
                                    <div className="space-y-3" role="radiogroup">
                                        {question.choices.map((choice, index) => {
                                            const isSelected = answers[question.id] === choice;
                                            const optionLabel = String.fromCharCode(65 + index);
                                            
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => setAnswers({ ...answers, [question.id]: choice })}
                                                    className={cn(
                                                        "w-full rounded-xl border-2 p-4 text-left transition-all duration-200 cursor-pointer",
                                                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                                                        isSelected
                                                            ? "border-primary bg-primary/10 shadow-md"
                                                            : "border-border hover:border-primary/30 hover:bg-secondary/50"
                                                    )}
                                                    role="radio"
                                                    aria-checked={isSelected}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <span className={cn(
                                                            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-semibold",
                                                            isSelected 
                                                                ? "bg-primary text-primary-foreground" 
                                                                : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {optionLabel}
                                                        </span>
                                                        <span className={isSelected ? "text-foreground" : "text-muted-foreground"}>
                                                            {choice}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            )}

                            {/* Navigation Buttons */}
                            <div className="mt-8 flex gap-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                                    disabled={currentQuestion === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                    Câu trước
                                </Button>
                                <Button
                                    onClick={() => setCurrentQuestion(Math.min(allQuestions.length - 1, currentQuestion + 1))}
                                    disabled={currentQuestion === allQuestions.length - 1}
                                >
                                    Câu tiếp
                                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Question Navigation Sidebar */}
                    <aside aria-label="Danh sách câu hỏi">
                        <Card className="sticky top-6 p-6">
                            <h3 className="mb-4 font-semibold text-foreground">Danh sách câu hỏi</h3>
                            
                            {/* Legend */}
                            <div className="mb-4 flex flex-wrap gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 rounded bg-emerald-500" />
                                    <span className="text-muted-foreground">Đã làm</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 rounded bg-amber-500" />
                                    <span className="text-muted-foreground">Đánh dấu</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-3 w-3 rounded bg-primary" />
                                    <span className="text-muted-foreground">Hiện tại</span>
                                </div>
                            </div>

                            {/* Question Grid */}
                            <div className="grid grid-cols-5 gap-2" role="navigation" aria-label="Chuyển đến câu hỏi">
                                {allQuestions.map((q, index) => {
                                    const isAnswered = answers[q.id];
                                    const isFlagged = flagged.has(q.id);
                                    const isCurrent = currentQuestion === index;
                                    
                                    return (
                                        <button
                                            key={`question-nav-${index}`}
                                            onClick={() => setCurrentQuestion(index)}
                                            className={cn(
                                                "aspect-square rounded-lg border-2 text-sm font-semibold transition-all duration-200 cursor-pointer",
                                                "focus:outline-none focus:ring-2 focus:ring-primary",
                                                isCurrent
                                                    ? "border-primary bg-primary/20 text-primary"
                                                    : isFlagged
                                                        ? "border-amber-500 bg-amber-500/10 text-amber-500"
                                                        : isAnswered
                                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                                                            : "border-border text-muted-foreground hover:border-primary/30"
                                            )}
                                            aria-label={`Câu ${index + 1}${isAnswered ? ' - đã làm' : ''}${isFlagged ? ' - đánh dấu' : ''}`}
                                            aria-current={isCurrent ? "true" : undefined}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Submit Button */}
                            <Button 
                                className="mt-6 w-full"
                                onClick={() => setShowConfirm(true)}
                                disabled={isSubmitting}
                                aria-label={`Nộp bài - Đã làm ${answeredCount}/${allQuestions.length} câu`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                                ) : (
                                    <CheckCircle className="h-5 w-5" aria-hidden="true" />
                                )}
                                {isSubmitting ? "Đang nộp..." : `Nộp bài (${answeredCount}/${allQuestions.length})`}
                            </Button>
                        </Card>
                    </aside>
                </div>

                {/* Confirm Modal */}
                {showConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <Card className="w-full max-w-md p-6 mx-4">
                            <h2 className="text-xl font-bold text-foreground mb-4">Xác nhận nộp bài</h2>
                            <p className="text-muted-foreground mb-2">
                                Bạn đã hoàn thành <span className="font-semibold text-foreground">{answeredCount}/{allQuestions.length}</span> câu hỏi.
                            </p>
                            {answeredCount < allQuestions.length && (
                                <p className="text-amber-500 text-sm mb-4">
                                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                                    Còn {allQuestions.length - answeredCount} câu chưa trả lời!
                                </p>
                            )}
                            <div className="flex gap-3 mt-6">
                                <Button 
                                    variant="secondary" 
                                    className="flex-1"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={isSubmitting}
                                >
                                    Tiếp tục làm
                                </Button>
                                <Button 
                                    className="flex-1"
                                    onClick={() => {
                                        setShowConfirm(false);
                                        handleSubmit();
                                    }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Nộp bài"}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
