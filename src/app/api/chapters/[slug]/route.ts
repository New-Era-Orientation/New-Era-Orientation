import { NextResponse } from "next/server";
import { db } from "@/server/db";

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// GET /api/chapters/[slug] - Lấy chi tiết chương với các topics
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { slug } = await params;

        const chapter = await db.chapter.findFirst({
            where: { slug },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                topics: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        content: true,
                        videoUrl: true,
                        duration: true,
                        order: true,
                    },
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!chapter) {
            return NextResponse.json(
                { success: false, error: "Chapter not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: chapter.id,
                name: chapter.name,
                slug: chapter.slug,
                description: chapter.description,
                subject: chapter.subject,
                topics: chapter.topics,
            },
        });
    } catch (error) {
        console.error("Error fetching chapter:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch chapter" },
            { status: 500 }
        );
    }
}
