/**
 * Script to convert exams-seed.json to SQL for Supabase
 * Run: npx tsx scripts/json-to-sql.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface SubQuestion {
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
}

interface Question {
    id: string;
    content: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP';
    track: 'COMMON' | 'COMPUTER_SCIENCE' | 'APPLIED_INFORMATICS';
    choices: string[];
    correctAnswer: string | null;
    subQuestions?: SubQuestion[];
}

interface Exam {
    id: string;
    title: string;
    slug: string;
    description: string;
    subject: string;
    year: number;
    source: string;
    type: 'STANDARD' | 'HSG' | 'MOCK';
    duration: number;
    published: boolean;
    parts: any[];
}

interface ExamQuestion {
    examId: string;
    questionId: string;
    partNumber: number;
    order: number;
    points: number;
}

interface SeedData {
    exams: Exam[];
    questions: Question[];
    examQuestions: ExamQuestion[];
}

function escapeSQL(str: string): string {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

function generateSQL(data: SeedData): string {
    const lines: string[] = [];
    const now = new Date().toISOString();

    lines.push('-- =============================================');
    lines.push('-- NEO-EDU Exam Data Import');
    lines.push(`-- Generated at: ${now}`);
    lines.push('-- =============================================');
    lines.push('');

    // Begin transaction
    lines.push('BEGIN;');
    lines.push('');

    // ============ INSERT EXAMS ============
    lines.push('-- =============================================');
    lines.push('-- EXAMS');
    lines.push('-- =============================================');
    lines.push('');

    for (const exam of data.exams) {
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
        lines.push(`  subject = EXCLUDED.subject,`);
        lines.push(`  year = EXCLUDED.year,`);
        lines.push(`  source = EXCLUDED.source,`);
        lines.push(`  type = EXCLUDED.type,`);
        lines.push(`  duration = EXCLUDED.duration,`);
        lines.push(`  parts = EXCLUDED.parts,`);
        lines.push(`  published = EXCLUDED.published,`);
        lines.push(`  "updatedAt" = EXCLUDED."updatedAt";`);
        lines.push('');
    }

    // ============ INSERT QUESTIONS ============
    lines.push('-- =============================================');
    lines.push('-- QUESTIONS');
    lines.push('-- =============================================');
    lines.push('');

    for (const question of data.questions) {
        const choicesArray = `ARRAY[${question.choices.map(c => `'${escapeSQL(c)}'`).join(', ')}]::text[]`;
        const correctAnswer = question.correctAnswer ? `'${escapeSQL(question.correctAnswer)}'` : 'NULL';

        lines.push(`INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")`);
        lines.push(`VALUES (`);
        lines.push(`  '${question.id}',`);
        lines.push(`  '${escapeSQL(question.content)}',`);
        lines.push(`  '${question.type}',`);
        lines.push(`  '${question.track}',`);
        lines.push(`  ${choicesArray},`);
        lines.push(`  ${correctAnswer},`);
        lines.push(`  '${now}',`);
        lines.push(`  '${now}'`);
        lines.push(`) ON CONFLICT (id) DO UPDATE SET`);
        lines.push(`  content = EXCLUDED.content,`);
        lines.push(`  type = EXCLUDED.type,`);
        lines.push(`  track = EXCLUDED.track,`);
        lines.push(`  choices = EXCLUDED.choices,`);
        lines.push(`  "correctAnswer" = EXCLUDED."correctAnswer",`);
        lines.push(`  "updatedAt" = EXCLUDED."updatedAt";`);
        lines.push('');

        // Insert sub-questions if present
        if (question.subQuestions && question.subQuestions.length > 0) {
            for (const sub of question.subQuestions) {
                lines.push(`INSERT INTO sub_questions (id, "questionId", content, "isCorrect", "order")`);
                lines.push(`VALUES (`);
                lines.push(`  '${sub.id}',`);
                lines.push(`  '${question.id}',`);
                lines.push(`  '${escapeSQL(sub.content)}',`);
                lines.push(`  ${sub.isCorrect},`);
                lines.push(`  ${sub.order}`);
                lines.push(`) ON CONFLICT (id) DO UPDATE SET`);
                lines.push(`  content = EXCLUDED.content,`);
                lines.push(`  "isCorrect" = EXCLUDED."isCorrect",`);
                lines.push(`  "order" = EXCLUDED."order";`);
                lines.push('');
            }
        }
    }

    // ============ INSERT EXAM_QUESTIONS ============
    lines.push('-- =============================================');
    lines.push('-- EXAM_QUESTIONS (linking exams to questions)');
    lines.push('-- =============================================');
    lines.push('');

    for (const eq of data.examQuestions) {
        lines.push(`INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)`);
        lines.push(`VALUES (`);
        lines.push(`  '${eq.examId}',`);
        lines.push(`  '${eq.questionId}',`);
        lines.push(`  ${eq.partNumber},`);
        lines.push(`  ${eq.order},`);
        lines.push(`  ${eq.points}`);
        lines.push(`) ON CONFLICT ("examId", "questionId") DO UPDATE SET`);
        lines.push(`  "partNumber" = EXCLUDED."partNumber",`);
        lines.push(`  "order" = EXCLUDED."order",`);
        lines.push(`  points = EXCLUDED.points;`);
        lines.push('');
    }

    // Commit transaction
    lines.push('COMMIT;');
    lines.push('');
    lines.push('-- =============================================');
    lines.push('-- Import completed successfully!');
    lines.push('-- =============================================');

    return lines.join('\n');
}

async function main() {
    const jsonPath = path.join(__dirname, '../data/exams-seed.json');
    const sqlPath = path.join(__dirname, '../data/exams-seed.sql');

    console.log('📂 Reading JSON file...');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const data: SeedData = JSON.parse(jsonContent);

    console.log(`📊 Found:`);
    console.log(`   - ${data.exams.length} exams`);
    console.log(`   - ${data.questions.length} questions`);
    console.log(`   - ${data.examQuestions.length} exam-question links`);

    console.log('🔄 Converting to SQL...');
    const sql = generateSQL(data);

    console.log('💾 Writing SQL file...');
    fs.writeFileSync(sqlPath, sql, 'utf-8');

    console.log(`✅ SQL file generated: ${sqlPath}`);
    console.log('');
    console.log('📋 To import to Supabase:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Create a new query');
    console.log('   3. Paste the contents of data/exams-seed.sql');
    console.log('   4. Run the query');
}

main().catch(console.error);
