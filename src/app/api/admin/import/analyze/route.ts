import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

// ============================================
// Types
// ============================================

interface EntityMapping {
    type: 'PROVINCE' | 'SCHOOL' | 'SUBJECT';
    value: string;
    match: { id: string | number; name: string } | null;
    suggestions: { id: string | number; name: string }[];
    action: 'MATCHED' | 'CREATE_NEW' | 'NEEDS_SELECTION';
}

interface ParsedQuestion {
    type: string;
    content: string;
    order: number;
    choices?: { content: string; isCorrect: boolean }[];
    statements?: { content: string; isCorrect: boolean }[];
}

interface ParsedPart {
    name: string;
    order: number;
    questions: ParsedQuestion[];
}

interface ParsedExam {
    title: string;
    description?: string;
    duration: number;
    year?: number;
    province?: string;
    school?: string;
    subject?: string;
    type?: string;
    parts: ParsedPart[];
}

interface AnalysisResult {
    status: 'READY' | 'NEEDS_ACTION' | 'ERROR';
    exam: ParsedExam | null;
    mappings: EntityMapping[];
    questionCount: number;
    errors: string[];
    warnings: string[];
}

// ============================================
// Parsers
// ============================================

function parseJsonContent(content: string): ParsedExam | null {
    try {
        const data = JSON.parse(content);
        if (data.exam) {
            return data.exam as ParsedExam;
        }
        return null;
    } catch {
        return null;
    }
}

function parseExcelContent(buffer: ArrayBuffer): ParsedExam | null {
    try {
        const workbook = XLSX.read(buffer, { type: 'array' });

        // First sheet should be "Metadata" or exam info
        const metaSheet = workbook.Sheets['Metadata'] || workbook.Sheets[workbook.SheetNames[0]];
        const metaData = XLSX.utils.sheet_to_json<Record<string, string>>(metaSheet, { header: 1 });

        // Parse metadata (key-value pairs in first two columns)
        const metadata: Record<string, string> = {};
        for (const row of metaData) {
            const arr = row as unknown as string[];
            if (arr[0] && arr[1]) {
                metadata[arr[0].toLowerCase().trim()] = String(arr[1]).trim();
            }
        }

        // Questions sheet
        const questionsSheet = workbook.Sheets['Questions'] || workbook.Sheets[workbook.SheetNames[1]];
        if (!questionsSheet) {
            return null;
        }

        const questionsData = XLSX.utils.sheet_to_json<Record<string, string>>(questionsSheet);

        // Group questions by Part
        const partsMap = new Map<string, ParsedQuestion[]>();
        let currentQuestion: ParsedQuestion | null = null;

        for (const row of questionsData) {
            const partName = row['Part'] || row['Phần'] || 'Phần 1';
            const questionContent = row['Question'] || row['Câu hỏi'] || row['Content'];
            const optionContent = row['Option'] || row['Đáp án'] || row['Choice'];
            const isCorrect = row['IsCorrect'] === 'true' || row['Đúng'] === 'true' || row['Correct'] === 'true' || row['IsCorrect'] === 'TRUE' || String(row['IsCorrect']).toLowerCase() === 'true';
            const questionType = row['Type'] || row['Loại'] || 'MULTIPLE_CHOICE';

            if (questionContent) {
                // New question
                currentQuestion = {
                    type: questionType,
                    content: questionContent,
                    order: (partsMap.get(partName)?.length || 0) + 1,
                    choices: [],
                };

                if (!partsMap.has(partName)) {
                    partsMap.set(partName, []);
                }
                partsMap.get(partName)!.push(currentQuestion);
            }

            // Add option to current question
            if (currentQuestion && optionContent) {
                if (currentQuestion.type === 'TRUE_FALSE_GROUP') {
                    if (!currentQuestion.statements) currentQuestion.statements = [];
                    currentQuestion.statements.push({ content: optionContent, isCorrect });
                } else {
                    if (!currentQuestion.choices) currentQuestion.choices = [];
                    currentQuestion.choices.push({ content: optionContent, isCorrect });
                }
            }
        }

        // Build parts array
        const parts: ParsedPart[] = [];
        let partOrder = 1;
        for (const [name, questions] of partsMap) {
            parts.push({ name, order: partOrder++, questions });
        }

        return {
            title: metadata['title'] || metadata['tên đề'] || 'Đề thi nhập từ Excel',
            description: metadata['description'] || metadata['mô tả'],
            duration: parseInt(metadata['duration'] || metadata['thời gian'] || '90', 10),
            year: parseInt(metadata['year'] || metadata['năm'] || String(new Date().getFullYear()), 10),
            province: metadata['province'] || metadata['tỉnh'],
            school: metadata['school'] || metadata['trường'],
            subject: metadata['subject'] || metadata['môn'],
            type: metadata['type'] || metadata['loại'] || 'STANDARD',
            parts,
        };
    } catch (e) {
        console.error('Excel parse error:', e);
        return null;
    }
}

