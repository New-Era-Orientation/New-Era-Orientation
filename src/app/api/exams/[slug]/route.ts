import { NextResponse } from "next/server";
import { db } from "@/server/db";

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// GET /api/exams/[slug] - Lấy chi tiết đề thi
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { slug } = await params;

        const exam = await db.exam.findUnique({
            where: { slug },
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
        });

        if (!exam) {
            return NextResponse.json(
                { success: false, error: "Exam not found" },
                { status: 404 }
            );
        }

        // Group questions by part
        const partsMap = new Map<number, {
            id: number;
            title: string;
            questions: unknown[];
        }>();

        exam.questions.forEach((eq) => {
            if (!partsMap.has(eq.partNumber)) {
                partsMap.set(eq.partNumber, {
                    id: eq.partNumber,
                    title: `Phần ${eq.partNumber}`,
                    questions: [],
                });
            }

            const part = partsMap.get(eq.partNumber)!;
            part.questions.push({
                id: eq.question.id,
                num: eq.order,
                content: eq.question.content,
                type: eq.question.type,
                track: eq.question.track,
                choices: eq.question.choices,
                points: eq.points,
                subQuestions: eq.question.subQuestions.map((sq) => ({
                    id: sq.id,
                    content: sq.content,
                })),
            });
        });

        const parts = Array.from(partsMap.values()).sort((a, b) => a.id - b.id);

        return NextResponse.json({
            success: true,
            data: {
                id: exam.id,
                title: exam.title,
                slug: exam.slug,
                description: exam.description,
                year: exam.year,
                source: exam.source,
                type: exam.type,
                duration: exam.duration,
                parts,
            },
        });
    } catch (error) {
        console.error("Error fetching exam:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch exam" },
            { status: 500 }
        );
    }
}
