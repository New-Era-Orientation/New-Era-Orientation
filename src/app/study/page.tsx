"use client";

import { BookOpen, ArrowRight, Sparkles, Clock, Target, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSubject } from "@/client/contexts/SubjectContext";
import { Card } from "@/client/components/ui/Card";

export default function StudyPage() {
    const { selectedSubject, isLoading } = useSubject();

    const studyTips = [
        {
            icon: Clock,
            title: "Học đều đặn",
            description: "Dành 30 phút mỗi ngày để duy trì thói quen học",
        },
        {
            icon: Target,
            title: "Đặt mục tiêu",
            description: "Hoàn thành 1 chương mỗi tuần để tiến bộ ổn định",
        },
        {
            icon: Sparkles,
            title: "Ôn tập thường xuyên",
            description: "Làm lại các bài tập để nhớ lâu hơn",
        },
    ];

    if (isLoading) {
        return <div className="p-10 text-center">Đang tải...</div>;
    }

    if (!selectedSubject) {
        return <div className="p-10 text-center">Vui lòng chọn môn học trong Cài đặt</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-6 lg:p-10">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 text-center">
                        <div className="mx-auto mb-6 inline-flex rounded-full bg-primary/10 p-6 text-primary ring-4 ring-primary/5">
                            <span className="text-4xl">{selectedSubject.icon || "📘"}</span>
                        </div>
                        <h1 className="mb-4 text-3xl font-bold text-foreground">
                            {selectedSubject.name}
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            {selectedSubject.description || "Chọn bài học bên dưới để bắt đầu hành trình chinh phục kiến thức."}
                        </p>
                    </div>

                    {/* Syllabus */}
                    <div className="space-y-6">
                        {selectedSubject.chapters.length > 0 ? (
                            selectedSubject.chapters.map((chapter) => (
                                <Card key={chapter.id} className="overflow-hidden">
                                    <div className="border-b border-border bg-secondary/30 p-4">
                                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                            {chapter.name}
                                        </h2>
                                        {chapter.description && (
                                            <p className="mt-1 text-sm text-muted-foreground pl-7">{chapter.description}</p>
                                        )}
                                    </div>
                                    <div className="divide-y divide-border">
                                        {chapter.topics.length > 0 ? (
                                            chapter.topics.map((topic) => (
                                                <Link
                                                    key={topic.id}
                                                    href={`/study/${topic.slug}`}
                                                    className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50 group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary opacity-70 group-hover:opacity-100 transition-opacity">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                            {topic.name}
                                                        </span>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-muted-foreground italic">
                                                Chưa có bài học nào trong chương này
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                                <p className="text-muted-foreground">Chưa có nội dung cho môn học này</p>
                            </div>
                        )}
                    </div>

                    {/* Study Tips */}
                    <div className="mt-16 pt-10 border-t border-border">
                        <h3 className="mb-6 text-xl font-bold text-foreground text-center">Mẹo học tập hiệu quả</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            {studyTips.map((tip, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border border-border bg-secondary/50 p-4 text-left"
                                >
                                    <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                                        <tip.icon className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <h3 className="mb-1 font-semibold text-foreground">{tip.title}</h3>
                                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
