import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";

/**
 * Combined Dashboard API
 * Trả về tất cả data cần cho dashboard trong 1 request
 * Giảm từ 5+ requests xuống còn 1
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parallel queries
    const [
      statsResult,
      activitiesResult,
      progressResult,
      streakResult,
    ] = await Promise.all([
      // User stats
      prisma.$queryRaw<{ exams_completed: bigint; average_score: number; study_time: bigint }[]>`
        SELECT 
          COUNT(DISTINCT ea.id) as exams_completed,
          COALESCE(AVG(ea.score), 0) as average_score,
          COALESCE(SUM(up."timeSpent"), 0) as study_time
        FROM users u
        LEFT JOIN exam_attempts ea ON ea."userId" = u.id
        LEFT JOIN user_progress up ON up."userId" = u.id
        WHERE u.id = ${userId}
      `,

      // Recent activities (last 5)
      prisma.examAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          score: true,
          createdAt: true,
          exam: {
            select: { title: true },
          },
        },
      }),

      // Study progress
      prisma.$queryRaw<{ total: bigint; completed: bigint }[]>`
        SELECT 
          COUNT(t.id) as total,
          COUNT(CASE WHEN up.completed THEN 1 END) as completed
        FROM topics t
        LEFT JOIN user_progress up ON up."topicId" = t.id AND up."userId" = ${userId}
      `,

      // User streak
      prisma.userStreak.findUnique({
        where: { userId },
        select: { currentStreak: true },
      }),
    ]);

    const stats = statsResult[0];
    const progress = progressResult[0];
    const total = Number(progress?.total || 0);
    const completed = Number(progress?.completed || 0);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          examsCompleted: Number(stats?.exams_completed || 0),
          averageScore: Math.round((stats?.average_score || 0) * 10) / 10,
          studyTime: Number(stats?.study_time || 0),
          progress: total > 0 ? Math.round((completed / total) * 100) : 0,
          streak: streakResult?.currentStreak || 0,
        },
        activities: activitiesResult.map(a => ({
          id: a.id,
          title: a.exam.title,
          type: "exam" as const,
          score: a.score,
          createdAt: a.createdAt.toISOString(),
        })),
        progress: {
          totalTopics: total,
          completedTopics: completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
