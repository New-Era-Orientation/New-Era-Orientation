"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSubject } from "@/client/contexts/SubjectContext";
import { useStudyChapter } from "@/client/contexts/StudyChapterContext";
import { useSidebar } from "@/client/contexts/SidebarContext";
import { cn } from "@/client/lib/utils";
import { ChevronRight, CheckCircle, Circle, TrendingUp, ChevronDown, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";

export function StudySidebar() {
    const pathname = usePathname();
    const { selectedSubject, subjects, setSelectedSubjectId, isLoading } = useSubject();
    const { selectedChapterId, setSelectedChapterId } = useStudyChapter();
    const { isOpen, toggle } = useSidebar();
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

    // Mock progress data - would come from API
    const progress: Record<string, boolean> = {};

    // Get chapters from selected subject
    const chapters = selectedSubject?.chapters || [];

    // Active chapter (default to first chapter)
    const activeChapterId = selectedChapterId || chapters[0]?.id || null;

    // Calculate overall progress
    const totalTopics = chapters.reduce((acc, chapter) => acc + chapter.topics.length, 0);
    const completedTopics = Object.values(progress).filter(Boolean).length;
    const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Check if we're on the main study page (not a topic detail page)
    const isMainStudyPage = pathname === "/study";

    const handleSelectSubject = (subjectId: string) => {
        setSelectedSubjectId(subjectId);
        setSelectedChapterId(null); // Reset chapter when changing subject
        setIsSubjectDropdownOpen(false);
    };

    // Collapsed state - just show toggle button
    if (!isOpen) {
        return (
            <aside className="w-14 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] sticky top-14 md:top-16 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col items-center py-4">
                <button
                    onClick={toggle}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Mở sidebar"
                    title="Mở sidebar"
                >
                    <PanelLeft className="h-5 w-5" />
                </button>
                
                {/* Mini subject icon */}
                {selectedSubject && (
                    <div className="mt-4 p-2 rounded-lg bg-secondary/50" title={selectedSubject.name}>
                        <span className="text-xl">{selectedSubject.icon || "📘"}</span>
                    </div>
                )}

                {/* Mini progress */}
                <div className="mt-4 flex flex-col items-center gap-1" title={`Tiến độ: ${progressPercentage}%`}>
                    <div className="h-16 w-1.5 rounded-full bg-secondary overflow-hidden">
                        <div 
                            className="w-full bg-primary rounded-full transition-all duration-500"
                            style={{ height: `${progressPercentage}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{progressPercentage}%</span>
                </div>

                {/* Footer spacer */}
                <div className="mt-auto" />
            </aside>
        );
    }

    return (
        <aside
            className="w-80 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] sticky top-14 md:top-16 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col"
            aria-label="Menu điều hướng nội dung học tập"
        >
            {/* Header with Toggle */}
            <div className="p-3 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Học tập</h2>
                <button
                    onClick={toggle}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Thu gọn sidebar"
                    title="Thu gọn sidebar"
                >
                    <PanelLeftClose className="h-4 w-4" />
                </button>
            </div>

            {/* Subject Selector */}
            <div className="p-4 border-b border-border">
                <div className="relative">
                    <button
                        onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                            {selectedSubject?.icon || "📘"}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <p className="font-semibold text-foreground truncate">
                                {selectedSubject?.name || "Chọn môn học"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {selectedSubject?.school?.name || "Nhấn để chọn môn"}
                            </p>
                        </div>
                        <ChevronDown className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isSubjectDropdownOpen && "rotate-180"
                        )} />
                    </button>

                    {/* Dropdown */}
                    {isSubjectDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                            {subjects.map((subject) => (
                                <button
                                    key={subject.id}
                                    onClick={() => handleSelectSubject(subject.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors",
                                        selectedSubject?.id === subject.id && "bg-primary/10"
                                    )}
                                >
                                    <span className="text-xl">{subject.icon || "📘"}</span>
                                    <div className="flex-1 text-left">
                                        <p className={cn(
                                            "font-medium",
                                            selectedSubject?.id === subject.id ? "text-primary" : "text-foreground"
                                        )}>
                                            {subject.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {subject.school?.name || "THPT"}
                                        </p>
                                    </div>
                                    {selectedSubject?.id === subject.id && (
                                        <CheckCircle className="h-4 w-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Section */}
            <div className="px-4 py-3 border-b border-border">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" aria-hidden="true" />
                            Tiến độ
                        </span>
                        <span className="font-medium text-foreground">{progressPercentage}%</span>
                    </div>
                    <div
                        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
                        role="progressbar"
                        aria-valuenow={progressPercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Tiến độ: ${progressPercentage}%`}
                    >
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {completedTopics}/{totalTopics} bài học
                    </p>
                </div>
            </div>

            {/* Chapter Navigation */}
            <div className="px-4 py-2 border-b border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nội dung học tập
                </h3>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-muted-foreground animate-pulse">Đang tải...</div>
                    </div>
                ) : chapters.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        Chưa có nội dung học tập cho môn này
                    </div>
                ) : (
                    <div className="space-y-2">
                        {chapters.map((chapter) => {
                            const chapterTopics = chapter.topics;
                            const completedInChapter = chapterTopics.filter(t => progress[t.slug]).length;
                            const isChapterActive = activeChapterId === chapter.id;

                            return (
                                <div key={chapter.id}>
                                    {/* Chapter Header - Clickable on main study page */}
                                    {isMainStudyPage ? (
                                        <button
                                            onClick={() => setSelectedChapterId(chapter.id)}
                                            className={cn(
                                                "w-full text-left mb-2 px-3 py-3 rounded-lg transition-all",
                                                "hover:bg-secondary/80",
                                                isChapterActive
                                                    ? "bg-primary/10 border-l-4 border-primary"
                                                    : "hover:text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className={cn(
                                                    "text-sm font-semibold line-clamp-2",
                                                    isChapterActive ? "text-primary" : "text-foreground/80"
                                                )}>
                                                    {chapter.name}
                                                </h3>
                                                <span className={cn(
                                                    "text-xs ml-2 px-2 py-0.5 rounded-full flex-shrink-0",
                                                    isChapterActive 
                                                        ? "bg-primary/20 text-primary" 
                                                        : "bg-secondary text-muted-foreground"
                                                )}>
                                                    {completedInChapter}/{chapterTopics.length}
                                                </span>
                                            </div>
                                        </button>
                                    ) : (
                                        <>
                                            {/* Chapter Header - Not clickable on topic detail page */}
                                            <div className="mb-3 flex items-center justify-between px-3">
                                                <h3 className="text-sm font-semibold text-foreground/80">
                                                    {chapter.name}
                                                </h3>
                                                <span className="text-xs text-muted-foreground">
                                                    {completedInChapter}/{chapterTopics.length}
                                                </span>
                                            </div>

                                            {/* Topics List - Only show on topic detail page */}
                                            <ul className="space-y-1">
                                                {chapterTopics.map((topic) => {
                                                    const isActive = pathname === `/study/${topic.slug}`;
                                                    const isCompleted = progress[topic.slug];

                                                    return (
                                                        <li key={topic.id}>
                                                            <Link
                                                                href={`/study/${topic.slug}`}
                                                                className={cn(
                                                                    "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                                                                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                                                    isActive
                                                                        ? "bg-primary/10 text-primary font-medium"
                                                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                                                )}
                                                                aria-current={isActive ? "page" : undefined}
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    {isCompleted ? (
                                                                        <CheckCircle
                                                                            className="h-4 w-4 flex-shrink-0 text-emerald-500"
                                                                            aria-label="Đã hoàn thành"
                                                                        />
                                                                    ) : (
                                                                        <Circle
                                                                            className={cn(
                                                                                "h-4 w-4 flex-shrink-0",
                                                                                isActive ? "text-primary" : "text-muted-foreground/50"
                                                                            )}
                                                                            aria-label="Chưa hoàn thành"
                                                                        />
                                                                    )}
                                                                    <span className="truncate">{topic.name}</span>
                                                                </div>
                                                                <ChevronRight
                                                                    className={cn(
                                                                        "h-4 w-4 flex-shrink-0 opacity-0 transition-all",
                                                                        "group-hover:opacity-100 group-hover:translate-x-0.5",
                                                                        isActive && "opacity-100"
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </nav>

            {/* Footer */}
            <div className="mt-auto p-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                    Hỗ trợ:{" "}
                    <a 
                        href="https://www.facebook.com/profile.php?id=61581439181186" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        Facebook
                    </a>
                </p>
            </div>
        </aside>
    );
}
