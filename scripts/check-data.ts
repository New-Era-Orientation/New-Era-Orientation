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
    console.log("📊 Checking database...\n");

    const subjects = await prisma.subject.findMany({
        include: {
            chapters: {
                include: {
                    _count: { select: { topics: true, questions: true } }
                }
            },
            questions: {
                select: { id: true } // to count subject level questions if any
            },
            _count: { select: { questions: true } }
        }
    });

    console.log("SUBJECTS & CHAPTERS:");
    for (const s of subjects) {
        const totalTopics = s.chapters.reduce((sum, c) => sum + c._count.topics, 0);
        console.log(`\n📚 ${s.name} (${s.slug})`);
        console.log(`   Total Questions: ${s._count.questions}`);
        console.log(`   Chapters: ${s.chapters.length}`);
        console.log(`   Topics: ${totalTopics}`);
        for (const c of s.chapters) {
            console.log(`     - ${c.name}: ${c._count.topics} topics, ${c._count.questions} questions`);
        }
    }

    await prisma.$disconnect();
}

main();
