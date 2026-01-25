import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const subjects = await prisma.subject.findMany({
    select: {
      slug: true,
      name: true,
      practiceMode: true,
    },
    orderBy: { name: "asc" },
  });

  console.log("\n=== Practice Mode Configuration ===\n");
  console.table(subjects);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
