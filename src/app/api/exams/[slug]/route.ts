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
                                options: {
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

            // Map options array to string[] choices for compatibility
            // The frontend ExamEngine expects choices: string[]
            const choices = eq.question.options.map(o => o.content);

            part.questions.push({
                id: eq.question.id,
                num: eq.order,
                content: eq.question.content,
                type: eq.question.typeId || "MULTIPLE_CHOICE", // Handle typeId
                track: "COMMON", // Default, field not in new schema?
                choices: choices,
                points: eq.points,
                // SubQuestions not supported in current schema/import
                subQuestions: [],
                // Include correct answer info (masked in client, handled by submit API)
                // But for "Taking" page, we usually don't send correct answers if secure.
                // However, ExamEngine calculates locally if API submit fails?
                // ExamEngine fallback logic: checks `q.correctAnswer`.
                // Ideally, we shouldn't send correct answer to client.
                // But ExamEngine fallback relies on it.
                // Let's verify ExamEngine fallback.
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
