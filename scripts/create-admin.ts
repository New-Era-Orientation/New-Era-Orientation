import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  const email = "admin@neo-edu.vn";
  const name = "Neo";
  const password = "Neothpt123";
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  
  console.log("✅ Admin user created/updated:");
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
