// Script to set user role to ADMIN
import { prisma } from "../src/server/db/db";

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
        users.forEach(u => {
            console.log(`  - ${u.email} (${u.name || "No name"}) - Role: ${u.role}`);
        });
        
        process.exit(1);
    }
    
    const user = await prisma.user.findUnique({
        where: { email },
    });
    
    if (!user) {
        console.error(`User with email "${email}" not found`);
        process.exit(1);
    }
    
    const updated = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
    });
    
    console.log(`✅ User ${updated.email} is now ADMIN`);
}

setAdmin()
    .catch(console.error)
    .finally(() => process.exit(0));
