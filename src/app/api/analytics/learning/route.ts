import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// Learning Analytics API - Topic mastery, weakness identification, study patterns
export async function GET(request: NextRequest) {
    const session = await auth();
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "month";

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
        case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case "quarter":
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(0);
    }

    try {
        // Get exam attempts with detailed answers
        const attempts = await db.examAttempt.findMany({
            where: {
                userId: session.user.id,
                completedAt: { gte: startDate },
            },
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

        // Get study progress
        const studyProgress = await db.userProgress.findMany({
            where: {
                userId: session.user.id,
                updatedAt: { gte: startDate },
            },
            include: {
                topic: {
                    include: {
                        chapter: {
                            include: {
                                subject: true,
                            },
                        },
                    },
                },
            },
        });

        // Get flashcard reviews
        const flashcardReviews = await db.flashcardReview.findMany({
            where: {
                userId: session.user.id,
                createdAt: { gte: startDate },
            },
            include: {
                flashcard: {
                    include: {
                        deck: true,
                    },
                },
            },
        });

        // Calculate topic mastery
        const topicMastery = calculateTopicMastery(studyProgress);

        // Calculate weakness areas
        const weaknesses = identifyWeaknesses(attempts);

        // Calculate study patterns
        const studyPatterns = analyzeStudyPatterns(attempts, studyProgress, flashcardReviews);

        // Calculate progress trends
        const progressTrends = calculateProgressTrends(attempts, range);

        // Calculate skill radar
        const skillRadar = calculateSkillRadar(attempts, studyProgress);

        // Get recommendations
        const recommendations = generateRecommendations(topicMastery, weaknesses, studyPatterns);

        return NextResponse.json({
            topicMastery,
            weaknesses,
            studyPatterns,
            progressTrends,
            skillRadar,
            recommendations,
            summary: {
                totalStudyHours: Math.round(studyPatterns.totalStudyTime / 60),
                topicsCompleted: studyProgress.filter(p => p.completed).length,
                totalTopics: studyProgress.length,
                masteryLevel: calculateOverallMastery(topicMastery),
                improvementRate: calculateImprovementRate(progressTrends),
            },
        });
    } catch (error) {
        console.error("Learning analytics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch learning analytics" },
            { status: 500 }
        );
    }
}

// Calculate topic mastery levels
function calculateTopicMastery(progress: any[]) {
    const topicMap = new Map<string, {
        name: string;
        subject: string;
        progress: number;
        mastery: "beginner" | "intermediate" | "advanced" | "mastered";
        lastStudied: Date;
    }>();

    for (const p of progress) {
        const mastery = 
            p.progress >= 90 ? "mastered" :
            p.progress >= 70 ? "advanced" :
            p.progress >= 40 ? "intermediate" : "beginner";

        topicMap.set(p.topic.id, {
            name: p.topic.name,
            subject: p.topic.chapter?.subject?.name || "Unknown",
            progress: p.progress,
            mastery,
            lastStudied: p.updatedAt,
        });
    }

    return Array.from(topicMap.values())
        .sort((a, b) => b.progress - a.progress);
}

// Identify weakness areas from exam performance
function identifyWeaknesses(attempts: any[]) {
    const topicPerformance = new Map<string, {
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
            for (const question of part.questions) {
                const topic = question.topic || part.name || "General";
                const existing = topicPerformance.get(topic) || {
                    topic,
                    correct: 0,
                    total: 0,
                    avgTime: 0,
                };

                const isCorrect = answers[question.id] === question.correctAnswer;
                existing.total += 1;
                if (isCorrect) existing.correct += 1;

                topicPerformance.set(topic, existing);
            }
        }
    }

    const weaknesses = Array.from(topicPerformance.values())
        .map(t => ({
            ...t,
            accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
        }))
        .filter(t => t.accuracy < 70 && t.total >= 3)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5);

    return weaknesses;
}

// Analyze study patterns
function analyzeStudyPatterns(attempts: any[], progress: any[], flashcards: any[]) {
    // Calculate total study time
    const totalStudyTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

    // Study by hour of day
    const hourlyActivity = Array(24).fill(0);
    for (const attempt of attempts) {
        if (attempt.completedAt) {
            const hour = new Date(attempt.completedAt).getHours();
            hourlyActivity[hour]++;
        }
    }

    // Find peak hours
    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));

    // Study by day of week
    const weekdayActivity = Array(7).fill(0);
    for (const attempt of attempts) {
        if (attempt.completedAt) {
            const day = new Date(attempt.completedAt).getDay();
            weekdayActivity[day]++;
        }
    }

    // Calculate consistency
    const uniqueDays = new Set(
        attempts.map(a => a.completedAt?.toISOString().split("T")[0])
    ).size;
    const consistency = Math.min(100, Math.round((uniqueDays / 30) * 100));

    return {
        totalStudyTime,
        peakHour,
        peakHourLabel: `${peakHour}:00 - ${peakHour + 1}:00`,
        hourlyActivity,
        weekdayActivity,
        consistency,
        averageSessionLength: attempts.length > 0 
            ? Math.round(totalStudyTime / attempts.length) 
            : 0,
        flashcardsReviewed: flashcards.length,
    };
}

