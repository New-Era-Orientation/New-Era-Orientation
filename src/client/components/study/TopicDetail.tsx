"use client";

import { Card } from "@/client/components/ui/Card";
import { Badge } from "@/client/components/ui/Badge";
import { Button } from "@/client/components/ui/Button";
import { Play, BookOpen, Download, CheckCircle, Clock, Bookmark, ArrowRight, ArrowLeft, Loader2, FileText, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Chapter {
    id: string;
    name: string;
    slug: string;
    content?: string;
    duration?: number | null;
    pdfUrl?: string | null;
    exercises?: Exercise[] | null;
}

interface Exercise {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface Topic {
    id: string;
    name: string;
    slug: string;
    chapters: { id: string; name: string; slug: string }[];
}

interface UserProgress {
    completed: boolean;
    timeSpent: number;
    lastAccess: string;
}

interface TopicDetailProps {
    topic: Topic;
    chapter: Chapter;
    userProgress?: UserProgress | null;
}

export function TopicDetail({ topic, chapter, userProgress }: TopicDetailProps) {
    const { data: session } = useSession();
    const [playbackSpeed, setPlaybackSpeed] = useState("1x");
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isCompleted, setIsCompleted] = useState(userProgress?.completed ?? false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [showExercises, setShowExercises] = useState(false);
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const speeds = ["0.5x", "1x", "1.5x", "2x"];

    // Find current, prev, and next chapters
    const currentIndex = topic.chapters.findIndex((c) => c.slug === chapter.slug);
    const prevChapter = currentIndex > 0 ? topic.chapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < topic.chapters.length - 1 ? topic.chapters[currentIndex + 1] : null;

    // Handle mark complete
    const handleMarkComplete = useCallback(async () => {
        if (!session?.user) {
            setNotification({ type: "error", message: "Vui lòng đăng nhập để đánh dấu hoàn thành" });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setIsMarkingComplete(true);
        try {
            const method = isCompleted ? "DELETE" : "POST";
            const response = await fetch(`/api/topics/${topic.slug}/complete`, {
                method,
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();

            if (data.success) {
                setIsCompleted(!isCompleted);
                setNotification({
                    type: "success",
                    message: isCompleted ? "Đã bỏ đánh dấu hoàn thành" : "Đã hoàn thành bài học!",
                });
            } else {
                throw new Error(data.error || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error("Error marking complete:", error);
            setNotification({
                type: "error",
                message: "Không thể đánh dấu. Vui lòng thử lại.",
            });
        } finally {
            setIsMarkingComplete(false);
            setTimeout(() => setNotification(null), 3000);
        }
    }, [session, isCompleted, topic.slug]);

    // Handle download PDF
    const handleDownloadPDF = useCallback(async () => {
        if (chapter.pdfUrl) {
            window.open(chapter.pdfUrl, "_blank");
        } else {
            // Generate PDF on-the-fly (mock for now)
            setNotification({
                type: "error",
                message: "PDF chưa có sẵn. Tính năng đang được phát triển.",
            });
            setTimeout(() => setNotification(null), 3000);
        }
    }, [chapter.pdfUrl]);

    // Handle practice exercises
    const handlePractice = useCallback(() => {
        if (chapter.exercises && chapter.exercises.length > 0) {
            setShowExercises(true);
        } else {
            setNotification({
                type: "error",
                message: "Chưa có bài tập cho bài học này.",
            });
            setTimeout(() => setNotification(null), 3000);
        }
    }, [chapter.exercises]);

    return (
        <div className="p-6 lg:p-10">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 ${
                    notification.type === "success" 
                        ? "bg-green-500 text-white" 
                        : "bg-destructive text-destructive-foreground"
                }`}>
                    {notification.type === "success" ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <AlertCircle className="h-5 w-5" />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-8">
                <p className="mb-2 text-sm text-muted-foreground">{topic.name}</p>
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold text-foreground">{chapter.name}</h1>
                    {isCompleted && (
                        <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Đã hoàn thành
                        </Badge>
                    )}
                </div>

                {/* Progress indicator */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <Badge variant="info">
                        Bài {currentIndex + 1}/{topic.chapters.length}
                    </Badge>
                    {chapter.duration && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" aria-hidden="true" />
                            <span>{chapter.duration} phút</span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        className={`flex items-center gap-1 text-sm transition-colors cursor-pointer ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        aria-pressed={isBookmarked}
                        aria-label={isBookmarked ? "Đã lưu" : "Lưu bài học"}
                    >
                        <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} aria-hidden="true" />
                        <span>{isBookmarked ? 'Đã lưu' : 'Lưu'}</span>
                    </button>
                </div>
            </nav>

            {/* Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Card className="p-6 lg:p-8">
                        <article className="prose prose-neutral dark:prose-invert max-w-none">
                            {chapter.content ? (
                                <ReactMarkdown
                                    components={{
                                        h1: ({ children }) => <h1 className="text-3xl font-bold text-foreground mt-8 mb-4">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-2xl font-bold text-foreground mt-6 mb-3">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">{children}</h3>,
                                        p: ({ children }) => <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">{children}</ol>,
                                        li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                                        code: ({ className, children }) => {
                                            const isInline = !className;
                                            if (isInline) {
                                                return <code className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-sm">{children}</code>;
                                            }
                                            return (
                                                <code className="block p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
                                                    {children}
                                                </code>
                                            );
                                        },
                                        pre: ({ children }) => <pre className="p-4 rounded-lg bg-muted overflow-x-auto mb-4">{children}</pre>,
                                        table: ({ children }) => (
                                            <div className="overflow-x-auto mb-4">
                                                <table className="w-full border-collapse border border-border">{children}</table>
                                            </div>
                                        ),
                                        th: ({ children }) => <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">{children}</th>,
                                        td: ({ children }) => <td className="border border-border px-4 py-2">{children}</td>,
                                        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                    }}
                                >
                                    {chapter.content}
                                </ReactMarkdown>
                            ) : (
                                <p className="text-muted-foreground">Nội dung đang được cập nhật...</p>
                            )}
                        </article>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Video Section */}
                    <Card hover className="group p-6">
                        <h2 className="mb-4 text-lg font-bold text-foreground">Video bài giảng</h2>
                        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button 
                                    className="group/btn rounded-full bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/30 transition-colors duration-200 hover:bg-primary/80 focus:outline-none focus:ring-4 focus:ring-primary/30 cursor-pointer"
                                    aria-label="Phát video"
                                >
                                    <Play className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20" aria-hidden="true" />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Video sẽ sớm có</span>
                            <div className="flex gap-1">
                                {speeds.map((speed) => (
                                    <button
                                        key={speed}
                                        onClick={() => setPlaybackSpeed(speed)}
                                        className={`rounded px-2 py-1 font-medium transition-colors cursor-pointer ${playbackSpeed === speed
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:bg-secondary"
                                        }`}
                                    >
                                        {speed}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    <Card className="p-6">
                        <h2 className="mb-4 text-lg font-bold text-foreground">Tài nguyên</h2>
                        <div className="space-y-3">
                            <Button 
                                variant="ghost" 
                                className="w-full justify-start"
                                onClick={handleDownloadPDF}
                            >
                                <Download className="h-4 w-4" aria-hidden="true" />
                                Tải PDF
                                {chapter.pdfUrl && (
                                    <Badge variant="success" className="ml-auto text-xs">Có sẵn</Badge>
                                )}
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="w-full justify-start"
                                onClick={handlePractice}
                            >
                                <BookOpen className="h-4 w-4" aria-hidden="true" />
                                Bài tập thực hành
                                {chapter.exercises && chapter.exercises.length > 0 && (
                                    <Badge variant="info" className="ml-auto text-xs">
                                        {chapter.exercises.length} câu
                                    </Badge>
                                )}
                            </Button>
                        </div>
                    </Card>

                    {/* Completion Status */}
                    <Card className="p-6">
                        <h2 className="mb-4 text-lg font-bold text-foreground">Tiến độ</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Trạng thái:</span>
                                <Badge variant={isCompleted ? "success" : "default"}>
                                    {isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
                                </Badge>
                            </div>
                            {userProgress?.timeSpent && userProgress.timeSpent > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Thời gian học:</span>
                                    <span className="font-medium">{Math.round(userProgress.timeSpent / 60)} phút</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Exercises Modal */}
            {showExercises && chapter.exercises && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Bài tập thực hành</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowExercises(false)}>
                                ✕
                            </Button>
                        </div>
                        <div className="space-y-6">
                            {chapter.exercises.map((exercise, index) => (
                                <div key={exercise.id} className="p-4 rounded-lg bg-muted/50">
                                    <p className="font-medium mb-3">
                                        Câu {index + 1}: {exercise.question}
                                    </p>
                                    <div className="space-y-2">
                                        {exercise.options.map((option, optIndex) => (
                                            <button
                                                key={optIndex}
                                                className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                                            >
                                                {String.fromCharCode(65 + optIndex)}. {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={() => setShowExercises(false)}>
                                Đóng
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                {prevChapter ? (
                    <Link href={`/study/${prevChapter.slug}`} className="flex-1">
                        <Card hover className="group p-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Bài trước</p>
                                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                        {prevChapter.name}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ) : <div className="flex-1" />}

                {nextChapter && (
                    <Link href={`/study/${nextChapter.slug}`} className="flex-1">
                        <Card hover glow className="group p-4 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Bài tiếp theo</p>
                                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                        {nextChapter.name}
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </Card>
                    </Link>
                )}
            </div>

            {/* Completion */}
            <div className="mt-6 text-center">
                <Button 
                    size="lg"
                    variant={isCompleted ? "secondary" : "default"}
                    onClick={handleMarkComplete}
                    disabled={isMarkingComplete}
                >
                    {isMarkingComplete ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : isCompleted ? (
                        <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Đã hoàn thành ✓
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-5 w-5" />
                            Đánh dấu hoàn thành
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
