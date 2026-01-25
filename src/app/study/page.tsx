"use client";

import { useSubject } from "@/client/contexts/SubjectContext";
import { Card } from "@/client/components/ui/Card";
import { BookOpen, FileText, ChevronRight, Play, Bot } from "lucide-react";
import Link from "next/link";
import { Button } from "@/client/components/ui/Button";
import { Badge } from "@/client/components/ui/Badge";
import { ShareButton } from "@/client/components/ui/ShareButton";
import { useStudyChapter } from "@/client/contexts/StudyChapterContext";
import type { TopicInfo } from "@/client/contexts/SubjectContext";

export default function StudyPage() {
    const { selectedSubject, isLoading } = useSubject();
    const { selectedChapterId } = useStudyChapter();

    // Get active chapter
    const activeChapterId = selectedChapterId || selectedSubject?.chapters[0]?.id || null;
    const activeChapter = selectedSubject?.chapters.find(ch => ch.id === activeChapterId);

    // Get practice mode from subject (from database)
    const practiceMode = selectedSubject?.practiceMode || "QUESTION_IDS";
    const isChapterBasedSubject = practiceMode === "CHAPTER";
    const isTopicIdBasedSubject = practiceMode === "TOPIC";

    // Helper function to get practice URL based on subject's practiceMode
    const getPracticeUrl = (topic: TopicInfo) => {
        if (isTopicIdBasedSubject) {
            // TOPIC mode: luyện theo topicId
            return `/simulation?mode=practice&topicId=${topic.id}`;
        }

        if (isChapterBasedSubject) {
            // CHAPTER mode: luyện theo chương (chapterId)
            return `/simulation?mode=practice&chapterId=${activeChapterId}`;
        }

        // QUESTION_IDS mode: now uses topicId since questions are assigned to topics
        // Fallback to questionIds from metadata if topic has no questions in DB
        if (topic.questionCount && topic.questionCount > 0) {
            return `/simulation?mode=practice&topicId=${topic.id}`;
        }

        // Fallback: use questionIds from metadata for backward compatibility
        const questionIds = topic.metadata?.questionIds;
        if (questionIds) {
            const allIds = Object.values(questionIds).flat();
            if (allIds.length > 0) {
                return `/simulation?mode=practice&questionIds=${allIds.join(",")}`;
            }
        }

        // Final fallback to topicId
        return `/simulation?mode=practice&topicId=${topic.id}`;
    };

    // Get question count for display - prefer database count over metadata
    const getQuestionCount = (topic: TopicInfo): number | null => {
        if (isChapterBasedSubject) {
            return null; // Will show chapter-level count instead
        }
        // Use questionCount from database if available
        if (topic.questionCount !== undefined && topic.questionCount > 0) {
            return topic.questionCount;
        }
        // Fallback to metadata questionIds for backward compatibility
        const questionIds = topic.metadata?.questionIds;
        if (questionIds) {
            return Object.values(questionIds).flat().length;
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-muted-foreground animate-pulse">Đang tải dữ liệu...</div>
            </div>
        );
    }

    if (!selectedSubject) {
        return (
            <div className="container mx-auto p-10 text-center">
                <h2 className="text-xl font-bold mb-4">Chưa chọn môn học</h2>
                <p className="text-muted-foreground mb-6">Vui lòng chọn môn học từ sidebar bên trái.</p>
            </div>
        );
    }

    const handleNotebookLM = () => {
        window.open("https://notebooklm.google.com/", "_blank");
    };

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-0">
            <main className="p-3 md:p-4 lg:p-6">
                {/* Header Section */}
                <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="h-6 md:h-8 w-1 bg-primary rounded-full"></div>
                        <h2 className="text-base md:text-xl font-bold text-foreground line-clamp-1">
                            {activeChapter?.name || "Chọn chương học"}
                        </h2>
                        {activeChapter && !isChapterBasedSubject && (
                            <Badge variant="default" className="text-[10px] md:text-xs">
                                {activeChapter.topics.length} chủ đề
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Chapter-level Practice Button for Logistics/PLDC */}
                        {isChapterBasedSubject && activeChapter && (
                            <Link href={`/simulation?mode=practice&chapterId=${activeChapterId}`}>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-1.5 md:gap-2 text-xs md:text-sm font-medium h-8 md:h-9 px-2.5 md:px-3"
                                >
                                    <Play className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    <span className="hidden sm:inline">Luyện tập</span>
                                    <span className="sm:hidden">Luyện</span>
                                </Button>
                            </Link>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 md:gap-2 text-xs md:text-sm font-medium h-8 md:h-9 px-2.5 md:px-3 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                            onClick={handleNotebookLM}
                        >
                            <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="hidden sm:inline">NotebookLM</span>
                            <span className="sm:hidden">AI</span>
                        </Button>
                    </div>
                </div>

                {/* Mobile Chapter Selector */}
                <div className="lg:hidden mb-3 md:mb-4">
                    <select
                        value={activeChapterId || ""}
                        onChange={(e) => {
                            // Would need to set context here
                        }}
                        className="w-full p-2.5 md:p-3 rounded-lg border border-border bg-background text-foreground text-sm"
                    >
                        {selectedSubject.chapters.map((chapter) => (
                            <option key={chapter.id} value={chapter.id}>
                                {chapter.name} {!isChapterBasedSubject && `(${chapter.topics.length} chủ đề)`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Content based on subject type */}
                {activeChapter ? (
                    isChapterBasedSubject ? (
                        // Chapter-based subjects (Logistics, PLDC): Show simple chapter info
                        <div className="space-y-3 md:space-y-4">
                            <Card className="p-4 md:p-6">
                                <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                                    <div className="h-10 w-10 md:h-14 md:w-14 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="h-5 w-5 md:h-7 md:w-7 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base md:text-lg font-semibold text-foreground line-clamp-2">
                                            {activeChapter.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs md:text-sm text-muted-foreground">
                                                Môn {selectedSubject.name}
                                            </p>
                                            {activeChapter.questionCount && activeChapter.questionCount > 0 && (
                                                <Badge variant="info" className="text-[9px] md:text-xs">
                                                    {activeChapter.questionCount} câu hỏi
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3 md:mb-4">
                                    {activeChapter.description || "Luyện tập tất cả câu hỏi trong chương này."}
                                </p>
                                <Link href={`/simulation?mode=practice&chapterId=${activeChapterId}`}>
                                    <Button className="w-full gap-2 h-10 md:h-11">
                                        <Play className="h-4 w-4" />
                                        Bắt đầu luyện tập
                                    </Button>
                                </Link>
                            </Card>
                        </div>
                    ) : (
                        // Topic-based subjects: Show topics grid
                        <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                            {activeChapter.topics.length > 0 ? (
                                activeChapter.topics.map((topic) => {
                                    const questionCount = getQuestionCount(topic);
                                    return (
                                        <Card
                                            key={topic.id}
                                            className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 flex flex-col"
                                        >
                                            <div className="p-3 md:p-5 flex-1">
                                                <div className="flex items-start justify-between mb-2 md:mb-3">
                                                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <FileText className="h-4 w-4 md:h-5 md:w-5" />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {questionCount && (
                                                            <Badge variant="info" className="text-[9px] md:text-xs px-1.5 md:px-2">
                                                                {questionCount} câu
                                                            </Badge>
                                                        )}
                                                        <div className="hidden md:block">
                                                            <ShareButton
                                                                title={`Học cùng mình: ${topic.name}`}
                                                                text={`Mình đang ôn tập chủ đề "${topic.name}" môn ${selectedSubject.name}. Cùng học nhé!`}
                                                                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/study/${topic.slug}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <h3 className="text-sm md:text-lg font-semibold text-foreground mb-1 md:mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                                    <Link href={`/study/${topic.slug}`} className="hover:underline decoration-primary/50 underline-offset-4">
                                                        {topic.name}
                                                    </Link>
                                                </h3>
                                                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 hidden md:block">
                                                    {topic.description || "Chủ đề quan trọng cần nắm vững kiến thức và làm bài tập."}
                                                </p>
                                            </div>

                                            <div className="bg-secondary/30 p-2 md:p-3 flex gap-1 md:gap-2 border-t border-border/50">
                                                <Link href={getPracticeUrl(topic)} className="flex-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full gap-1 md:gap-2 text-[10px] md:text-xs font-medium h-7 md:h-8 hover:bg-background hover:text-emerald-600 hover:shadow-sm"
                                                    >
                                                        <Play className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                        Luyện
                                                    </Button>
                                                </Link>

                                                <Link href={`/study/${topic.slug}`} className="flex-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full gap-1 md:gap-2 text-[10px] md:text-xs font-medium h-7 md:h-8 hover:bg-background hover:text-primary hover:shadow-sm"
                                                    >
                                                        <ChevronRight className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                        Học
                                                    </Button>
                                                </Link>
                                            </div>
                                        </Card>
                                    );
                                })
                            ) : (
                                <div className="col-span-full p-8 text-center text-muted-foreground italic bg-secondary/10 rounded-xl border border-dashed">
                                    Chưa có bài học nào trong chương này
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    <div className="py-20 text-center border-2 border-dashed border-border rounded-xl">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">Chưa có nội dung</h3>
                        <p className="text-muted-foreground">Môn học này đang được cập nhật nội dung.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
