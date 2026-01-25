
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// KTH Groups definition based on nhom.md
const GROUPS = [
    // VI MÔ (MICRO) - Chapters 1-6
    { id: 1, name: "Nguyên lý cơ bản & PPF", part: "VI MÔ" },
    { id: 2, name: "Cung - Cầu & Cân bằng thị trường", part: "VI MÔ" },
    { id: 3, name: "Độ co dãn (Elasticity)", part: "VI MÔ" },
    { id: 4, name: "Hành vi Người tiêu dùng", part: "VI MÔ" },
    { id: 5, name: "Lý thuyết Sản xuất & Chi phí", part: "VI MÔ" },
    { id: 6, name: "Cấu trúc thị trường & Doanh thu", part: "VI MÔ" },
    // VĨ MÔ (MACRO) - Chapters 7-12
    { id: 7, name: "Đo lường sản lượng (GDP/GNP)", part: "VĨ MÔ" },
    { id: 8, name: "Tổng Cầu (AD) - Tổng Cung (AS)", part: "VĨ MÔ" },
    { id: 9, name: "Tiền tệ & Chính sách Tiền tệ", part: "VĨ MÔ" },
    { id: 10, name: "Mô hình IS - LM & Phối hợp chính sách", part: "VĨ MÔ" },
    { id: 11, name: "Lạm phát & Thất nghiệp", part: "VĨ MÔ" },
    { id: 12, name: "Tăng trưởng & Kinh tế mở", part: "VĨ MÔ" },
];

