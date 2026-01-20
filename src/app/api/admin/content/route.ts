import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';

export const dynamic = 'force-dynamic';

// GET - List all subjects with chapters and topics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subjects = await db.subject.findMany({
      orderBy: { order: 'asc' },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            topics: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                name: true,
                slug: true,
                order: true,
                _count: {
                  select: { progress: true },
                },
              },
            },
          },
        },
        _count: {
          select: { chapters: true },
        },
      },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
