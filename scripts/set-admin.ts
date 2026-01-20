// Script to set user role to ADMIN
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function setAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.log("Usage: npx tsx scripts/set-admin.ts <email>");
        console.log("\nExample: npx tsx scripts/set-admin.ts admin@example.com");

        // List all users
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true },
            take: 10,
        });

        console.log("\nExisting users:");
        users.forEach((u: any) => {
            console.log(`  - ${u.email} (${u.name || "No name"}) - Role: ${u.role}`);
        });

        await prisma.$disconnect();
        process.exit(1);
    }

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error(`User with email "${email}" not found`);
        await prisma.$disconnect();
        process.exit(1);
    }

    const updated = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
    });

    console.log(`✅ User ${updated.email} is now ADMIN`);
    await prisma.$disconnect();
}

setAdmin().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});

setAdmin()
    .catch(console.error)
    .finally(() => process.exit(0));