// ============================================
// DOCX Parser
// ============================================

const DOCX_PATTERNS = {
    // Question patterns like "Câu 1:", "Câu 1.", "Câu 1)"
    questionStart: /^(?:Câu|Question)\s*(\d+)\s*[:.)\]]/i,
    // Choice patterns like "A.", "A)", "a."
    choiceOption: /^([A-Da-d])\s*[.)]\s*(.+)/,
    // Correct answer marker: "Đáp án: A" or "Đáp án đúng: B"
    correctAnswer: /(?:Đáp án|Answer|Correct)[:\s]*([A-Da-d])/i,
    // Metadata patterns
    examTitle: /(?:ĐỀ|Đề|Title)[:\s]*(.+)/i,
    province: /(?:Tỉnh|Province|Sở)[:\s]*(.+)/i,
    school: /(?:Trường|School)[:\s]*(.+)/i,
    subject: /(?:Môn|Subject)[:\s]*(.+)/i,
    duration: /(?:Thời gian|Duration|Time)[:\s]*(\d+)/i,
    year: /(?:Năm|Year)[:\s]*(\d{4})/i,
};

async function parseDocxContent(buffer: ArrayBuffer): Promise<ParsedExam | null> {
    try {
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        const text = result.value;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);

        // Extract metadata from first ~20 lines
        const metadata: Record<string, string> = {};
        let metadataEndIndex = 0;

        for (let i = 0; i < Math.min(lines.length, 30); i++) {
            const line = lines[i];

            // Check if it's the start of questions
            if (DOCX_PATTERNS.questionStart.test(line)) {
                metadataEndIndex = i;
                break;
            }

            // Extract metadata
            const titleMatch = line.match(DOCX_PATTERNS.examTitle);
            if (titleMatch) metadata.title = titleMatch[1].trim();

            const provinceMatch = line.match(DOCX_PATTERNS.province);
            if (provinceMatch) metadata.province = provinceMatch[1].trim();

            const schoolMatch = line.match(DOCX_PATTERNS.school);
            if (schoolMatch) metadata.school = schoolMatch[1].trim();

            const subjectMatch = line.match(DOCX_PATTERNS.subject);
            if (subjectMatch) metadata.subject = subjectMatch[1].trim();

            const durationMatch = line.match(DOCX_PATTERNS.duration);
            if (durationMatch) metadata.duration = durationMatch[1];

            const yearMatch = line.match(DOCX_PATTERNS.year);
            if (yearMatch) metadata.year = yearMatch[1];
        }

        // Parse questions
        const questions: ParsedQuestion[] = [];
        let currentQuestion: ParsedQuestion | null = null;
        let currentChoices: { content: string; isCorrect: boolean }[] = [];
        let correctAnswer: string | null = null;

        for (let i = metadataEndIndex; i < lines.length; i++) {
            const line = lines[i];

            // Check for new question
            const questionMatch = line.match(DOCX_PATTERNS.questionStart);
            if (questionMatch) {
                // Save previous question
                if (currentQuestion) {
                    // Apply correct answer
                    if (correctAnswer) {
                        const upperAnswer = correctAnswer.toUpperCase();
                        currentChoices = currentChoices.map((c, idx) => ({
                            ...c,
                            isCorrect: String.fromCharCode(65 + idx) === upperAnswer,
                        }));
                    }
                    currentQuestion.choices = currentChoices;
                    questions.push(currentQuestion);
                }

                // Extract question content (rest of line after "Câu N:")
                const questionContent = line.replace(DOCX_PATTERNS.questionStart, '').trim();
                currentQuestion = {
                    type: 'MULTIPLE_CHOICE',
                    content: questionContent || '',
                    order: parseInt(questionMatch[1]),
                };
                currentChoices = [];
                correctAnswer = null;
                continue;
            }

            // Check for choice
            const choiceMatch = line.match(DOCX_PATTERNS.choiceOption);
            if (choiceMatch && currentQuestion) {
                currentChoices.push({
                    content: choiceMatch[2].trim(),
                    isCorrect: false,
                });
                continue;
            }

            // Check for correct answer indicator
            const answerMatch = line.match(DOCX_PATTERNS.correctAnswer);
            if (answerMatch) {
                correctAnswer = answerMatch[1];
                continue;
            }

            // Continue question content if no choices yet
            if (currentQuestion && currentChoices.length === 0 && line) {
                currentQuestion.content += ' ' + line;
            }
        }

        // Don't forget last question
        if (currentQuestion) {
            if (correctAnswer) {
                const upperAnswer = correctAnswer.toUpperCase();
                currentChoices = currentChoices.map((c, idx) => ({
                    ...c,
                    isCorrect: String.fromCharCode(65 + idx) === upperAnswer,
                }));
            }
            currentQuestion.choices = currentChoices;
            questions.push(currentQuestion);
        }

        return {
            title: metadata.title || 'Đề thi nhập từ DOCX',
            description: undefined,
            duration: parseInt(metadata.duration || '90', 10),
            year: parseInt(metadata.year || String(new Date().getFullYear()), 10),
            province: metadata.province,
            school: metadata.school,
            subject: metadata.subject,
            type: 'STANDARD',
            parts: [
                {
                    name: 'Phần 1',
                    order: 1,
                    questions,
                },
            ],
        };
    } catch (e) {
        console.error('DOCX parse error:', e);
        return null;
    }
}

