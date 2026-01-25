"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { fetchExams, type Exam } from "@/client/lib/exam-data";
import { Card } from "@/client/components/ui/Card";
import { Clock, FileText, Award, Filter, Search, X, ArrowRight, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/client/components/ui/Input";
import { Badge } from "@/client/components/ui/Badge";
import { useSubject } from "@/client/contexts/SubjectContext";
import { SubjectPicker } from "@/client/components/ui/SubjectPicker";

export default function ExamPage() {
    const { selectedSubjectId, isLoading: isSubjectLoading } = useSubject();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function loadExams() {
            if (isSubjectLoading) return;
            try {
                setLoading(true);
                console.log("[ExamPage] Fetching exams...");
                const data = await fetchExams({
                    type: selectedType || undefined,
                    year: selectedYear || undefined,
                    search: searchQuery || undefined,
                    subjectId: selectedSubjectId || undefined,
                });
                console.log("[ExamPage] Fetched data:", data);
                setExams(data.exams || []);
                setError(null);
            } catch (err) {
                setError("Không thể tải danh sách đề thi");
                setExams([]);
                console.error("[ExamPage] Error:", err);
            } finally {
                setLoading(false);
            }
        }
        loadExams();
    }, [selectedYear, selectedType, searchQuery, selectedSubjectId, isSubjectLoading]);

    const years = Array.from(new Set((exams || []).map((e) => e.year))).sort((a, b) => b - a);
    const types = ["HSG", "STANDARD", "MOCK"];

    const hasFilters = selectedYear || selectedType || searchQuery;

    const clearFilters = () => {
        setSelectedYear(null);
        setSelectedType(null);
        setSearchQuery("");
    };

    // Stats
    const stats = [
        { label: "Tổng đề thi", value: exams.length, icon: FileText },
        { label: "Đề HSG", value: exams.filter(e => e.type === "HSG").length, icon: Award },
        { label: "Lượt làm", value: "1,234", icon: Users },
    ];

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header */}
                <section className="mb-10" aria-labelledby="exam-heading">
                    <div className="flex items-center justify-between mb-4">
                        <h1 id="exam-heading" className="text-4xl font-bold text-foreground">
                            📝 Kho đề thi
                        </h1>
                        <SubjectPicker />
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Luyện thi với đề thi thực tế từ các kỳ thi chính thức
                    </p>

                    {/* Quick Stats */}
                    <div className="mt-6 flex flex-wrap gap-4">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-2"
                            >
                                <stat.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                                <div>
                                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Filters */}
                <section className="mb-8" aria-label="Bộ lọc đề thi">
                    <div className="flex flex-wrap gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[250px]">
                            <Input
                                type="text"
                                placeholder="Tìm kiếm đề thi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                leftIcon={<Search className="h-5 w-5" />}
                                rightIcon={
                                    searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="p-1 hover:bg-muted rounded-full"
                                            aria-label="Xóa tìm kiếm"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )
                                }
                                aria-label="Tìm kiếm đề thi"
                            />
                        </div>

                        {/* Year filter */}
                        <div className="relative">
                            <label htmlFor="year-filter" className="sr-only">Lọc theo năm</label>
                            <select
                                id="year-filter"
                                value={selectedYear || ""}
                                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                                className="appearance-none rounded-lg border border-border bg-secondary px-4 py-3 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Tất cả năm</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Type filter */}
                        <div className="relative">
                            <label htmlFor="type-filter" className="sr-only">Lọc theo loại</label>
                            <select
                                id="type-filter"
                                value={selectedType || ""}
                                onChange={(e) => setSelectedType(e.target.value || null)}
                                className="appearance-none rounded-lg border border-border bg-secondary px-4 py-3 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Tất cả loại</option>
                                {types.map((type) => (
                                    <option key={type} value={type}>
                                        {type === "HSG" ? "Học sinh giỏi" : "Chuẩn"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear filters */}
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
                </section>

                {/* Results count */}
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Tìm thấy <span className="font-semibold text-foreground">{exams.length}</span> đề thi
                        {hasFilters && " (đã lọc)"}
                    </p>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Đang tải...</span>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="py-20 text-center">
                        <p className="text-destructive">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Exam grid */}
                {!loading && !error && (
                    <section aria-label="Danh sách đề thi">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {exams.map((exam) => (
                                <Link key={exam.id} href={`/exam/${exam.slug}`}>
                                    <Card
                                        hover
                                        className="group h-full cursor-pointer p-6"
                                    >
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="rounded-xl bg-primary/10 p-3 text-primary transition-colors duration-200">
                                                <FileText className="h-6 w-6" aria-hidden="true" />
                                            </div>
                                            <div className="flex gap-2">
                                                {exam.type === "HSG" && (
                                                    <Badge variant="warning">HSG</Badge>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="mb-3 text-xl font-bold text-foreground group-hover:text-primary motion-safe:transition-colors">
                                            {exam.title}
                                        </h3>

                                        <div className="space-y-2 text-sm text-muted-foreground mb-6">
                                            <div className="flex items-center gap-2">
                                                <Award className="h-4 w-4" aria-hidden="true" />
                                                <span>{exam.source}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" aria-hidden="true" />
                                                <span>{exam.duration} phút • Năm {exam.year}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                                                Bắt đầu làm bài
                                                <ArrowRight className="h-4 w-4 motion-safe:transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                            </span>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty state */}
                {!loading && !error && exams.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-6 inline-flex rounded-full bg-secondary p-6">
                            <Filter className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-foreground">
                            Không tìm thấy đề thi
                        </h3>
                        <p className="mb-6 text-muted-foreground">
                            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                        </p>
                        <button
                            onClick={clearFilters}
                            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
