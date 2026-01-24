import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

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

async function main() {
    console.log("🌱 Seeding subjects...");

    // 1. Create UTT School (if not exists)
    const uttProvince = await prisma.province.findFirst({
        where: { name: { contains: "Hà Nội" } },
    });

    let uttSchool = await prisma.school.findFirst({
        where: { name: { contains: "Giao thông Vận tải" } },
    });

    if (!uttSchool && uttProvince) {
        uttSchool = await prisma.school.create({
            data: {
                name: "Đại học Công nghệ Giao thông Vận tải",
                code: "UTT",
                provinceId: uttProvince.id,
            },
        });
        console.log("✅ Created UTT School");
    } else if (uttSchool) {
        console.log("⏭️ UTT School already exists");
    }

    // 2. Create "Tin học THPT" (General Subject, no schoolId)
    const tinHocThpt = await prisma.subject.upsert({
        where: { slug: "tin-hoc-thpt" },
        update: {},
        create: {
            name: "Tin học THPT",
            slug: "tin-hoc-thpt",
            description: "Môn Tin học cấp Trung học Phổ thông",
            icon: "💻",
            order: 0,
            schoolId: null, // General subject
        },
    });
    console.log(`✅ Subject: ${tinHocThpt.name}`);

    // 3. Create "Triết học Mác - Lênin" (UTT Subject)
    if (uttSchool) {
        const trietHoc = await prisma.subject.upsert({
            where: { slug: "triet-hoc-mac-lenin" },
            update: { schoolId: uttSchool.id },
            create: {
                name: "Triết học Mác - Lênin",
                slug: "triet-hoc-mac-lenin",
                description: "Triết học Mác - Lênin (Đại cương)",
                icon: "📚",
                order: 1,
                schoolId: uttSchool.id,
            },
        });
        console.log(`✅ Subject: ${trietHoc.name} (${uttSchool.code})`);

        // 4. Create "Kinh tế Học" (UTT Subject)
        const kinhTeHoc = await prisma.subject.upsert({
            where: { slug: "kinh-te-hoc" },
            update: { schoolId: uttSchool.id },
            create: {
                name: "Kinh tế Học",
                slug: "kinh-te-hoc",
                description: "Kinh tế Học Đại cương",
                icon: "📈",
                order: 2,
                schoolId: uttSchool.id,
            },
        });
        console.log(`✅ Subject: ${kinhTeHoc.name} (${uttSchool.code})`);
    }

    console.log("✨ Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
