import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const session = await auth();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "month";
    const category = searchParams.get("category") || "score";
    const limit = parseInt(searchParams.get("limit") || "50");
    const subjectId = searchParams.get("subjectId");

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
        default:
            startDate = new Date(0); // All time
    }

    try {
        // Base filter conditions
        const baseWhere: any = {
            completedAt: {
                gte: startDate,
                not: null,
            },
        };

        if (subjectId) {
            baseWhere.exam = {
                subjectId: subjectId,
            };
        }

        // Get all attempts in the date range grouped by user
        const attempts = await db.examAttempt.findMany({
            where: baseWhere,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        // Aggregate by user
        const userStats = new Map<string, {
            userId: string;
            name: string;
            image: string | null;
            totalScore: number;
            examsCompleted: number;
            scores: number[];
            lastActive: Date;
        }>();

        for (const attempt of attempts) {
            if (!attempt.user) continue;

            const existing = userStats.get(attempt.userId) || {
                userId: attempt.userId,
                name: attempt.user.name || "Unknown",
                image: attempt.user.image,
                totalScore: 0,
                examsCompleted: 0,
                scores: [] as number[],
                lastActive: new Date(0),
            };

            existing.totalScore += (attempt.score || 0);
            existing.examsCompleted += 1;
            existing.scores.push(attempt.score || 0);
            if (attempt.completedAt && attempt.completedAt > existing.lastActive) {
                existing.lastActive = attempt.completedAt;
            }

            userStats.set(attempt.userId, existing);
        }

        // Calculate streak for each user
        const userStreaks = new Map<string, number>();

        for (const [userId] of userStats) {
            const streakWhere: any = {
                userId,
                completedAt: {
                    not: null,
                },
            };

            if (subjectId) {
                streakWhere.exam = {
                    subjectId: subjectId,
                };
            }

            const userAttempts = await db.examAttempt.findMany({
                where: streakWhere,
                select: {
                    completedAt: true,
                },
                orderBy: {
                    completedAt: "desc",
                },
            });

            const activeDays = new Set(
                userAttempts.map(a => a.completedAt?.toISOString().split("T")[0])
            );

            let streak = 0;
            const today = new Date().toISOString().split("T")[0];
            let checkDate = today;

            while (activeDays.has(checkDate)) {
                streak++;
                const prevDate = new Date(checkDate);
                prevDate.setDate(prevDate.getDate() - 1);
                checkDate = prevDate.toISOString().split("T")[0];
            }

            userStreaks.set(userId, streak);
        }

        // Convert to array and sort
        const leaderboard = Array.from(userStats.values()).map(user => ({
            userId: user.userId,
            name: user.name,
            image: user.image,
            score: Math.round(user.totalScore * 10) / 10,
            examsCompleted: user.examsCompleted,
            avgScore: user.scores.length > 0
                ? Math.round((user.scores.reduce((a, b) => a + b, 0) / user.scores.length) * 10) / 10
                : 0,
            streak: userStreaks.get(user.userId) || 0,
        }));

        // Sort by category
        leaderboard.sort((a, b) => {
            switch (category) {
                case "exams":
                    return b.examsCompleted - a.examsCompleted;
                case "streak":
                    return b.streak - a.streak;
                default: // score
                    return b.score - a.score;
            }
        });

        // Add ranks
        const rankedLeaderboard = leaderboard.slice(0, limit).map((user, index) => ({
            ...user,
            rank: index + 1,
            previousRank: null as number | null, // Could implement week-over-week comparison
        }));

        // Find current user's position
        let currentUser: any = null;
        if (session?.user?.id) {
            const userIndex = leaderboard.findIndex(u => u.userId === session.user!.id);
            if (userIndex !== -1) {
                currentUser = {
                    ...leaderboard[userIndex],
                    rank: userIndex + 1,
                    previousRank: null,
                };
            }
        }

        return NextResponse.json({
            topUsers: rankedLeaderboard,
            currentUser,
            totalParticipants: leaderboard.length,
        });
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
