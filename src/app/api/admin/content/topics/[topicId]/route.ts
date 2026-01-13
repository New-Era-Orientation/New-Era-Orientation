import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { z } from 'zod';

const updateTopicSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().optional().nullable(),
  order: z.number().optional(),
});

// GET - Get single topic
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { topicId } = await params;

    const topic = await db.topic.findUnique({
      where: { id: topicId },
      include: {
        chapter: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ topic });
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update topic
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { topicId } = await params;
    const body = await request.json();
    const validation = updateTopicSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // Check if topic exists
    const existingTopic = await db.topic.findUnique({
      where: { id: topicId },
    });

    if (!existingTopic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if new slug conflicts (globally unique)
    if (validation.data.slug && validation.data.slug !== existingTopic.slug) {
      const slugConflict = await db.topic.findFirst({
        where: { 
          slug: validation.data.slug,
          NOT: { id: topicId }
        },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: 'SLUG_EXISTS' },
          { status: 400 }
        );
      }
    }

    const topic = await db.topic.update({
      where: { id: topicId },
      data: validation.data,
    });

    return NextResponse.json({ topic });
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete topic
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { topicId } = await params;

    // Check if topic exists
    const existingTopic = await db.topic.findUnique({
      where: { id: topicId },
    });

    if (!existingTopic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Delete topic and related progress
    await db.topic.delete({
      where: { id: topicId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
