import { TopicDetail } from "@/client/components/study/TopicDetail";
import { notFound } from "next/navigation";
import { db } from "@/server/db";

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

export default async function StudyTopicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const topicData = await getTopicBySlug(slug);

    if (!topicData) {
        return notFound();
    }

    // Transform to match component props
    const topic = {
        id: topicData.chapter.id,
        name: topicData.chapter.name,
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
    };

    return <TopicDetail topic={topic} chapter={chapter} />;
}
