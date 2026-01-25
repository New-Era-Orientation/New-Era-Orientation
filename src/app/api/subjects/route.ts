import { NextResponse } from "next/server";
import { db } from "@/server/db";

// GET /api/subjects - Lấy danh sách môn học
export async function GET() {
    try {
        const subjects = await db.subject.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                icon: true,
                practiceMode: true,
                school: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                chapters: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        order: true,
                        topics: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                order: true,
                                metadata: true,
                                _count: {
                                    select: { questions: true }
                                }
                            },
                            orderBy: { order: "asc" },
                        },
                        _count: {
                            select: { topics: true, questions: true },
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
            practiceMode: subject.practiceMode,
            school: subject.school,
            chapters: subject.chapters.map((chapter) => ({
                id: chapter.id,
                name: chapter.name,
                slug: chapter.slug,
                description: chapter.description,
                topicCount: chapter._count.topics,
                questionCount: chapter._count.questions,
                topics: chapter.topics.map(topic => ({
                    id: topic.id,
                    name: topic.name,
                    slug: topic.slug,
                    order: topic.order,
                    questionCount: topic._count.questions,
                    metadata: topic.metadata as Record<string, unknown> | null,
                }))
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
