import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { sendEmail } from "@/server/email";
import { WeeklyDigestEmail } from "@/server/email/templates/WeeklyDigestEmail";
import { render } from "@react-email/components";

// API to send weekly digest emails (typically called by a cron job)
export async function POST(request: NextRequest) {
    try {
        // Verify this is from an authorized source (cron job or admin)
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;
        
        // Check for cron secret or admin session
        let isAuthorized = false;
        
        if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
            isAuthorized = true;
        } else {
            const session = await auth();
            if (session?.user?.id) {
                const user = await db.user.findUnique({
                    where: { id: session.user.id },
                    select: { role: true },
                });
                isAuthorized = user?.role === "ADMIN";
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId } = await request.json().catch(() => ({}));

        // Get users to send digest to
        const users = userId
            ? await db.user.findMany({ where: { id: userId } })
            : await db.user.findMany({
                where: {
                    emailVerified: { not: null },
                    // Could add a preference check here
                },
            });

        const now = new Date();
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const results = {
            sent: 0,
            failed: 0,
            skipped: 0,
        };

        for (const user of users) {
            try {
                // Generate digest data for this user
                const digestData = await generateDigestData(user.id, weekStart, now);
                
                // Skip if no activity
                if (digestData.stats.examsCompleted === 0 && 
                    digestData.stats.flashcardsReviewed === 0) {
                    results.skipped++;
                    continue;
                }

                // Render email
                const emailHtml = await render(
                    WeeklyDigestEmail({
                        userName: user.name || "Học sinh",
                        weekStartDate: weekStart.toLocaleDateString("vi-VN"),
                        weekEndDate: now.toLocaleDateString("vi-VN"),
                        ...digestData,
                    })
                );

                // Send email
                await sendEmail({
                    to: user.email,
                    subject: `📊 Báo cáo học tập tuần - NEO-EDU`,
                    html: emailHtml,
                });

                results.sent++;
            } catch (error) {
                console.error(`Failed to send digest to ${user.email}:`, error);
                results.failed++;
            }
        }

        return NextResponse.json({
            success: true,
            results,
            message: `Sent ${results.sent} digests, ${results.failed} failed, ${results.skipped} skipped`,
        });
    } catch (error) {
        console.error("Weekly digest error:", error);
        return NextResponse.json(
            { error: "Failed to send weekly digest" },
            { status: 500 }
        );
    }
}

async function generateDigestData(userId: string, weekStart: Date, weekEnd: Date) {
    // Get exam attempts
    const attempts = await db.examAttempt.findMany({
        where: {
            userId,
            completedAt: { gte: weekStart, lte: weekEnd },
        },
        include: {
            exam: { select: { title: true } },
        },
        orderBy: { score: "desc" },
    });

    // Get flashcard reviews
    const flashcardReviews = await db.flashcardReview.count({
        where: {
            userId,
            createdAt: { gte: weekStart, lte: weekEnd },
        },
    });

    // Get streak
    const streak = await db.userStreak.findUnique({
        where: { userId },
    });

    // Get new achievements
    const newAchievements = await db.userAchievement.findMany({
        where: {
            userId,
            unlockedAt: { gte: weekStart, lte: weekEnd },
        },
        include: {
            achievement: true,
        },
    });

    // Calculate stats
    const scores = attempts.map(a => a.score || 0);
    const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

    // Analyze weak areas (simplified)
    const weakAreas: { topic: string; accuracy: number }[] = [];

    // Generate recommendations
    const recommendations = generateRecommendations(attempts, streak);

    return {
        stats: {
            examsCompleted: attempts.length,
            avgScore: scores.length > 0 
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 
                : 0,
            studyTime: totalTime,
            flashcardsReviewed: flashcardReviews,
            streakDays: streak?.currentStreak || 0,
        },
        topScores: attempts.slice(0, 3).map(a => ({
            examTitle: a.exam.title,
            score: a.score || 0,
            date: a.completedAt?.toLocaleDateString("vi-VN") || "",
        })),
        weakAreas,
        achievements: newAchievements.map(ua => ({
            name: ua.achievement.name,
            icon: ua.achievement.icon,
        })),
        recommendations,
    };
}

function generateRecommendations(attempts: any[], streak: any): string[] {
    const recommendations: string[] = [];

    if (attempts.length < 3) {
        recommendations.push("Cố gắng làm ít nhất 3 đề thi mỗi tuần để duy trì nhịp học");
    }

    if (streak?.currentStreak && streak.currentStreak > 0) {
        recommendations.push(`Tuyệt vời! Tiếp tục duy trì streak ${streak.currentStreak} ngày của bạn`);
    } else {
        recommendations.push("Hãy bắt đầu một streak mới bằng cách học mỗi ngày");
    }

    const avgScore = attempts.length > 0
        ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
        : 0;

    if (avgScore < 6) {
        recommendations.push("Xem lại những câu hỏi sai và ôn tập kiến thức liên quan");
    } else if (avgScore >= 8) {
        recommendations.push("Điểm số rất tốt! Thử thách bản thân với đề thi khó hơn");
    }

    return recommendations.slice(0, 3);
}
