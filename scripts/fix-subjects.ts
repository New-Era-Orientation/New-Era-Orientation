
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🛠️ Fixing subjects...");

    // 1. Get/Create Schools

    // UTT
    let utt = await prisma.school.findFirst({
        where: { code: "UTT" }
    });
    if (!utt) {
        console.log("Creating UTT school...");
        const hanoi = await prisma.province.findFirst({ where: { name: { contains: "Hà Nội" } } });
        utt = await prisma.school.create({
            data: {
                name: "Đại học Công nghệ Giao thông Vận tải",
                code: "UTT",
                provinceId: hanoi?.id,
            }
        });
    }

    // PTIT
    let ptit = await prisma.school.findFirst({
        where: { code: "PTIT" }
    });
    if (!ptit) {
        console.log("Creating PTIT school...");
        const hanoi = await prisma.province.findFirst({ where: { name: { contains: "Hà Nội" } } });
        ptit = await prisma.school.create({
            data: {
                name: "Học viện Công nghệ Bưu chính Viễn thông",
                code: "PTIT",
                provinceId: hanoi?.id,
            }
        });
    }

    // 2. Upsert Subjects

    // Logistics -> UTT
    await prisma.subject.upsert({
        where: { slug: "logistics" },
        update: { schoolId: utt.id },
        create: {
            name: "Logistics",
            slug: "logistics",
            description: "Logistics và Quản lý chuỗi cung ứng",
            icon: "🚛",
            order: 3,
            schoolId: utt.id,
        }
    });
    console.log("✅ Fixed/Created: Logistics -> UTT");

    // Phap luat dai cuong -> PTIT
    await prisma.subject.upsert({
        where: { slug: "phap-luat-dai-cuong" },
        update: { schoolId: ptit.id },
        create: {
            name: "Pháp luật đại cương",
            slug: "phap-luat-dai-cuong",
            description: "Pháp luật đại cương",
            icon: "⚖️",
            order: 4,
            schoolId: ptit.id,
        }
    });
    console.log("✅ Fixed/Created: Pháp luật đại cương -> PTIT");

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
