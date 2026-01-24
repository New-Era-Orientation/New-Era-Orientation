/**
 * Script to import data from triet-utt project into NEO Education
 * Run: npx ts-node scripts/import-triet-utt.ts
 */

import { PrismaClient, DifficultyLevel } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Path to triet-utt project
const TRIET_UTT_PATH = "C:/Users/eleven/triet-utt";

interface SubjectConfig {
    id: string;
    name: string;
    shortName: string;
    icon: string;
    school: string;
    shortSchool: string;
    path: string;
}

interface ChapterConfig {
    id: number;
    name: string;
    file: string;
}

interface SubjectData {
    id: string;
    name: string;
    shortName: string;
    icon: string;
    school: string;
    shortSchool: string;
    examPath: string;
    chapters: ChapterConfig[];
    simulationConfig?: {
        totalQuestions: number;
        timeMinutes: number;
        distribution: { chapter: number; percent: number }[];
    };
}

interface StudyTopic {
    id: number;
    title: string;
    icon: string;
    content: string;
    goals: string[];
    tips: string[];
    keywords: string[];
    chapters: number[];
    questionIds: Record<string, number[]>;
}

interface QuestionOption {
    id: string;
    content: string;
}

interface QuestionData {
    id: number;
    question: string;
    options: QuestionOption[];
    answer: string;
    explain?: string;
    topic?: string;
    noShuffle?: boolean;
}

interface ChapterQuestions {
    title: string;
    chapter?: number;
    total_questions: number;
    questions: QuestionData[];
}

