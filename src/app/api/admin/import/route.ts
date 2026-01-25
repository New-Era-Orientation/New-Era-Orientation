import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { z } from 'zod';
import { ExamType, Prisma } from '@prisma/client';

// Schema for import validation - matches the JSON structure we use for parts
const choiceSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1),
  isCorrect: z.boolean(),
});

const statementSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE_GROUP']),
  content: z.string().min(1),
  order: z.number(),
  choices: z.array(choiceSchema).optional(),
  statements: z.array(statementSchema).optional(),
});

const partSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  order: z.number(),
  questions: z.array(questionSchema),
});

const examSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().min(1),
  year: z.number().optional(),
  source: z.string().optional(),
  subject: z.string().optional(),
  type: z.enum(['STANDARD', 'HSG', 'MOCK']).optional(),
  parts: z.array(partSchema),
});

// Resolved mappings from the analyze step
const resolvedMappingsSchema = z.object({
  provinceId: z.number().optional(),
  schoolId: z.string().optional(),
  subjectId: z.string().optional(),
  createSchool: z.object({
    name: z.string(),
    provinceId: z.number(),
  }).optional(),
}).optional();

const importSchema = z.object({
  exam: examSchema.optional(),
  examId: z.string().optional(), // For adding to existing exam's JSON parts
  resolvedMappings: resolvedMappingsSchema,
});


// Helper to generate unique IDs for JSON structure
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// POST - Import exam data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = importSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid import format',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { exam, examId, resolvedMappings } = validation.data;
    const errors: string[] = [];
    let importedCount = 0;

    // Import full exam - store parts as JSON
    if (exam) {
      const slug = exam.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now();

      // Process parts to add IDs and count questions
      const processedParts = exam.parts.map((part, partIndex) => {
        const questions = part.questions.map((q, qIndex) => {
          importedCount++;

          // Validate question has proper data
          if (q.type === 'MULTIPLE_CHOICE' && (!q.choices || q.choices.length === 0)) {
            errors.push(`Câu hỏi "${q.content.substring(0, 30)}..." thiếu choices`);
          } else if (q.type === 'TRUE_FALSE_GROUP' && (!q.statements || q.statements.length === 0)) {
            errors.push(`Câu hỏi "${q.content.substring(0, 30)}..." thiếu statements`);
          }

          return {
            id: q.id || generateId(),
            type: q.type,
            content: q.content,
            order: q.order || qIndex + 1,
            choices: q.choices?.map((c, cIndex) => ({
              id: c.id || generateId(),
              content: c.content,
              isCorrect: c.isCorrect,
              order: cIndex + 1,
            })),
            statements: q.statements?.map((s, sIndex) => ({
              id: s.id || generateId(),
              content: s.content,
              isCorrect: s.isCorrect,
              order: sIndex + 1,
            })),
          };
        });

        return {
          id: part.id || generateId(),
          name: part.name,
          order: part.order || partIndex + 1,
          questions,
        };
      });

      // Handle school creation if needed
      let finalSchoolId = resolvedMappings?.schoolId;
      if (resolvedMappings?.createSchool) {
        const newSchool = await db.school.create({
          data: {
            name: resolvedMappings.createSchool.name,
            provinceId: resolvedMappings.createSchool.provinceId,
          },
        });
        finalSchoolId = newSchool.id;
      }

      // Create exam with parts stored as JSON
      const createdExam = await db.exam.create({
        data: {
          title: exam.title,
          slug,
          description: exam.description || null,
          duration: exam.duration,
          year: exam.year || new Date().getFullYear(),
          source: exam.source || 'Imported',
          subjectId: resolvedMappings?.subjectId || '',
          provinceId: resolvedMappings?.provinceId,
          schoolId: finalSchoolId,
          type: (exam.type as ExamType) || ExamType.STANDARD,
          published: false,
          parts: processedParts,
          createdBy: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        imported: importedCount,
        examId: createdExam.id,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Add parts to existing exam (merge with existing JSON)
    if (examId && body.parts) {
      const existingExam = await db.exam.findUnique({
        where: { id: examId },
      });

      if (!existingExam) {
        return NextResponse.json(
          { error: 'Exam not found' },
          { status: 404 }
        );
      }

      // Get existing parts or empty array
      const existingParts = (existingExam.parts as Array<{ id: string; name: string; order: number; questions: unknown[] }>) || [];
      const maxOrder = existingParts.reduce((max, p) => Math.max(max, p.order), 0);

      // Process new parts
      const partsValidation = z.array(partSchema).safeParse(body.parts);
      if (!partsValidation.success) {
        return NextResponse.json(
          { error: 'Invalid parts format', details: partsValidation.error.issues },
          { status: 400 }
        );
      }

      const newParts = partsValidation.data.map((part, partIndex) => {
        const questions = part.questions.map((q, qIndex) => {
          importedCount++;
          return {
            id: q.id || generateId(),
            type: q.type,
            content: q.content,
            order: q.order || qIndex + 1,
            choices: q.choices?.map((c, cIndex) => ({
              id: c.id || generateId(),
              content: c.content,
              isCorrect: c.isCorrect,
              order: cIndex + 1,
            })),
            statements: q.statements?.map((s, sIndex) => ({
              id: s.id || generateId(),
              content: s.content,
              isCorrect: s.isCorrect,
              order: sIndex + 1,
            })),
          };
        });

        return {
          id: part.id || generateId(),
          name: part.name,
          order: part.order || maxOrder + partIndex + 1,
          questions,
        };
      });

      // Merge and update
      const updatedParts = [...existingParts, ...newParts] as Prisma.InputJsonValue;

      await db.exam.update({
        where: { id: examId },
        data: { parts: updatedParts },
      });

      return NextResponse.json({
        success: true,
        imported: importedCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return NextResponse.json(
      { error: 'No data to import. Provide either exam or examId with parts.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
