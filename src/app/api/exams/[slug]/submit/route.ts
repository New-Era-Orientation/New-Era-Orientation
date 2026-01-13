import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// POST /api/exams/[slug]/submit - Nộp bài thi
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
        const body = await request.json();
        const { answers, track, startedAt, duration } = body;

        // Find exam
        const exam = await db.exam.findUnique({
            where: { slug },
            include: {
                questions: {
                    include: {
                        question: {
                            include: {
                                subQuestions: true,
                            },
                        },
                    },
                },
            },
        });

        if (!exam) {
            return NextResponse.json(
                { success: false, error: "Exam not found" },
                { status: 404 }
            );
        }

        // Calculate score
        let score = 0;
        let maxScore = 0;
        const results: Record<string, {
            correct: boolean;
            userAnswer: string | Record<string, boolean>;
            correctAnswer: string | Record<string, boolean>;
            points: number;
            earned: number;
        }> = {};

        for (const eq of exam.questions) {
            const question = eq.question;
            
            // Filter by track if applicable
            if (question.track !== "COMMON" && question.track !== track) {
                continue;
            }

            maxScore += eq.points;
            const userAnswer = answers[question.id];

            if (question.type === "MULTIPLE_CHOICE") {
                const isCorrect = userAnswer === question.correctAnswer;
                const earned = isCorrect ? eq.points : 0;
                score += earned;

                results[question.id] = {
                    correct: isCorrect,
                    userAnswer: userAnswer || "",
                    correctAnswer: question.correctAnswer || "",
                    points: eq.points,
                    earned,
                };
            } else if (question.type === "TRUE_FALSE_GROUP") {
                // Calculate partial score for T/F groups
                const subAnswers = userAnswer || {};
                let correctCount = 0;
                const correctAnswerMap: Record<string, boolean> = {};

                for (const sq of question.subQuestions) {
                    correctAnswerMap[sq.id] = sq.isCorrect;
                    if (subAnswers[sq.id] === sq.isCorrect) {
                        correctCount++;
                    }
                }

                const totalSubs = question.subQuestions.length;
                const earnedPoints = totalSubs > 0 
                    ? (correctCount / totalSubs) * eq.points 
                    : 0;
                
                score += earnedPoints;

                results[question.id] = {
                    correct: correctCount === totalSubs,
                    userAnswer: subAnswers,
                    correctAnswer: correctAnswerMap,
                    points: eq.points,
                    earned: earnedPoints,
                };
            }
        }

        // Save attempt to database
        const attempt = await db.examAttempt.create({
            data: {
                userId: session.user.id,
                examId: exam.id,
                track: track || "COMMON",
                answers: answers,
                score: Math.round(score * 100) / 100,
                maxScore,
                startedAt: startedAt ? new Date(startedAt) : new Date(),
                completedAt: new Date(),
                timeSpent: duration || 0,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                attemptId: attempt.id,
                score: Math.round(score * 100) / 100,
                maxScore,
                percentage: Math.round((score / maxScore) * 100),
                results,
                timeSpent: attempt.timeSpent,
            },
        });
    } catch (error) {
        console.error("Error submitting exam:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit exam" },
            { status: 500 }
        );
    }
}
