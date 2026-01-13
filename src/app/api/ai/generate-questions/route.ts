import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { getAIService } from '@/server/services/ai-service';
import { z } from 'zod';

const generateSchema = z.object({
  topic: z.string().min(1),
  subject: z.enum(['toan', 'vatly', 'hoahoc', 'sinhhoc', 'nguvan', 'tienganh', 'lichsu', 'dialy', 'gdcd']),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  count: z.number().min(1).max(10).optional().default(5),
  questionType: z.enum(['multiple_choice', 'true_false', 'fill_blank']).optional().default('multiple_choice'),
});

const SUBJECT_NAMES: Record<string, string> = {
  toan: 'Toán học',
  vatly: 'Vật lý',
  hoahoc: 'Hóa học',
  sinhhoc: 'Sinh học',
  nguvan: 'Ngữ văn',
  tienganh: 'Tiếng Anh',
  lichsu: 'Lịch sử',
  dialy: 'Địa lý',
  gdcd: 'Giáo dục công dân',
};

const DIFFICULTY_NAMES: Record<string, string> = {
  easy: 'Cơ bản',
  medium: 'Trung bình',
  hard: 'Nâng cao',
};

// POST - Generate questions using AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = generateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { topic, subject, difficulty, count, questionType } = validation.data;

    const prompt = buildPrompt(topic, subject, difficulty, count, questionType);

    const aiService = getAIService();
    const response = await aiService.chat([
      { role: 'user', content: prompt }
    ]);

    // Parse AI response to extract questions
    const questions = parseQuestionsFromResponse(response.content, questionType);

    return NextResponse.json({
      success: true,
      questions,
      metadata: {
        topic,
        subject: SUBJECT_NAMES[subject],
        difficulty: DIFFICULTY_NAMES[difficulty],
        count: questions.length,
        model: response.model,
        tokensUsed: response.tokensUsed,
      },
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions. Please try again.' },
      { status: 500 }
    );
  }
}

function buildPrompt(
  topic: string,
  subject: string,
  difficulty: string,
  count: number,
  questionType: string
): string {
  const subjectName = SUBJECT_NAMES[subject];
  const difficultyName = DIFFICULTY_NAMES[difficulty];

  if (questionType === 'multiple_choice') {
    return `Bạn là giáo viên ${subjectName} chuyên ra đề thi THPT Quốc gia.

Hãy tạo ${count} câu hỏi trắc nghiệm về chủ đề "${topic}" với độ khó ${difficultyName}.

YÊU CẦU:
- Mỗi câu có 4 đáp án A, B, C, D
- Chỉ có 1 đáp án đúng
- Câu hỏi phải rõ ràng, chính xác
- Phù hợp với chương trình THPT

FORMAT (JSON):
[
  {
    "content": "Nội dung câu hỏi",
    "choices": [
      {"label": "A", "content": "Đáp án A", "isCorrect": false},
      {"label": "B", "content": "Đáp án B", "isCorrect": true},
      {"label": "C", "content": "Đáp án C", "isCorrect": false},
      {"label": "D", "content": "Đáp án D", "isCorrect": false}
    ],
    "explanation": "Giải thích đáp án đúng"
  }
]

Chỉ trả về JSON, không có text khác.`;
  }

  if (questionType === 'true_false') {
    return `Bạn là giáo viên ${subjectName} chuyên ra đề thi THPT Quốc gia.

Hãy tạo ${count} câu hỏi đúng/sai về chủ đề "${topic}" với độ khó ${difficultyName}.

FORMAT (JSON):
[
  {
    "content": "Nội dung mệnh đề",
    "isCorrect": true,
    "explanation": "Giải thích"
  }
]

Chỉ trả về JSON, không có text khác.`;
  }

  // Fill in the blank
  return `Bạn là giáo viên ${subjectName} chuyên ra đề thi THPT Quốc gia.

Hãy tạo ${count} câu hỏi điền từ về chủ đề "${topic}" với độ khó ${difficultyName}.

FORMAT (JSON):
[
  {
    "content": "Câu với chỗ trống ___",
    "answer": "Đáp án đúng",
    "explanation": "Giải thích"
  }
]

Chỉ trả về JSON, không có text khác.`;
}

function parseQuestionsFromResponse(content: string, questionType: string): unknown[] {
  try {
    // Find JSON in response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      return [];
    }

    const questions = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(questions)) {
      return [];
    }

    // Validate and clean questions
    return questions.map((q, index) => ({
      id: `generated-${Date.now()}-${index}`,
      type: questionType === 'multiple_choice' ? 'MULTIPLE_CHOICE' : 
            questionType === 'true_false' ? 'TRUE_FALSE' : 'FILL_BLANK',
      ...q,
    }));
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return [];
  }
}
