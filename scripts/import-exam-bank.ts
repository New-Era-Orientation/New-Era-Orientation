/**
 * Script Batch Import Đề Thi Tin Học từ Ngân Hàng Đề 2025
 * 
 * Scan thư mục chứa đề thi, tự động parse và import vào database
 * 
 * Sử dụng:
 *   npx tsx scripts/import-exam-bank.ts scan <folder-path>    # Scan và hiển thị danh sách
 *   npx tsx scripts/import-exam-bank.ts import <folder-path>  # Import tất cả
 *   npx tsx scripts/import-exam-bank.ts import <file-path>    # Import 1 file
 */

import { PrismaClient, DifficultyLevel } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as mammoth from "mammoth";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

import {
    readDocxFile,
    extractMetadata,
    parseExamText,
    parseAnswerKey,
    applyAnswerKey,
    toImportJson,
} from "./parse-tin-hoc-exam";

// ========================
// DATABASE SETUP
// ========================

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

// ========================
// TYPE DEFINITIONS
// ========================

interface ExamFile {
    examPath: string;
    answerPath?: string;
    province: string;
    school?: string;
    examCode?: string;
    fileName: string;
    type: "SỞ" | "TRƯỜNG";
}

interface ImportResult {
    success: boolean;
    examPath: string;
    examId?: string;
    slug?: string;
    error?: string;
    questionsImported?: number;
}

// ========================
// PROVINCE MAPPING
// ========================

const PROVINCE_MAP: Record<string, number> = {
    "An Giang": 89,
    "Bắc Giang": 24,
    "Bạc Liêu": 95,
    "Bắc Ninh": 27,
    "Bến Tre": 83,
    "Bình Dương": 74,
    "Bình Phước": 70,
    "Bình Thuận": 60,
    "Cần Thơ": 92,
    "Đà Nẵng": 48,
    "Đăk Lăk": 66,
    "Đắk Lắk": 66,
    "Đăk Nông": 67,
    "Đắk Nông": 67,
    "Đồng Nai": 75,
    "Đồng Tháp": 87,
    "Gia Lai": 64,
    "Hà Nội": 1,
    "Hà Tĩnh": 42,
    "Hải Phòng": 31,
    "Hậu Giang": 93,
    "Hòa Bình": 17,
    "Hồ Chí Minh": 79,
    "Huế": 46,
    "Khánh Hoà": 56,
    "Khánh Hòa": 56,
    "Kiên Giang": 91,
    "Lâm Đồng": 68,
    "Lào Cai": 10,
    "Long An": 80,
    "Nam Định": 36,
    "Nghệ An": 40,
    "Ninh Bình": 37,
    "Quảng Bình": 44,
    "Quảng Nam": 49,
    "Quảng Ninh": 22,
    "Sóc Trăng": 94,
    "Thái Bình": 34,
    "Thái Nguyên": 19,
    "Thanh Hóa": 38,
    "Tiền Giang": 82,
    "Trà Vinh": 84,
    "Tuyên Quang": 8,
    "Vĩnh Long": 86,
    "Vĩnh Phúc": 26,
    "Vũng Tàu": 77,
    "Phú Thọ": 25,
    "Phú Yên": 54,
    "Quảng Ngãi": 51,
    "Bình Định": 52,
};

// ========================
// SCAN FUNCTIONS
// ========================

/**
 * Scan thư mục và tìm tất cả file đề thi
 */
export async function scanExamFolder(folderPath: string): Promise<ExamFile[]> {
    const examFiles: ExamFile[] = [];
    
    if (!fs.existsSync(folderPath)) {
        console.error(`❌ Folder not found: ${folderPath}`);
        return [];
    }
    
    await scanRecursive(folderPath, examFiles);
    
    // Match exam files with answer files
    return matchExamWithAnswers(examFiles);
}

async function scanRecursive(currentPath: string, examFiles: ExamFile[]): Promise<void> {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
            // Skip hidden folders and non-exam folders
            if (!item.startsWith(".") && !item.startsWith("~")) {
                await scanRecursive(itemPath, examFiles);
            }
        } else if (stat.isFile()) {
            // Check if it's a docx/doc file and contains "Tin" (Tin học)
            const ext = path.extname(item).toLowerCase();
            if ((ext === ".docx" || ext === ".doc") && 
                !item.startsWith("~") &&
                !item.includes("TIENG ANH") &&
                !item.includes("KTPL") &&
                !item.includes("hóa") &&
                !item.includes("lý") &&
                !item.includes("toán") &&
                !item.includes("văn")) {
                
                const examFile = createExamFile(itemPath);
                if (examFile) {
                    examFiles.push(examFile);
                }
            }
        }
    }
}

