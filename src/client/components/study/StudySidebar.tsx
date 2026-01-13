"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mockTopics } from "@/client/lib/mock-data";
import { cn } from "@/client/lib/utils";
import { ChevronRight, CheckCircle, Circle, BookOpen, TrendingUp } from "lucide-react";

export function StudySidebar() {
    const pathname = usePathname();

    // Mock progress data - would come from API
    const progress: Record<string, boolean> = {
        "triet-hoc-mac-lenin-c1": true,
        "triet-hoc-mac-lenin-c2": false,
        "kinh-te-chinh-tri-c1": false,
    };

    // Calculate overall progress
    const totalChapters = mockTopics.reduce((acc, topic) => acc + topic.chapters.length, 0);
    const completedChapters = Object.values(progress).filter(Boolean).length;
    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    return (
        <aside
            className="w-80 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col"
            aria-label="Menu điều hướng nội dung học tập"
        >
            {/* Header with Progress */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">Nội dung học tập</h2>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" aria-hidden="true" />
                            Tiến độ tổng thể
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
                        {completedChapters}/{totalChapters} chương hoàn thành
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                    {mockTopics.map((topic) => {
                        const topicChapters = topic.chapters;
                        const completedInTopic = topicChapters.filter(ch => progress[ch.slug]).length;

                        return (
                            <div key={topic.id}>
                                {/* Topic Header */}
                                <div className="mb-3 flex items-center justify-between px-3">
                                    <h3 className="text-sm font-semibold text-foreground/80">
                                        {topic.name}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {completedInTopic}/{topicChapters.length}
                                    </span>
                                </div>

                                {/* Chapters List */}
                                <ul className="space-y-1">
                                    {topic.chapters.map((chapter) => {
                                        const isActive = pathname === `/study/${chapter.slug}`;
                                        const isCompleted = progress[chapter.slug];

                                        return (
                                            <li key={chapter.id}>
                                                <Link
                                                    href={`/study/${chapter.slug}`}
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
                                                        <span className="truncate">{chapter.name}</span>
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
                            </div>
                        );
                    })}
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                    Cần hỗ trợ? Liên hệ <a href="mailto:support@neoedu.com" className="text-primary hover:underline">support@neoedu.com</a>
                </p>
            </div>
        </aside>
    );
}