// ============================================
// Matching Logic
// ============================================

async function findProvinceMatch(name: string): Promise<EntityMapping> {
    if (!name) {
        return { type: 'PROVINCE', value: '', match: null, suggestions: [], action: 'NEEDS_SELECTION' };
    }

    const normalizedName = name.toLowerCase().trim();

    // Try exact match first
    const exactMatch = await db.province.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (exactMatch) {
        return {
            type: 'PROVINCE',
            value: name,
            match: { id: exactMatch.id, name: exactMatch.name },
            suggestions: [],
            action: 'MATCHED',
        };
    }

    // Fuzzy search - find similar names
    const allProvinces = await db.province.findMany({ take: 63 });
    const suggestions = allProvinces
        .filter(p => p.name.toLowerCase().includes(normalizedName) || normalizedName.includes(p.name.toLowerCase()))
        .slice(0, 5)
        .map(p => ({ id: p.id, name: p.name }));

    return {
        type: 'PROVINCE',
        value: name,
        match: null,
        suggestions,
        action: 'NEEDS_SELECTION',
    };
}

async function findSchoolMatch(name: string, provinceId?: number): Promise<EntityMapping> {
    if (!name) {
        return { type: 'SCHOOL', value: '', match: null, suggestions: [], action: 'NEEDS_SELECTION' };
    }

    const normalizedName = name.toLowerCase().trim();

    // Try exact match
    const exactMatch = await db.school.findFirst({
        where: {
            name: { equals: name, mode: 'insensitive' },
            ...(provinceId && { provinceId }),
        },
    });

    if (exactMatch) {
        return {
            type: 'SCHOOL',
            value: name,
            match: { id: exactMatch.id, name: exactMatch.name },
            suggestions: [],
            action: 'MATCHED',
        };
    }

    // Fuzzy search
    const schools = await db.school.findMany({
        where: provinceId ? { provinceId } : {},
        take: 100,
    });

    const suggestions = schools
        .filter(s => s.name.toLowerCase().includes(normalizedName) || normalizedName.includes(s.name.toLowerCase()))
        .slice(0, 5)
        .map(s => ({ id: s.id, name: s.name }));

    return {
        type: 'SCHOOL',
        value: name,
        match: null,
        suggestions,
        action: suggestions.length > 0 ? 'NEEDS_SELECTION' : 'CREATE_NEW',
    };
}