// Calculate progress trends over time
function calculateProgressTrends(attempts: any[], range: string) {
    const periods = range === "week" ? 7 : range === "month" ? 30 : 90;
    const trends: { date: string; score: number; count: number }[] = [];

    const now = new Date();
    for (let i = periods - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        
        const dayAttempts = attempts.filter(a => {
            const attemptDate = a.completedAt?.toISOString().split("T")[0];
            return attemptDate === dateStr;
        });

        const scores = dayAttempts.map(a => a.score).filter(Boolean);
        trends.push({
            date: dateStr,
            score: scores.length > 0 
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 
                : 0,
            count: dayAttempts.length,
        });
    }

    return trends;
}

// Calculate skill radar for visualization
function calculateSkillRadar(attempts: any[], progress: any[]) {
    // Categories for radar chart
    const categories = [
        { name: "Kiến thức", value: 0, max: 100 },
        { name: "Tốc độ", value: 0, max: 100 },
        { name: "Chính xác", value: 0, max: 100 },
        { name: "Kiên trì", value: 0, max: 100 },
        { name: "Đa dạng", value: 0, max: 100 },
    ];

    // Knowledge: based on topics covered
    categories[0].value = Math.min(100, progress.length * 10);

    // Speed: based on time per question
    if (attempts.length > 0) {
        const avgTimePerQ = attempts.reduce((sum, a) => {
            const qCount = a.exam?.parts?.reduce((s: number, p: any) => s + p.questions.length, 0) || 1;
            return sum + (a.timeSpent || 0) / qCount;
        }, 0) / attempts.length;
        categories[1].value = Math.max(0, Math.min(100, 100 - avgTimePerQ));
    }

    // Accuracy: based on scores
    if (attempts.length > 0) {
        const avgScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length;
        categories[2].value = Math.round(avgScore * 10);
    }

    // Persistence: based on streak and consistency
    const uniqueDays = new Set(
        attempts.map(a => a.completedAt?.toISOString().split("T")[0])
    ).size;
    categories[3].value = Math.min(100, uniqueDays * 5);

    // Diversity: based on different subjects/exams
    const uniqueExams = new Set(attempts.map(a => a.examId)).size;
    categories[4].value = Math.min(100, uniqueExams * 15);

    return categories;
}

// Calculate overall mastery percentage
function calculateOverallMastery(topicMastery: any[]) {
    if (topicMastery.length === 0) return 0;
    const total = topicMastery.reduce((sum, t) => sum + t.progress, 0);
    return Math.round(total / topicMastery.length);
}

// Calculate improvement rate
function calculateImprovementRate(trends: any[]) {
    if (trends.length < 7) return 0;
    
    const recentScores = trends.slice(-7).filter(t => t.score > 0).map(t => t.score);
    const olderScores = trends.slice(-14, -7).filter(t => t.score > 0).map(t => t.score);
    
    if (recentScores.length === 0 || olderScores.length === 0) return 0;
    
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
    
    return Math.round((recentAvg - olderAvg) * 10) / 10;
}

// Generate personalized recommendations
function generateRecommendations(
    topicMastery: any[], 
    weaknesses: any[], 
    patterns: any
) {
    const recommendations: {
        type: "study" | "practice" | "review" | "habit";
        title: string;
        description: string;
        priority: "high" | "medium" | "low";
    }[] = [];

    // Weakness-based recommendations
    for (const weakness of weaknesses.slice(0, 2)) {
        recommendations.push({
            type: "practice",
            title: `Ôn tập: ${weakness.topic}`,
            description: `Độ chính xác ${weakness.accuracy}% - Cần luyện tập thêm ${weakness.topic}`,
            priority: weakness.accuracy < 50 ? "high" : "medium",
        });
    }

    // Consistency recommendation
    if (patterns.consistency < 50) {
        recommendations.push({
            type: "habit",
            title: "Tăng cường học tập đều đặn",
            description: "Hãy cố gắng học mỗi ngày 15-30 phút để duy trì kiến thức",
            priority: "high",
        });
    }

    // Review old topics
    const oldTopics = topicMastery
        .filter(t => {
            const daysSince = (Date.now() - new Date(t.lastStudied).getTime()) / (1000 * 60 * 60 * 24);
            return daysSince > 7 && t.mastery !== "mastered";
        })
        .slice(0, 2);

    for (const topic of oldTopics) {
        recommendations.push({
            type: "review",
            title: `Ôn lại: ${topic.name}`,
            description: `Đã lâu không học - hãy ôn lại để không quên`,
            priority: "medium",
        });
    }

    // Peak hour suggestion
    if (patterns.peakHour) {
        recommendations.push({
            type: "habit",
            title: `Học tập hiệu quả lúc ${patterns.peakHourLabel}`,
            description: "Đây là khung giờ bạn học tập hiệu quả nhất",
            priority: "low",
        });
    }

    return recommendations.slice(0, 5);
}
