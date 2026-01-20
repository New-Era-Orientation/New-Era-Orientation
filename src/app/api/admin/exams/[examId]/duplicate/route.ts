import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

interface RouteParams {
    params: Promise<{ examId: string }>;
}

// POST - Duplicate exam
export async function POST(request: NextRequest, { params }: RouteParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { examId } = await params;

    try {
        // Fetch original exam with all questions
        const originalExam = await db.exam.findUnique({
            where: { id: examId },
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

        if (!originalExam) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        // Generate unique slug
        const baseSlug = originalExam.slug.replace(/-copy(-\d+)?$/, '');
        let newSlug = `${baseSlug}-copy`;
        let counter = 1;

        while (await db.exam.findUnique({ where: { slug: newSlug } })) {
            newSlug = `${baseSlug}-copy-${counter}`;
            counter++;
        }

        // Create duplicated exam
        const duplicatedExam = await db.exam.create({
            data: {
                title: `${originalExam.title} (Bản sao)`,
                slug: newSlug,
                description: originalExam.description,
                subject: originalExam.subject,
                year: originalExam.year,
                source: originalExam.source,
                type: originalExam.type,
                duration: originalExam.duration,
                parts: originalExam.parts ?? undefined,
                published: false, // Always start as unpublished
                questions: {
                    create: originalExam.questions.map((eq) => ({
                        order: eq.order,
                        partNumber: eq.partNumber,
                        points: eq.points,
                        question: {
                            create: {
                                content: eq.question.content,
                                type: eq.question.type,
                                track: eq.question.track,
                                choices: eq.question.choices,
                                correctAnswer: eq.question.correctAnswer,
                                subQuestions: eq.question.subQuestions.length > 0 ? {
                                    create: eq.question.subQuestions.map((sq) => ({
                                        content: sq.content,
                                        isCorrect: sq.isCorrect,
                                        order: sq.order,
                                    })),
                                } : undefined,
                            },
                        },
                    })),
                },
            },
            include: {
                _count: {
                    select: { questions: true },
                },
            },
        });

        return NextResponse.json({
            exam: duplicatedExam,
            message: "Đã nhân bản đề thi thành công"
        });
    } catch (error) {
        console.error("Error duplicating exam:", error);
        return NextResponse.json(
            { error: "Failed to duplicate exam" },
            { status: 500 }
        );
    }
}
