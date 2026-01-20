/**
 * Script to convert Tin học exam JSON to SQL for Supabase
 * Supports the THPT Tin học exam structure with:
 * - Part I: Multiple choice (24 questions)
 * - Part II: True/False with common + specialized tracks
 * 
 * Run: npx tsx scripts/convert-exam-json.ts data/exam-tin-hoc-template.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface SubQuestion {
    id: string;
    label: string;
    content: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    order: number;
    content: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP';
    track: 'COMMON' | 'COMPUTER_SCIENCE' | 'APPLIED_INFORMATICS';
    choices?: string[];
    correctAnswer?: string;
    points: number;
    subQuestions?: SubQuestion[];
}

interface ExamData {
    exam: {
        id: string;
        title: string;
        slug: string;
        description: string;
        subject: string;
        year: number;
        source: string;
        type: string;
        duration: number;
        published: boolean;
        parts: any[];
    };
    questions: {
        part1: Question[];
        part2_common: Question[];
        part2_computer_science: Question[];
        part2_applied_informatics: Question[];
    };
}

function escapeSQL(str: string): string {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

function generateId(): string {
    return 'cuid_' + Math.random().toString(36).substring(2, 15);
}

function generateSQL(data: ExamData): string {
    const lines: string[] = [];
    const now = new Date().toISOString();
    const exam = data.exam;

    lines.push('-- =============================================');
    lines.push(`-- ${exam.title}`);
    lines.push(`-- Generated at: ${now}`);
    lines.push('-- =============================================');
    lines.push('');
    lines.push('BEGIN;');
    lines.push('');

    // ============ INSERT EXAM ============
    lines.push('-- =============================================');
    lines.push('-- EXAM');
    lines.push('-- =============================================');
    lines.push('');

    lines.push(`INSERT INTO exams (id, title, slug, description, subject, year, source, type, duration, parts, published, "createdAt", "updatedAt")`);
    lines.push(`VALUES (`);
    lines.push(`  '${exam.id}',`);
    lines.push(`  '${escapeSQL(exam.title)}',`);
    lines.push(`  '${escapeSQL(exam.slug)}',`);
    lines.push(`  '${escapeSQL(exam.description)}',`);
    lines.push(`  '${escapeSQL(exam.subject)}',`);
    lines.push(`  ${exam.year},`);
    lines.push(`  '${escapeSQL(exam.source)}',`);
    lines.push(`  '${exam.type}',`);
    lines.push(`  ${exam.duration},`);
    lines.push(`  '${JSON.stringify(exam.parts).replace(/'/g, "''")}',`);
    lines.push(`  ${exam.published},`);
    lines.push(`  '${now}',`);
    lines.push(`  '${now}'`);
    lines.push(`) ON CONFLICT (slug) DO UPDATE SET`);
    lines.push(`  title = EXCLUDED.title,`);
    lines.push(`  description = EXCLUDED.description,`);
    lines.push(`  parts = EXCLUDED.parts,`);
    lines.push(`  published = EXCLUDED.published,`);
    lines.push(`  "updatedAt" = EXCLUDED."updatedAt";`);
    lines.push('');

    // ============ INSERT QUESTIONS ============
    lines.push('-- =============================================');
    lines.push('-- QUESTIONS - Part 1: Multiple Choice');
    lines.push('-- =============================================');
    lines.push('');

    const allQuestions: { question: Question; partNumber: number }[] = [];

    // Part 1 questions
    for (const q of data.questions.part1) {
        allQuestions.push({ question: q, partNumber: 1 });
        const choicesArray = q.choices && q.choices.length > 0
            ? `ARRAY[${q.choices.map(c => `'${escapeSQL(c)}'`).join(', ')}]::text[]`
            : `ARRAY[]::text[]`;

        lines.push(`INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")`);
        lines.push(`VALUES (`);
        lines.push(`  '${q.id}',`);
        lines.push(`  '${escapeSQL(q.content)}',`);
        lines.push(`  '${q.type}',`);
        lines.push(`  '${q.track}',`);
        lines.push(`  ${choicesArray},`);
        lines.push(`  ${q.correctAnswer ? `'${escapeSQL(q.correctAnswer)}'` : 'NULL'},`);
        lines.push(`  '${now}',`);
        lines.push(`  '${now}'`);
        lines.push(`) ON CONFLICT (id) DO UPDATE SET`);
        lines.push(`  content = EXCLUDED.content,`);
        lines.push(`  choices = EXCLUDED.choices,`);
        lines.push(`  "correctAnswer" = EXCLUDED."correctAnswer",`);
        lines.push(`  "updatedAt" = EXCLUDED."updatedAt";`);
        lines.push('');
    }

    // Part 2 - Common questions
    lines.push('-- =============================================');
    lines.push('-- QUESTIONS - Part 2A: True/False Common');
    lines.push('-- =============================================');
    lines.push('');

    for (const q of data.questions.part2_common) {
        allQuestions.push({ question: q, partNumber: 2 });
        insertTrueFalseQuestion(lines, q, now);
    }

    // Part 2 - Computer Science
    lines.push('-- =============================================');
    lines.push('-- QUESTIONS - Part 2B: True/False Computer Science');
    lines.push('-- =============================================');
    lines.push('');

    for (const q of data.questions.part2_computer_science) {
        allQuestions.push({ question: q, partNumber: 2 });
        insertTrueFalseQuestion(lines, q, now);
    }

    // Part 2 - Applied Informatics
    lines.push('-- =============================================');
    lines.push('-- QUESTIONS - Part 2B: True/False Applied Informatics');
    lines.push('-- =============================================');
    lines.push('');

    for (const q of data.questions.part2_applied_informatics) {
        allQuestions.push({ question: q, partNumber: 2 });
        insertTrueFalseQuestion(lines, q, now);
    }

    // ============ INSERT EXAM_QUESTIONS ============
    lines.push('-- =============================================');
    lines.push('-- EXAM_QUESTIONS (linking exams to questions)');
    lines.push('-- =============================================');
    lines.push('');

    for (const { question, partNumber } of allQuestions) {
        lines.push(`INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)`);
        lines.push(`VALUES (`);
        lines.push(`  '${exam.id}',`);
        lines.push(`  '${question.id}',`);
        lines.push(`  ${partNumber},`);
        lines.push(`  ${question.order},`);
        lines.push(`  ${question.points}`);
        lines.push(`) ON CONFLICT ("examId", "questionId") DO UPDATE SET`);
        lines.push(`  "partNumber" = EXCLUDED."partNumber",`);
        lines.push(`  "order" = EXCLUDED."order",`);
        lines.push(`  points = EXCLUDED.points;`);
        lines.push('');
    }

    lines.push('COMMIT;');
    lines.push('');
    lines.push('-- =============================================');
    lines.push('-- Import completed successfully!');
    lines.push(`-- Total questions: ${allQuestions.length}`);
    lines.push('-- =============================================');

    return lines.join('\n');
}

function insertTrueFalseQuestion(lines: string[], q: Question, now: string): void {
    lines.push(`INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")`);
    lines.push(`VALUES (`);
    lines.push(`  '${q.id}',`);
    lines.push(`  '${escapeSQL(q.content)}',`);
    lines.push(`  '${q.type}',`);
    lines.push(`  '${q.track}',`);
    lines.push(`  ARRAY[]::text[],`);
    lines.push(`  NULL,`);
    lines.push(`  '${now}',`);
    lines.push(`  '${now}'`);
    lines.push(`) ON CONFLICT (id) DO UPDATE SET`);
    lines.push(`  content = EXCLUDED.content,`);
    lines.push(`  track = EXCLUDED.track,`);
    lines.push(`  "updatedAt" = EXCLUDED."updatedAt";`);
    lines.push('');

    // Insert sub-questions
    if (q.subQuestions && q.subQuestions.length > 0) {
        for (let i = 0; i < q.subQuestions.length; i++) {
            const sub = q.subQuestions[i];
            lines.push(`INSERT INTO sub_questions (id, "questionId", content, "isCorrect", "order")`);
            lines.push(`VALUES (`);
            lines.push(`  '${sub.id}',`);
            lines.push(`  '${q.id}',`);
            lines.push(`  '${escapeSQL(sub.content)}',`);
            lines.push(`  ${sub.isCorrect},`);
            lines.push(`  ${i + 1}`);
            lines.push(`) ON CONFLICT (id) DO UPDATE SET`);
            lines.push(`  content = EXCLUDED.content,`);
            lines.push(`  "isCorrect" = EXCLUDED."isCorrect",`);
            lines.push(`  "order" = EXCLUDED."order";`);
            lines.push('');
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: npx tsx scripts/convert-exam-json.ts <path-to-json-file>');
        console.log('');
        console.log('Example:');
        console.log('  npx tsx scripts/convert-exam-json.ts data/exam-tin-hoc-2025.json');
        process.exit(1);
    }

    const jsonPath = path.resolve(args[0]);
    const sqlPath = jsonPath.replace('.json', '.sql');

    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ File not found: ${jsonPath}`);
        process.exit(1);
    }

    console.log('📂 Reading JSON file...');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const data: ExamData = JSON.parse(jsonContent);

    const totalQuestions = 
        (data.questions.part1?.length || 0) +
        (data.questions.part2_common?.length || 0) +
        (data.questions.part2_computer_science?.length || 0) +
        (data.questions.part2_applied_informatics?.length || 0);

    console.log(`📊 Exam: ${data.exam.title}`);
    console.log(`📊 Found:`);
    console.log(`   - Part 1 (Multiple Choice): ${data.questions.part1?.length || 0} questions`);
    console.log(`   - Part 2A (True/False Common): ${data.questions.part2_common?.length || 0} questions`);
    console.log(`   - Part 2B (Computer Science): ${data.questions.part2_computer_science?.length || 0} questions`);
    console.log(`   - Part 2B (Applied Informatics): ${data.questions.part2_applied_informatics?.length || 0} questions`);
    console.log(`   - Total: ${totalQuestions} questions`);

    console.log('🔄 Converting to SQL...');
    const sql = generateSQL(data);

    console.log('💾 Writing SQL file...');
    fs.writeFileSync(sqlPath, sql, 'utf-8');

    console.log(`✅ SQL file generated: ${sqlPath}`);
    console.log('');
    console.log('📋 To import to Supabase:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Create a new query');
    console.log(`   3. Paste the contents of ${path.basename(sqlPath)}`);
    console.log('   4. Run the query');
}

main().catch(console.error);
