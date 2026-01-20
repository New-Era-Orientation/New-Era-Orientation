import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

export const dynamic = "force-dynamic";

// Achievement requirement checker
async function checkAchievementRequirement(
    userId: string,
    requirement: { type: string; value: number }
): Promise<{ met: boolean; progress: number }> {
    switch (requirement.type) {
        case "exams_completed": {
            const count = await db.examAttempt.count({
                where: { userId, completedAt: { not: null } }
            });
            return { met: count >= requirement.value, progress: Math.min(100, (count / requirement.value) * 100) };
        }
        case "perfect_score": {
            const count = await db.examAttempt.count({
                where: { userId, score: { gte: 10 } }
            });
            return { met: count >= requirement.value, progress: Math.min(100, (count / requirement.value) * 100) };
        }
        case "topics_completed": {
            const count = await db.userProgress.count({
                where: { userId, completed: true }
            });
            return { met: count >= requirement.value, progress: Math.min(100, (count / requirement.value) * 100) };
        }
        case "streak_days": {
            const streak = await db.userStreak.findUnique({ where: { userId } });
            const current = streak?.currentStreak || 0;
            return { met: current >= requirement.value, progress: Math.min(100, (current / requirement.value) * 100) };
        }
        case "total_time": {
            const result = await db.examAttempt.aggregate({
                where: { userId },
                _sum: { timeSpent: true }
            });
            const totalMinutes = result._sum.timeSpent || 0;
            return { met: totalMinutes >= requirement.value, progress: Math.min(100, (totalMinutes / requirement.value) * 100) };
        }
        default:
            return { met: false, progress: 0 };
    }
}

// POST /api/achievements/unlock - Check and unlock achievements
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { achievementSlug } = body;

        // Get achievement
        const achievement = await db.achievement.findUnique({
            where: { slug: achievementSlug },
            include: {
                users: { where: { userId } }
            }
        });

        if (!achievement) {
            return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
        }

        // Already unlocked
        if (achievement.users.length > 0) {
            return NextResponse.json({
                success: false,
                message: "Achievement already unlocked"
            });
        }

        // Check requirement
        const requirement = achievement.requirement as { type: string; value: number };
        const { met, progress } = await checkAchievementRequirement(userId, requirement);

        if (!met) {
            return NextResponse.json({
                success: false,
                message: "Requirement not met",
                progress
            });
        }

        // Unlock achievement
        const userAchievement = await db.userAchievement.create({
            data: {
                userId,
                achievementId: achievement.id,
                progress: 100
            }
        });

        // Create notification
        await db.notification.create({
            data: {
                userId,
                type: "ACHIEVEMENT",
                title: "🎉 Thành tựu mới!",
                message: `Bạn đã mở khóa "${achievement.name}"`,
                link: "/achievements",
                data: { achievementId: achievement.id }
            }
        });

        return NextResponse.json({
            success: true,
            achievement: {
                id: achievement.id,
                name: achievement.name,
                icon: achievement.icon,
                points: achievement.points,
                rarity: achievement.rarity
            },
            unlockedAt: userAchievement.unlockedAt
        });

    } catch (error) {
        console.error("Failed to unlock achievement:", error);
        return NextResponse.json(
            { error: "Failed to unlock achievement" },
            { status: 500 }
        );
    }
}

// GET /api/achievements/unlock - Check all achievements for user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Get all achievements not yet unlocked
        const achievements = await db.achievement.findMany({
            where: {
                users: { none: { userId } }
            }
        });

        const results: any[] = [];

        for (const achievement of achievements) {
            const requirement = achievement.requirement as { type: string; value: number };
            const { met, progress } = await checkAchievementRequirement(userId, requirement);

            if (met) {
                // Auto-unlock
                await db.userAchievement.create({
                    data: {
                        userId,
                        achievementId: achievement.id,
                        progress: 100
                    }
                });

                // Create notification
                await db.notification.create({
                    data: {
                        userId,
                        type: "ACHIEVEMENT",
                        title: "🎉 Thành tựu mới!",
                        message: `Bạn đã mở khóa "${achievement.name}"`,
                        link: "/achievements",
                        data: { achievementId: achievement.id }
                    }
                });

                results.push({
                    id: achievement.id,
                    name: achievement.name,
                    icon: achievement.icon,
                    unlocked: true
                });
            } else {
                results.push({
                    id: achievement.id,
                    name: achievement.name,
                    progress,
                    unlocked: false
                });
            }
        }

        const newlyUnlocked = results.filter(r => r.unlocked);

        return NextResponse.json({
            checked: results.length,
            newlyUnlocked: newlyUnlocked.length,
            achievements: newlyUnlocked
        });

    } catch (error) {
        console.error("Failed to check achievements:", error);
        return NextResponse.json(
            { error: "Failed to check achievements" },
            { status: 500 }
        );
    }
}
