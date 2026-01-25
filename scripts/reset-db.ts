
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
    console.log("🔥 WARNING: This will delete ALL subjects, chapters, topics, exams and questions.");
    console.log("Starting reset in 3 seconds...");
    await new Promise(r => setTimeout(r, 3000));

    // 1. Exam related
    console.log("Deleting ExamAttempts...");
    await prisma.examAttempt.deleteMany({});

    console.log("Deleting ExamQuestions...");
    await prisma.examQuestion.deleteMany({});

    console.log("Deleting ExamStats...");
    await prisma.examStats.deleteMany({});

    console.log("Deleting Exams...");
    await prisma.exam.deleteMany({});

    // 2. Question related
    console.log("Deleting QuestionStats...");
    await prisma.questionStats.deleteMany({});

    console.log("Deleting QuestionOptions...");
    await prisma.questionOption.deleteMany({});

    console.log("Deleting Questions...");
    await prisma.question.deleteMany({});

    console.log("Deleting QuestionGroups...");
    await prisma.questionGroup.deleteMany({});

    // 3. Toipc related
    console.log("Deleting UserProgress...");
    await prisma.userProgress.deleteMany({});

    console.log("Deleting Bookmarks...");
    await prisma.bookmark.deleteMany({});

    console.log("Deleting Topics...");
    await prisma.topic.deleteMany({});

    // 4. Structure
    console.log("Deleting Chapters...");
    await prisma.chapter.deleteMany({});

    console.log("Deleting Subjects...");
    await prisma.subject.deleteMany({});

    console.log("Deleting Schools...");
    await prisma.school.deleteMany({});

    console.log("✅ Database cleared successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
