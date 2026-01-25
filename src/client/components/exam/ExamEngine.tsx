"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Badge } from "@/client/components/ui/Badge";
import { Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Flag, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/client/lib/utils";
import { submitExam } from "@/client/lib/exam-data";
import type { Exam } from "@/client/lib/exam-data";

interface ExamEngineProps {
    exam: Exam;
}

export function ExamEngine({ exam }: ExamEngineProps) {
    const router = useRouter();
    const parts = exam.parts || [];
    const allQuestions = parts.flatMap((part) => part.questions);

    // State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
    const [startTime] = useState(Date.now());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);

    // Refs for scrolling
    const questionRef = useRef<HTMLDivElement>(null);

    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const question = allQuestions[currentQuestionIndex];

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const toggleFlag = useCallback((questionId: string) => {
        setFlagged(prev => {
            const newFlagged = new Set(prev);
            if (newFlagged.has(questionId)) newFlagged.delete(questionId);
            else newFlagged.add(questionId);
            return newFlagged;
        });
    }, []);

    const handleAnswer = (questionId: string, choice: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: choice }));
    };

    const navigateQuestion = (index: number) => {
        if (index >= 0 && index < allQuestions.length) {
            setCurrentQuestionIndex(index);
            // Smooth scroll to top of question area
            questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        try {
            const response = await submitExam(exam.slug, { 
                answers, 
                duration: timeSpent,
                track: "COMMON",
                startedAt: new Date(startTime).toISOString()
            });
            const result = (response as any).data || response;

            // Save result for result page
            sessionStorage.setItem(`exam-result-${exam.slug}`, JSON.stringify({
                ...result,
                timeSpent,
                answers // pass answers to review
            }));

            router.push(`/exam/${exam.slug}/result`);
        } catch (error) {
            console.error("Submit error:", error);
            // Fallback (calculate locally if possible, or just error)
            alert("Có lỗi khi nộp bài. Vui lòng thử lại.");
            setIsSubmitting(false);
            setShowConfirm(false);
        }
    };

    const answeredCount = Object.keys(answers).length;
    const progressPercentage = Math.round((answeredCount / allQuestions.length) * 100);

    return (
        <div className={cn("min-h-screen bg-gray-50/50 dark:bg-zinc-950", isFocusMode ? "z-50" : "")}>
            {!isFocusMode && <DashboardHeader />}

            <main className={cn("container mx-auto p-4 lg:p-8 transition-all duration-300", isFocusMode ? "max-w-6xl py-8" : "")}>
                {/* Top Bar: Title & Timer */}
                <div className="sticky top-4 z-40 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-background/80 p-4 shadow-sm backdrop-blur-md border border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block">
                            <h1 className="text-lg font-bold text-foreground line-clamp-1">{exam.title}</h1>
                            <p className="text-xs text-muted-foreground">{answeredCount}/{allQuestions.length} câu đã làm</p>
                        </div>
                        {/* Progress bar for mobile */}
                        <div className="md:hidden w-32 h-2 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${progressPercentage}%` }} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Focus Mode Toggle */}
                        <Button variant="ghost" size="icon" onClick={() => setIsFocusMode(!isFocusMode)} title="Chế độ tập trung">
                            {isFocusMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                        </Button>

                        <div className={cn(
                            "flex items-center gap-2 rounded-xl px-4 py-2 font-mono font-bold border transition-colors",
                            timeLeft < 60 ? "bg-red-500/10 text-red-600 border-red-200" : "bg-secondary text-foreground border-transparent"
                        )}>
                            <Clock className="h-4 w-4" />
                            {formatTime(timeLeft)}
                        </div>

                        <Button
                            className="hidden sm:flex shadow-sm hover:shadow-md transition-all"
                            onClick={() => setShowConfirm(true)}
                            disabled={isSubmitting}
                        >
                            Nộp bài
                        </Button>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12 items-start">
                    {/* LEFT: Question Area */}
                    <div className="lg:col-span-8 space-y-6" ref={questionRef}>
                        {question ? (
                            <Card className="overflow-hidden border-border/60 shadow-md">
                                {/* Question Header */}
                                <div className="border-b border-border/50 bg-secondary/20 p-6 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-primary/90 hover:bg-primary text-sm px-3 py-1">
                                            Câu {currentQuestionIndex + 1}
                                        </Badge>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Phần {allQuestions[currentQuestionIndex]?.num ? Math.floor(allQuestions[currentQuestionIndex].num / 100) : 1}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleFlag(question.id)}
                                        className={cn(
                                            "gap-2 transition-colors",
                                            flagged.has(question.id) ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Flag className={cn("h-4 w-4", flagged.has(question.id) && "fill-current")} />
                                        {flagged.has(question.id) ? "Đã đánh dấu" : "Đánh dấu"}
                                    </Button>
                                </div>

                                {/* Question Content */}
                                <div className="p-6 md:p-8">
                                    <h2 className="text-xl md:text-2xl font-medium leading-relaxed text-foreground mb-8">
                                        {question.content}
                                    </h2>

                                    {/* Choices */}
                                    {question.choices && (
                                        <div className="grid gap-3">
                                            {question.choices.map((choice, idx) => {
                                                const isSelected = answers[question.id] === choice;
                                                const label = String.fromCharCode(65 + idx);

                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleAnswer(question.id, choice)}
                                                        className={cn(
                                                            "group relative flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all duration-200",
                                                            isSelected
                                                                ? "border-primary bg-primary/5 shadow-md"
                                                                : "border-border hover:border-primary/50 hover:bg-secondary/40"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-bold transition-colors",
                                                            isSelected
                                                                ? "border-primary bg-primary text-primary-foreground"
                                                                : "border-muted-foreground/30 bg-background text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
                                                        )}>
                                                            {label}
                                                        </div>
                                                        <div className={cn(
                                                            "flex-1 text-base leading-relaxed pt-0.5",
                                                            isSelected ? "font-medium text-foreground" : "text-foreground/80"
                                                        )}>
                                                            {choice}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Navigation Footer */}
                                <div className="bg-secondary/20 p-4 flex justify-between items-center border-t border-border/50">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigateQuestion(currentQuestionIndex - 1)}
                                        disabled={currentQuestionIndex === 0}
                                        className="gap-2"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Câu trước
                                    </Button>
                                    <Button
                                        onClick={() => navigateQuestion(currentQuestionIndex + 1)}
                                        disabled={currentQuestionIndex === allQuestions.length - 1}
                                        className="gap-2"
                                    >
                                        Câu tiếp <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Sidebar (Navigation Grid) */}
                    <div className="hidden lg:block lg:col-span-4 space-y-6">
                        <Card className="sticky top-24 p-6 shadow-md border-border/60">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-bold text-lg">Danh sách câu hỏi</h3>
                                <span className="text-sm text-muted-foreground">{answeredCount}/{allQuestions.length}</span>
                            </div>

                            <div className="flex gap-4 text-xs mb-6 text-muted-foreground">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đã làm</div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Cờ</div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" /> Hiện tại</div>
                            </div>

                            <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {allQuestions.map((q, idx) => {
                                    const status =
                                        currentQuestionIndex === idx ? 'current' :
                                            flagged.has(q.id) ? 'flagged' :
                                                answers[q.id] ? 'answered' : 'unanswered';

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => navigateQuestion(idx)}
                                            className={cn(
                                                "h-10 w-full rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95",
                                                status === 'current' && "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
                                                status === 'flagged' && "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50",
                                                status === 'answered' && "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50",
                                                status === 'unanswered' && "bg-secondary text-muted-foreground hover:bg-secondary/80 border border-transparent"
                                            )}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-8 pt-6 border-t border-border">
                                <Button className="w-full" size="lg" onClick={() => setShowConfirm(true)} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                    Nộp bài thi
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Mobile Floating Action Button for Map/Submit */}
                <div className="lg:hidden fixed bottom-6 right-6 z-50">
                    <Button
                        size="lg"
                        className="rounded-full h-14 w-14 shadow-xl"
                        onClick={() => setShowConfirm(true)}
                    >
                        <CheckCircle className="h-6 w-6" />
                    </Button>
                </div>

                {/* Confirm Submit Modal */}
                {showConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <Card className="w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                            <div className="text-center mb-6">
                                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <h2 className="text-xl font-bold mb-2">Xác nhận nộp bài?</h2>
                                <p className="text-muted-foreground">
                                    Bạn đã làm <strong className="text-foreground">{answeredCount}/{allQuestions.length}</strong> câu hỏi.
                                    {allQuestions.length - answeredCount > 0 && (
                                        <span className="block text-amber-500 mt-2 font-medium">
                                            Còn {allQuestions.length - answeredCount} câu chưa làm!
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={() => setShowConfirm(false)}>
                                    Làm tiếp
                                </Button>
                                <Button onClick={() => { setShowConfirm(false); handleSubmit(); }}>
                                    Nộp ngay
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