function createExamFile(filePath: string): ExamFile | null {
    const fileName = path.basename(filePath);
    const dirPath = path.dirname(filePath);
    
    // Determine type (Sở or Trường)
    const isSo = dirPath.includes("ĐỀ CÁC SỞ") || dirPath.toUpperCase().includes("SỞ");
    const type = isSo ? "SỞ" : "TRƯỜNG";
    
    // Extract province
    let province = "Unknown";
    for (const [name, _] of Object.entries(PROVINCE_MAP)) {
        if (dirPath.includes(name) || fileName.includes(name)) {
            province = name;
            break;
        }
    }
    
    // Extract exam code from filename
    const codeMatch = fileName.match(/m[ãa]\s*đ[ềe][:\s]*(\d+)/i) ||
                      fileName.match(/MĐỀ\s*(\d+)/i);
    const examCode = codeMatch ? codeMatch[1] : undefined;
    
    // Check if this is an answer file
    const isAnswer = /[-_]?(ĐA|ĐÁP\s*ÁN)/i.test(fileName);
    
    return {
        examPath: filePath,
        province,
        examCode,
        fileName,
        type,
        answerPath: isAnswer ? filePath : undefined,
    };
}

function matchExamWithAnswers(files: ExamFile[]): ExamFile[] {
    const examFiles: ExamFile[] = [];
    const answerFiles: ExamFile[] = [];
    
    // Separate exam and answer files
    for (const file of files) {
        if (/[-_]?(ĐA|ĐÁP\s*ÁN)/i.test(file.fileName)) {
            answerFiles.push(file);
        } else {
            examFiles.push(file);
        }
    }
    
    // Match answer files to exam files
    for (const exam of examFiles) {
        const examBaseName = exam.fileName
            .replace(/\.(docx?|pdf)$/i, "")
            .replace(/[-_]?(ĐA|ĐÁP\s*ÁN)/gi, "")
            .trim();
        
        // Find matching answer file
        const answerFile = answerFiles.find(a => {
            const answerBaseName = a.fileName
                .replace(/\.(docx?|pdf)$/i, "")
                .replace(/[-_]?(ĐA|ĐÁP\s*ÁN)/gi, "")
                .trim();
            
            return answerBaseName === examBaseName ||
                   a.fileName.includes(exam.examCode || "###") ||
                   (exam.province && a.province === exam.province && 
                    a.examCode === exam.examCode);
        });
        
        if (answerFile) {
            exam.answerPath = answerFile.examPath;
        }
    }
    
    return examFiles;
}

// ========================
// IMPORT FUNCTIONS
// ========================

/**
 * Import một đề thi vào database
 */
