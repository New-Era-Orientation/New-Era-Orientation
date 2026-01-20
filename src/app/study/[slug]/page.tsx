import { TopicDetail } from "@/client/components/study/TopicDetail";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

async function getTopicBySlug(slug: string) {
    // Find topic across all chapters
    const topic = await db.topic.findFirst({
        where: { slug },
        include: {
            chapter: {
                include: {
                    subject: true,
                    topics: {
                        orderBy: { order: "asc" },
                        select: { id: true, name: true, slug: true, order: true },
                    },
                },
            },
        },
    });

    return topic;
}

async function getUserProgress(userId: string, topicId: string) {
    const progress = await db.userProgress.findUnique({
        where: {
            userId_topicId: {
                userId,
                topicId,
            },
        },
    });
    return progress;
}

export default async function StudyTopicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const session = await auth();
    const topicData = await getTopicBySlug(slug);

    if (!topicData) {
        return notFound();
    }

    // Get user progress if authenticated
    let userProgress: any = null;
    if (session?.user?.id) {
        const progress = await getUserProgress(session.user.id, topicData.id);
        if (progress) {
            userProgress = {
                completed: progress.completed,
                timeSpent: progress.timeSpent,
                lastAccess: progress.lastAccess.toISOString(),
            };
        }
    }

    // Transform to match component props
    const topic = {
        id: topicData.chapter.id,
        name: topicData.chapter.name,
        slug: topicData.slug,
        chapters: topicData.chapter.topics.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
        })),
    };

    const chapter = {
        id: topicData.id,
        name: topicData.name,
        slug: topicData.slug,
        content: topicData.content,
        duration: topicData.duration,
        pdfUrl: null, // TODO: Add pdfUrl to Topic model
        exercises: null, // TODO: Add exercises relation
    };

    return <TopicDetail topic={topic} chapter={chapter} userProgress={userProgress} />;
}
