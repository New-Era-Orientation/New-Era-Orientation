
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
    const schools = await prisma.school.findMany();
    const subjects = await prisma.subject.findMany({
        include: { school: true },
        orderBy: { order: 'asc' }
    });

    console.log("🏫 Schools:");
    schools.forEach(s => console.log(`- [${s.id}] ${s.name} (${s.code})`));

    console.log("\n📚 Subjects:");
    subjects.forEach(s => console.log(`- [${s.id}] ${s.name} (Order: ${s.order}) - School: ${s.school?.name || "None"}`));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
