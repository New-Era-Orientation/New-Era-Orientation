import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
    const session = await auth();
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get all subjects with their chapters and topics
        const subjects = await db.subject.findMany({
            include: {
                chapters: {
                    orderBy: { order: "asc" },
                    include: {
                        topics: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
            orderBy: { order: "asc" },
        });

        // Get user's study progress
        const userProgress = await db.userProgress.findMany({
            where: {
                userId: session.user.id,
            },
        });

        // Create a map for quick lookup
        const progressMap = new Map(
            userProgress.map(p => [p.topicId, p])
        );

        // Format response with progress data
        const subjectsWithProgress = subjects.map(subject => {
            let subjectCompletedTopics = 0;
            let subjectTotalTopics = 0;

            const chapters = subject.chapters.map(chapter => {
                let chapterCompletedTopics = 0;
                const totalTopics = chapter.topics.length;
                subjectTotalTopics += totalTopics;

                const topics = chapter.topics.map(topic => {
                    const progress = progressMap.get(topic.id);
                    const completed = progress?.completed || false;
                    const timeSpent = progress?.timeSpent || 0;

                    if (completed) {
                        chapterCompletedTopics++;
                        subjectCompletedTopics++;
                    }

                    return {
                        id: topic.id,
                        slug: topic.slug,
                        title: topic.name,
                        completed,
                        timeSpent,
                    };
                });

                return {
                    id: chapter.id,
                    slug: chapter.slug,
                    name: chapter.name,
                    description: chapter.description || "",
                    totalTopics,
                    completedTopics: chapterCompletedTopics,
                    progress: totalTopics > 0 ? Math.round((chapterCompletedTopics / totalTopics) * 100) : 0,
                    topics,
                };
            });

            const completedChapters = chapters.filter(c => c.progress === 100).length;

            return {
                id: subject.id,
                slug: subject.slug,
                name: subject.name,
                icon: subject.icon || "📚",
                totalChapters: chapters.length,
                completedChapters,
                totalTopics: subjectTotalTopics,
                completedTopics: subjectCompletedTopics,
                overallProgress: subjectTotalTopics > 0 
                    ? Math.round((subjectCompletedTopics / subjectTotalTopics) * 100) 
                    : 0,
                chapters,
            };
        });

        return NextResponse.json({
            subjects: subjectsWithProgress,
        });
    } catch (error) {
        console.error("Failed to fetch study progress:", error);
        return NextResponse.json({ error: "Failed to fetch study progress" }, { status: 500 });
    }
}
