/**
 * Script gán câu hỏi vào topics
 * 
 * Logic:
 * 1. Với các môn có practiceMode = CHAPTER (Logistics, PLDC): 
 *    Gán tất cả câu hỏi của chapter vào topic đầu tiên của chapter đó
 * 
 * 2. Với các môn có practiceMode = TOPIC hoặc QUESTION_IDS:
 *    Gán câu hỏi dựa trên order trong chapter (chia đều)
 * 
 * Chạy: npx tsx scripts/assign-questions-to-topics.ts
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
    console.log("=== Gán câu hỏi vào Topics ===\n");

    // Lấy tất cả subjects với chapters và topics
    const subjects = await prisma.subject.findMany({
        include: {
            chapters: {
                include: {
                    topics: {
                        orderBy: { order: "asc" }
                    },
                    questions: {
                        where: { topicId: null },
                        orderBy: { createdAt: "asc" }
                    }
                },
                orderBy: { order: "asc" }
            }
        },
        orderBy: { order: "asc" }
    });

    for (const subject of subjects) {
        console.log(`\n📚 ${subject.name} (${subject.practiceMode})`);

        for (const chapter of subject.chapters) {
            const questionsWithoutTopic = chapter.questions;
            const topics = chapter.topics;

            if (questionsWithoutTopic.length === 0) {
                console.log(`   📖 ${chapter.name}: Không có câu hỏi cần gán`);
                continue;
            }

            if (topics.length === 0) {
                console.log(`   📖 ${chapter.name}: ⚠️  Không có topics! ${questionsWithoutTopic.length} câu chưa gán`);
                continue;
            }

            console.log(`   📖 ${chapter.name}: ${questionsWithoutTopic.length} câu → ${topics.length} topics`);

            if (subject.practiceMode === "CHAPTER") {
                // Gán tất cả câu hỏi vào topic đầu tiên
                const targetTopic = topics[0];
                const questionIds = questionsWithoutTopic.map(q => q.id);

                await prisma.question.updateMany({
                    where: { id: { in: questionIds } },
                    data: { topicId: targetTopic.id }
                });

                console.log(`      → Gán ${questionIds.length} câu vào "${targetTopic.name}"`);

            } else {
                // Chia đều câu hỏi vào các topics
                const questionsPerTopic = Math.ceil(questionsWithoutTopic.length / topics.length);

                for (let i = 0; i < topics.length; i++) {
                    const topic = topics[i];
                    const startIdx = i * questionsPerTopic;
                    const endIdx = Math.min(startIdx + questionsPerTopic, questionsWithoutTopic.length);
                    const topicQuestions = questionsWithoutTopic.slice(startIdx, endIdx);

                    if (topicQuestions.length === 0) continue;

                    const questionIds = topicQuestions.map(q => q.id);

                    await prisma.question.updateMany({
                        where: { id: { in: questionIds } },
                        data: { topicId: topic.id }
                    });

                    console.log(`      → Gán ${questionIds.length} câu vào "${topic.name}"`);
                }
            }
        }
    }

    // Xử lý câu hỏi không có chapter (như Kinh tế học)
    console.log("\n=== Xử lý câu hỏi không có chapter ===");
    
    const questionsWithoutChapter = await prisma.question.findMany({
        where: { 
            topicId: null,
            chapterId: null 
        },
        include: {
            subject: true
        }
    });

    if (questionsWithoutChapter.length > 0) {
        // Group by subject
        const bySubject: Record<string, typeof questionsWithoutChapter> = {};
        for (const q of questionsWithoutChapter) {
            const subjectId = q.subjectId;
            if (!bySubject[subjectId]) {
                bySubject[subjectId] = [];
            }
            bySubject[subjectId].push(q);
        }

        for (const [subjectId, questions] of Object.entries(bySubject)) {
            const subject = questions[0].subject;
            console.log(`\n📚 ${subject.name}: ${questions.length} câu không có chapter`);

            // Lấy tất cả topics của subject này
            const topics = await prisma.topic.findMany({
                where: {
                    chapter: {
                        subjectId: subjectId
                    }
                },
                include: {
                    chapter: true
                },
                orderBy: [
                    { chapter: { order: "asc" } },
                    { order: "asc" }
                ]
            });

            if (topics.length === 0) {
                console.log(`   ⚠️  Không có topics để gán!`);
                continue;
            }

            // Chia đều vào các topics
            const questionsPerTopic = Math.ceil(questions.length / topics.length);

            for (let i = 0; i < topics.length; i++) {
                const topic = topics[i];
                const startIdx = i * questionsPerTopic;
                const endIdx = Math.min(startIdx + questionsPerTopic, questions.length);
                const topicQuestions = questions.slice(startIdx, endIdx);

                if (topicQuestions.length === 0) continue;

                const questionIds = topicQuestions.map(q => q.id);

                await prisma.question.updateMany({
                    where: { id: { in: questionIds } },
                    data: { 
                        topicId: topic.id,
                        chapterId: topic.chapter.id
                    }
                });

                console.log(`   → Gán ${questionIds.length} câu vào "${topic.name}" (${topic.chapter.name})`);
            }
        }
    }

    console.log("\n✅ Hoàn thành gán câu hỏi vào topics!");
}

main()
    .catch(console.error)
    .finally(() => {
        pool.end();
        process.exit(0);
    });
