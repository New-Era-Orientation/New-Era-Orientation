import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// Exam Analytics API - Question difficulty, common mistakes, score distribution
export async function GET(request: NextRequest) {
    const session = await auth();
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");
    const range = searchParams.get("range") || "month";

    const startDate = getStartDate(range);

    try {
        // Get user's exam attempts
        const whereClause: any = {
            userId: session.user.id,
            completedAt: { gte: startDate },
        };
        
        if (examId) {
            whereClause.examId = examId;
        }

        const attempts = await db.examAttempt.findMany({
            where: whereClause,
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        subject: true,
                        parts: true,
                        duration: true,
                    },
                },
            },
            orderBy: { completedAt: "desc" },
        });

        // Analyze question performance
        const questionAnalysis = analyzeQuestionPerformance(attempts);

        // Calculate score distribution
        const scoreDistribution = calculateScoreDistribution(attempts);

        // Calculate time analysis
        const timeAnalysis = analyzeTimePerformance(attempts);

        // Identify common mistakes
        const commonMistakes = identifyCommonMistakes(attempts);

        // Topic performance breakdown
        const topicPerformance = calculateTopicPerformance(attempts);

        // Improvement over attempts
        const attemptProgress = calculateAttemptProgress(attempts);

        return NextResponse.json({
            overview: {
                totalAttempts: attempts.length,
                avgScore: calculateAverage(attempts.map(a => a.score || 0)),
                bestScore: Math.max(...attempts.map(a => a.score || 0), 0),
                avgTime: calculateAverage(attempts.map(a => a.timeSpent || 0)),
                passRate: calculatePassRate(attempts),
            },
            questionAnalysis,
            scoreDistribution,
            timeAnalysis,
            commonMistakes,
            topicPerformance,
            attemptProgress,
        });
    } catch (error) {
        console.error("Exam analytics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch exam analytics" },
            { status: 500 }
        );
    }
}

function getStartDate(range: string): Date {
    const now = new Date();
    switch (range) {
        case "week": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "month": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case "quarter": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        default: return new Date(0);
    }
}

function calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length * 10) / 10;
}

function calculatePassRate(attempts: any[]): number {
    if (attempts.length === 0) return 0;
    const passed = attempts.filter(a => (a.score || 0) >= 5).length;
    return Math.round((passed / attempts.length) * 100);
}

// Analyze question-level performance
function analyzeQuestionPerformance(attempts: any[]) {
    const questionStats = new Map<string, {
        id: string;
        content: string;
        topic: string;
        correct: number;
        total: number;
        avgTime: number;
        difficulty: "easy" | "medium" | "hard";
    }>();

    for (const attempt of attempts) {
        if (!attempt.answers || !attempt.exam?.parts) continue;

        const answers = typeof attempt.answers === "string"
            ? JSON.parse(attempt.answers)
            : attempt.answers;

        for (const part of attempt.exam.parts) {
            for (const question of part.questions) {
                const existing = questionStats.get(question.id) || {
                    id: question.id,
                    content: question.content?.substring(0, 100) || "",
                    topic: question.topic || part.name || "General",
                    correct: 0,
                    total: 0,
                    avgTime: 0,
                    difficulty: "medium" as const,
                };

                existing.total += 1;
                if (answers[question.id] === question.correctAnswer) {
                    existing.correct += 1;
                }

                // Determine difficulty
                const accuracy = existing.correct / existing.total;
                existing.difficulty = accuracy >= 0.7 ? "easy" : accuracy >= 0.4 ? "medium" : "hard";

                questionStats.set(question.id, existing);
            }
        }
    }

    return Array.from(questionStats.values())
        .map(q => ({
            ...q,
            accuracy: Math.round((q.correct / q.total) * 100),
        }))
        .sort((a, b) => a.accuracy - b.accuracy);
}

// Calculate score distribution
function calculateScoreDistribution(attempts: any[]) {
    const distribution = {
        "0-2": 0,
        "2-4": 0,
        "4-6": 0,
        "6-8": 0,
        "8-10": 0,
    };

    for (const attempt of attempts) {
        const score = attempt.score || 0;
        if (score < 2) distribution["0-2"]++;
        else if (score < 4) distribution["2-4"]++;
        else if (score < 6) distribution["4-6"]++;
        else if (score < 8) distribution["6-8"]++;
        else distribution["8-10"]++;
    }

    return Object.entries(distribution).map(([range, count]) => ({
        range,
        count,
        percentage: attempts.length > 0 ? Math.round((count / attempts.length) * 100) : 0,
    }));
}

