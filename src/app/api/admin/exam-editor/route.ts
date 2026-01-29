/**
 * API Route: Exam Editor
 * Parse text format và chuyển đổi qua lại với structured data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

// ============================================
// Types
// ============================================

interface ExamChoice {
  label: string;
  content: string;
  isCorrect: boolean;
}

interface ExamQuestion {
  order: number;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP';
  choices: ExamChoice[];
  correctAnswer?: string;
  images?: string[];
  explanation?: string;
}

interface ExamPart {
  name: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP';
  questions: ExamQuestion[];
}

interface ExamData {
  title: string;
  subject?: string;
  year?: number;
  duration: number;
  province?: string;
  source?: string;
  parts: ExamPart[];
}

// ============================================
// Text Format Parser
// ============================================

/**
 * Parse text format vào structured data
 * Format:
 * Phần 1:
 * Câu 1: Nội dung câu hỏi
 * A. Đáp án A
 * **B. Đáp án B (đáp án đúng)**
 * C. Đáp án C
 * D. Đáp án D
 */
function parseTextToExam(text: string): ExamData {
  // Normalize text - add line breaks before choice patterns and question numbers
  let normalizedText = text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Normalize multiple whitespace (except newlines) to single space
    .replace(/[^\S\n]+/g, ' ')
    // STEP 1: Add newline BEFORE A. B. C. D. when preceded by punctuation (? . !)
    // This handles: "Kết quả?A. 70" -> "Kết quả?\nA. 70"
    // Must use function replacement to preserve group 2
    .replace(/([?.!])([A-D])\.\s*/g, (_, p, c) => `${p}\n${c}. `)
    // STEP 2: Handle table-style choices: Split before B., C., D. when preceded by non-newline
    // This handles: "A. 70.B. 165" -> "A. 70.\nB. 165"
    .replace(/([^\n])([B-D])\.\s*/gi, (_, g1, g2) => `${g1}\n${g2}. `)
    // STEP 3: Add newline before "Câu X" when preceded by any char
    // This handles: "D. 90.Câu 9" -> "D. 90.\nCâu 9"
    .replace(/([^\n])(Câu\s*\d+)/gi, (_, g1, g2) => `${g1}\n${g2}`)
    // Add newline BEFORE A. B. C. D. when preceded by ) or > (HTML closing tags)
    .replace(/([)>])([A-D])\.\s*/g, (_, g1, g2) => `${g1}\n${g2}. `)
    // Handle pattern where choices run together without period: "hìnhB. Switch"
    .replace(/([a-zàáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])([A-D])\.\s*/gi, (_, g1, g2) => `${g1}\n${g2}. `)
    // Part 2 True/False: Add newline before a), b), c), d) when preceded by . ? ! or : (with any spaces)
    .replace(/([.?!:])\s*([a-d])\)\s*/g, (_, g1, g2) => `${g1}\n${g2}) `)
    // Also handle when directly after a word without punctuation
    .replace(/([a-zàáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])([a-d])\)\s*/gi, (_, g1, g2) => `${g1}\n${g2}) `)
    // Handle **A. format for correct answers
    .replace(/([^\n])(\*\*[A-D])\./g, '$1\n$2.');
  
  const lines = normalizedText.split('\n');
  const exam: ExamData = {
    title: 'Đề thi mới',
    duration: 50,
    parts: [],
  };

  let currentPart: ExamPart | null = null;
  let currentQuestion: ExamQuestion | null = null;
  let questionOrder = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check metadata
    if (line.startsWith('Tiêu đề:')) {
      exam.title = line.replace('Tiêu đề:', '').trim();
      continue;
    }
    if (line.startsWith('Môn:')) {
      exam.subject = line.replace('Môn:', '').trim();
      continue;
    }
    if (line.startsWith('Năm:')) {
      exam.year = parseInt(line.replace('Năm:', '').trim()) || undefined;
      continue;
    }
    if (line.startsWith('Thời gian:')) {
      exam.duration = parseInt(line.replace('Thời gian:', '').trim()) || 50;
      continue;
    }
    if (line.startsWith('Tỉnh:')) {
      exam.province = line.replace('Tỉnh:', '').trim();
      continue;
    }
    if (line.startsWith('Nguồn:')) {
      exam.source = line.replace('Nguồn:', '').trim();
      continue;
    }

    // Check part header: "Phần 1:", "Phần I:", "PHẦN 1"
    const partMatch = line.match(/^PH[ẦAÀ]N\s*(I{1,2}|[12])[:.]\s*(.*)?$/iu);
    if (partMatch) {
      // Save current question to current part
      if (currentQuestion && currentPart) {
        currentPart.questions.push(currentQuestion);
        currentQuestion = null;
      }

      const partNum = partMatch[1];
      const partName = partMatch[2]?.trim() || (
        partNum === '1' || partNum === 'I' 
          ? 'Trắc nghiệm nhiều lựa chọn' 
          : 'Trắc nghiệm đúng sai'
      );
      
      currentPart = {
        name: `Phần ${partNum === 'I' || partNum === '1' ? 'I' : 'II'}: ${partName}`,
        type: partNum === '1' || partNum === 'I' ? 'MULTIPLE_CHOICE' : 'TRUE_FALSE_GROUP',
        questions: [],
      };
      exam.parts.push(currentPart);
      questionOrder = 0;
      continue;
    }

    // Check question: "Câu 1:", "Câu 1.", "1."
    const questionMatch = line.match(/^(?:C[âaà]u\s*)?(\d+)[.:]\s*(.*)$/iu);
    if (questionMatch) {
      // Save previous question
      if (currentQuestion && currentPart) {
        currentPart.questions.push(currentQuestion);
      }

      // Create default part if not exists
      if (!currentPart) {
        currentPart = {
          name: 'Phần I: Trắc nghiệm nhiều lựa chọn',
          type: 'MULTIPLE_CHOICE',
          questions: [],
        };
        exam.parts.push(currentPart);
      }

      questionOrder++;
      currentQuestion = {
        order: questionOrder,
        content: questionMatch[2].trim(),
        type: currentPart.type,
        choices: [],
      };
      continue;
    }

    // Check choice: "A.", "**A.", "a)", "**a)"
    const choiceMatch = line.match(/^(\*\*)?([A-Da-d])[.)]\s*(.+?)(\*\*)?$/);
    if (choiceMatch && currentQuestion) {
      const isCorrect = !!choiceMatch[1] || !!choiceMatch[4];
      const label = choiceMatch[2].toUpperCase();
      const content = choiceMatch[3].trim();

      currentQuestion.choices.push({
        label,
        content,
        isCorrect,
      });

      if (isCorrect) {
        currentQuestion.correctAnswer = label;
      }
      continue;
    }

    // Check standalone correct answer marker: "Đáp án: A"
    const answerMatch = line.match(/^[Đđ][áa]p\s*[áa]n[:\s]+([A-D])/i);
    if (answerMatch && currentQuestion) {
      const correctLabel = answerMatch[1].toUpperCase();
      currentQuestion.correctAnswer = correctLabel;
      // Mark the correct choice
      for (const choice of currentQuestion.choices) {
        choice.isCorrect = choice.label === correctLabel;
      }
      continue;
    }

    // Check explanation
    if (line.startsWith('Giải thích:') && currentQuestion) {
      currentQuestion.explanation = line.replace('Giải thích:', '').trim();
      continue;
    }

    // Continuation of question content (if no choice pattern)
    if (currentQuestion && !line.match(/^[A-Da-d][.)]/)) {
      currentQuestion.content += ' ' + line;
    }
  }

  // Save last question
  if (currentQuestion && currentPart) {
    currentPart.questions.push(currentQuestion);
  }

  return exam;
}

