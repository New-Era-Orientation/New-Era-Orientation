
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
    console.log("🔄 Reorganizing Subjects...");

    // 0. Ensure Province
    let province = await prisma.province.findFirst({ where: { name: "Hà Nội" } });
    if (!province) {
        // Find max ID
        const maxProvince = await prisma.province.findFirst({ orderBy: { id: "desc" } });
        const newId = (maxProvince?.id || 0) + 1;

        province = await prisma.province.create({
            data: { id: newId, name: "Hà Nội" }
        });
        console.log(`✅ Created Province: Hà Nội (ID: ${newId})`);
    }

    // 1. Ensure Schools
    let thptSchool = await prisma.school.findFirst({ where: { code: "THPT" } });
    if (!thptSchool) {
        thptSchool = await prisma.school.create({
            data: {
                name: "Trung học Phổ thông",
                code: "THPT",
                provinceId: province.id
            }
        });
        console.log("✅ Created School: THPT");
    }

    let uttSchool = await prisma.school.findFirst({ where: { code: "UTT" } });
    if (!uttSchool) {
        uttSchool = await prisma.school.create({
            data: {
                name: "Đại học Công nghệ GTVT",
                code: "UTT",
                provinceId: province.id
            }
        });
        console.log("✅ Created School: UTT");
    }

    // 2. Create Tin Hoc THPT (Pinned Order 1)
    await prisma.subject.upsert({
        where: { slug: "tin-hoc-thpt" },
        update: {
            name: "Tin học THPT",
            order: 1,
            schoolId: thptSchool.id,
            description: "Môn Tin học cấp THPT (Lớp 10, 11, 12)",
            icon: "💻"
        },
        create: {
            name: "Tin học THPT",
            slug: "tin-hoc-thpt",
            order: 1,
            schoolId: thptSchool.id,
            description: "Môn Tin học cấp THPT (Lớp 10, 11, 12)",
            icon: "💻"
        }
    });
    console.log("✅ Upserted Subject: Tin học THPT (Order 1)");

    // 3. Update Existing Subjects to UTT and Reorder
    const uttSubjects = [
        "triet-hoc-mac-lenin",
        "kinh-te-hoc",
        "phap-luat-dai-cuong",
        "dai-cuong-logistics-va-chuoi-cung-ung"
    ];

    let orderCounter = 2;
    for (const slug of uttSubjects) {
        const s = await prisma.subject.findUnique({ where: { slug } });
        if (s) {
            await prisma.subject.update({
                where: { slug },
                data: {
                    schoolId: uttSchool.id,
                    order: orderCounter++
                }
            });
            console.log(`Updated ${s.name} -> Order ${orderCounter - 1}, School UTT`);
        }
    }

    // Assign any other subjects to UTT or Generic?
    // Current DB has only these.
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
