import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { z } from 'zod';

const createChapterSchema = z.object({
  name: z.string().min(1, 'Tên chương là bắt buộc'),
  slug: z.string().min(1, 'Slug là bắt buộc').regex(/^[a-z0-9-]+$/, 'Slug không hợp lệ'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Vui lòng chọn môn học'),
});

// POST - Create new chapter
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
    const validation = createChapterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, slug, description, subjectId } = validation.data;

    // Check if subject exists
    const subject = await db.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check if slug exists within the subject
    const existingChapter = await db.chapter.findFirst({
      where: {
        slug,
        subjectId,
      },
    });

    if (existingChapter) {
      return NextResponse.json(
        { error: 'SLUG_EXISTS' },
        { status: 400 }
      );
    }

    // Get max order within subject
    const maxOrder = await db.chapter.aggregate({
      where: { subjectId },
      _max: { order: true },
    });

    const chapter = await db.chapter.create({
      data: {
        name,
        slug,
        description: description || null,
        subjectId,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
