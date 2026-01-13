/**
 * Script Import Đề Thi vào Database
 * 
 * Sử dụng: npx tsx scripts/import-exams.ts
 * 
 * Script này sẽ:
 * 1. Đọc tất cả file JSON trong src/server/data/
 * 2. Import vào database với Prisma
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Prisma client with adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface SubQuestion {
    id: string;
    content: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    num: number;
    content: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE_GROUP";
    track: "COMMON" | "COMPUTER_SCIENCE" | "APPLIED_INFORMATICS";
    choices?: string[];
    subQuestions?: SubQuestion[] | null;
    correctAnswer?: string | null;
}

interface ExamPart {
    id: number;
    title: string;
    questions: Question[];
}

interface ExamData {
    title: string;
    slug: string;
    year: number;
    source: string;
    type: "HSG" | "STANDARD" | "MOCK";
    duration: number;
    parts: ExamPart[];
}

async function importExam(examData: ExamData) {
    console.log(`\n📄 Importing: ${examData.title}`);

    try {
        // Check if exam already exists
        const existing = await prisma.exam.findUnique({
            where: { slug: examData.slug },
        });

        if (existing) {
            console.log(`   ⏭️  Skipping (already exists)`);
            return { success: true, skipped: true };
        }

        // Create exam with parts JSON
        const exam = await prisma.exam.create({
            data: {
                title: examData.title,
                slug: examData.slug,
                year: examData.year,
                source: examData.source,
                type: examData.type,
                duration: examData.duration,
                subject: "Tin học 12",
                parts: examData.parts as unknown as Parameters<typeof prisma.exam.create>[0]["data"]["parts"],
                published: true,
            },
        });

        console.log(`   ✅ Created exam: ${exam.id}`);

        // Process each part
        for (const part of examData.parts) {
            console.log(`   📋 Part ${part.id}: ${part.questions.length} questions`);

            for (const q of part.questions) {
                // Create question
                const question = await prisma.question.create({
                    data: {
                        content: q.content,
                        type: q.type,
                        track: q.track,
                        choices: q.choices || [],
                        correctAnswer: q.correctAnswer || null,
                    },
                });

                // Create sub-questions if TRUE_FALSE_GROUP
                if (q.type === "TRUE_FALSE_GROUP" && q.subQuestions) {
                    for (let i = 0; i < q.subQuestions.length; i++) {
                        const sq = q.subQuestions[i];
                        await prisma.subQuestion.create({
                            data: {
                                questionId: question.id,
                                content: sq.content,
                                isCorrect: sq.isCorrect,
                                order: i + 1,
                            },
                        });
                    }
                }

                // Link question to exam
                await prisma.examQuestion.create({
                    data: {
                        examId: exam.id,
                        questionId: question.id,
                        partNumber: part.id,
                        order: q.num,
                        points: calculatePoints(part.id, q.type, examData.parts.length),
                    },
                });
            }
        }

        const totalQuestions = examData.parts.reduce((sum, p) => sum + p.questions.length, 0);
        console.log(`   ✅ Imported ${totalQuestions} questions`);

        return { success: true, skipped: false };
    } catch (error) {
        console.error(`   ❌ Error:`, error);
        return { success: false, error };
    }
}

function calculatePoints(partNumber: number, type: string, totalParts: number): number {
    // Simple point calculation - can be customized
    if (type === "TRUE_FALSE_GROUP") {
        return 1.0; // 1 point for T/F groups
    }
    
    // Part 1 (TNKQ) usually has more questions with less points each
    if (partNumber === 1) {
        return 0.25; // 0.25 points per multiple choice
    }
    
    return 0.5; // Default 0.5 points
}

async function main() {
    console.log("🚀 Starting Exam Import Script\n");
    console.log("=".repeat(50));

    const dataDir = path.join(process.cwd(), "src", "server", "data");
    
    // Get all JSON files
    const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));
    
    console.log(`📁 Found ${files.length} JSON file(s) in ${dataDir}\n`);

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of files) {
        const filePath = path.join(dataDir, file);
        
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const examData: ExamData = JSON.parse(content);
            
            const result = await importExam(examData);
            
            if (result.success) {
                if (result.skipped) {
                    skipped++;
                } else {
                    imported++;
                }
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ Failed to read/parse ${file}:`, error);
            failed++;
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Import Summary:");
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log("=".repeat(50));
}

main()
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
