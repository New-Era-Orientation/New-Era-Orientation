import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { z } from 'zod';

const createTopicSchema = z.object({
  name: z.string().min(1, 'Tên bài học là bắt buộc'),
  slug: z.string().min(1, 'Slug là bắt buộc').regex(/^[a-z0-9-]+$/, 'Slug không hợp lệ'),
  chapterId: z.string().min(1, 'Vui lòng chọn chương'),
  content: z.string().min(1, 'Nội dung bài học là bắt buộc'),
});

// POST - Create new topic
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
    const validation = createTopicSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, slug, chapterId, content } = validation.data;

    // Check if chapter exists
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Check if slug is unique globally (topics have global slugs for /study/:slug)
    const existingTopic = await db.topic.findFirst({
      where: { slug },
    });

    if (existingTopic) {
      return NextResponse.json(
        { error: 'SLUG_EXISTS' },
        { status: 400 }
      );
    }

    // Get max order within chapter
    const maxOrder = await db.topic.aggregate({
      where: { chapterId },
      _max: { order: true },
    });

    const topic = await db.topic.create({
      data: {
        name,
        slug,
        chapterId,
        content,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
