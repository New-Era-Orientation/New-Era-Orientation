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
                            subQuestions: {
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
            type: q.type as "MULTIPLE_CHOICE" | "TRUE_FALSE_GROUP",
            track: q.track as "COMMON" | "COMPUTER_SCIENCE" | "APPLIED_INFORMATICS",
            choices: q.choices,
            correctAnswer: q.correctAnswer || undefined,
            points: eq.points,
            subQuestions: q.subQuestions.map((sq): SubQuestion => ({
                id: sq.id,
                content: sq.content,
                isCorrect: sq.isCorrect,
            })),
        };
        
        partsMap.get(partNum)!.push(question);
    }

    const parts: ExamPart[] = Array.from(partsMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([id, questions]) => ({
            id,
            title: id === 1 ? "PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN" : "PHẦN II. TRẮC NGHIỆM ĐÚNG/SAI",
            questions,
        }));

    return {
        id: exam.id,
        title: exam.title,
        slug: exam.slug,
        year: exam.year,
        source: exam.source,
        type: exam.type as "HSG" | "STANDARD" | "MOCK",
        duration: exam.duration,
        parts,
    };
}

export interface ExamListParams {
    page?: number;
    pageSize?: number;
    type?: string;
    year?: number;
    search?: string;
}

export async function getExamList(params: ExamListParams = {}) {
    const {
        page = 1,
        pageSize = 12,
        type,
        year,
        search,
    } = params;

    const where: Record<string, unknown> = {
        published: true,
    };

    if (type) {
        where.type = type;
    }

    if (year) {
        where.year = year;
    }

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
