import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// GET /api/profile - Get user profile with stats
export async function GET() {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
                examAttempts: {
                    include: {
                        exam: {
                            select: {
                                title: true,
                                slug: true,
                            }
                        }
                    },
                    orderBy: { completedAt: "desc" },
                    take: 10
                },
                progress: {
                    select: {
                        topicId: true,
                        completed: true,
                        createdAt: true,
                    }
                },
                achievements: {
                    include: {
                        achievement: true
                    }
                },
                streak: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Calculate stats
        const examCount = user.examAttempts.length;
        const avgScore = examCount > 0 
            ? user.examAttempts.reduce((sum: number, a) => sum + (a.score || 0), 0) / examCount 
            : 0;
        const completedTopics = user.progress.filter(p => p.completed).length;
        const totalStudyTime = completedTopics * 30; // Estimate 30 min per topic

        const stats = {
            examsCompleted: examCount,
            averageScore: Math.round(avgScore * 10) / 10,
            studyTime: totalStudyTime,
            completedTopics,
            streak: user.streak?.currentStreak || 0,
            longestStreak: user.streak?.longestStreak || 0,
        };

        // Get recent activities
        const recentActivities = user.examAttempts.slice(0, 5).map(attempt => ({
            type: "exam" as const,
            title: `Hoàn thành đề thi ${attempt.exam.title}`,
            date: attempt.completedAt,
            score: attempt.score,
            href: `/exam/${attempt.exam.slug}`,
        }));

        // Format achievements
        const achievements = user.achievements.map(ua => ({
            id: ua.achievement.id,
            title: ua.achievement.name,
            description: ua.achievement.description,
            icon: ua.achievement.icon,
            category: ua.achievement.category,
            unlockedAt: ua.unlockedAt,
            unlocked: true,
        }));

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                bio: (user as any).bio || null,
                role: user.role,
                joinedDate: user.createdAt,
            },
            stats,
            recentActivities,
            achievements,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/profile - Update user profile
export async function PUT(request: Request) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, bio, image } = body;

        // Validate name
        if (name && (name.length < 2 || name.length > 50)) {
            return NextResponse.json({ 
                error: "Tên phải từ 2-50 ký tự" 
            }, { status: 400 });
        }

        // Validate bio
        if (bio && bio.length > 200) {
            return NextResponse.json({ 
                error: "Giới thiệu không được quá 200 ký tự" 
            }, { status: 400 });
        }

        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: {
                ...(name && { name }),
                ...(bio !== undefined && { bio }),
                ...(image && { image }),
            } as any,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            }
        });

        return NextResponse.json({ 
            success: true, 
            user: {
                ...updatedUser,
                bio: bio !== undefined ? bio : null,
            },
            message: "Hồ sơ đã được cập nhật"
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
