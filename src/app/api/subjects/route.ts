import { NextResponse } from "next/server";
import { db } from "@/server/db";

// GET /api/subjects - Lấy danh sách môn học
export async function GET() {
    try {
        const subjects = await db.subject.findMany({
            include: {
                chapters: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        order: true,
                        _count: {
                            select: { topics: true },
                        },
                    },
                    orderBy: { order: "asc" },
                },
            },
            orderBy: { order: "asc" },
        });

        const data = subjects.map((subject) => ({
            id: subject.id,
            name: subject.name,
            slug: subject.slug,
            description: subject.description,
            icon: subject.icon,
            chapters: subject.chapters.map((chapter) => ({
                id: chapter.id,
                name: chapter.name,
                slug: chapter.slug,
                description: chapter.description,
                topicCount: chapter._count.topics,
            })),
        }));

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch subjects" },
            { status: 500 }
        );
    }
}
