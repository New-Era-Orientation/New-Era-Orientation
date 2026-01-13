import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

// GET /api/user/attempts - Lấy lịch sử làm bài thi
export async function GET(request: Request) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const examSlug = searchParams.get("exam");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const userId = session.user.id;

        // Build where clause
        const where: Record<string, unknown> = { userId };
        
        if (examSlug) {
            where.exam = { slug: examSlug };
        }

        // Query attempts
        const [attempts, total] = await Promise.all([
            db.examAttempt.findMany({
                where,
                include: {
                    exam: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            year: true,
                            source: true,
                            type: true,
                            duration: true,
                        },
                    },
                },
                orderBy: { completedAt: "desc" },
                skip,
                take: limit,
            }),
            db.examAttempt.count({ where }),
        ]);

        const data = attempts.map((attempt) => ({
            id: attempt.id,
            exam: attempt.exam,
            track: attempt.track,
            score: attempt.score,
            maxScore: attempt.maxScore,
            percentage: Math.round(((attempt.score || 0) / attempt.maxScore) * 100),
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt,
            timeSpent: attempt.timeSpent,
        }));

        return NextResponse.json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching attempts:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch attempts" },
            { status: 500 }
        );
    }
}
