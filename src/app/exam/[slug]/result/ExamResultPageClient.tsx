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
    const [isLoading, setIsLoading] = useState(true);
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
                const parsed = JSON.parse(stored);
                console.log("Parsed exam result:", parsed);
                
                // Ensure all required fields have default values
                const validatedResult = {
                    score: typeof parsed.score === 'number' ? parsed.score : 0,
                    maxScore: typeof parsed.maxScore === 'number' ? parsed.maxScore : 10,
                    correctCount: typeof parsed.correctCount === 'number' ? parsed.correctCount : 0,
                    totalQuestions: typeof parsed.totalQuestions === 'number' ? parsed.totalQuestions : 0,
                    percentage: typeof parsed.percentage === 'number' ? parsed.percentage : 0,
                    passed: typeof parsed.passed === 'boolean' ? parsed.passed : false,
                    timeSpent: typeof parsed.timeSpent === 'number' ? parsed.timeSpent : 0,
                    answers: parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {},
                };
                console.log("Validated result:", validatedResult);
                setResult(validatedResult);
                setIsLoading(false);
            } catch (e) {
                console.error("Failed to parse exam result:", e);
                router.push(`/exam/${exam.slug}`);
                return;
            }
        } else {
            // No result found, redirect to exam detail
            console.log("No exam result found in sessionStorage");
            router.push(`/exam/${exam.slug}`);
            return;
        }
    }, [exam.slug, router]);

    if (isLoading || !result) {
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
