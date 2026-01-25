import { NextResponse } from "next/server";
import { db } from "@/server/db";

// GET /api/exams - Lấy danh sách đề thi
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = searchParams.get("year");
        const type = searchParams.get("type");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Record<string, unknown> = {
            published: true,
        };

        if (year) {
            where.year = parseInt(year);
        }

        if (type) {
            where.type = type;
        }

        const subjectId = searchParams.get("subjectId");
        if (subjectId) {
            where.subjectId = subjectId;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { source: { contains: search, mode: "insensitive" } },
            ];
        }

        // Query database
        const [exams, total] = await Promise.all([
            db.exam.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    year: true,
                    source: true,
                    type: true,
                    duration: true,
                    createdAt: true,
                    _count: {
                        select: { questions: true, attempts: true },
                    },
                },
                orderBy: [{ year: "desc" }, { title: "asc" }],
                skip,
                take: limit,
            }),
            db.exam.count({ where }),
        ]);

        // Transform response
        const data = exams.map((exam) => ({
            id: exam.id,
            title: exam.title,
            slug: exam.slug,
            description: exam.description,
            year: exam.year,
            source: exam.source,
            type: exam.type,
            duration: exam.duration,
            questionCount: exam._count.questions,
            attemptCount: exam._count.attempts,
            createdAt: exam.createdAt,
        }));

        return NextResponse.json({
            exams: data,
            pagination: {
                page,
                pageSize: limit,
                totalCount: total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching exams:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch exams" },
            { status: 500 }
        );
    }
}
