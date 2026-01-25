/**
 * Script kiểm tra topics và câu hỏi trong database
 * Chạy: npx tsx scripts/check-topics.ts
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
    console.log("=== Kiểm tra Topics và Câu hỏi ===\n");

    // Lấy tất cả subjects với chapters và topics
    const subjects = await prisma.subject.findMany({
        include: {
            chapters: {
                include: {
                    topics: {
                        include: {
                            _count: {
                                select: { questions: true }
                            }
                        },
                        orderBy: { order: "asc" }
                    }
                },
                orderBy: { order: "asc" }
            }
        },
        orderBy: { order: "asc" }
    });

    for (const subject of subjects) {
        console.log(`\n📚 MÔN: ${subject.name} (${subject.slug})`);
        console.log(`   Practice Mode: ${subject.practiceMode}`);

        let totalTopics = 0;
        let totalQuestions = 0;

        for (const chapter of subject.chapters) {
            console.log(`\n   📖 ${chapter.name}`);
            
            for (const topic of chapter.topics) {
                totalTopics++;
                const qCount = topic._count.questions;
                totalQuestions += qCount;
                
                const metadata = topic.metadata as any;
                const questionIdsCount = metadata?.questionIds 
                    ? Object.values(metadata.questionIds).flat().length 
                    : 0;
                
                console.log(`      - ${topic.name}: ${qCount} câu (DB) | ${questionIdsCount} câu (metadata)`);
            }
        }

        console.log(`\n   📊 Tổng: ${totalTopics} topics, ${totalQuestions} câu hỏi trong DB`);
    }

    // Tổng số câu hỏi
    const totalQuestionsInDB = await prisma.question.count();
    console.log(`\n=== Tổng số câu hỏi trong DB: ${totalQuestionsInDB} ===`);

    // Câu hỏi không có topicId
    const questionsWithoutTopic = await prisma.question.count({
        where: { topicId: null }
    });
    console.log(`=== Câu hỏi chưa gán topic: ${questionsWithoutTopic} ===`);
}

main()
    .catch(console.error)
    .finally(() => {
        pool.end();
        process.exit(0);
    });
