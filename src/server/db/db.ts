import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    
    // Create pool with SSL required for Supabase
    const pool = new Pool({ 
        connectionString,
        ssl: {
            rejectUnauthorized: false // Required for Supabase pooler
        }
    });
    
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
