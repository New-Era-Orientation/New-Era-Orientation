"use client";

import { Card, CardContent } from "@/client/components/ui/Card";
import { Calendar, Loader2, BookOpen, Target, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/client/lib/utils";
import { useEffect, useState } from "react";
import { useSubject } from "@/client/contexts/SubjectContext";

interface Topic {
    id: string;
    slug: string;
    title: string;
    completed: boolean;
}

interface Chapter {
    id: string;
    slug: string;
    name: string;
    progress: number;
    completedTopics: number;
    totalTopics: number;
    topics: Topic[];
}

interface SubjectProgress {
    id: string;
    slug: string;
    name: string;
    overallProgress: number;
    chapters: Chapter[];
}

interface UpcomingTask {
    id: string;
    title: string;
    description: string;
    href: string;
    priority: "high" | "medium" | "low";
    type: "continue" | "new" | "review";
    dueLabel: string;
}

export function UpcomingTasks() {
    const { selectedSubjectId } = useSubject();
    const [tasks, setTasks] = useState<UpcomingTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTasks() {
            try {
                const res = await fetch("/api/user/study-progress");
                if (res.ok) {
                    const data = await res.json();
                    const generatedTasks = generateTasks(data, selectedSubjectId);
                    setTasks(generatedTasks);
                }
            } catch (error) {
                console.error("Failed to fetch tasks:", error);
                // Set default tasks for guest users
                setTasks([
                    {
                        id: "default-1",
                        title: "Bắt đầu học",
                        description: "Khám phá các chủ đề học tập",
                        href: "/study",
                        priority: "high",
                        type: "new",
                        dueLabel: "Hôm nay",
                    },
                    {
                        id: "default-2",
                        title: "Làm đề thi thử",
                        description: "Kiểm tra kiến thức của bạn",
                        href: "/exam",
                        priority: "medium",
                        type: "new",
                        dueLabel: "Bắt đầu ngay",
                    },
                ]);
            } finally {
                setLoading(false);
            }
        }
        fetchTasks();
    }, [selectedSubjectId]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "bg-destructive/10 text-destructive border-destructive/20";
            case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            default: return "bg-primary/10 text-primary border-primary/20";
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case "high": return "Ưu tiên";
            case "medium": return "Trung bình";
            default: return "Thấp";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "continue": return BookOpen;
            case "review": return CheckCircle2;
            default: return Target;
        }
    };

    if (loading) {
        return (
            <section aria-labelledby="tasks-heading" className="space-y-6">
                <h2 id="tasks-heading" className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                    Nhiệm vụ sắp tới
                </h2>
                <Card>
                    <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            </section>
        );
    }

    return (
        <section aria-labelledby="tasks-heading" className="space-y-6">
            <h2 id="tasks-heading" className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                Nhiệm vụ sắp tới
            </h2>
            <Card>
                <CardContent className="p-6">
                    {tasks.length > 0 ? (
                        <ul className="space-y-3">
                            {tasks.map((task) => {
                                const Icon = getTypeIcon(task.type);
                                return (
                                    <li key={task.id}>
                                        <Link
                                            href={task.href}
                                            className="flex items-center justify-between rounded-xl border bg-card/50 p-4 hover:bg-secondary/20 transition-colors group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                        {task.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">{task.dueLabel}</p>
                                                </div>
                                            </div>
                                            <span className={cn("rounded-full border px-3 py-1 text-xs font-medium shrink-0", getPriorityColor(task.priority))}>
                                                {getPriorityLabel(task.priority)}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="py-8 text-center">
                            <div className="mx-auto mb-4 inline-flex rounded-full bg-emerald-500/10 p-4">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" aria-hidden="true" />
                            </div>
                            <p className="text-foreground font-medium">Tuyệt vời!</p>
                            <p className="text-sm text-muted-foreground mt-1">Bạn đã hoàn thành tất cả nhiệm vụ</p>
                        </div>
                    )}

                    <Link
                        href="/study"
                        className="mt-4 block w-full text-center text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                        Xem tất cả nhiệm vụ →
                    </Link>
                </CardContent>
            </Card>
        </section>
    );
}

function generateTasks(data: SubjectProgress[], selectedSubjectId: string | null): UpcomingTask[] {
    const tasks: UpcomingTask[] = [];
    
    // Filter by selected subject if specified
    const subjects = selectedSubjectId 
        ? data.filter(s => s.id === selectedSubjectId)
        : data;

    for (const subject of subjects) {
        for (const chapter of subject.chapters) {
            // Find in-progress chapters (started but not completed)
            if (chapter.progress > 0 && chapter.progress < 100) {
                // Find next incomplete topic
                const nextTopic = chapter.topics.find(t => !t.completed);
                if (nextTopic) {
                    tasks.push({
                        id: `continue-${nextTopic.id}`,
                        title: `Tiếp tục: ${nextTopic.title}`,
                        description: chapter.name,
                        href: `/study/${nextTopic.slug}`,
                        priority: "high",
                        type: "continue",
                        dueLabel: "Đang học",
                    });
                }
            }
            
            // Find chapters not started yet
            if (chapter.progress === 0 && chapter.topics.length > 0) {
                const firstTopic = chapter.topics[0];
                tasks.push({
                    id: `new-${chapter.id}`,
                    title: `Bắt đầu: ${chapter.name}`,
                    description: `${chapter.totalTopics} chủ đề`,
                    href: `/study/${firstTopic.slug}`,
                    priority: "medium",
                    type: "new",
                    dueLabel: "Chưa học",
                });
            }
        }
    }

    // Sort by priority and limit to 5
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return tasks
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, 5);
}
