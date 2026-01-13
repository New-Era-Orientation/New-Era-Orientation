import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { z } from 'zod';

const updateChapterSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  order: z.number().optional(),
});

// GET - Get single chapter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { chapterId } = await params;

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: {
        subject: true,
        topics: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update chapter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { chapterId } = await params;
    const body = await request.json();
    const validation = updateChapterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // Check if chapter exists
    const existingChapter = await db.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Check if new slug conflicts within same subject
    if (validation.data.slug && validation.data.slug !== existingChapter.slug) {
      const slugConflict = await db.chapter.findFirst({
        where: {
          slug: validation.data.slug,
          subjectId: existingChapter.subjectId,
          NOT: { id: chapterId },
        },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: 'SLUG_EXISTS' },
          { status: 400 }
        );
      }
    }

    const chapter = await db.chapter.update({
      where: { id: chapterId },
      data: validation.data,
    });

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error('Error updating chapter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete chapter (cascade deletes topics)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { chapterId } = await params;

    // Check if chapter exists
    const existingChapter = await db.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Delete chapter (cascade will handle topics)
    await db.chapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