export async function importExam(examFile: ExamFile): Promise<ImportResult> {
    try {
        console.log(`\n📄 Importing: ${examFile.fileName}`);
        
        // Read and parse exam
        const examText = await readDocxFile(examFile.examPath);
        const metadata = extractMetadata(examFile.examPath);
        const exam = parseExamText(examText, metadata);
        
        // Parse answer key if available
        if (examFile.answerPath) {
            console.log(`   📝 Answer key: ${path.basename(examFile.answerPath)}`);
            const answerText = await readDocxFile(examFile.answerPath);
            const answerKey = parseAnswerKey(answerText);
            applyAnswerKey(exam, answerKey);
        }
        
        // Check if exam already exists
        const existing = await prisma.exam.findUnique({
            where: { slug: exam.slug },
        });
        
        if (existing) {
            console.log(`   ⏭️  Skipping (already exists): ${exam.slug}`);
            return {
                success: true,
                examPath: examFile.examPath,
                examId: existing.id,
                slug: exam.slug,
            };
        }
        
        // Ensure subject exists
        const subject = await ensureSubject();
        
        // Ensure province exists
        let provinceId: number | undefined;
        if (exam.province && PROVINCE_MAP[exam.province]) {
            provinceId = PROVINCE_MAP[exam.province];
            await ensureProvince(exam.province, provinceId);
        }
        
        // Ensure question types exist
        await ensureQuestionTypes();
        
        // Create exam
        const createdExam = await prisma.exam.create({
            data: {
                title: exam.title,
                slug: exam.slug,
                description: `Đề thi THPT Quốc gia môn Tin học năm ${exam.year}`,
                year: exam.year,
                source: exam.source,
                type: exam.type === "HSG" ? "HSG" : "STANDARD",
                duration: exam.duration,
                published: true,
                subjectId: subject.id,
                provinceId: provinceId,
                parts: {
                    part1: {
                        name: "Phần I: Trắc nghiệm nhiều lựa chọn",
                        questionCount: exam.part1Questions.length,
                        pointsPerQuestion: 0.25,
                    },
                    part2: {
                        name: "Phần II: Trắc nghiệm đúng sai",
                        questionCount: exam.part2CommonQuestions.length + 
                            exam.part2CSQuestions.length + exam.part2AIQuestions.length,
                        pointsPerQuestion: 1.0,
                    },
                },
            },
        });
        
        console.log(`   ✅ Created exam: ${createdExam.id}`);
        
        let questionsImported = 0;
        
        // Import Part 1 questions
        for (const q of exam.part1Questions) {
            await importQuestion(q, createdExam.id, subject.id, 1);
            questionsImported++;
        }
        
        // Import Part 2 Common questions
        for (const q of exam.part2CommonQuestions) {
            await importQuestion(q, createdExam.id, subject.id, 2);
            questionsImported++;
        }
        
        // Import Part 2 CS questions
        for (const q of exam.part2CSQuestions) {
            await importQuestion(q, createdExam.id, subject.id, 2);
            questionsImported++;
        }
        
        // Import Part 2 AI questions
        for (const q of exam.part2AIQuestions) {
            await importQuestion(q, createdExam.id, subject.id, 2);
            questionsImported++;
        }
        
        console.log(`   ✅ Imported ${questionsImported} questions`);
        
        return {
            success: true,
            examPath: examFile.examPath,
            examId: createdExam.id,
            slug: exam.slug,
            questionsImported,
        };
    } catch (error) {
        console.error(`   ❌ Error:`, error);
        return {
            success: false,
            examPath: examFile.examPath,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function ensureSubject() {
    let subject = await prisma.subject.findUnique({
        where: { slug: "tin-hoc-thpt" },
    });
    
    if (!subject) {
        subject = await prisma.subject.create({
            data: {
                name: "Tin học THPT",
                slug: "tin-hoc-thpt",
                code: "TINHOC12",
                description: "Môn Tin học THPT - Chuẩn bị cho kỳ thi THPT Quốc gia",
                icon: "💻",
                practiceMode: "TOPIC",
            },
        });
        console.log("   ✅ Created subject: Tin học THPT");
    }
    
    return subject;
}

async function ensureProvince(name: string, id: number) {
    const existing = await prisma.province.findUnique({
        where: { id },
    });
    
    if (!existing) {
        await prisma.province.create({
            data: { id, name },
        });
    }
}

async function ensureQuestionTypes() {
    const types = [
        { id: "MULTIPLE_CHOICE", name: "Trắc nghiệm", description: "Câu hỏi trắc nghiệm nhiều lựa chọn" },
        { id: "TRUE_FALSE_GROUP", name: "Đúng/Sai", description: "Câu hỏi đúng sai theo nhóm" },
    ];
    
    for (const type of types) {
        const existing = await prisma.questionType.findUnique({
            where: { id: type.id },
        });
        
        if (!existing) {
            await prisma.questionType.create({ data: type });
        }
    }
}

async function importQuestion(
    q: any,
    examId: string,
    subjectId: string,
    partNumber: number
) {
    // Create question
    const question = await prisma.question.create({
        data: {
            content: q.content,
            typeId: q.type,
            subjectId,
            sourceExamId: examId,
            difficulty: "MEDIUM",
            isShuffleable: q.type === "MULTIPLE_CHOICE",
            options: q.choices ? {
                create: q.choices.map((choice: string, idx: number) => {
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D
                    const isCorrect = q.correctAnswer === letter;
                    return {
                        content: choice.replace(/^[A-D][.)\s]+/, ""),
                        isCorrect,
                        order: idx + 1,
                    };
                }),
            } : undefined,
        },
    });
    
    // Create exam-question link
    await prisma.examQuestion.create({
        data: {
            examId,
            questionId: question.id,
            partNumber,
            order: q.order,
            points: q.points,
        },
    });
    
    // Create sub-questions for TRUE_FALSE_GROUP
    if (q.type === "TRUE_FALSE_GROUP" && q.subQuestions) {
        for (let i = 0; i < q.subQuestions.length; i++) {
            const sub = q.subQuestions[i];
            await prisma.questionOption.create({
                data: {
                    questionId: question.id,
                    content: `${sub.label} ${sub.content}`,
                    isCorrect: sub.isCorrect ?? false,
                    order: i + 1,
                },
            });
        }
    }
}

// ========================
// CLI
// ========================

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log("Batch Import Đề Thi Tin Học từ Ngân Hàng Đề 2025");
        console.log("=".repeat(50));
        console.log("");
        console.log("Usage:");
        console.log("  npx tsx scripts/import-exam-bank.ts scan <folder-path>");
        console.log("  npx tsx scripts/import-exam-bank.ts import <folder-path>");
        console.log("  npx tsx scripts/import-exam-bank.ts import <file-path>");
        console.log("");
        console.log("Examples:");
        console.log('  npx tsx scripts/import-exam-bank.ts scan "C:\\path\\to\\2025"');
        console.log('  npx tsx scripts/import-exam-bank.ts import "C:\\path\\to\\2025\\ĐỀ CÁC SỞ"');
        console.log('  npx tsx scripts/import-exam-bank.ts import "C:\\path\\to\\exam.docx"');
        process.exit(1);
    }
    
    const command = args[0].toLowerCase();
    const targetPath = path.resolve(args[1]);
    
    if (!fs.existsSync(targetPath)) {
        console.error(`❌ Path not found: ${targetPath}`);
        process.exit(1);
    }
    
    const stat = fs.statSync(targetPath);
    
    if (command === "scan") {
        console.log("🔍 Scanning exam folder...\n");
        
        const files = await scanExamFolder(targetPath);
        
        console.log(`\n📊 Found ${files.length} exam file(s):\n`);
        console.log("-".repeat(80));
        
        // Group by province
        const byProvince = new Map<string, ExamFile[]>();
        for (const file of files) {
            const list = byProvince.get(file.province) || [];
            list.push(file);
            byProvince.set(file.province, list);
        }
        
        for (const [province, examFiles] of byProvince) {
            console.log(`\n📍 ${province} (${examFiles.length} file(s)):`);
            for (const file of examFiles) {
                const hasAnswer = file.answerPath ? "✅" : "❌";
                console.log(`   ${hasAnswer} ${file.fileName}`);
                if (file.answerPath) {
                    console.log(`      ↳ Đáp án: ${path.basename(file.answerPath)}`);
                }
            }
        }
        
        console.log("\n" + "=".repeat(80));
        console.log(`Total: ${files.length} exam(s)`);
        console.log(`With answer key: ${files.filter(f => f.answerPath).length}`);
        console.log(`Without answer key: ${files.filter(f => !f.answerPath).length}`);
        
    } else if (command === "import") {
        console.log("🚀 Starting import...\n");
        
        let files: ExamFile[] = [];
        
        if (stat.isDirectory()) {
            files = await scanExamFolder(targetPath);
        } else {
            // Single file import
            const examFile = createExamFile(targetPath);
            if (examFile) {
                files = [examFile];
            }
        }
        
        if (files.length === 0) {
            console.log("No exam files found.");
            process.exit(0);
        }
        
        console.log(`Found ${files.length} exam file(s) to import.\n`);
        
        const results: ImportResult[] = [];
        
        for (const file of files) {
            const result = await importExam(file);
            results.push(result);
        }
        
        // Summary
        console.log("\n" + "=".repeat(80));
        console.log("📊 Import Summary:");
        console.log("-".repeat(80));
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const totalQuestions = successful.reduce((sum, r) => sum + (r.questionsImported || 0), 0);
        
        console.log(`✅ Successful: ${successful.length}`);
        console.log(`❌ Failed: ${failed.length}`);
        console.log(`📝 Total questions imported: ${totalQuestions}`);
        
        if (failed.length > 0) {
            console.log("\n❌ Failed imports:");
            for (const r of failed) {
                console.log(`   - ${path.basename(r.examPath)}: ${r.error}`);
            }
        }
        
    } else {
        console.error(`❌ Unknown command: ${command}`);
        console.log("Use 'scan' or 'import'");
        process.exit(1);
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
