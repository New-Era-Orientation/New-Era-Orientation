import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
    const session = await auth();
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search") || "";
    const passed = searchParams.get("passed");

    const skip = (page - 1) * limit;

    try {
        // Build where clause
        const where: Prisma.ExamAttemptWhereInput = {
            userId: session.user.id,
            completedAt: {
                not: null,
            },
        };

        // Add search filter
        if (search) {
            where.exam = {
                title: {
                    contains: search,
                    mode: "insensitive",
                },
            };
        }

        // Add passed filter
        if (passed === "passed") {
            where.score = {
                gte: 5,
            };
        } else if (passed === "failed") {
            where.score = {
                lt: 5,
            };
        }

        // Build order by
        const orderBy: Prisma.ExamAttemptOrderByWithRelationInput = 
            sortBy === "score" 
                ? { score: sortOrder as "asc" | "desc" }
                : { completedAt: sortOrder as "asc" | "desc" };

        // Get attempts with pagination
        const [attempts, total] = await Promise.all([
            db.examAttempt.findMany({
                where,
                include: {
                    exam: {
                        select: {
                            id: true,
                            slug: true,
                            title: true,
                            duration: true,
                            parts: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            db.examAttempt.count({ where }),
        ]);

        // Get all attempts for stats
        const allAttempts = await db.examAttempt.findMany({
            where: {
                userId: session.user.id,
                completedAt: {
                    not: null,
                },
            },
            select: {
                score: true,
                timeSpent: true,
            },
        });

        // Calculate stats
        const scores = allAttempts.filter(a => a.score !== null).map(a => a.score as number);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const passRate = scores.length > 0 
            ? Math.round((scores.filter(s => s >= 5).length / scores.length) * 100) 
            : 0;
        const totalTime = allAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

        // Format attempts for response
        const formattedAttempts = attempts.map(attempt => {
            // Count total questions from exam parts
            const parts = (attempt.exam.parts as Array<{ questions: unknown[] }>) || [];
            const totalQuestions = parts.reduce((sum, part) => sum + (part.questions?.length || 0), 0);
            
            // Calculate correct answers from score (assuming 10 points = all correct)
            const correctAnswers = Math.round((attempt.score || 0) / 10 * totalQuestions);

            return {
                id: attempt.id,
                examId: attempt.exam.id,
                examSlug: attempt.exam.slug,
                examTitle: attempt.exam.title,
                score: attempt.score || 0,
                maxScore: 10,
                correctAnswers,
                totalQuestions,
                timeSpent: attempt.timeSpent || 0,
                timeLimit: attempt.exam.duration || 90,
                completedAt: attempt.completedAt?.toISOString() || "",
                passed: (attempt.score || 0) >= 5,
            };
        });

        return NextResponse.json({
            attempts: formattedAttempts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: {
                totalAttempts: allAttempts.length,
                avgScore: Math.round(avgScore * 10) / 10,
                passRate,
                totalTime,
            },
        });
    } catch (error) {
        console.error("Failed to fetch history:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
