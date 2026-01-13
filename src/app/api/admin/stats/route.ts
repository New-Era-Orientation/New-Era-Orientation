import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// GET - Dashboard stats
export async function GET() {
    const session = await auth();
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const [
            totalUsers,
            totalExams,
            totalAttempts,
            totalTopics,
            recentUsers,
            recentAttempts,
            examStats,
        ] = await Promise.all([
            db.user.count(),
            db.exam.count(),
            db.examAttempt.count(),
            db.topic.count(),
            db.user.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    createdAt: true,
                },
            }),
            db.examAttempt.findMany({
                take: 10,
                orderBy: { startedAt: "desc" },
                include: {
                    user: { select: { name: true, email: true } },
                    exam: { select: { title: true } },
                },
            }),
            db.examAttempt.aggregate({
                _avg: { score: true },
                _count: { id: true },
            }),
        ]);

        // Get daily stats for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyAttempts = await db.examAttempt.groupBy({
            by: ["startedAt"],
            where: {
                startedAt: { gte: sevenDaysAgo },
            },
            _count: { id: true },
        });

        return NextResponse.json({
            overview: {
                totalUsers,
                totalExams,
                totalAttempts,
                totalTopics,
                averageScore: examStats._avg.score || 0,
            },
            recentUsers,
            recentAttempts,
            dailyAttempts,
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
