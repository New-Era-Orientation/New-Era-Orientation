// Re-export prisma from db.ts which has the adapter configured
export { prisma, prisma as db } from "./db";
