
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

async function main() {
    console.log("🚀 Generating exams from chapters...");

    const chapters = await prisma.chapter.findMany({
        include: {
            subject: true,
            questions: true,
            topics: {
                include: {
                    questions: true
                }
            }
        }
    });

    for (const chapter of chapters) {
        // Combine direct questions and topic questions
        const directQuestions = chapter.questions || [];
        const topicQuestions = chapter.topics.flatMap(t => t.questions) || [];
        const allQuestions = [...directQuestions, ...topicQuestions];

        // Remove duplicates if any
        const uniqueQuestionsMap = new Map();
        allQuestions.forEach(q => uniqueQuestionsMap.set(q.id, q));
        const questions = Array.from(uniqueQuestionsMap.values());

        if (questions.length === 0) continue;

        const examTitle = `Đề ôn tập ${chapter.name}`;
        const examSlug = `${chapter.subject.slug}-${slugify(chapter.name)}-exam`;

        // Check availability
        const existing = await prisma.exam.findUnique({
            where: { slug: examSlug },
            include: { questions: true }
        });

        if (existing) {
            if (existing.questions.length === 0 && questions.length > 0) {
                console.log(`♻️  Re-populating empty exam: ${examTitle}`);
                await prisma.exam.update({
                    where: { id: existing.id },
                    data: {
                        questions: {
                            create: questions.map((q, idx) => ({
                                questionId: q.id,
                                order: idx + 1,
                                partNumber: 1,
                                points: 10 / questions.length
                            }))
                        }
                    }
                });
            } else {
                console.log(`ℹ️ Exam exists: ${examTitle} (${existing.questions.length} q)`);
            }
            continue;
        }

        console.log(`📝 Creating exam: ${examTitle} (${questions.length} questions)`);

        await prisma.exam.create({
            data: {
                title: examTitle,
                slug: examSlug,
                type: "STANDARD",
                duration: 45, // Default 45 mins
                year: 2025,
                source: "NEO Generator",
                published: true,
                subjectId: chapter.subjectId,
                schoolId: chapter.subject.schoolId,
                questions: {
                    create: questions.map((q, idx) => ({
                        questionId: q.id,
                        order: idx + 1,
                        partNumber: 1,
                        points: 10 / questions.length // Distribute 10 points
                    }))
                }
            }
        });
    }

    console.log("✅ Exams generated successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
