
import { prisma } from "../src/server/db/db";
import fs from "fs";
import path from "path";

// const prisma = new PrismaClient(); // Removed


const LEGACY_PATH = "C:\\Users\\eleven\\triet-utt";

const SUBJECTS_CONFIG = [
    {
        slug: "triet-hoc-mac-lenin",
        name: "Triết học Mác-Lênin",
        code: "TRIET",
        schoolCode: "UTT",
        schoolName: "Trường Đại học Công nghệ Giao thông Vận tải",
        provinceName: "Hà Nội",
        dir: "subjects/utt/triet-mac-lenin/exam",
    },
    {
        slug: "kinh-te-hoc",
        name: "Kinh tế học",
        code: "KTH",
        schoolCode: "UTT",
        schoolName: "Trường Đại học Công nghệ Giao thông Vận tải",
        provinceName: "Hà Nội",
        dir: "subjects/utt/kth/exam",
    },
    {
        slug: "logistics",
        name: "Logistics",
        code: "LOG",
        schoolCode: "UTT",
        schoolName: "Trường Đại học Công nghệ Giao thông Vận tải",
        provinceName: "Hà Nội",
        dir: "subjects/utt/log/exam",
    },
    {
        slug: "phap-luat-dai-cuong",
        name: "Pháp luật đại cương",
        code: "PLDC",
        schoolCode: "PTIT",
        schoolName: "Học viện Công nghệ Bưu chính Viễn thông",
        provinceName: "Hà Nội",
        dir: "subjects/ptit/phap-luat-dai-cuong/exam",
    },
];

async function main() {
    console.log("🚀 Starting legacy data migration...");

    // 1. Get Multiple Choice Type
    const mcType = await prisma.questionType.findUnique({
        where: { id: "MULTIPLE_CHOICE" },
    });

    if (!mcType) {
        throw new Error("Question Type 'multiple-choice' not found. Please run seed-question-types.ts first.");
    }

    // 2. Ensure Province (Hanoi default for now)
    // Assuming Hanoi has ID 1 or we find by name
    let hanoi = await prisma.province.findFirst({
        where: { name: { contains: "Hà Nội" } },
    });

    if (!hanoi) {
        // Fallback or create? Better to rely on existing seed, but let's create if missing for safety
        hanoi = await prisma.province.create({
            data: { id: 1, name: "Thành phố Hà Nội" }
        })
    }

    for (const config of SUBJECTS_CONFIG) {
        console.log(`\n📦 Processing ${config.name}...`);

        // 3. Ensure School
        const school = await prisma.school.upsert({
            where: {
                provinceId_name: {
                    provinceId: hanoi.id,
                    name: config.schoolName,
                },
            },
            update: {},
            create: {
                name: config.schoolName,
                code: config.schoolCode,
                provinceId: hanoi.id,
            },
        });

        // 4. Ensure Subject
        const subject = await prisma.subject.upsert({
            where: { slug: config.slug },
            update: {},
            create: {
                name: config.name,
                slug: config.slug,
                code: config.code,
                description: `Ngân hàng câu hỏi môn ${config.name}`,
            },
        });

        // 5. Read Data Files
        const subjectDir = path.join(LEGACY_PATH, config.dir);
        if (!fs.existsSync(subjectDir)) {
            console.warn(`⚠️ Directory not found: ${subjectDir}`);
            continue;
        }

        const files = fs.readdirSync(subjectDir).filter(f => f.endsWith(".json"));

        for (const file of files) {
            console.log(`   📄 Reading ${file}...`);
            const content = fs.readFileSync(path.join(subjectDir, file), "utf-8");
            const data = JSON.parse(content);

            // 6. Create Chapter
            // Determine chapter title and slug
            let chapterTitle = data.title || `Chương ${data.chapter}`;
            const chapterSlug = `${config.slug}-chapter-${data.chapter || file.replace('.json', '')}`;
            // Basic slugify

            const chapter = await prisma.chapter.upsert({
                where: {
                    subjectId_slug: {
                        subjectId: subject.id,
                        slug: chapterSlug,
                    }
                },
                update: { name: chapterTitle },
                create: {
                    name: chapterTitle,
                    slug: chapterSlug,
                    subjectId: subject.id,
                    order: typeof data.chapter === 'number' ? data.chapter : parseInt(file) || 1,
                    description: `Chương ${data.chapter}`
                }
            });

            // 7. Process Questions
            let questionCount = 0;
            for (const q of data.questions) {
                // Skip if question exists (dedup by content hash? or just content)
                // For simplicity, we check if a question with same content exists in this chapter
                // But content can be long. Let's just create key based on content substring + chapter

                const existingQ = await prisma.question.findFirst({
                    where: {
                        chapterId: chapter.id,
                        content: q.question
                    }
                });

                if (existingQ) continue;

                await prisma.question.create({
                    data: {
                        content: q.question,
                        typeId: mcType.id,
                        difficulty: "MEDIUM",
                        subjectId: subject.id,
                        chapterId: chapter.id,
                        explanation: q.explain,
                        isShuffleable: q.noShuffle !== true, // Legacy logic reversed? "noShuffle": true -> isShuffleable: false
                        options: {
                            create: q.options.map((opt: any) => ({
                                content: opt.content,
                                isCorrect: opt.id === q.answer,
                                order: opt.id.charCodeAt(0) - 65, // A->0, B->1
                            })),
                        },
                    },
                });
                questionCount++;
            }
            console.log(`     ✅ Imported ${questionCount} questions to ${chapterTitle}`);
        }
    }

    console.log("\n🎉 Migration completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