// Analyze time performance
function analyzeTimePerformance(attempts: any[]) {
    if (attempts.length === 0) {
        return {
            avgTimePerQuestion: 0,
            fastestAttempt: 0,
            slowestAttempt: 0,
            timeVsScore: [],
        };
    }

    const times = attempts.map(a => a.timeSpent || 0);
    const questionCounts = attempts.map(a => 
        a.exam?.parts?.reduce((sum: number, p: any) => sum + p.questions.length, 0) || 1
    );

    const timePerQuestion = attempts.map((a, i) => 
        (a.timeSpent || 0) / questionCounts[i]
    );

    // Time vs Score correlation
    const timeVsScore = attempts.map(a => ({
        time: a.timeSpent || 0,
        score: a.score || 0,
        date: a.completedAt?.toISOString().split("T")[0],
    }));

    return {
        avgTimePerQuestion: calculateAverage(timePerQuestion),
        fastestAttempt: Math.min(...times),
        slowestAttempt: Math.max(...times),
        avgTime: calculateAverage(times),
        timeVsScore,
    };
}

// Identify common mistakes
function identifyCommonMistakes(attempts: any[]) {
    const mistakeMap = new Map<string, {
        questionId: string;
        content: string;
        correctAnswer: string;
        wrongAnswers: Map<string, number>;
        count: number;
    }>();

    for (const attempt of attempts) {
        if (!attempt.answers || !attempt.exam?.parts) continue;

        const answers = typeof attempt.answers === "string"
            ? JSON.parse(attempt.answers)
            : attempt.answers;

        for (const part of attempt.exam.parts) {
            for (const question of part.questions) {
                const userAnswer = answers[question.id];
                if (userAnswer && userAnswer !== question.correctAnswer) {
                    const existing = mistakeMap.get(question.id) || {
                        questionId: question.id,
                        content: question.content?.substring(0, 150) || "",
                        correctAnswer: question.correctAnswer,
                        wrongAnswers: new Map<string, number>(),
                        count: 0,
                    };

                    existing.count += 1;
                    existing.wrongAnswers.set(
                        userAnswer,
                        (existing.wrongAnswers.get(userAnswer) || 0) + 1
                    );

                    mistakeMap.set(question.id, existing);
                }
            }
        }
    }

    return Array.from(mistakeMap.values())
        .map(m => ({
            ...m,
            wrongAnswers: Array.from(m.wrongAnswers.entries())
                .map(([answer, count]) => ({ answer, count }))
                .sort((a, b) => b.count - a.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

// Calculate topic performance breakdown
function calculateTopicPerformance(attempts: any[]) {
    const topicMap = new Map<string, {
        topic: string;
        correct: number;
        total: number;
        avgTime: number;
    }>();

    for (const attempt of attempts) {
        if (!attempt.answers || !attempt.exam?.parts) continue;

        const answers = typeof attempt.answers === "string"
            ? JSON.parse(attempt.answers)
            : attempt.answers;

        for (const part of attempt.exam.parts) {
            const topic = part.name || "General";

            for (const question of part.questions) {
                const existing = topicMap.get(topic) || {
                    topic,
                    correct: 0,
                    total: 0,
                    avgTime: 0,
                };

                existing.total += 1;
                if (answers[question.id] === question.correctAnswer) {
                    existing.correct += 1;
                }

                topicMap.set(topic, existing);
            }
        }
    }

    return Array.from(topicMap.values())
        .map(t => ({
            ...t,
            accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
        }))
        .sort((a, b) => b.accuracy - a.accuracy);
}

// Calculate progress across attempts
function calculateAttemptProgress(attempts: any[]) {
    return attempts
        .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
        .map((attempt, index) => ({
            attempt: index + 1,
            score: attempt.score || 0,
            time: attempt.timeSpent || 0,
            date: attempt.completedAt?.toISOString().split("T")[0],
            examTitle: attempt.exam?.title || "Unknown",
        }));
}
