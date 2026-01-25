import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';

export const dynamic = 'force-dynamic';

interface Part {
  name: string;
  order: number;
  questions: Question[];
}

interface Question {
  type: string;
  content: string;
  order: number;
  choices?: { content: string; isCorrect: boolean }[];
  statements?: { content: string; isCorrect: boolean }[];
}

// GET - Export exam data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const format = searchParams.get('format') || 'json';

    if (!examId) {
      return NextResponse.json(
        { error: 'examId is required' },
        { status: 400 }
      );
    }

    const exam = await db.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Parse parts from JSON
    const parts: Part[] = exam.parts ? (exam.parts as unknown as Part[]) : [];

    if (format === 'xlsx') {
      // Import xlsx dynamically
      const XLSX = await import('xlsx');

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Metadata sheet
      const metadataData = [
        ['title', exam.title],
        ['duration', exam.duration],
        ['year', exam.year || ''],
        ['type', exam.type],
      ];
      const metadataSheet = XLSX.utils.aoa_to_sheet(metadataData);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');

      // Questions sheet
      const questionsData: (string | boolean | number)[][] = [
        ['Part', 'Question', 'Type', 'Option', 'IsCorrect']
      ];

      parts.forEach((part) => {
        part.questions?.forEach((question) => {
          if (question.type === 'MULTIPLE_CHOICE' && question.choices) {
            question.choices.forEach((choice, cIndex) => {
              questionsData.push([
                cIndex === 0 ? part.name : '',
                cIndex === 0 ? question.content : '',
                cIndex === 0 ? question.type : '',
                choice.content,
                choice.isCorrect,
              ]);
            });
          } else if (question.type === 'TRUE_FALSE_GROUP' && question.statements) {
            question.statements.forEach((statement, sIndex) => {
              questionsData.push([
                sIndex === 0 ? part.name : '',
                sIndex === 0 ? question.content : '',
                sIndex === 0 ? question.type : '',
                statement.content,
                statement.isCorrect,
              ]);
            });
          }
        });
      });

      const questionsSheet = XLSX.utils.aoa_to_sheet(questionsData);
      XLSX.utils.book_append_sheet(workbook, questionsSheet, 'Questions');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="exam-${examId}.xlsx"`,
        },
      });
    }

    if (format === 'csv') {
      // Convert to CSV
      const rows: string[] = [];
      rows.push('Part,Question Number,Type,Content,Option/Statement,IsCorrect');

      parts.forEach((part) => {
        part.questions?.forEach((question, qIndex) => {
          if (question.type === 'MULTIPLE_CHOICE' && question.choices) {
            question.choices.forEach((choice) => {
              rows.push(
                [
                  `"${part.name}"`,
                  qIndex + 1,
                  question.type,
                  `"${question.content.replace(/"/g, '""')}"`,
                  `"${choice.content.replace(/"/g, '""')}"`,
                  choice.isCorrect,
                ].join(',')
              );
            });
          } else if (question.type === 'TRUE_FALSE_GROUP' && question.statements) {
            question.statements.forEach((statement) => {
              rows.push(
                [
                  `"${part.name}"`,
                  qIndex + 1,
                  question.type,
                  `"${question.content.replace(/"/g, '""')}"`,
                  `"${statement.content.replace(/"/g, '""')}"`,
                  statement.isCorrect,
                ].join(',')
              );
            });
          }
        });
      });

      const csvContent = rows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="exam-${examId}.csv"`,
        },
      });
    }

    // JSON format
    const exportData = {
      exam: {
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        year: exam.year,
        source: exam.source,
        type: exam.type,
        parts: parts.map((part) => ({
          name: part.name,
          order: part.order,
          questions: part.questions?.map((q) => ({
            type: q.type,
            content: q.content,
            order: q.order,
            ...(q.type === 'MULTIPLE_CHOICE' && q.choices && {
              choices: q.choices.map((c) => ({
                content: c.content,
                isCorrect: c.isCorrect,
              })),
            }),
            ...(q.type === 'TRUE_FALSE_GROUP' && q.statements && {
              statements: q.statements.map((s) => ({
                content: s.content,
                isCorrect: s.isCorrect,
              })),
            }),
          })) || [],
        })),
      },
      exportedAt: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(exportData, null, 2);

    return new NextResponse(jsonContent, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="exam-${examId}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
