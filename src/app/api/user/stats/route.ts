import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            // Return default stats for unauthenticated users
            return NextResponse.json({
                examsCompleted: 0,
                averageScore: 0,
                studyTime: 0,
                progress: 0,
                streak: 0,
            });
        }

        const userId = session.user.id;

        // Get exam attempts stats
        const examAttempts = await db.examAttempt.findMany({
            where: { userId },
            orderBy: { startedAt: "desc" },
        });

        const examsCompleted = examAttempts.length;
        const averageScore = examsCompleted > 0
            ? examAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / examsCompleted
            : 0;

        // Get study progress
        const progress = await db.userProgress.findMany({
            where: { userId },
        });

        const completedTopics = progress.filter(p => p.completed).length;
        const totalProgress = progress.length > 0
            ? (completedTopics / progress.length) * 100
            : 0;

        // Calculate study time from progress
        const studyTime = progress.reduce((acc, curr) => {
            return acc + (curr.timeSpent || 0);
        }, 0);

        // Calculate streak (consecutive days with activity)
        const streak = calculateStreak(examAttempts.map(a => a.startedAt));

        return NextResponse.json({
            examsCompleted,
            averageScore: Math.round(averageScore * 10) / 10,
            studyTime: Math.round(studyTime / 60), // Convert to hours
            progress: Math.round(totalProgress),
            streak,
        });
    } catch (error) {
        console.error("Stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}

function calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    const sortedDates = dates
        .map(d => new Date(d).toDateString())
        .filter((date, index, self) => self.indexOf(date) === index)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of sortedDates) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak) {
            streak++;
        } else if (diffDays > streak) {
            break;
        }
    }

    return streak;
}
