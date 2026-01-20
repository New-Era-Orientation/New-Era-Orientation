import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// Admin Dashboard Analytics API
export async function GET(request: NextRequest) {
    const session = await auth();
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "month";

    const startDate = getStartDate(range);

    try {
        // User metrics
        const userMetrics = await getUserMetrics(startDate);

        // Content metrics
        const contentMetrics = await getContentMetrics();

        // Engagement metrics
        const engagementMetrics = await getEngagementMetrics(startDate);

        // Performance metrics
        const performanceMetrics = await getPerformanceMetrics(startDate);

        // Growth trends
        const growthTrends = await getGrowthTrends(range);

        // Top performers
        const topPerformers = await getTopPerformers(startDate);

        // Popular content
        const popularContent = await getPopularContent(startDate);

        return NextResponse.json({
            userMetrics,
            contentMetrics,
            engagementMetrics,
            performanceMetrics,
            growthTrends,
            topPerformers,
            popularContent,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Admin analytics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch admin analytics" },
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
        case "year": return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default: return new Date(0);
    }
}

async function getUserMetrics(startDate: Date) {
    const [totalUsers, newUsers, activeUsers, usersByRole] = await Promise.all([
        db.user.count(),
        db.user.count({
            where: { createdAt: { gte: startDate } },
        }),
        db.user.count({
            where: {
                examAttempts: {
                    some: { completedAt: { gte: startDate } },
                },
            },
        }),
        db.user.groupBy({
            by: ["role"],
            _count: { id: true },
        }),
    ]);

    const previousStartDate = new Date(startDate.getTime() - (Date.now() - startDate.getTime()));
    const previousNewUsers = await db.user.count({
        where: {
            createdAt: {
                gte: previousStartDate,
                lt: startDate,
            },
        },
    });

    const growthRate = previousNewUsers > 0
        ? Math.round(((newUsers - previousNewUsers) / previousNewUsers) * 100)
        : 100;

    return {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
        growthRate,
        byRole: usersByRole.map(r => ({
            role: r.role,
            count: r._count.id,
        })),
        retentionRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
    };
}

async function getContentMetrics() {
    const [exams, subjects, chapters, topics] = await Promise.all([
        db.exam.count(),
        db.subject.count(),
        db.chapter.count(),
        db.topic.count(),
    ]);

    const questionsCount = await db.question.count();

    return {
        exams,
        questions: questionsCount,
        subjects,
        chapters,
        topics,
    };
}

async function getEngagementMetrics(startDate: Date) {
    const [examAttempts, chatMessages] = await Promise.all([
        db.examAttempt.count({
            where: { completedAt: { gte: startDate } },
        }),
        db.chatMessage.count({
            where: { createdAt: { gte: startDate } },
        }),
    ]);

    const avgAttemptsPerUser = await db.examAttempt.groupBy({
        by: ["userId"],
        where: { completedAt: { gte: startDate } },
        _count: { id: true },
    });

    const avgAttempts = avgAttemptsPerUser.length > 0
        ? Math.round(avgAttemptsPerUser.reduce((sum, u) => sum + u._count.id, 0) / avgAttemptsPerUser.length * 10) / 10
        : 0;

    // Calculate daily active users trend
    const dailyActiveUsers: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const activeCount = await db.examAttempt.groupBy({
            by: ["userId"],
            where: {
                completedAt: { gte: dayStart, lte: dayEnd },
            },
        });

        dailyActiveUsers.push({
            date: dayStart.toISOString().split("T")[0],
            count: activeCount.length,
        });
    }

    return {
        examAttempts,
        chatMessages,
        avgAttemptsPerUser: avgAttempts,
        dailyActiveUsers,
    };
}

async function getPerformanceMetrics(startDate: Date) {
    const attempts = await db.examAttempt.findMany({
        where: { completedAt: { gte: startDate } },
        select: {
            score: true,
            timeSpent: true,
            completedAt: true,
        },
    });

    if (attempts.length === 0) {
        return {
            avgScore: 0,
            passRate: 0,
            avgTimeSpent: 0,
            completionRate: 0,
        };
    }

    const scores = attempts.map(a => a.score || 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
    const passRate = Math.round(scores.filter(s => s >= 5).length / scores.length * 100);
    const avgTimeSpent = Math.round(attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / attempts.length);

    // Score distribution
    const scoreDistribution = [
        { range: "0-4", count: scores.filter(s => s < 4).length },
        { range: "4-6", count: scores.filter(s => s >= 4 && s < 6).length },
        { range: "6-8", count: scores.filter(s => s >= 6 && s < 8).length },
        { range: "8-10", count: scores.filter(s => s >= 8).length },
    ];

    return {
        avgScore,
        passRate,
        avgTimeSpent,
        scoreDistribution,
        totalAttempts: attempts.length,
    };
}

async function getGrowthTrends(range: string) {
    const periods = range === "week" ? 7 : range === "month" ? 30 : 90;
    const trends: {
        date: string;
        users: number;
        attempts: number;
        revenue?: number;
    }[] = [];

    const now = new Date();
    for (let i = periods - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const [newUsers, attempts] = await Promise.all([
            db.user.count({
                where: { createdAt: { gte: dayStart, lte: dayEnd } },
            }),
            db.examAttempt.count({
                where: { completedAt: { gte: dayStart, lte: dayEnd } },
            }),
        ]);

        trends.push({
            date: dayStart.toISOString().split("T")[0],
            users: newUsers,
            attempts,
        });
    }

    return trends;
}

async function getTopPerformers(startDate: Date) {
    const topScorers = await db.examAttempt.groupBy({
        by: ["userId"],
        where: { completedAt: { gte: startDate } },
        _avg: { score: true },
        _count: { id: true },
        orderBy: { _avg: { score: "desc" } },
        take: 10,
    });

    const userIds = topScorers.map(s => s.userId);
    const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, image: true },
    });

    return topScorers.map(scorer => {
        const user = users.find(u => u.id === scorer.userId);
        return {
            userId: scorer.userId,
            name: user?.name || "Unknown",
            email: user?.email,
            image: user?.image,
            avgScore: Math.round((scorer._avg.score || 0) * 10) / 10,
            attempts: scorer._count.id,
        };
    });
}

async function getPopularContent(startDate: Date) {
    const popularExams = await db.examAttempt.groupBy({
        by: ["examId"],
        where: { completedAt: { gte: startDate } },
        _count: { id: true },
        _avg: { score: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
    });

    const examIds = popularExams.map(e => e.examId);
    const exams = await db.exam.findMany({
        where: { id: { in: examIds } },
        select: { id: true, title: true, subject: true },
    });

    return popularExams.map(item => {
        const exam = exams.find(e => e.id === item.examId);
        return {
            examId: item.examId,
            title: exam?.title || "Unknown",
            subject: exam?.subject,
            attempts: item._count.id,
            avgScore: Math.round((item._avg.score || 0) * 10) / 10,
        };
    });
}
