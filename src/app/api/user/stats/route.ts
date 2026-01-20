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

        // Get streak from UserStreak table (updated when completing topics/exams)
        const userStreak = await db.userStreak.findUnique({
            where: { userId },
        });

        // Validate streak - check if lastActiveAt is within 1 day
        let streak = 0;
        if (userStreak) {
            const lastActive = new Date(userStreak.lastActiveAt);
            lastActive.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
            
            // Streak is valid if active today or yesterday
            if (diffDays <= 1) {
                streak = userStreak.currentStreak;
            }
            // If more than 1 day gap, streak is broken (will be reset on next activity)
        }

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
