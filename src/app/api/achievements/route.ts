import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

// GET /api/achievements - Lấy danh sách achievements
export async function GET() {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        // Lấy tất cả achievements
        const achievements = await db.achievement.findMany({
            where: {
                OR: [
                    { secret: false },
                    // Nếu đã unlock thì hiện cả secret
                    ...(userId ? [{
                        users: { some: { userId } }
                    }] : [])
                ]
            },
            include: {
                users: userId ? {
                    where: { userId },
                    select: { unlockedAt: true, progress: true }
                } : false
            },
            orderBy: [
                { category: "asc" },
                { points: "desc" }
            ]
        });

        // Transform response
        const data = achievements.map(achievement => ({
            id: achievement.id,
            name: achievement.name,
            slug: achievement.slug,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            points: achievement.points,
            rarity: achievement.rarity,
            secret: achievement.secret,
            unlocked: achievement.users && achievement.users.length > 0,
            unlockedAt: achievement.users?.[0]?.unlockedAt || null,
            progress: achievement.users?.[0]?.progress || 0,
        }));

        // Get user stats
        let userStats = null;
        if (userId) {
            const [totalPoints, unlockedCount, streak] = await Promise.all([
                db.userAchievement.aggregate({
                    where: { userId },
                    _sum: { progress: true }
                }),
                db.userAchievement.count({ where: { userId } }),
                db.userStreak.findUnique({ where: { userId } })
            ]);

            // Calculate total points from achievements
            const userAchievements = await db.userAchievement.findMany({
                where: { userId },
                include: { achievement: { select: { points: true } } }
            });
            const points = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);

            userStats = {
                totalPoints: points,
                unlockedCount,
                totalAchievements: achievements.length,
                currentStreak: streak?.currentStreak || 0,
                longestStreak: streak?.longestStreak || 0
            };
        }

        return NextResponse.json({
            achievements: data,
            stats: userStats,
            categories: ["LEARNING", "EXAM", "STREAK", "SOCIAL", "SPECIAL"]
        });

    } catch (error) {
        console.error("Failed to fetch achievements:", error);
        return NextResponse.json(
            { error: "Failed to fetch achievements" },
            { status: 500 }
        );
    }
}
