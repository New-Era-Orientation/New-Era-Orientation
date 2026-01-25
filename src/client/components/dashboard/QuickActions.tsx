"use client";

import { Card, CardContent } from "@/client/components/ui/Card";
import { BookOpen, Target, Zap, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/client/lib/utils";
import { useEffect, useState } from "react";
import { useSubject } from "@/client/contexts/SubjectContext";

interface QuickAction {
    title: string;
    description: string;
    href: string;
    icon: typeof BookOpen;
    color: string;
    bg: string;
    badge: string | null;
}

interface StudyStatus {
    lastTopic?: {
        slug: string;
        name: string;
        chapterName: string;
    };
    inProgressChapters: number;
    pendingExams: number;
}

export function QuickActions() {
    const { selectedSubjectId, selectedSubject } = useSubject();
    const [studyStatus, setStudyStatus] = useState<StudyStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const [progressRes, examsRes] = await Promise.all([
                    fetch("/api/user/study-progress"),
                    fetch(`/api/exams?subjectId=${selectedSubjectId || ""}&limit=100`),
                ]);

                let status: StudyStatus = {
                    inProgressChapters: 0,
                    pendingExams: 0,
                };

                if (progressRes.ok) {
                    const progressData = await progressRes.json();
                    // Find in-progress info for selected subject
                    const subjects = selectedSubjectId 
                        ? progressData.filter((s: any) => s.id === selectedSubjectId)
                        : progressData;

                    for (const subject of subjects) {
                        for (const chapter of subject.chapters) {
                            if (chapter.progress > 0 && chapter.progress < 100) {
                                status.inProgressChapters++;
                                // Get last incomplete topic
                                const incompleteTopic = chapter.topics.find((t: any) => !t.completed);
                                if (incompleteTopic && !status.lastTopic) {
                                    status.lastTopic = {
                                        slug: incompleteTopic.slug,
                                        name: incompleteTopic.title,
                                        chapterName: chapter.name,
                                    };
                                }
                            }
                        }
                    }
                }

                if (examsRes.ok) {
                    const examsData = await examsRes.json();
                    status.pendingExams = examsData.data?.length || 0;
                }

                setStudyStatus(status);
            } catch (error) {
                console.error("Failed to fetch status:", error);
                setStudyStatus({
                    inProgressChapters: 0,
                    pendingExams: 0,
                });
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, [selectedSubjectId]);

    const getQuickActions = (): QuickAction[] => {
        const actions: QuickAction[] = [];

        // Continue learning action
        if (studyStatus?.lastTopic) {
            actions.push({
                title: "Tiếp tục học",
                description: studyStatus.lastTopic.chapterName,
                href: `/study/${studyStatus.lastTopic.slug}`,
                icon: BookOpen,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                badge: "Đang học",
            });
        } else {
            actions.push({
                title: "Bắt đầu học",
                description: selectedSubject?.name || "Khám phá chương trình",
                href: "/study",
                icon: BookOpen,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                badge: null,
            });
        }

        // Exam action
        actions.push({
            title: "Làm đề thi",
            description: studyStatus?.pendingExams 
                ? `${studyStatus.pendingExams} đề thi có sẵn`
                : "Kiểm tra kiến thức",
            href: "/exam",
            icon: Target,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            badge: studyStatus?.pendingExams && studyStatus.pendingExams > 0 ? "Mới" : null,
        });

        // Practice action
        actions.push({
            title: "Luyện tập",
            description: "Simulation Mode",
            href: "/simulation",
            icon: Zap,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            badge: null,
        });

        return actions;
    };

    if (loading) {
        return (
            <section aria-labelledby="quick-actions-heading">
                <h2 id="quick-actions-heading" className="mb-4 md:mb-6 text-lg md:text-2xl font-bold text-foreground">
                    Hành động nhanh
                </h2>
                <div className="grid grid-cols-3 gap-2 md:gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="h-full">
                            <CardContent className="p-3 md:p-6 flex items-center justify-center min-h-[100px] md:min-h-[150px]">
                                <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        );
    }

    const quickActions = getQuickActions();

    return (
        <section aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className="mb-4 md:mb-6 text-lg md:text-2xl font-bold text-foreground">
                Hành động nhanh
            </h2>
            <div className="grid grid-cols-3 gap-2 md:gap-6">
                {quickActions.map((action, index) => (
                    <Link
                        key={index}
                        href={action.href}
                        className="group block"
                    >
                        <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50">
                            <CardContent className="p-3 md:p-6">
                                <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between mb-2 md:mb-4">
                                    <div className={cn("rounded-lg md:rounded-xl p-2 md:p-3 transition-colors", action.bg, action.color)}>
                                        <action.icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                                    </div>
                                    {action.badge && (
                                        <span className="mt-1 md:mt-0 inline-flex items-center rounded-full border px-1.5 md:px-2.5 py-0.5 text-[10px] md:text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary">
                                            {action.badge}
                                        </span>
                                    )}
                                </div>

                                <h3 className="mb-1 md:mb-2 text-sm md:text-xl font-bold text-foreground group-hover:text-primary transition-colors text-center md:text-left">
                                    {action.title}
                                </h3>
                                <p className="text-[10px] md:text-sm text-muted-foreground mb-2 md:mb-4 line-clamp-1 text-center md:text-left hidden md:block">{action.description}</p>

                                <div className="hidden md:flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                                    <span>Bắt đầu</span>
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
