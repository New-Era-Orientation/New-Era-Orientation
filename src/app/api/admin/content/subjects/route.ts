import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { z } from 'zod';

const createSubjectSchema = z.object({
  name: z.string().min(1, 'Tên môn học là bắt buộc'),
  slug: z.string().min(1, 'Slug là bắt buộc').regex(/^[a-z0-9-]+$/, 'Slug không hợp lệ'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

// POST - Create new subject
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
    const validation = createSubjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, slug, description, icon } = validation.data;

    // Check if slug exists
    const existingSubject = await db.subject.findUnique({
      where: { slug },
    });

    if (existingSubject) {
      return NextResponse.json(
        { error: 'SLUG_EXISTS' },
        { status: 400 }
      );
    }

    // Get max order
    const maxOrder = await db.subject.aggregate({
      _max: { order: true },
    });

    const subject = await db.subject.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || null,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
