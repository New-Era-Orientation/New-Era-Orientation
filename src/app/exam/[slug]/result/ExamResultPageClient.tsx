"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExamResultClient } from "@/client/components/exam/ExamResultClient";
import type { Exam } from "@/client/lib/exam-data";
import { Loader2 } from "lucide-react";

interface ExamResultPageClientProps {
    exam: Exam;
}

export default function ExamResultPageClient({ exam }: ExamResultPageClientProps) {
    const router = useRouter();
    const [result, setResult] = useState<{
        score: number;
        maxScore: number;
        correctCount: number;
        totalQuestions: number;
        percentage: number;
        passed: boolean;
        timeSpent: number;
        answers: Record<string, string>;
    } | null>(null);

    useEffect(() => {
        // Get result from sessionStorage
        const stored = sessionStorage.getItem(`exam-result-${exam.slug}`);
        
        if (stored) {
            try {
                setResult(JSON.parse(stored));
            } catch {
                router.push(`/exam/${exam.slug}`);
            }
        } else {
            // No result found, redirect to exam detail
            router.push(`/exam/${exam.slug}`);
        }
    }, [exam.slug, router]);

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Đang tải kết quả...</p>
                </div>
            </div>
        );
    }

    return <ExamResultClient exam={exam} result={result} />;
}
