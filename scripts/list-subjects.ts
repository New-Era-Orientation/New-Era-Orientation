
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    const subjects = await db.subject.findMany({
        include: { school: true }
    });
    console.log("Current Subjects:");
    subjects.forEach(s => {
        console.log(`- [${s.id}] ${s.name} (${s.slug}) | School: ${s.school?.name || "None"}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
