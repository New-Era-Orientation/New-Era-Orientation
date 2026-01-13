import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// GET /api/topics/[slug] - Lấy chi tiết topic
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        const { slug } = await params;

        const topic = await db.topic.findFirst({
            where: { slug },
            include: {
                chapter: {
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
                                order: true,
                            },
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        });

        if (!topic) {
            return NextResponse.json(
                { success: false, error: "Topic not found" },
                { status: 404 }
            );
        }

        // Get user progress if authenticated
        let userProgress = null;
        if (session?.user?.id) {
            userProgress = await db.userProgress.findUnique({
                where: {
                    userId_topicId: {
                        userId: session.user.id,
                        topicId: topic.id,
                    },
                },
            });
        }

        // Find prev/next topics
        const allTopics = topic.chapter.topics;
        const currentIndex = allTopics.findIndex((t) => t.id === topic.id);
        const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
        const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

        return NextResponse.json({
            success: true,
            data: {
                id: topic.id,
                name: topic.name,
                slug: topic.slug,
                content: topic.content,
                videoUrl: topic.videoUrl,
                duration: topic.duration,
                chapter: {
                    id: topic.chapter.id,
                    name: topic.chapter.name,
                    slug: topic.chapter.slug,
                },
                subject: topic.chapter.subject,
                navigation: {
                    prev: prevTopic ? { name: prevTopic.name, slug: prevTopic.slug } : null,
                    next: nextTopic ? { name: nextTopic.name, slug: nextTopic.slug } : null,
                },
                userProgress: userProgress ? {
                    completed: userProgress.completed,
                    timeSpent: userProgress.timeSpent,
                    lastAccess: userProgress.lastAccess,
                } : null,
            },
        });
    } catch (error) {
        console.error("Error fetching topic:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch topic" },
            { status: 500 }
        );
    }
}