async function findSubjectMatch(name: string): Promise<EntityMapping> {
    if (!name) {
        return { type: 'SUBJECT', value: '', match: null, suggestions: [], action: 'NEEDS_SELECTION' };
    }

    const normalizedName = name.toLowerCase().trim();

    // Try exact match by name or slug
    const exactMatch = await db.subject.findFirst({
        where: {
            OR: [
                { name: { equals: name, mode: 'insensitive' } },
                { slug: { equals: normalizedName } },
            ],
        },
    });

    if (exactMatch) {
        return {
            type: 'SUBJECT',
            value: name,
            match: { id: exactMatch.id, name: exactMatch.name },
            suggestions: [],
            action: 'MATCHED',
        };
    }

    // Fuzzy search
    const subjects = await db.subject.findMany({ take: 50 });
    const suggestions = subjects
        .filter(s => s.name.toLowerCase().includes(normalizedName) || normalizedName.includes(s.name.toLowerCase()))
        .slice(0, 5)
        .map(s => ({ id: s.id, name: s.name }));

    return {
        type: 'SUBJECT',
        value: name,
        match: null,
        suggestions,
        action: 'NEEDS_SELECTION',
    };
}

// ============================================
// API Handler
// ============================================

const analyzeSchema = z.object({
    fileType: z.enum(['json', 'xlsx', 'docx']),
    content: z.string(), // Base64 for xlsx/docx, raw string for json
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = analyzeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { fileType, content } = validation.data;
        const result: AnalysisResult = {
            status: 'READY',
            exam: null,
            mappings: [],
            questionCount: 0,
            errors: [],
            warnings: [],
        };

        // Parse file content
        if (fileType === 'json') {
            result.exam = parseJsonContent(content);
        } else {
            // Decode base64 to ArrayBuffer
            const binaryString = atob(content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            if (fileType === 'xlsx') {
                result.exam = parseExcelContent(bytes.buffer);
            } else if (fileType === 'docx') {
                result.exam = await parseDocxContent(bytes.buffer);
            }
        }

        if (!result.exam) {
            result.status = 'ERROR';
            result.errors.push('Không thể đọc file. Vui lòng kiểm tra định dạng.');
            return NextResponse.json(result);
        }

        // Count questions
        result.questionCount = result.exam.parts.reduce(
            (sum, part) => sum + part.questions.length,
            0
        );

        // Validate questions
        for (const part of result.exam.parts) {
            for (const q of part.questions) {
                if (q.type === 'MULTIPLE_CHOICE' && (!q.choices || q.choices.length === 0)) {
                    result.warnings.push(`Câu "${q.content.substring(0, 30)}..." thiếu đáp án.`);
                }
                if (q.type === 'TRUE_FALSE_GROUP' && (!q.statements || q.statements.length === 0)) {
                    result.warnings.push(`Câu "${q.content.substring(0, 30)}..." thiếu mệnh đề.`);
                }
            }
        }

        // Find entity matches
        if (result.exam.province) {
            result.mappings.push(await findProvinceMatch(result.exam.province));
        }

        if (result.exam.school) {
            const provinceMapping = result.mappings.find(m => m.type === 'PROVINCE');
            const provinceId = provinceMapping?.match?.id as number | undefined;
            result.mappings.push(await findSchoolMatch(result.exam.school, provinceId));
        }

        if (result.exam.subject) {
            result.mappings.push(await findSubjectMatch(result.exam.subject));
        }

        // Determine overall status
        const needsAction = result.mappings.some(m => m.action === 'NEEDS_SELECTION');
        result.status = needsAction ? 'NEEDS_ACTION' : 'READY';

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error analyzing import:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