// School mapping by shortSchool code
const SCHOOLS: Record<string, { name: string; provinceId: number }> = {
    UTT: { name: "Đại học Công nghệ GTVT", provinceId: 1 }, // Hà Nội
    PTIT: { name: "Học viện Công nghệ Bưu chính Viễn thông", provinceId: 1 },
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

async function ensureSchool(shortSchool: string, fullName: string): Promise<string> {
    const schoolInfo = SCHOOLS[shortSchool];
    if (!schoolInfo) {
        throw new Error(`Unknown school: ${shortSchool}`);
    }

    let school = await prisma.school.findFirst({
        where: { name: fullName },
    });

    if (!school) {
        school = await prisma.school.create({
            data: {
                name: fullName,
                code: shortSchool,
                provinceId: schoolInfo.provinceId,
            },
        });
        console.log(`✅ Created school: ${fullName}`);
    }

    return school.id;
}

async function ensureQuestionType(): Promise<void> {
    const exists = await prisma.questionType.findUnique({
        where: { id: "MULTIPLE_CHOICE" },
    });

    if (!exists) {
        await prisma.questionType.create({
            data: {
                id: "MULTIPLE_CHOICE",
                name: "Trắc nghiệm",
                description: "Câu hỏi trắc nghiệm với nhiều lựa chọn",
            },
        });
        console.log("✅ Created question type: MULTIPLE_CHOICE");
    }
}

async function importSubject(subjectPath: string, subjectConfig: SubjectConfig): Promise<void> {
    console.log(`\n📚 Importing subject: ${subjectConfig.name}`);

    // Load subject.json
    const subjectDataPath = path.join(TRIET_UTT_PATH, subjectPath, "subject.json");
    if (!fs.existsSync(subjectDataPath)) {
        console.log(`⚠️ subject.json not found at ${subjectDataPath}`);
        return;
    }

    const subjectData: SubjectData = JSON.parse(fs.readFileSync(subjectDataPath, "utf-8"));

    // Ensure school exists
    const schoolId = await ensureSchool(subjectConfig.shortSchool, subjectConfig.school);

    // Create or update subject
    const subjectSlug = slugify(subjectConfig.name);
    let subject = await prisma.subject.findUnique({
        where: { slug: subjectSlug },
    });

    if (!subject) {
        subject = await prisma.subject.create({
            data: {
                name: subjectConfig.name,
                slug: subjectSlug,
                code: subjectConfig.id.toUpperCase(),
                description: `Môn ${subjectConfig.name} - ${subjectConfig.school}`,
                icon: subjectConfig.icon,
                schoolId,
            },
        });
        console.log(`✅ Created subject: ${subjectConfig.name}`);
    } else {
        console.log(`ℹ️ Subject already exists: ${subjectConfig.name}`);
    }

    // Import chapters
    for (let i = 0; i < subjectData.chapters.length; i++) {
        const chapterConfig = subjectData.chapters[i];
        const chapterSlug = `${subjectSlug}-chuong-${chapterConfig.id}`;

        let chapter = await prisma.chapter.findFirst({
            where: { subjectId: subject.id, slug: chapterSlug },
        });

        if (!chapter) {
            chapter = await prisma.chapter.create({
                data: {
                    subjectId: subject.id,
                    name: chapterConfig.name,
                    slug: chapterSlug,
                    description: `Chương ${chapterConfig.id}: ${chapterConfig.name}`,
                    order: chapterConfig.id,
                },
            });
            console.log(`  ✅ Created chapter: ${chapterConfig.name}`);
        }

        // Import questions for this chapter
        const questionsPath = path.join(TRIET_UTT_PATH, subjectPath, subjectData.examPath, chapterConfig.file);
        if (fs.existsSync(questionsPath)) {
            await importChapterQuestions(questionsPath, subject.id, chapter.id);
        }
    }

    // Import study topics
    const studyDataPath = path.join(TRIET_UTT_PATH, subjectPath, "study_data.json");
    if (fs.existsSync(studyDataPath)) {
        await importStudyTopics(studyDataPath, subject.id);
    }
}

async function importChapterQuestions(filePath: string, subjectId: string, chapterId: string): Promise<void> {
    try {
        const data: ChapterQuestions = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        console.log(`    📝 Importing ${data.questions.length} questions from ${path.basename(filePath)}`);

        let imported = 0;
        let skipped = 0;

        for (const q of data.questions) {
            // Check if question already exists (by content hash)
            const existingQuestion = await prisma.question.findFirst({
                where: {
                    subjectId,
                    chapterId,
                    content: { contains: q.question.substring(0, 100) },
                },
            });

            if (existingQuestion) {
                skipped++;
                continue;
            }

            // Determine correct answer index (A=0, B=1, C=2, D=3, E=4, etc.)
            const correctIndex = q.answer.charCodeAt(0) - 65;

            // Create question with options
            await prisma.question.create({
                data: {
                    content: q.question,
                    explanation: q.explain || null,
                    typeId: "MULTIPLE_CHOICE",
                    difficulty: DifficultyLevel.MEDIUM,
                    subjectId,
                    chapterId,
                    isShuffleable: !q.noShuffle,
                    options: {
                        create: q.options.map((opt, idx) => ({
                            label: opt.id,
                            content: opt.content,
                            isCorrect: idx === correctIndex,
                            order: idx,
                        })),
                    },
                },
            });
            imported++;
        }

        console.log(`    ✅ Imported: ${imported}, Skipped: ${skipped}`);
    } catch (error) {
        console.error(`    ❌ Error importing questions from ${filePath}:`, error);
    }
}

async function importStudyTopics(filePath: string, subjectId: string): Promise<void> {
    try {
        const topics: StudyTopic[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        console.log(`  📖 Importing ${topics.length} study topics`);

        // Get chapters for this subject
        const chapters = await prisma.chapter.findMany({
            where: { subjectId },
            orderBy: { order: "asc" },
        });

        if (chapters.length === 0) {
            console.log("  ⚠️ No chapters found, skipping topics");
            return;
        }

        for (const topic of topics) {
            // Determine which chapter this topic belongs to
            const chapterNum = topic.chapters[0] || 1;
            const chapter = chapters.find((c) => c.order === chapterNum) || chapters[0];

            const topicSlug = slugify(topic.title);

            // Check if topic exists
            const existingTopic = await prisma.topic.findFirst({
                where: { chapterId: chapter.id, slug: topicSlug },
            });

            if (existingTopic) {
                continue;
            }

            // Build content with goals and tips
            let content = topic.content;
            if (topic.goals && topic.goals.length > 0) {
                content += `\n\n<h3>🎯 Mục tiêu học tập</h3>\n<ul>${topic.goals.map((g) => `<li>${g}</li>`).join("")}</ul>`;
            }
            if (topic.tips && topic.tips.length > 0) {
                content += `\n\n<h3>💡 Mẹo ghi nhớ</h3>\n<ul>${topic.tips.map((t) => `<li>${t}</li>`).join("")}</ul>`;
            }

            await prisma.topic.create({
                data: {
                    chapterId: chapter.id,
                    name: topic.title,
                    slug: topicSlug,
                    content,
                    metadata: {
                        icon: topic.icon,
                        keywords: topic.keywords,
                        questionIds: topic.questionIds,
                    },
                    order: topic.id,
                },
            });
        }

        console.log(`  ✅ Topics imported successfully`);
    } catch (error) {
        console.error(`  ❌ Error importing study topics:`, error);
    }
}

async function main() {
    console.log("🚀 Starting import from triet-utt...\n");

    // Ensure question type exists
    await ensureQuestionType();

    // Load subjects.json
    const subjectsPath = path.join(TRIET_UTT_PATH, "subjects.json");
    const subjects: SubjectConfig[] = JSON.parse(fs.readFileSync(subjectsPath, "utf-8"));

    console.log(`Found ${subjects.length} subjects to import\n`);

    for (const subject of subjects) {
        await importSubject(subject.path, subject);
    }

    console.log("\n✅ Import completed!");
}

main()
    .catch((e) => {
        console.error("❌ Import failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
