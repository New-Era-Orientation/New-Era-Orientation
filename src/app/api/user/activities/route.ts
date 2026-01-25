import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/db";

export async function GET() {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            // Return empty array for guest users
            return NextResponse.json([]);
        }

        const userId = session.user.id;

        // Get recent exam attempts
        const examAttempts = await prisma.examAttempt.findMany({
            where: { userId },
            orderBy: { startedAt: "desc" },
            take: 10,
            include: {
                exam: {
                    select: {
                        title: true,
                        slug: true,
                    },
                },
            },
        });

        // Get recent study progress
        const studyProgress = await prisma.userProgress.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            take: 5,
            include: {
                topic: {
                    select: {
                        name: true,
                        slug: true,
                    },
                },
            },
        });

        // Combine and sort activities
        const activities = [
            ...examAttempts.map(attempt => ({
                id: attempt.id,
                title: `Hoàn thành đề thi: ${attempt.exam.title}`,
                type: "exam" as const,
                score: attempt.score,
                createdAt: attempt.startedAt.toISOString(),
                href: `/exam/${attempt.exam.slug}`,
            })),
            ...studyProgress.map(progress => ({
                id: progress.id,
                title: `Học: ${progress.topic?.name || "Chủ đề"}`,
                type: "study" as const,
                createdAt: progress.updatedAt.toISOString(),
                href: `/study/${progress.topic?.slug || ""}`,
            })),
        ]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

        return NextResponse.json(activities);
    } catch (error) {
        console.error("Activities error:", error);
        return NextResponse.json(
            { error: "Failed to fetch activities" },
            { status: 500 }
        );
    }
}