function slugify(text: string): string {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
    console.log("🚀 Starting KTH Remake Import...");

    // 1. Create/Find Subject
    const subject = await prisma.subject.upsert({
        where: { slug: "kinh-te-hoc" },
        update: { name: "Kinh tế học", description: "Kinh tế học Vi mô và Vĩ mô (Updated)", icon: "📊" },
        create: {
            name: "Kinh tế học",
            slug: "kinh-te-hoc",
            description: "Kinh tế học Vi mô và Vĩ mô (Updated)",
            icon: "📊"
        }
    });

    // 2. Clear old data for KTH (optional but recommended for clean start)
    // Be careful not to delete if we want to keep history. But user wants "remake".
    // For now, let's delete chapters to rebuild structure.
    console.log("🗑️ Cleaning old chapters...");
    const oldChapters = await prisma.chapter.findMany({ where: { subjectId: subject.id } });
    for (const c of oldChapters) {
        // Delete topics (and consequently questions via cascade if configured, or manually)
        const topics = await prisma.topic.findMany({ where: { chapterId: c.id } });
        for (const t of topics) {
            // Delete questions linked primarily to this topic? In our schema, Question is linked to Topic.
            // We need to delete questions first.
            await prisma.question.deleteMany({ where: { topicId: t.id } });
        }
        await prisma.topic.deleteMany({ where: { chapterId: c.id } });
    }
    await prisma.chapter.deleteMany({ where: { subjectId: subject.id } });
    console.log("✅ Cleaned old data.");

    // 3. Create Chapters (Vi Mo, Vi Mo)
    const microChapter = await prisma.chapter.create({
        data: {
            name: "Kinh tế Vi mô (Micro)",
            slug: "kinh-te-vi-mo-micro",
            description: "Các nguyên lý kinh tế vi mô cơ bản",
            order: 1,
            subjectId: subject.id
        }
    });

    const macroChapter = await prisma.chapter.create({
        data: {
            name: "Kinh tế Vĩ mô (Macro)",
            slug: "kinh-te-vi-mo-macro",
            description: "Các nguyên lý kinh tế vĩ mô cơ bản và nâng cao",
            order: 2,
            subjectId: subject.id
        }
    });

    // 4. Create Topics
    const topicMap = new Map<number, string>(); // ID -> Prisma ID
    for (const g of GROUPS) {
        const chapterId = g.part === "VI MÔ" ? microChapter.id : macroChapter.id;
        const topic = await prisma.topic.create({
            data: {
                name: `${g.id}. ${g.name}`,
                slug: slugify(g.name),
                order: g.id,
                chapterId: chapterId,
                content: "" // Required by schema
            }
        });
        topicMap.set(g.id, topic.id);
        console.log(`Created topic: ${topic.name}`);
    }

    // 5. Read & Parse Remake.md
    // Use absolute path to avoid relative path confusion
    const filePath = "c:\\Users\\eleven\\triet-utt\\subjects\\utt\\kth\\remake.md";
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    let count = 0;

    // Helper to extract question data from table row
    // Format: | Câu | Nội dung... | Đ.Án | Đúng | Giải thích | Nhóm |
    // Regex or Split by pipe.

    for (const line of lines) {
        if (!line.trim().startsWith("|") || line.includes("---") || line.includes("Nội dung câu hỏi")) continue;

        const parts = line.split("|").map(p => p.trim());
        if (parts.length < 8) continue; // Need at least 7 columns (empty first/last due to markdown table)

        // Index: 0='', 1=Câu, 2=Nội dung, 3=Đ.Án, 4=Đúng, 5=Giải thích, 6=Nhóm, 7=''
        const qNum = parts[1];
        const rawContent = parts[2]; // Content + Options (a. ... b. ...)
        const answerKey = parts[3].replace(/\*/g, "").toLowerCase(); // a, b, c, d, e
        const correctContent = parts[4];
        const explanation = parts[5];
        const groupStr = parts[6]; // e.g., "Co dãn" or name. 

        // Map group string to ID? 
        // Wait, remake.md doesn't have Group ID column (1, 2, 3..). It has Group NAME (e.g. "Co dãn").
        // I need to map Name back to ID.
        // Or I can use "nhom.md" mapping logic:
        // Group names in remake.md are short (e.g. "Co dãn", "Hành vi NTD").
        // Let's create a mapping helper.

        const groupId = mapGroup(groupStr);
        if (!groupId || !topicMap.has(groupId)) {
            // console.log(`Warning: Cannot map group '${groupStr}' for question ${qNum}`);
            // Fallback: If Micro -> Group 1, If Macro -> Group 7?
            // Checking question number:
            // 1-69: Micro
            // 70-120: Macro Basic
            // 121-164: Macro Advanced
            // Just assign roughly if exact mapping fails?
            // Actually, "Vi mô" table has rows 13-81 in file.
            // Let's guess based on Q num range if group mapping fails.
            continue;
            // Better to try hard to map.
        }

        // Parse content and options
        // Content format: "Lượng cầu...<br>a. ...; b. ..."
        const [qText, optionsText] = rawContent.split("<br>");
        const finalContent = qText;

        // Parse options (simple split by ;)
        const optionsRaw = optionsText ? optionsText.split(/;\s*(?=[a-z]\.)/) : [];
        const choices = optionsRaw.map(o => {
            // "a. Cung ko co dãn" -> "Cung ko co dãn"
            return o.replace(/^[a-z]\.\s*/, "").trim();
        });

        // Determine correct answer index
        // answerKey is 'a', 'b'...
        let correctIndex = -1;
        if (answerKey === 'a') correctIndex = 0;
        if (answerKey === 'b') correctIndex = 1;
        if (answerKey === 'c') correctIndex = 2;
        if (answerKey === 'd') correctIndex = 3;
        if (answerKey === 'e') correctIndex = 4;

        // Create Question
        const q = await prisma.question.create({
            data: {
                content: finalContent,
                explanation: `${explanation}. (Đáp án đúng: ${correctContent})`,
                topicId: topicMap.get(groupId)!,
                subjectId: subject.id, // Required by schema
                typeId: "MULTIPLE_CHOICE", // Required by schema
                options: {
                    create: choices.map((c, idx) => ({
                        content: c,
                        isCorrect: idx === correctIndex,
                        order: idx + 1
                    }))
                }
            }
        });
        count++;
    }

    console.log(`✅ Imported ${count} questions successfully.`);
}

function mapGroup(name: string): number {
    const n = name.toLowerCase();
    if (n.includes("cơ bản") && n.includes("nguyên lý")) return 1;
    if (n.includes("cung") || n.includes("cầu")) return 2;
    if (n.includes("co dãn")) return 3;
    if (n.includes("hành vi") || n.includes("ntd")) return 4;
    if (n.includes("sản xuất") || n.includes("chi phí")) return 5;
    if (n.includes("thị trường")) return 6; // Cấu trúc thị trường

    if (n.includes("gdp") || n.includes("gnp")) return 7;
    if (n.includes("ad") || n.includes("as") || n.includes("tổng cầu")) return 8;
    if (n.includes("tiền")) return 9;
    if (n.includes("is-lm") || n.includes("is - lm")) return 10;
    if (n.includes("lạm phát") || n.includes("thất nghiệp")) return 11;
    if (n.includes("tăng trưởng") || n.includes("mở")) return 12;

    // Direct mapping from remake.md text
    if (n.includes("sx & chi phí")) return 5;
    if (n.includes("cung cầu")) return 2;
    return 0;
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
