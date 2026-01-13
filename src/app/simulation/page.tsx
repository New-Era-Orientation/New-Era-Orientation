"use client";

import { useState } from "react";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Play, Clock, Target, BookOpen, Lightbulb, Plus, Filter, Shuffle, ArrowRight, Zap, X } from "lucide-react";
import { Card } from "@/client/components/ui/Card";
import { Badge } from "@/client/components/ui/Badge";
import Link from "next/link";

export default function SimulationPage() {
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    const topics = [
        {
            id: "1",
            title: "Cấu trúc dữ liệu cơ bản",
            description: "Mảng, danh sách liên kết, ngăn xếp, hàng đợi",
            questions: 15,
            difficulty: "easy" as const,
            color: "from-emerald-500/20 to-green-500/20",
            iconBg: "bg-emerald-500/10 text-emerald-400",
            completedQuestions: 8,
        },
        {
            id: "2",
            title: "Thuật toán sắp xếp",
            description: "Bubble sort, Quick sort, Merge sort",
            questions: 20,
            difficulty: "medium" as const,
            color: "from-primary/20 to-cyan-500/20",
            iconBg: "bg-primary/10 text-primary",
            completedQuestions: 5,
        },
        {
            id: "3",
            title: "Đồ thị và cây",
            description: "BFS, DFS, Dijkstra, Cây nhị phân",
            questions: 25,
            difficulty: "hard" as const,
            color: "from-purple-500/20 to-pink-500/20",
            iconBg: "bg-purple-500/10 text-purple-400",
            completedQuestions: 0,
        },
    ];

    const features = [
        {
            icon: Clock,
            title: "Không giới hạn thời gian",
            description: "Làm bài thoải mái, không áp lực",
            color: "text-primary bg-primary/10",
        },
        {
            icon: Lightbulb,
            title: "Gợi ý thông minh",
            description: "Nhận gợi ý khi gặp khó khăn",
            color: "text-purple-400 bg-purple-500/10",
        },
        {
            icon: Target,
            title: "Phản hồi tức thì",
            description: "Biết ngay kết quả sau mỗi câu",
            color: "text-emerald-400 bg-emerald-500/10",
        },
    ];

    const getDifficultyLabel = (difficulty: "easy" | "medium" | "hard") => {
        const labels = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
        return labels[difficulty];
    };

    const filteredTopics = topics.filter((topic) => {
        if (selectedDifficulty && getDifficultyLabel(topic.difficulty) !== selectedDifficulty) return false;
        if (selectedTopic && topic.id !== selectedTopic) return false;
        return true;
    });

    const hasFilters = selectedDifficulty || selectedTopic;

    const clearFilters = () => {
        setSelectedDifficulty(null);
        setSelectedTopic(null);
    };

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header */}
                <section className="mb-10" aria-labelledby="simulation-heading">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 id="simulation-heading" className="text-4xl font-bold text-foreground">
                                Chế độ Luyện tập
                            </h1>
                            <p className="mt-2 text-lg text-muted-foreground">
                                Luyện tập không giới hạn thời gian với gợi ý và giải thích chi tiết
                            </p>
                        </div>
                        
                        <Link
                            href="/simulation/create"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            <Plus className="h-5 w-5" aria-hidden="true" />
                            Tạo đề thi tùy chỉnh
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                    </div>
                </section>

                {/* Features */}
                <section className="mb-10" aria-labelledby="features-heading">
                    <h2 id="features-heading" className="sr-only">Tính năng chế độ luyện tập</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        {features.map((feature, index) => (
                            <Card key={index} className="group p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`rounded-xl p-3 ${feature.color} transition-colors duration-200`}>
                                        <feature.icon className="h-6 w-6" aria-hidden="true" />
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
                <section aria-labelledby="question-bank-heading">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 id="question-bank-heading" className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <Zap className="h-6 w-6 text-amber-500" aria-hidden="true" />
                                Ngân hàng câu hỏi
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Tạo đề thi tùy chỉnh từ <span className="font-semibold text-foreground">150+</span> câu hỏi
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-4">
                        <div className="relative">
                            <label htmlFor="difficulty-filter" className="sr-only">Lọc theo độ khó</label>
                            <select
                                id="difficulty-filter"
                                value={selectedDifficulty || ""}
                                onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                                className="appearance-none rounded-lg border border-border bg-secondary px-4 py-3 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Tất cả độ khó</option>
                                <option value="Dễ">Dễ</option>
                                <option value="Trung bình">Trung bình</option>
                                <option value="Khó">Khó</option>
                            </select>
                        </div>

                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary"
                                aria-label="Xóa tất cả bộ lọc"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {/* Topics Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTopics.map((topic) => {
                            const progressPercentage = Math.round((topic.completedQuestions / topic.questions) * 100);
                            
                            return (
                                <Card 
                                    key={topic.id} 
                                    hover
                                    className="group relative overflow-hidden p-6"
                                >
                                    <div 
                                        className={`absolute inset-0 -z-10 bg-gradient-to-br ${topic.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} 
                                        aria-hidden="true"
                                    />

                                    <div className="mb-4 flex items-start justify-between">
                                        <div className={`rounded-xl p-3 ${topic.iconBg} transition-colors duration-200`}>
                                            <BookOpen className="h-6 w-6" aria-hidden="true" />
                                        </div>
                                        <Badge 
                                            variant={topic.difficulty === "easy" ? "success" : topic.difficulty === "medium" ? "warning" : "error"}
                                        >
                                            {getDifficultyLabel(topic.difficulty)}
                                        </Badge>
                                    </div>

                                    <h3 className="mb-2 text-xl font-semibold text-foreground motion-safe:transition-colors group-hover:text-primary">
                                        {topic.title}
                                    </h3>

                                    <p className="mb-4 text-sm text-muted-foreground">{topic.description}</p>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Target className="h-4 w-4" aria-hidden="true" />
                                                Tiến độ
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {topic.completedQuestions}/{topic.questions}
                                            </span>
                                        </div>
                                        <div 
                                            className="h-2 w-full overflow-hidden rounded-full bg-muted"
                                            role="progressbar"
                                            aria-valuenow={progressPercentage}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        >
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    topic.difficulty === "easy" ? "bg-emerald-500" :
                                                    topic.difficulty === "medium" ? "bg-amber-500" : "bg-purple-500"
                                                }`}
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                            aria-label={`Luyện tập ${topic.title}`}
                                        >
                                            <Play className="h-4 w-4" aria-hidden="true" />
                                            Luyện tập
                                        </button>
                                        <button 
                                            className="rounded-lg border border-border px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary"
                                            aria-label={`Làm ngẫu nhiên ${topic.title}`}
                                        >
                                            <Shuffle className="h-4 w-4" aria-hidden="true" />
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
                                <Filter className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-foreground">
                                Không tìm thấy chủ đề
                            </h3>
                            <p className="mb-6 text-muted-foreground">Thử thay đổi bộ lọc</p>
                            <button 
                                onClick={clearFilters} 
                                className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
