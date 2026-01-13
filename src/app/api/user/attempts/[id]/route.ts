import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/user/attempts/[id] - Lấy chi tiết lần làm bài
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const userId = session.user.id;

        const attempt = await db.examAttempt.findFirst({
            where: { id, userId },
            include: {
                exam: {
                    include: {
                        questions: {
                            include: {
                                question: {
                                    include: {
                                        subQuestions: {
                                            orderBy: { order: "asc" },
                                        },
                                    },
                                },
                            },
                            orderBy: [{ partNumber: "asc" }, { order: "asc" }],
                        },
                    },
                },
            },
        });

        if (!attempt) {
            return NextResponse.json(
                { success: false, error: "Attempt not found" },
                { status: 404 }
            );
        }

        // Build detailed result
        const answers = attempt.answers as Record<string, unknown>;
        
        // Group questions by part with answers
        const partsMap = new Map<number, {
            id: number;
            title: string;
            questions: unknown[];
        }>();

        attempt.exam.questions.forEach((eq) => {
            const question = eq.question;
            
            // Filter by track
            if (question.track !== "COMMON" && question.track !== attempt.track) {
                return;
            }

            if (!partsMap.has(eq.partNumber)) {
                partsMap.set(eq.partNumber, {
                    id: eq.partNumber,
                    title: `Phần ${eq.partNumber}`,
                    questions: [],
                });
            }

            const part = partsMap.get(eq.partNumber)!;
            const userAnswer = answers[question.id];

            let isCorrect = false;
            let correctAnswer: unknown;

            if (question.type === "MULTIPLE_CHOICE") {
                isCorrect = userAnswer === question.correctAnswer;
                correctAnswer = question.correctAnswer;
            } else if (question.type === "TRUE_FALSE_GROUP") {
                const correctAnswerMap: Record<string, boolean> = {};
                question.subQuestions.forEach((sq) => {
                    correctAnswerMap[sq.id] = sq.isCorrect;
                });
                correctAnswer = correctAnswerMap;
                
                const subAnswers = (userAnswer || {}) as Record<string, boolean>;
                isCorrect = question.subQuestions.every(
                    (sq) => subAnswers[sq.id] === sq.isCorrect
                );
            }

            part.questions.push({
                id: question.id,
                num: eq.order,
                content: question.content,
                type: question.type,
                track: question.track,
                choices: question.choices,
                points: eq.points,
                subQuestions: question.subQuestions.map((sq) => ({
                    id: sq.id,
                    content: sq.content,
                    isCorrect: sq.isCorrect,
                })),
                userAnswer,
                correctAnswer,
                isCorrect,
            });
        });

        const parts = Array.from(partsMap.values()).sort((a, b) => a.id - b.id);

        return NextResponse.json({
            success: true,
            data: {
                id: attempt.id,
                exam: {
                    id: attempt.exam.id,
                    title: attempt.exam.title,
                    slug: attempt.exam.slug,
                    year: attempt.exam.year,
                    source: attempt.exam.source,
                    type: attempt.exam.type,
                    duration: attempt.exam.duration,
                },
                track: attempt.track,
                score: attempt.score,
                maxScore: attempt.maxScore,
                percentage: Math.round(((attempt.score || 0) / attempt.maxScore) * 100),
                startedAt: attempt.startedAt,
                completedAt: attempt.completedAt,
                timeSpent: attempt.timeSpent,
                parts,
            },
        });
    } catch (error) {
        console.error("Error fetching attempt detail:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch attempt" },
            { status: 500 }
        );
    }
}