// ============================================
// Structured Data to Text Format
// ============================================

function examToText(exam: ExamData): string {
  const lines: string[] = [];

  // Metadata
  if (exam.title) lines.push(`Tiêu đề: ${exam.title}`);
  if (exam.subject) lines.push(`Môn: ${exam.subject}`);
  if (exam.year) lines.push(`Năm: ${exam.year}`);
  if (exam.duration) lines.push(`Thời gian: ${exam.duration}`);
  if (exam.province) lines.push(`Tỉnh: ${exam.province}`);
  if (exam.source) lines.push(`Nguồn: ${exam.source}`);
  
  if (lines.length > 0) lines.push('');

  // Parts and questions
  for (const part of exam.parts) {
    lines.push(part.name);
    lines.push('');

    for (const question of part.questions) {
      lines.push(`Câu ${question.order}: ${question.content}`);
      
      for (const choice of question.choices) {
        const marker = choice.isCorrect ? '**' : '';
        lines.push(`${marker}${choice.label}. ${choice.content}${marker}`);
      }
      
      if (question.explanation) {
        lines.push(`Giải thích: ${question.explanation}`);
      }
      
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ============================================
// API Handlers
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'parse-text': {
        // Parse text format to structured data
        const exam = parseTextToExam(data.text);
        return NextResponse.json({ exam });
      }

      case 'to-text': {
        // Convert structured data to text format
        const text = examToText(data.exam);
        return NextResponse.json({ text });
      }

      case 'parse-docx': {
        // Parse uploaded DOCX file (base64)
        // This would use mammoth or similar
        return NextResponse.json({ 
          error: 'DOCX parsing requires server-side processing',
          hint: 'Use the parse endpoint with file upload'
        }, { status: 400 });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Exam editor API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
