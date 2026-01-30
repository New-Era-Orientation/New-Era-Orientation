"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Play, Clock, Target, BookOpen, Lightbulb, Filter, Shuffle, Zap, X, ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "@/client/components/ui/Card";
import { Badge } from "@/client/components/ui/Badge";
import { Button } from "@/client/components/ui/Button";
import { useSubject } from "@/client/contexts/SubjectContext";
import { SubjectPicker } from "@/client/components/ui/SubjectPicker";

// Practice Mode Component
interface Question {
    id: string;
    content: string;
    explanation?: string;
    options: {
        id: string;
        content: string;
        isCorrect: boolean;
    }[];
}

function PracticeMode({ topicId, chapterId, questionIds, onBack }: { topicId?: string; chapterId?: string; questionIds?: string; onBack: () => void }) {
    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { selectedSubject } = useSubject();

    // Quiz State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
    const [revealStates, setRevealStates] = useState<Record<string, boolean>>({}); // questionId -> boolean (is revealed)

    // Find topic/chapter name
    const topicName = topicId
        ? selectedSubject?.chapters.flatMap(c => c.topics).find(t => t.id === topicId)?.name
        : null;
    const chapterName = chapterId
        ? selectedSubject?.chapters.find(c => c.id === chapterId)?.name
        : null;

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setIsLoading(true);
                let url = "/api/practice/questions?";
                if (questionIds) {
                    url += `questionIds=${questionIds}`;
                } else if (chapterId) {
                    url += `chapterId=${chapterId}`;
                } else if (topicId) {
                    url += `topicId=${topicId}`;
                }

                const res = await fetch(url);
                const data = await res.json();

                if (data.success) {
                    setQuestions(data.data);
                } else {
                    setError(data.error || "Không thể tải câu hỏi");
                }
            } catch {
                setError("Có lỗi xảy ra khi tải câu hỏi");
            } finally {
                setIsLoading(false);
            }
        };

        if (topicId || chapterId || questionIds) {
            fetchQuestions();
        }
    }, [topicId, chapterId, questionIds]);

    const handleAnswer = (questionId: string, optionId: string) => {
        if (answers[questionId]) return; // Already answered
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
        setRevealStates(prev => ({ ...prev, [questionId]: true }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Đang tải câu hỏi...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                <div className="container mx-auto p-6 lg:p-10">
                    <div className="text-center py-20">
                        <p className="text-destructive mb-4">{error}</p>
                        <Button onClick={onBack} variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const isAnswered = currentQuestion && !!answers[currentQuestion.id];
    const selectedOptionId = currentQuestion ? answers[currentQuestion.id] : null;

    return (
        <div className="min-h-screen bg-background pb-20">
            <DashboardHeader />
            <main className="container mx-auto p-4 md:p-6 max-w-4xl">
                {/* Header Info */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Button onClick={onBack} variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Button>
                        <h1 className="text-xl font-bold text-foreground">
                            {topicName || chapterName || "Luyện tập"}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="default" className="text-xs font-normal">
                                Câu {currentIndex + 1}/{questions.length}
                            </Badge>
                            <span>•</span>
                            <span>Practice Mode</span>
                        </div>
                    </div>

                    {/* Progress Ring or Simple Count could go here */}
                </div>

                {questions.length === 0 ? (
                    <Card className="p-10 text-center">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="font-semibold text-foreground mb-2">Chưa có câu hỏi</h3>
                        <p className="text-muted-foreground mb-4">
                            Chủ đề này chưa có câu hỏi luyện tập.
                        </p>
                        <Button onClick={onBack}>Quay lại</Button>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>

                        {/* Question Card */}
                        <Card className="p-6 md:p-8 shadow-sm border-border/60">
                            <div className="mb-6">
                                <h3 className="text-lg md:text-xl font-medium leading-relaxed text-foreground">
                                    {currentQuestion.content}
                                </h3>
                            </div>

                            <div className="grid gap-3">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = selectedOptionId === option.id;
                                    const isCorrect = option.isCorrect;
                                    const showResult = isAnswered;

                                    let variant = "outline";
                                    let className = "justify-start text-left h-auto py-3 px-4 w-full border-border hover:bg-secondary/50";

                                    if (showResult) {
                                        if (isCorrect) {
                                            className += " bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-medium";
                                            variant = "default"; // Just to override outline behavior if needed, but className handles bg
                                        } else if (isSelected && !isCorrect) {
                                            className += " bg-destructive/10 border-destructive text-destructive font-medium";
                                        } else {
                                            className += " opacity-60";
                                        }
                                    } else if (isSelected) {
                                        className += " border-primary bg-primary/5 text-primary";
                                    }

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleAnswer(currentQuestion.id, option.id)}
                                            disabled={isAnswered}
                                            className={`relative flex items-center gap-3 rounded-lg border transition-all ${className}`}
                                        >
                                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${showResult && isCorrect ? "border-emerald-500 bg-emerald-500 text-white" :
                                                showResult && isSelected && !isCorrect ? "border-destructive bg-destructive text-white" :
                                                    "border-muted-foreground/30 text-muted-foreground"
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span>{option.content}</span>

                                            {showResult && isCorrect && (
                                                <div className="absolute right-3 text-emerald-600">
                                                    <Target className="h-4 w-4" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explanation */}
                            {isAnswered && (
                                <div className="mt-6 rounded-lg bg-secondary/50 p-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-start gap-3">
                                        <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-foreground mb-1">Giải thích</p>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                {currentQuestion.explanation || "Chưa có giải thích cho câu hỏi này."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                            >
                                Câu trước
                            </Button>

                            <Button
                                onClick={handleNext}
                                disabled={currentIndex === questions.length - 1}
                                className={currentIndex === questions.length - 1 ? "invisible" : ""}
                            >
                                Câu tiếp
                                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                            </Button>

                            {currentIndex === questions.length - 1 && (
                                <Button onClick={onBack} variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                                    Hoàn thành
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function SimulationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const mode = searchParams.get("mode");
    const topicId = searchParams.get("topicId");
    const chapterId = searchParams.get("chapterId");
    const questionIds = searchParams.get("questionIds");

    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const { selectedSubject } = useSubject();

    // If in practice mode with params, show practice interface
    if (mode === "practice" && (topicId || chapterId || questionIds)) {
        return (
            <PracticeMode
                topicId={topicId || undefined}
                chapterId={chapterId || undefined}
                questionIds={questionIds || undefined}
                onBack={() => router.push("/simulation")}
            />
        );
    }

    // Map chapters to simulation topics
    const topics = selectedSubject?.chapters.map((chapter, index) => ({
        id: chapter.id,
        title: chapter.name,
        description: chapter.description || "Luyện tập các câu hỏi thuộc chương này",
        questions: chapter.topicCount * 10 || 20,
        difficulty: (index % 3 === 0 ? "easy" : index % 3 === 1 ? "medium" : "hard") as "easy" | "medium" | "hard",
        color: index % 3 === 0 ? "from-emerald-500/20 to-green-500/20" : index % 3 === 1 ? "from-primary/20 to-cyan-500/20" : "from-purple-500/20 to-pink-500/20",
        iconBg: index % 3 === 0 ? "bg-emerald-500/10 text-emerald-400" : index % 3 === 1 ? "bg-primary/10 text-primary" : "bg-purple-500/10 text-purple-400",
        completedQuestions: 0,
    })) || [];

    const features = [
        { icon: Clock, title: "Không giới hạn thời gian", description: "Làm bài thoải mái, không áp lực", color: "text-primary bg-primary/10" },
        { icon: Lightbulb, title: "Gợi ý thông minh", description: "Nhận gợi ý khi gặp khó khăn", color: "text-purple-400 bg-purple-500/10" },
        { icon: Target, title: "Phản hồi tức thì", description: "Biết ngay kết quả sau mỗi câu", color: "text-emerald-400 bg-emerald-500/10" },
    ];

    const getDifficultyLabel = (difficulty: "easy" | "medium" | "hard") => {
        const labels = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
        return labels[difficulty];
    };

    const filteredTopics = topics.filter((topic) => {
        if (selectedDifficulty && getDifficultyLabel(topic.difficulty) !== selectedDifficulty) return false;
        return true;
    });

    const clearFilters = () => setSelectedDifficulty(null);

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header */}
                <section className="mb-10">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground">🎯 Luyện tập</h1>
                            <p className="mt-2 text-lg text-muted-foreground">
                                Luyện tập không giới hạn thời gian với gợi ý và giải thích chi tiết
                            </p>
                        </div>
                        <SubjectPicker />
                    </div>
                </section>

                {/* Features */}
                <section className="mb-10">
                    <div className="grid gap-4 md:grid-cols-3">
                        {features.map((feature, index) => (
                            <Card key={index} className="group p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`rounded-xl p-3 ${feature.color}`}>
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">{feature.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Question Bank Section */}
                <section>
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <Zap className="h-6 w-6 text-amber-500" />
                                Ngân hàng câu hỏi
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Luyện tập theo chương với <span className="font-semibold text-foreground">{topics.length}</span> chủ đề
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-4">
                        <select
                            value={selectedDifficulty || ""}
                            onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                            className="appearance-none rounded-lg border border-border bg-secondary px-4 py-3 pr-10 text-foreground focus:border-primary focus:outline-none"
                        >
                            <option value="">Tất cả độ khó</option>
                            <option value="Dễ">Dễ</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Khó">Khó</option>
                        </select>

                        {selectedDifficulty && (
                            <button onClick={clearFilters} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-muted-foreground hover:bg-secondary">
                                <X className="h-4 w-4" />
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {/* Topics Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTopics.map((topic) => {
                            const progressPercentage = Math.round((topic.completedQuestions / topic.questions) * 100);
                            return (
                                <Card key={topic.id} hover className="group relative overflow-hidden p-6">
                                    <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${topic.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                    <div className="mb-4 flex items-start justify-between">
                                        <div className={`rounded-xl p-3 ${topic.iconBg}`}>
                                            <BookOpen className="h-6 w-6" />
                                        </div>
                                        <Badge variant={topic.difficulty === "easy" ? "success" : topic.difficulty === "medium" ? "warning" : "error"}>
                                            {getDifficultyLabel(topic.difficulty)}
                                        </Badge>
                                    </div>

                                    <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {topic.title}
                                    </h3>
                                    <p className="mb-4 text-sm text-muted-foreground">{topic.description}</p>

                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Target className="h-4 w-4" />
                                                Tiến độ
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {topic.completedQuestions}/{topic.questions}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={`h-full rounded-full transition-all ${topic.difficulty === "easy" ? "bg-emerald-500" : topic.difficulty === "medium" ? "bg-amber-500" : "bg-purple-500"}`}
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                            <Play className="h-4 w-4" />
                                            Luyện tập
                                        </button>
                                        <button className="rounded-lg border border-border px-3 py-2 text-muted-foreground hover:bg-secondary">
                                            <Shuffle className="h-4 w-4" />
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Empty state */}
                    {filteredTopics.length === 0 && (
                        <div className="py-20 text-center">
                            <div className="mx-auto mb-6 inline-flex rounded-full bg-secondary p-6">
                                <Filter className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-foreground">Không tìm thấy chủ đề</h3>
                            <p className="mb-6 text-muted-foreground">Thử thay đổi bộ lọc</p>
                            <button onClick={clearFilters} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90">
                                Xóa bộ lọc
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
