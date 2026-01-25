/**
 * Script kiểm tra câu hỏi chưa gán topic
 * Chạy: npx tsx scripts/check-questions.ts
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("=== Kiểm tra câu hỏi chưa gán topic ===\n");

    // Câu hỏi chưa gán topic, group by subject và chapter
    const questionsWithoutTopic = await prisma.question.findMany({
        where: { topicId: null },
        select: {
            id: true,
            content: true,
            subject: {
                select: { id: true, name: true, slug: true }
            },
            chapter: {
                select: { id: true, name: true, slug: true }
            }
        }
    });

    // Group by subject
    const bySubject: Record<string, any[]> = {};
    for (const q of questionsWithoutTopic) {
        const subjectName = q.subject?.name || "Unknown";
        if (!bySubject[subjectName]) {
            bySubject[subjectName] = [];
        }
        bySubject[subjectName].push(q);
    }

    for (const [subjectName, questions] of Object.entries(bySubject)) {
        console.log(`\n📚 ${subjectName}: ${questions.length} câu chưa gán topic`);
        
        // Group by chapter
        const byChapter: Record<string, any[]> = {};
        for (const q of questions) {
            const chapterName = q.chapter?.name || "No Chapter";
            if (!byChapter[chapterName]) {
                byChapter[chapterName] = [];
            }
            byChapter[chapterName].push(q);
        }

        for (const [chapterName, chapterQuestions] of Object.entries(byChapter)) {
            console.log(`   📖 ${chapterName}: ${chapterQuestions.length} câu`);
        }
    }

    // Kiểm tra các subjects có chapters nhưng không có topics
    console.log("\n=== Subjects cần tạo topics ===");
    const subjectsWithChapters = await prisma.subject.findMany({
        include: {
            chapters: {
                include: {
                    _count: {
                        select: { topics: true, questions: true }
                    }
                }
            }
        }
    });

    for (const subject of subjectsWithChapters) {
        const chaptersWithoutTopics = subject.chapters.filter(c => c._count.topics === 0 && c._count.questions > 0);
        if (chaptersWithoutTopics.length > 0) {
            console.log(`\n📚 ${subject.name}:`);
            for (const chapter of chaptersWithoutTopics) {
                console.log(`   📖 ${chapter.name}: ${chapter._count.questions} câu, 0 topics`);
            }
        }
    }
}

main()
    .catch(console.error)
    .finally(() => {
        pool.end();
        process.exit(0);
    });
