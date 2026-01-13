"use client";

import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Clock, FileText, Award, Play, CheckCircle, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Exam } from "@/client/lib/exam-data";
import { Badge } from "@/client/components/ui/Badge";

interface ExamDetailClientProps {
    exam: Exam;
}

export function ExamDetailClient({ exam }: ExamDetailClientProps) {
    const parts = exam.parts || [];
    const totalQuestions = parts.reduce((sum, part) => sum + part.questions.length, 0);

    // Mock stats
    const examStats = {
        attempts: 1234,
        avgScore: 7.5,
        passRate: 85,
    };

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header */}
                <section className="mb-10" aria-labelledby="exam-title">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <Badge variant="info">{exam.type}</Badge>
                        <Badge variant="primary">{exam.year}</Badge>
                    </div>
                    <h1 id="exam-title" className="text-4xl font-bold text-foreground">{exam.title}</h1>
                    <div className="mt-4 flex flex-wrap gap-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-amber-500" aria-hidden="true" />
                            <span>{exam.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                            <span>{exam.duration} phút</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                            <span>{totalQuestions} câu hỏi</span>
                        </div>
                    </div>
                </section>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card className="text-center p-6">
                                <div className="text-2xl font-bold text-foreground">{examStats.attempts.toLocaleString()}</div>
                                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" aria-hidden="true" />
                                    Lượt làm
                                </div>
                            </Card>
                            <Card className="text-center p-6">
                                <div className="text-2xl font-bold text-amber-500">{examStats.avgScore}/10</div>
                                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                    <Award className="h-4 w-4" aria-hidden="true" />
                                    Điểm TB
                                </div>
                            </Card>
                            <Card className="text-center p-6">
                                <div className="text-2xl font-bold text-emerald-500">{examStats.passRate}%</div>
                                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                                    Tỷ lệ đạt
                                </div>
                            </Card>
                        </div>

                        {/* Structure */}
                        <Card className="p-6">
                            <h2 className="mb-4 text-xl font-bold text-foreground">Cấu trúc đề thi</h2>
                            <div className="space-y-3">
                                {parts.map((part) => (
                                    <div 
                                        key={part.id} 
                                        className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div>
                                            <h3 className="font-semibold text-foreground">{part.title}</h3>
                                            <p className="text-sm text-muted-foreground">{part.questions.length} câu hỏi</p>
                                        </div>
                                        <Badge variant="success" icon={<CheckCircle className="h-3 w-3" />}>
                                            Sẵn sàng
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Instructions */}
                        <Card className="p-6">
                            <h2 className="mb-4 text-xl font-bold text-foreground">Hướng dẫn làm bài</h2>
                            <ul className="space-y-3 text-muted-foreground" role="list">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                                    <span>Thời gian làm bài: <strong className="text-foreground">{exam.duration} phút</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                                    <span>Đọc kỹ đề trước khi trả lời</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                                    <span>Có thể quay lại câu hỏi đã làm bất cứ lúc nào</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                                    <span>Nhấn <strong className="text-foreground">"Nộp bài"</strong> khi hoàn thành</span>
                                </li>
                            </ul>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <aside aria-label="Bắt đầu làm bài">
                        <Card className="sticky top-6 p-6" glow>
                            <h3 className="mb-4 text-lg font-bold text-foreground">Bắt đầu làm bài</h3>
                            <div className="mb-6 space-y-4 text-sm">
                                <div className="flex justify-between py-2 border-b border-border">
                                    <span className="text-muted-foreground">Thời gian:</span>
                                    <span className="font-semibold text-foreground">{exam.duration} phút</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border">
                                    <span className="text-muted-foreground">Câu hỏi:</span>
                                    <span className="font-semibold text-foreground">{totalQuestions}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Độ khó:</span>
                                    <Badge variant={exam.type === "HSG" ? "error" : "warning"}>
                                        {exam.type === "HSG" ? "Khó" : "Trung bình"}
                                    </Badge>
                                </div>
                            </div>

                            <Link href={`/exam/${exam.slug}/take`}>
                                <Button className="w-full group" size="lg">
                                    <Play className="h-5 w-5" aria-hidden="true" />
                                    Bắt đầu làm bài
                                </Button>
                            </Link>
                            
                            <p className="mt-4 text-center text-xs text-muted-foreground">
                                Bạn có thể làm lại đề thi này bất cứ lúc nào
                            </p>
                        </Card>
                    </aside>
                </div>
            </main>
        </div>
    );
}
