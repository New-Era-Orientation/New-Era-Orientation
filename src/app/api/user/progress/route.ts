import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

// GET /api/user/progress - Lấy tiến độ học tập của user
export async function GET() {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Get user progress
        const progress = await db.userProgress.findMany({
            where: { userId },
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
            orderBy: { lastAccess: "desc" },
        });

        // Get exam attempts summary
        const examAttempts = await db.examAttempt.findMany({
            where: { userId },
            select: {
                id: true,
                score: true,
                maxScore: true,
                completedAt: true,
                exam: {
                    select: {
                        title: true,
                        slug: true,
                    },
                },
            },
            orderBy: { completedAt: "desc" },
            take: 10,
        });

        // Calculate stats
        const totalTopics = await db.topic.count();
        const completedTopics = progress.filter((p) => p.completed).length;
        const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);
        
        const avgScore = examAttempts.length > 0
            ? examAttempts.reduce((sum, a) => sum + ((a.score || 0) / a.maxScore) * 100, 0) / examAttempts.length
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    totalTopics,
                    completedTopics,
                    progressPercentage: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
                    totalTimeSpent, // in seconds
                    examsTaken: examAttempts.length,
                    averageScore: Math.round(avgScore * 10) / 10,
                },
                recentProgress: progress.slice(0, 10).map((p) => ({
                    topicId: p.topicId,
                    topicName: p.topic.name,
                    chapterName: p.topic.chapter.name,
                    subjectName: p.topic.chapter.subject.name,
                    completed: p.completed,
                    timeSpent: p.timeSpent,
                    lastAccess: p.lastAccess,
                })),
                recentExams: examAttempts.map((a) => ({
                    attemptId: a.id,
                    examTitle: a.exam.title,
                    examSlug: a.exam.slug,
                    score: a.score,
                    maxScore: a.maxScore,
                    percentage: Math.round(((a.score || 0) / a.maxScore) * 100),
                    completedAt: a.completedAt,
                })),
            },
        });
    } catch (error) {
        console.error("Error fetching user progress:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch progress" },
            { status: 500 }
        );
    }
}

// POST /api/user/progress - Cập nhật tiến độ học tập
export async function POST(request: Request) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const body = await request.json();
        const { topicId, completed, timeSpent } = body;

        if (!topicId) {
            return NextResponse.json(
                { success: false, error: "topicId is required" },
                { status: 400 }
            );
        }

        // Upsert progress
        const progress = await db.userProgress.upsert({
            where: {
                userId_topicId: { userId, topicId },
            },
            create: {
                userId,
                topicId,
                completed: completed ?? false,
                timeSpent: timeSpent ?? 0,
                lastAccess: new Date(),
            },
            update: {
                completed: completed ?? undefined,
                timeSpent: timeSpent ? { increment: timeSpent } : undefined,
                lastAccess: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            data: progress,
        });
    } catch (error) {
        console.error("Error updating user progress:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update progress" },
            { status: 500 }
        );
    }
}
