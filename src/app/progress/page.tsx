"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Badge } from "@/client/components/ui/Badge";
import { Button } from "@/client/components/ui/Button";
import { ProgressRing } from "@/client/components/ui/ProgressRing";
import { 
    BookOpen, 
    CheckCircle,
    Clock,
    ChevronRight,
    Loader2,
    BookMarked,
    GraduationCap,
    Target,
    Star
} from "lucide-react";
import { cn } from "@/client/lib/utils";
import Link from "next/link";

interface ChapterProgress {
    id: string;
    slug: string;
    name: string;
    description: string;
    totalTopics: number;
    completedTopics: number;
    progress: number;
    topics: {
        id: string;
        slug: string;
        title: string;
        completed: boolean;
        timeSpent: number;
    }[];
}

interface SubjectProgress {
    id: string;
    slug: string;
    name: string;
    icon: string;
    totalChapters: number;
    completedChapters: number;
    totalTopics: number;
    completedTopics: number;
    overallProgress: number;
    chapters: ChapterProgress[];
}

export default function ProgressPage() {
    const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProgress() {
            try {
                const res = await fetch("/api/user/study-progress");
                if (res.ok) {
                    const data = await res.json();
                    setSubjects(data.subjects || []);
                    if (data.subjects?.length > 0) {
                        setExpandedSubject(data.subjects[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch progress:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProgress();
    }, []);

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} phút`;
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs}h ${mins}m`;
    };

    // Calculate overall stats
    const totalTopics = subjects.reduce((sum, s) => sum + s.totalTopics, 0);
    const completedTopics = subjects.reduce((sum, s) => sum + s.completedTopics, 0);
    const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

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
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-4">
                            <GraduationCap className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Tiến độ học tập</h1>
                            <p className="text-muted-foreground mt-1">Theo dõi quá trình học của bạn</p>
                        </div>
                    </div>
                </div>

                {/* Overall Progress */}
                <Card className="mb-8 p-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <ProgressRing 
                            progress={overallProgress} 
                            size="xl" 
                            color="success"
                            label="Hoàn thành"
                        />
                        
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 rounded-xl bg-secondary">
                                <BookOpen className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
                                <p className="text-xs text-muted-foreground">Môn học</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-secondary">
                                <BookMarked className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">
                                    {subjects.reduce((sum, s) => sum + s.totalChapters, 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">Chương</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-secondary">
                                <Target className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">{totalTopics}</p>
                                <p className="text-xs text-muted-foreground">Bài học</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-secondary">
                                <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">{completedTopics}</p>
                                <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Subjects List */}
                {subjects.length > 0 ? (
                    <div className="space-y-4">
                        {subjects.map((subject) => (
                            <Card key={subject.id} className="overflow-hidden">
                                {/* Subject Header */}
                                <button
                                    onClick={() => setExpandedSubject(
                                        expandedSubject === subject.id ? null : subject.id
                                    )}
                                    className="w-full p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-xl bg-primary/10 p-3 text-2xl">
                                            {subject.icon}
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold text-foreground">
                                                {subject.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {subject.completedChapters}/{subject.totalChapters} chương • {subject.completedTopics}/{subject.totalTopics} bài
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <ProgressRing
                                            progress={subject.overallProgress}
                                            size="sm"
                                            color={subject.overallProgress >= 80 ? "success" : subject.overallProgress >= 40 ? "warning" : "primary"}
                                        />
                                        <ChevronRight className={cn(
                                            "h-5 w-5 text-muted-foreground transition-transform",
                                            expandedSubject === subject.id && "rotate-90"
                                        )} />
                                    </div>
                                </button>

                                {/* Chapters */}
                                {expandedSubject === subject.id && (
                                    <div className="border-t border-border px-6 pb-6">
                                        {subject.chapters.map((chapter, chapterIndex) => (
                                            <div key={chapter.id} className="mt-4">
                                                {/* Chapter Header */}
                                                <button
                                                    onClick={() => setExpandedChapter(
                                                        expandedChapter === chapter.id ? null : chapter.id
                                                    )}
                                                    className="w-full p-4 rounded-xl bg-secondary/50 flex items-center justify-between hover:bg-secondary transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                                                            chapter.progress === 100 
                                                                ? "bg-emerald-500 text-white" 
                                                                : "bg-primary/10 text-primary"
                                                        )}>
                                                            {chapter.progress === 100 ? (
                                                                <CheckCircle className="h-4 w-4" />
                                                            ) : (
                                                                chapterIndex + 1
                                                            )}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-medium text-foreground">{chapter.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {chapter.completedTopics}/{chapter.totalTopics} bài hoàn thành
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="hidden sm:flex items-center gap-2">
                                                            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                                                                <div 
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all",
                                                                        chapter.progress === 100 ? "bg-emerald-500" : "bg-primary"
                                                                    )}
                                                                    style={{ width: `${chapter.progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-muted-foreground w-10">
                                                                {chapter.progress}%
                                                            </span>
                                                        </div>
                                                        <ChevronRight className={cn(
                                                            "h-4 w-4 text-muted-foreground transition-transform",
                                                            expandedChapter === chapter.id && "rotate-90"
                                                        )} />
                                                    </div>
                                                </button>

                                                {/* Topics */}
                                                {expandedChapter === chapter.id && (
                                                    <div className="mt-2 ml-4 space-y-1">
                                                        {chapter.topics.map((topic) => (
                                                            <Link
                                                                key={topic.id}
                                                                href={`/study/${topic.slug}`}
                                                                className={cn(
                                                                    "flex items-center justify-between p-3 rounded-lg transition-colors",
                                                                    topic.completed 
                                                                        ? "bg-emerald-500/5 hover:bg-emerald-500/10" 
                                                                        : "hover:bg-secondary"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {topic.completed ? (
                                                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                                    ) : (
                                                                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                                                                    )}
                                                                    <span className={cn(
                                                                        "text-sm",
                                                                        topic.completed ? "text-foreground" : "text-muted-foreground"
                                                                    )}>
                                                                        {topic.title}
                                                                    </span>
                                                                </div>

                                                                {topic.timeSpent > 0 && (
                                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                        <Clock className="h-3 w-3" />
                                                                        {formatTime(topic.timeSpent)}
                                                                    </div>
                                                                )}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="p-12 text-center">
                        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">Chưa có tiến độ học tập</h3>
                        <p className="text-muted-foreground mb-6">Bắt đầu học để theo dõi tiến độ của bạn</p>
                        <Link href="/study">
                            <Button className="gap-2">
                                <BookOpen className="h-4 w-4" />
                                Bắt đầu học
                            </Button>
                        </Link>
                    </Card>
                )}
            </main>
        </div>
    );
}
