import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

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
        default:
            startDate = new Date(0); // All time
    }

    try {
        // Get all attempts in the date range
        const attempts = await db.examAttempt.findMany({
            where: {
                userId: session.user.id,
                completedAt: {
                    gte: startDate,
                },
            },
            include: {
                exam: {
                    select: {
                        title: true,
                        subject: true,
                    },
                },
            },
            orderBy: {
                completedAt: "desc",
            },
        });

        // Calculate overview stats
        const totalExams = attempts.length;
        const scores = attempts.filter(a => a.score !== null).map(a => a.score as number);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const worstScore = scores.length > 0 ? Math.min(...scores) : 0;
        const passRate = scores.length > 0
            ? Math.round((scores.filter(s => s >= 5).length / scores.length) * 100)
            : 0;

        // Calculate total time in hours
        const totalTimeMinutes = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
        const totalTime = Math.round(totalTimeMinutes / 60 * 10) / 10;

        // Calculate weekly progress
        const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        const weeklyProgress: any[] = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));

            const dayAttempts = attempts.filter(a => {
                const attemptDate = new Date(a.completedAt!);
                return attemptDate >= dayStart && attemptDate <= dayEnd;
            });

            const dayScores = dayAttempts.filter(a => a.score !== null).map(a => a.score as number);
            const avgDayScore = dayScores.length > 0
                ? dayScores.reduce((a, b) => a + b, 0) / dayScores.length
                : 0;

            weeklyProgress.push({
                day: weekDays[new Date(date).getDay()],
                exams: dayAttempts.length,
                score: Math.round(avgDayScore * 10) / 10,
            });
        }

        // Calculate subject breakdown
        const subjectMap = new Map<string, { exams: number; totalScore: number }>();

        for (const attempt of attempts) {
            const subject = attempt.exam.subject || "Khác";
            const existing = subjectMap.get(subject) || { exams: 0, totalScore: 0 };
            subjectMap.set(subject, {
                exams: existing.exams + 1,
                totalScore: existing.totalScore + (attempt.score || 0),
            });
        }

        const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, data]) => ({
            subject,
            exams: data.exams,
            avgScore: Math.round((data.totalScore / data.exams) * 10) / 10,
        }));

        // Calculate streak data
        const allAttempts = await db.examAttempt.findMany({
            where: {
                userId: session.user.id,
                completedAt: {
                    not: null,
                },
            },
            select: {
                completedAt: true,
            },
            orderBy: {
                completedAt: "desc",
            },
        });

        // Get unique days with activity
        const activeDays = new Set(
            allAttempts.map(a => a.completedAt?.toISOString().split("T")[0])
        );

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date().toISOString().split("T")[0];
        let checkDate = today;

        while (activeDays.has(checkDate)) {
            currentStreak++;
            const prevDate = new Date(checkDate);
            prevDate.setDate(prevDate.getDate() - 1);
            checkDate = prevDate.toISOString().split("T")[0];
        }

        // Calculate longest streak (simplified)
        let longestStreak = currentStreak;
        let tempStreak = 0;
        const sortedDays = Array.from(activeDays).filter((d): d is string => d !== undefined).sort();

        for (let i = 0; i < sortedDays.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const prevDay = new Date(sortedDays[i - 1]!);
                const currDay = new Date(sortedDays[i]!);
                const diffDays = (currDay.getTime() - prevDay.getTime()) / (24 * 60 * 60 * 1000);

                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        }

        // Days active this month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthDays = sortedDays.filter(d => new Date(d) >= monthStart).length;

        // Recent exams formatted
        const recentExams = attempts.slice(0, 10).map(attempt => ({
            title: attempt.exam.title,
            date: attempt.completedAt?.toLocaleDateString("vi-VN") || "",
            score: attempt.score || 0,
            maxScore: 10,
            passed: (attempt.score || 0) >= 5,
        }));

        return NextResponse.json({
            overview: {
                totalExams,
                avgScore: Math.round(avgScore * 10) / 10,
                totalTime,
                bestScore: Math.round(bestScore * 10) / 10,
                worstScore: Math.round(worstScore * 10) / 10,
                passRate,
            },
            weeklyProgress,
            subjectBreakdown,
            recentExams,
            streakData: {
                current: currentStreak,
                longest: longestStreak,
                thisMonth: thisMonthDays,
            },
        });
    } catch (error) {
        console.error("Failed to fetch analytics:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
