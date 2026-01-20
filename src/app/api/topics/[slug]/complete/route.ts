import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// POST /api/topics/[slug]/complete - Đánh dấu hoàn thành topic
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { slug } = await params;

        // Find topic by slug
        const topic = await db.topic.findFirst({
            where: { slug },
            select: { id: true, name: true },
        });

        if (!topic) {
            return NextResponse.json(
                { success: false, error: "Topic not found" },
                { status: 404 }
            );
        }

        // Upsert user progress (create or update)
        const progress = await db.userProgress.upsert({
            where: {
                userId_topicId: {
                    userId: session.user.id,
                    topicId: topic.id,
                },
            },
            update: {
                completed: true,
                lastAccess: new Date(),
            },
            create: {
                userId: session.user.id,
                topicId: topic.id,
                completed: true,
                timeSpent: 0,
            },
        });

        // Update user streak
        await updateStreak(session.user.id);

        // Check for achievements
        await checkStudyAchievements(session.user.id);

        return NextResponse.json({
            success: true,
            data: {
                topicId: topic.id,
                topicName: topic.name,
                completed: progress.completed,
                completedAt: progress.updatedAt,
            },
            message: `Đã hoàn thành bài học "${topic.name}"`,
        });
    } catch (error) {
        console.error("Error marking topic complete:", error);
        return NextResponse.json(
            { success: false, error: "Failed to mark topic complete" },
            { status: 500 }
        );
    }
}

// DELETE /api/topics/[slug]/complete - Bỏ đánh dấu hoàn thành
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { slug } = await params;

        const topic = await db.topic.findFirst({
            where: { slug },
            select: { id: true },
        });

        if (!topic) {
            return NextResponse.json(
                { success: false, error: "Topic not found" },
                { status: 404 }
            );
        }

        // Update progress to incomplete
        await db.userProgress.updateMany({
            where: {
                userId: session.user.id,
                topicId: topic.id,
            },
            data: {
                completed: false,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Đã bỏ đánh dấu hoàn thành",
        });
    } catch (error) {
        console.error("Error unmarking topic complete:", error);
        return NextResponse.json(
            { success: false, error: "Failed to unmark topic" },
            { status: 500 }
        );
    }
}

// Helper: Update user streak
async function updateStreak(userId: string) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const streak = await db.userStreak.findUnique({
            where: { userId },
        });

        if (!streak) {
            // Create new streak
            await db.userStreak.create({
                data: {
                    userId,
                    currentStreak: 1,
                    longestStreak: 1,
                    lastActiveAt: today,
                },
            });
            return;
        }

        const lastActive = new Date(streak.lastActiveAt);
        lastActive.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Already active today, no update needed
            return;
        } else if (diffDays === 1) {
            // Consecutive day, increase streak
            await db.userStreak.update({
                where: { userId },
                data: {
                    currentStreak: streak.currentStreak + 1,
                    longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
                    lastActiveAt: today,
                },
            });
        } else {
            // Streak broken, reset to 1
            await db.userStreak.update({
                where: { userId },
                data: {
                    currentStreak: 1,
                    lastActiveAt: today,
                },
            });
        }
    } catch (error) {
        console.error("Error updating streak:", error);
    }
}

// Helper: Check study-related achievements
async function checkStudyAchievements(userId: string) {
    try {
        // Count completed topics
        const completedCount = await db.userProgress.count({
            where: {
                userId,
                completed: true,
            },
        });

        // Achievement milestones
        const milestones = [
            { count: 1, achievementSlug: "first-lesson" },
            { count: 10, achievementSlug: "ten-lessons" },
            { count: 50, achievementSlug: "fifty-lessons" },
            { count: 100, achievementSlug: "hundred-lessons" },
        ];

        for (const milestone of milestones) {
            if (completedCount >= milestone.count) {
                // Find achievement by slug
                const achievement = await db.achievement.findFirst({
                    where: { slug: milestone.achievementSlug },
                });

                if (achievement) {
                    // Check if user already has this achievement
                    const existing = await db.userAchievement.findUnique({
                        where: {
                            userId_achievementId: {
                                userId,
                                achievementId: achievement.id,
                            },
                        },
                    });

                    if (!existing) {
                        // Create user achievement
                        await db.userAchievement.create({
                            data: {
                                userId,
                                achievementId: achievement.id,
                            },
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error checking achievements:", error);
    }
}
