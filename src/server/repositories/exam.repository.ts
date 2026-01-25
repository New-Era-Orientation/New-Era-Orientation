/**
 * Exam Repository - Server-side data access
 */

import { db } from "@/server/db";
import type { Exam, Question, ExamPart, SubQuestion } from "@/client/lib/exam-data";

export async function getExamBySlug(slug: string): Promise<Exam | null> {
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
                orderBy: [
                    { partNumber: "asc" },
                    { order: "asc" },
                ],
            },
        },
    });

    if (!exam) return null;

    // Group questions by part
    const partsMap = new Map<number, Question[]>();

    for (const eq of exam.questions) {
        const partNum = eq.partNumber;
        if (!partsMap.has(partNum)) {
            partsMap.set(partNum, []);
        }

        const q = eq.question;
        const question: Question = {
            id: q.id,
            num: eq.order,
            content: q.content,
            type: (q.typeId as any) || "MULTIPLE_CHOICE", // Handle typeId
            track: "COMMON", // Default
            choices: q.options.map(o => o.content),
            // correctAnswer logic if needed, but usually kept hidden or processed separately
            points: eq.points,
            // SubQuestions not supported in current schema
            subQuestions: [],
        };

        partsMap.get(partNum)!.push(question);
    }

    const parts: ExamPart[] = Array.from(partsMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([id, questions]) => ({
            id,
            title: id === 1 ? "PHẦN I. CÂU HỎI TRẮC NGHIỆM" : `PHẦN ${id}`,
            questions,
        }));

    return {
        id: exam.id,
        title: exam.title,
        slug: exam.slug,
        year: exam.year || new Date().getFullYear(),
        source: exam.source || "N/A",
        type: exam.type as "HSG" | "STANDARD" | "MOCK",
        duration: exam.duration || 60,
        parts,
    };
}

export interface ExamListParams {
    page?: number;
    pageSize?: number;
    type?: string;
    year?: number;
    search?: string;
    subjectId?: string;
}

export async function getExamList(params: ExamListParams = {}) {
    const {
        page = 1,
        pageSize = 12,
        type,
        year,
        search,
        subjectId,
    } = params;

    const where: Record<string, unknown> = {
        published: true,
    };

    if (type) where.type = type;
    if (year) where.year = year;
    if (subjectId) where.subjectId = subjectId;

    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { source: { contains: search, mode: "insensitive" } },
        ];
    }

    const [exams, totalCount] = await Promise.all([
        db.exam.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                year: true,
                source: true,
                type: true,
                duration: true,
                _count: {
                    select: { questions: true },
                },
            },
            orderBy: [
                { year: "desc" },
                { createdAt: "desc" },
            ],
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        db.exam.count({ where }),
    ]);

    return {
        exams: exams.map((exam) => ({
            id: exam.id,
            title: exam.title,
            slug: exam.slug,
            year: exam.year,
            source: exam.source,
            type: exam.type as "HSG" | "STANDARD" | "MOCK",
            duration: exam.duration,
            questionCount: exam._count.questions,
        })),
        pagination: {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
        },
    };
}
