import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { z } from 'zod';

const updateSubjectSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  order: z.number().optional(),
});

// GET - Get single subject
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subjectId } = await params;

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            topics: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subject });
  } catch (error) {
    console.error('Error fetching subject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update subject
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subjectId } = await params;
    const body = await request.json();
    const validation = updateSubjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // Check if subject exists
    const existingSubject = await db.subject.findUnique({
      where: { id: subjectId },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check if new slug conflicts
    if (validation.data.slug && validation.data.slug !== existingSubject.slug) {
      const slugConflict = await db.subject.findUnique({
        where: { slug: validation.data.slug },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: 'SLUG_EXISTS' },
          { status: 400 }
        );
      }
    }

    const subject = await db.subject.update({
      where: { id: subjectId },
      data: validation.data,
    });

    return NextResponse.json({ subject });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete subject (cascade deletes chapters and topics)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subjectId } = await params;

    // Check if subject exists
    const existingSubject = await db.subject.findUnique({
      where: { id: subjectId },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Delete subject (cascade will handle chapters and topics)
    await db.subject.delete({
      where: { id: subjectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
